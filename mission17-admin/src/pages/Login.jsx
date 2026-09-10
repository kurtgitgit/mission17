import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { endpoints } from '../config/api';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import '../styles/Auth.css';
import logoImg from '../assets/logo.png';

const Login = () => {
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  // OTP State
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [tempToken, setTempToken] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isSubmitting = useRef(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    setLoading(true);
    setError("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showNotification("Please enter a valid email address.", "error");
      setLoading(false);
      isSubmitting.current = false;
      return;
    }

    try {
      // 1. Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const idToken = await userCredential.user.getIdToken();

      // 2. Sync with Backend
      const response = await fetch(`${endpoints.auth.baseUrl}/sync-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          isAdminLogin: true
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Admin authorization failed");
      }

      if (data.mfaRequired) {
        setTempToken(idToken);
        setShowOtp(true);
        showNotification("OTP sent to your email", "info");
        return;
      }

      // 3. Success: Save the Token
      console.log("Login Successful:", data.user.role);
      localStorage.setItem('token', idToken);
      localStorage.setItem('user', JSON.stringify(data.user));

      navigate('/dashboard');

    } catch (err) {
      console.error("Login Error:", err);
      // Improve Firebase error messages
      let errorMsg = err.message || "Failed to log in";
      if (err.code === 'auth/invalid-credential') errorMsg = "Invalid email or password.";
      if (err.code === 'auth/too-many-requests') errorMsg = "Too many failed attempts. Try again later.";

      showNotification(errorMsg, "error");
    } finally {
      setLoading(false);
      isSubmitting.current = false;
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    setLoading(true);

    try {
      const response = await fetch(`${endpoints.auth.baseUrl}/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tempToken}`
        },
        body: JSON.stringify({ otp: otpCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid OTP");
      }
      if (data.user?.role !== 'admin') {
        throw new Error('Admin authorization failed.');
      }

      localStorage.setItem('token', tempToken);
      localStorage.setItem('user', JSON.stringify(data.user));

      navigate('/dashboard');
    } catch (err) {
      showNotification(err.message, "error");
    } finally {
      setLoading(false);
      isSubmitting.current = false;
    }
  };

  return (
    <div className="auth-container">

      {/* LEFT SIDE: BRANDING PANEL */}
      <div className="auth-sidebar">
        <div className="sidebar-content">
          <div className="brand-box">
            <img src={logoImg} alt="BrgyLink Logo" className="sidebar-logo" />
            <h1 className="brand-title">BARANGAY BAGONG PAG-ASA</h1>
            <p className="brand-tagline">Official Digital Portal</p>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginTop: '8px' }}>San Jacinto, Pangasinan</p>
          </div>
        </div>
        <div className="sidebar-footer">
          <p>© 2026 Barangay Bagong Pag-asa Admin</p>
        </div>
      </div>

      {/* RIGHT SIDE: LOGIN FORM */}
      <div className="auth-main">
        <div className="form-wrapper">
          <div className="form-header">
            <h2>{showOtp ? "Two-Factor Auth" : "Admin Portal Login"}</h2>
            <p>{showOtp ? "Enter the 6-digit code sent to your email." : "Barangay Bagong Pag-asa — Authorized personnel only."}</p>
          </div>

          {!showOtp ? (
            <form onSubmit={handleSubmit} className="auth-form">
              {/* EMAIL INPUT */}
              <div className="form-group">
                <label>Email Address</label>
                <div className="input-wrapper">
                  <Mail className="field-icon" size={18} />
                  <input
                    type="text"
                    name="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* PASSWORD INPUT */}
              <div className="form-group">
                <label>Password</label>
                <div className="input-wrapper">
                  <Lock className="field-icon" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-extras">
                <label className="checkbox-container">
                  <input type="checkbox" />
                  <span className="checkmark"></span>
                  Remember me
                </label>
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" size={18} /> : "Sign In"}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="auth-form">
              <div className="form-group">
                <label>6-Digit OTP Code</label>
                <div className="input-wrapper">
                  <Lock className="field-icon" size={18} />
                  <input
                    type="text"
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    maxLength={6}
                    required
                    style={{ letterSpacing: '4px', fontWeight: 'bold' }}
                  />
                </div>
              </div>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" size={18} /> : "Verify Code"}
                {!loading && <ArrowRight size={18} />}
              </button>
              <button
                type="button"
                onClick={() => { setShowOtp(false); setOtpCode(''); }}
                style={{ background: 'none', border: 'none', color: '#666', marginTop: '16px', cursor: 'pointer', width: '100%' }}
              >
                Back to Login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
