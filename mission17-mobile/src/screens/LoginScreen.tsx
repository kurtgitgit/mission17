import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator, 
  Platform, 
  Image, 
  Keyboard,
  ScrollView,
  KeyboardAvoidingView,
  SafeAreaView,
  NativeModules
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Mail, Lock, Key, Eye, EyeOff, RotateCcw } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNotification } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import { endpoints, GlobalState } from '../config/api';
import { saveAuthData } from '../utils/storage';
import { auth } from '../config/firebase';
import { signInWithEmailAndPassword, signInWithCredential, GoogleAuthProvider } from 'firebase/auth';

// Safe configuration for Expo Go
let isGoogleAvailable = false;
let GoogleSignin: any = null;

if (Platform.OS !== 'web' && NativeModules.RNGoogleSignin) {
  try {
    GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
    GoogleSignin.configure({
      webClientId: '273385582923-o4esb9aj3t3ssnmfm4j1mbq9jp5d1dnm.apps.googleusercontent.com',
    });
    isGoogleAvailable = true;
  } catch (e) {
    console.warn("⚠️ Google Sign-In not available in this environment (likely Expo Go).");
  }
}

export default function LoginScreen() {
  const { showNotification, registerPushToken } = useNotification();
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [num1, setNum1] = useState(Math.floor(Math.random() * 10) + 1);
  const [num2, setNum2] = useState(Math.floor(Math.random() * 10) + 1);

  // 🛡️ MFA STATE
  const [mfaRequired, setMfaRequired] = useState(false);
  const [otp, setOtp] = useState('');
  const [tempUserId, setTempUserId] = useState('');

  const refreshCaptcha = () => {
    setNum1(Math.floor(Math.random() * 10) + 1);
    setNum2(Math.floor(Math.random() * 10) + 1);
    setCaptchaAnswer('');
  };

  // 🌐 GOOGLE AUTH STATE
  const signInWithGoogleAsync = async () => {
    if (!isGoogleAvailable || Platform.OS === 'web') {
      Alert.alert(
        "Feature Unavailable",
        "Google Sign-In is only available on actual devices using the APK or a Development Build. Please use Email/Password to test in Expo Go.",
        [{ text: "OK" }]
      );
      return;
    }

    try {
      await GoogleSignin.hasPlayServices();
      
      try {
        await GoogleSignin.signOut();
      } catch (e) {}

      const userInfo = await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();
      
      if (tokens.idToken) {
        handleGoogleLogin(tokens.idToken);
      } else {
        showNotification("No ID token received from Google.", "error");
      }
    } catch (error: any) {
      if (error.code !== 'ASYNC_OP_IN_PROGRESS') {
          showNotification("Authentication was cancelled or failed.", "error");
      }
    }
  };

  const handleGoogleLogin = async (idToken: string) => {
    setLoading(true);
    try {
      // 1. Authenticate with Firebase using the Google ID Token
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      const firebaseToken = await userCredential.user.getIdToken();

      // 2. Sync with Backend
      const response = await fetch(`${endpoints.auth.baseUrl}/sync-user`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${firebaseToken}`
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (response.status === 403) {
        showNotification(data.message, "error");
        setLoading(false);
        return;
      }

      if (response.ok) {
        data.token = firebaseToken; 
        await processLoginSuccess(data);
      } else {
        showNotification(data.message || "Invalid Google token", "error");
      }
    } catch (error: any) {
      console.error(error);
      showNotification("Could not connect to server or authenticate.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    Keyboard.dismiss();  

    if (!captchaAnswer.trim()) {
      showNotification("Please answer the math question.", "error");
      return;
    }

    if (parseInt(captchaAnswer) !== num1 + num2) {
      showNotification("Incorrect math answer. Please try again.", "error");
      refreshCaptcha();
      return;
    }

    if (!email || !password) {
      showNotification('Please enter both email and password', 'error');
      return; 
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showNotification('Please enter a valid email address.', 'error');
      return;
    }

    setLoading(true);

    try {
      const cleanEmail = email.trim();
      
      // 1. Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const firebaseToken = await userCredential.user.getIdToken();

      // 2. Sync with Backend
      const response = await fetch(`${endpoints.auth.baseUrl}/sync-user`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${firebaseToken}`
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (response.status === 403) {
        showNotification(data.message, "error");
        setLoading(false);
        return;
      }

      if (response.ok) {
        if (data.mfaRequired) {
          setTempUserId(data.tempUserId);
          GlobalState.tempToken = firebaseToken; // Store temporarily
          setMfaRequired(true);
          showNotification('Please enter the OTP sent to your email.', 'info');
        } else {
          // Make sure token is passed so processLoginSuccess can save it
          data.token = firebaseToken; 
          await processLoginSuccess(data);
        }
      } else {
        showNotification(data.message || 'Invalid credentials', 'error');
        refreshCaptcha();
      }
    } catch (error: any) {
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        showNotification('Invalid email or password.', 'error');
      } else {
        showNotification('Could not connect to server.', 'error');
        console.error(error);
      }
      refreshCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) {
        showNotification("Please enter the full 6-digit code.", "error");
        return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${endpoints.auth.baseUrl}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: tempUserId, otp }),
      });

      const data = await response.json();

      if (response.ok) {
        data.token = GlobalState.tempToken;
        await processLoginSuccess(data);
      } else {
        showNotification("Invalid Code. Please try again.", "error");
      }
    } catch (error) {
      showNotification("Could not verify code.", "error");
    } finally {
      setLoading(false);
    }
  };

  const processLoginSuccess = async (data: any) => {
    const userId = data.user._id || data.user.id; 
    const userData = { ...data.user, _id: userId };

    GlobalState.userId = userId;
    GlobalState.token = data.token;
    GlobalState.auth = { token: data.token };
    await saveAuthData(data.token, userData);
    showNotification(`Welcome back, ${data.user.username}!`, "success");
    
    // Register device for push notifications
    if (registerPushToken) {
      registerPushToken(userId);
    }
    
    navigation.replace('Home', { 
        screen: 'HomeTab', 
        params: { userId: userId } 
    });
  };

  const RootComponent = (Platform.OS === 'web' ? View : SafeAreaView) as React.ElementType;

  return (
    <RootComponent style={styles.root}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* HEADER WITH LOGO (Royal Blue Linear Gradient) */}
          <LinearGradient colors={['#0038A8', '#001a5e']} style={styles.header}>
              <Image 
                source={require('../../assets/logo.png')} 
                style={styles.logo} 
                resizeMode="contain"
                accessibilityLabel="Barangay Bagong Pag-asa Official Seal"
              />
            <Text style={styles.title}>{mfaRequired ? 'Security Verification' : 'Barangay Citizen Portal'}</Text>
            <Text style={styles.subtitle}>
              {mfaRequired ? 'Enter the verification code to continue' : 'Sign in to access your barangay e-services'}
            </Text>
          </LinearGradient>

          {/* OVERLAPPING WHITE CARD */}
          <View style={styles.cardContainer}>
            <View style={styles.form}>
              
              {!mfaRequired ? (
                  <>
                      {/* EMAIL FIELD */}
                      <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>Email Address</Text>
                        <View style={styles.inputContainer}>
                            <Mail color="#64748b" size={20} style={styles.icon} />
                            <TextInput 
                                placeholder="name@example.com" 
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                placeholderTextColor="#94a3b8"
                                accessibilityLabel="Email Address"
                                accessibilityHint="Enter the email address registered with your resident account"
                            />
                        </View>
                      </View>

                      {/* PASSWORD FIELD */}
                      <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>Password</Text>
                        <View style={styles.inputContainer}>
                            <Lock color="#64748b" size={20} style={styles.icon} />
                            <TextInput 
                                placeholder="Enter your password" 
                                style={styles.input} 
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                placeholderTextColor="#94a3b8"
                                accessibilityLabel="Password"
                                accessibilityHint="Enter your account password"
                            />
                            <TouchableOpacity 
                              onPress={() => setShowPassword(!showPassword)}
                              style={styles.eyeButton}
                              accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                              accessibilityRole="button"
                              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                {showPassword ? <Eye color="#0038A8" size={22} /> : <EyeOff color="#64748b" size={22} />}
                            </TouchableOpacity>
                        </View>
                      </View>

                      <TouchableOpacity 
                          onPress={() => navigation.navigate('ForgotPassword')}
                          style={styles.forgotPasswordContainer}
                          accessibilityRole="button"
                          accessibilityLabel="Forgot Password"
                      >
                          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                      </TouchableOpacity>

                      {/* MATH CAPTCHA VERIFICATION */}
                      <View style={styles.captchaContainer}>
                          <View style={styles.captchaLeft}>
                            <View style={styles.securityBadge}>
                              <Text style={styles.securityBadgeText}>SECURITY CHECK</Text>
                            </View>
                            <Text style={styles.captchaText}>What is {num1} + {num2} = ?</Text>
                            <TouchableOpacity 
                              onPress={refreshCaptcha} 
                              style={styles.refreshButton}
                              accessibilityLabel="Get a new math problem"
                              accessibilityRole="button"
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <RotateCcw color="#0038A8" size={18} />
                            </TouchableOpacity>
                          </View>
                          <TextInput
                              style={styles.captchaInput}
                              placeholder="?"
                              value={captchaAnswer}
                              onChangeText={setCaptchaAnswer}
                              keyboardType="numeric"
                              maxLength={3}
                              placeholderTextColor="#94a3b8"
                              accessibilityLabel="Answer for security check math problem"
                          />
                      </View>

                      {/* PRIMARY ACTION BUTTON */}
                      <TouchableOpacity 
                        style={[styles.primaryButton, loading && styles.btnDisabled]} 
                        onPress={handleLogin} 
                        disabled={loading}
                        accessibilityRole="button"
                        accessibilityLabel="Log In to account"
                      >
                          {loading 
                            ? <ActivityIndicator color="white" /> 
                            : <Text style={styles.primaryButtonText}>Log In</Text>
                          }
                      </TouchableOpacity>
                  </>
              ) : (
                  <>
                      <Text style={styles.mfaInstruction}>
                        We sent a 6-digit verification code to <Text style={{ fontWeight: '700', color: theme.text }}>{email}</Text>
                      </Text>
                      <View style={styles.inputContainer}>
                          <Key color="#0038A8" size={20} style={styles.icon} />
                          <TextInput 
                              placeholder="123456" 
                              style={[styles.input, styles.otpInput]} 
                              value={otp}
                              onChangeText={setOtp}
                              keyboardType="number-pad"
                              maxLength={6}
                              placeholderTextColor="#94a3b8"
                              accessibilityLabel="6-digit verification code"
                          />
                      </View>

                      <TouchableOpacity 
                        style={[styles.primaryButton, loading && styles.btnDisabled]} 
                        onPress={handleVerifyOtp} 
                        disabled={loading}
                        accessibilityRole="button"
                      >
                          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.primaryButtonText}>Verify Code</Text>}
                      </TouchableOpacity>

                      <TouchableOpacity 
                        onPress={() => { setMfaRequired(false); setOtp(''); }}
                        style={{ padding: 12 }}
                      >
                          <Text style={styles.cancelLink}>Cancel & Return to Login</Text>
                      </TouchableOpacity>
                  </>
              )}
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have a resident account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')} accessibilityRole="button">
                <Text style={styles.linkText}>Register Here</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </RootComponent>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  root: { 
    flex: 1, 
    backgroundColor: theme.background, 
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: { 
    paddingTop: Platform.OS === 'android' ? 50 : 36,
    paddingHorizontal: 20,
    paddingBottom: 56,
    alignItems: 'center',
  },
  logo: {
    width: 90,
    height: 90,
    marginBottom: 14,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  title: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: 'white',
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    fontWeight: '500',
  },

  // OVERLAPPING CARD
  cardContainer: {
    backgroundColor: theme.surface,
    marginHorizontal: 16,
    borderRadius: 20,
    marginTop: -28,
    padding: 22,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12, 
    shadowRadius: 16, 
    elevation: 8,
    borderWidth: Platform.OS === 'web' ? 1 : 0,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  form: { 
    gap: 12,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.text,
    letterSpacing: 0.3,
    marginLeft: 2,
  },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: theme.surfaceSecondary || '#f8fafc', 
    borderRadius: 12, 
    borderWidth: 1.5, 
    borderColor: theme.border || '#e2e8f0', 
    paddingHorizontal: 14, 
    height: 52,
  },
  icon: { 
    marginRight: 10,
  },
  eyeButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40,
    minHeight: 40,
  },
  input: { 
    flex: 1, 
    fontSize: 15, 
    color: theme.text,
    fontWeight: '500',
    ...Platform.select({
      web: { outlineStyle: 'none' as any }
    }) 
  },
  otpInput: {
    letterSpacing: 8,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  mfaInstruction: {
    textAlign: 'center',
    color: theme.textSecondary,
    marginBottom: 10,
    paddingHorizontal: 10,
    lineHeight: 20,
  },
  primaryButton: { 
    backgroundColor: theme.primary, 
    height: 52, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 6,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  btnDisabled: {
    opacity: 0.65,
  },
  cancelLink: {
    textAlign: 'center',
    color: theme.danger,
    marginTop: 4,
    fontWeight: '700',
    fontSize: 14,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: theme.border || '#e2e8f0',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#64748b',
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.8,
  },
  googleButton: {
    backgroundColor: theme.surface,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.border || '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleButtonText: {
    color: theme.text,
    fontSize: 15,
    fontWeight: '700',
  },
  footer: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: theme.border || '#e2e8f0',
  },
  footerText: { 
    color: theme.textSecondary, 
    fontSize: 14,
    fontWeight: '500',
  },
  linkText: { 
    color: theme.primary, 
    fontSize: 14, 
    fontWeight: '800',
  },
  forgotPasswordContainer: { 
    alignSelf: 'flex-end', 
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  forgotPasswordText: { 
    color: theme.primary, 
    fontSize: 13, 
    fontWeight: '700',
  },
  captchaContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 12, 
    backgroundColor: '#eff6ff', 
    borderRadius: 14, 
    borderWidth: 1.5, 
    borderColor: '#bfdbfe',
    marginVertical: 2,
  },
  captchaLeft: { 
    flexDirection: 'column', 
    alignItems: 'flex-start',
    gap: 4,
    flex: 1,
  },
  securityBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  securityBadgeText: {
    color: '#1e40af',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  refreshButton: { 
    position: 'absolute',
    right: 8,
    top: 4,
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  captchaText: { 
    fontSize: 15, 
    fontWeight: '700', 
    color: '#1e3a8a', 
    marginTop: 2,
  },
  captchaInput: { 
    width: 58, 
    height: 44, 
    borderColor: '#3b82f6', 
    borderWidth: 1.5, 
    borderRadius: 10, 
    textAlign: 'center', 
    backgroundColor: '#ffffff', 
    color: '#0f172a', 
    fontWeight: '800',
    fontSize: 18,
    marginLeft: 10,
  },
});
