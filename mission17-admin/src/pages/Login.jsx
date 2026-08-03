import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Phone } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { endpoints } from '../config/api';
import { 
  signInWithEmailAndPassword, 
  getMultiFactorResolver, 
  PhoneAuthProvider, 
  PhoneMultiFactorGenerator, 
  RecaptchaVerifier,
  multiFactor 
} from 'firebase/auth';
import { auth } from '../config/firebase';
import '../styles/Auth.css';

const Login = () => {
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  
  // States
  const [step, setStep] = useState('login'); // 'login', 'mfa-verify', 'mfa-enroll-phone', 'mfa-enroll-otp'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // MFA States
  const [otpCode, setOtpCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('+63');
  const [resolver, setResolver] = useState(null);
  const [verificationId, setVerificationId] = useState('');
  const [pendingUser, setPendingUser] = useState(null);

  const [loading, setLoading] = useState(false);
  const isSubmitting = useRef(false);

  useEffect(() => {
    // Setup invisible recaptcha once
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible'
      });
    }
  }, []);

  const completeLogin = async (user, idToken) => {
    try {
      const response = await fetch(`${endpoints.auth.baseUrl}/sync-user`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ isAdminLogin: true }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Admin authorization failed');

      localStorage.setItem('token', idToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (err) {
      showNotification(err.message, 'error');
      setStep('login');
    } finally {
      setLoading(false);
      isSubmitting.current = false;
    }
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // If we get here, they are either NOT enrolled in MFA, or MFA is disabled on the project.
      const user = userCredential.user;
      
      // Check if they need to enroll
      const enrolledFactors = multiFactor(user).enrolledFactors;
      if (enrolledFactors.length === 0) {
        setPendingUser(user);
        setStep('mfa-enroll-phone');
        showNotification('Please link a phone number for 2FA security.', 'info');
        setLoading(false);
        isSubmitting.current = false;
        return;
      }

      // If they somehow bypassed MFA but are enrolled (shouldn't happen on Identity Platform), or MFA is off
      const idToken = await user.getIdToken();
      await completeLogin(user, idToken);

    } catch (err) {
      if (err.code === 'auth/multi-factor-auth-required') {
        // They are enrolled, time to verify!
        const mfaResolver = getMultiFactorResolver(auth, err);
        setResolver(mfaResolver);
        
        const phoneInfoOptions = {
          multiFactorHint: mfaResolver.hints[0],
          session: mfaResolver.session
        };
        const phoneAuthProvider = new PhoneAuthProvider(auth);
        try {
          const vId = await phoneAuthProvider.verifyPhoneNumber(phoneInfoOptions, window.recaptchaVerifier);
          setVerificationId(vId);
          setStep('mfa-verify');
          showNotification('SMS code sent to your phone!', 'success');
        } catch (smsErr) {
          showNotification('Failed to send SMS. Try again.', 'error');
          console.error(smsErr);
        }
      } else {
        showNotification(err.message.includes('invalid-credential') ? 'Invalid credentials' : err.message, 'error');
      }
      setLoading(false);
      isSubmitting.current = false;
    }
  };

  const handleSendEnrollmentSms = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const session = await multiFactor(pendingUser).getSession();
      const phoneInfoOptions = { phoneNumber, session };
      const phoneAuthProvider = new PhoneAuthProvider(auth);
      const vId = await phoneAuthProvider.verifyPhoneNumber(phoneInfoOptions, window.recaptchaVerifier);
      setVerificationId(vId);
      setStep('mfa-enroll-otp');
      showNotification('SMS code sent to link your phone!', 'success');
    } catch (err) {
      showNotification('Failed to send SMS: ' + err.message, 'error');
    }
    setLoading(false);
  };

  const handleVerifyEnrollmentOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const cred = PhoneAuthProvider.credential(verificationId, otpCode);
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);
      await multiFactor(pendingUser).enroll(multiFactorAssertion, 'Admin Phone');
      
      showNotification('Phone linked successfully!', 'success');
      
      // Now complete the login
      const idToken = await pendingUser.getIdToken();
      await completeLogin(pendingUser, idToken);
    } catch (err) {
      showNotification('Invalid OTP code.', 'error');
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const cred = PhoneAuthProvider.credential(verificationId, otpCode);
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);
      const userCredential = await resolver.resolveSignIn(multiFactorAssertion);
      
      const idToken = await userCredential.user.getIdToken();
      await completeLogin(userCredential.user, idToken);
    } catch (err) {
      showNotification('Invalid SMS Code.', 'error');
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div id="recaptcha-container"></div>
      <div className="auth-sidebar">
        <div className="sidebar-content">
          <div className="brand-box">
            <div style={{ fontSize: '56px', marginBottom: '12px' }}>🏛️</div>
            <h1 className="brand-title">BARANGAY PANTAL</h1>
            <p className="brand-tagline">Official Digital Portal</p>
          </div>
        </div>
        <div className="circle-decoration circle-1"></div>
        <div className="circle-decoration circle-2"></div>
      </div>

      <div className="auth-main">
        <div className="form-wrapper">
          
          {step === 'login' && (
            <>
              <div className="form-header">
                <h2>Admin Portal Login</h2>
                <p>Barangay Pantal — Authorized personnel only.</p>
              </div>
              <form onSubmit={handleLogin} className="auth-form">
                <div className="form-group">
                  <label>Email Address</label>
                  <div className="input-wrapper">
                    <Mail className="field-icon" size={18} />
                    <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <div className="input-wrapper">
                    <Lock className="field-icon" size={18} />
                    <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
                    <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                </div>
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" size={18} /> : "Sign In"}
                  {!loading && <ArrowRight size={18} />}
                </button>
              </form>
            </>
          )}

          {step === 'mfa-verify' && (
            <>
              <div className="form-header">
                <h2>Two-Factor Auth</h2>
                <p>Enter the 6-digit SMS code sent to your phone.</p>
              </div>
              <form onSubmit={handleVerifyOtp} className="auth-form">
                <div className="form-group">
                  <div className="input-wrapper">
                    <Lock className="field-icon" size={18} />
                    <input type="text" placeholder="123456" value={otpCode} onChange={e => setOtpCode(e.target.value)} maxLength={6} required style={{ letterSpacing: '4px', fontWeight: 'bold' }} />
                  </div>
                </div>
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" size={18} /> : "Verify Code"}
                </button>
                <button type="button" onClick={() => setStep('login')} style={{ background: 'none', border: 'none', color: '#666', marginTop: '16px', cursor: 'pointer', width: '100%' }}>Cancel</button>
              </form>
            </>
          )}

          {step === 'mfa-enroll-phone' && (
            <>
              <div className="form-header">
                <h2>Setup 2FA Security</h2>
                <p>Please link a phone number to secure your Admin account.</p>
              </div>
              <form onSubmit={handleSendEnrollmentSms} className="auth-form">
                <div className="form-group">
                  <label>Phone Number (with country code)</label>
                  <div className="input-wrapper">
                    <Phone className="field-icon" size={18} />
                    <input type="tel" placeholder="+639123456789" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required />
                  </div>
                </div>
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" size={18} /> : "Send SMS Code"}
                </button>
              </form>
            </>
          )}

          {step === 'mfa-enroll-otp' && (
            <>
              <div className="form-header">
                <h2>Verify Phone Number</h2>
                <p>Enter the 6-digit SMS code sent to {phoneNumber}</p>
              </div>
              <form onSubmit={handleVerifyEnrollmentOtp} className="auth-form">
                <div className="form-group">
                  <div className="input-wrapper">
                    <Lock className="field-icon" size={18} />
                    <input type="text" placeholder="123456" value={otpCode} onChange={e => setOtpCode(e.target.value)} maxLength={6} required style={{ letterSpacing: '4px', fontWeight: 'bold' }} />
                  </div>
                </div>
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" size={18} /> : "Link Phone & Login"}
                </button>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default Login;
