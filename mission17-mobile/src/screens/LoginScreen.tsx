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
import { useNotification } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import { endpoints, GlobalState } from '../config/api';
import { saveAuthData } from '../utils/storage';

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
      const res = await fetch(`${endpoints.auth.baseUrl}/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });
      const data = await res.json();
      if (res.ok) {
        await processLoginSuccess(data);
      } else {
        showNotification(data.message || "Invalid Google token", "error");
      }
    } catch (error) {
      showNotification("Could not connect to server.", "error");
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
    let isMfaTriggered = false;

    try {
      const cleanEmail = email.trim();

      const response = await fetch(endpoints.auth.login, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const data = await response.json();

      if (response.status === 202) {
        setMfaRequired(true);
        setTempUserId(data.userId);
        showNotification("We sent a 6-digit code to your email.", "info");
        setLoading(false);
        isMfaTriggered = true;
        return;
      }

      if (response.status === 401 && data.unverified) {
        showNotification(data.message, "info");
        navigation.navigate('VerifySignup', { 
          userId: data.userId, 
          email: cleanEmail 
        });
        setLoading(false);
        return;
      }

      if (response.ok) {
        await processLoginSuccess(data);
      } else {
        showNotification(data.message || 'Invalid credentials', 'error');
        refreshCaptcha();
      }
    } catch (error) {
      showNotification('Could not connect to server.', 'error');
      console.error(error);
      refreshCaptcha();
    } finally {
      if (!isMfaTriggered) {
        setLoading(false);
      }
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
          {/* HEADER WITH LOGO (Blue) */}
          <View style={styles.header}>
            <Image 
              source={require('../../assets/logo.png')} 
              style={styles.logo} 
              resizeMode="contain"
            />
            <Text style={styles.title}>{mfaRequired ? 'Security Check' : 'Welcome Back'}</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>
          </View>

          {/* OVERLAPPING WHITE CARD */}
          <View style={styles.cardContainer}>
            <View style={styles.form}>
              
              {!mfaRequired ? (
                  <>
                      <View style={styles.inputContainer}>
                          <Mail color="#94a3b8" size={20} style={styles.icon} />
                          <TextInput 
                              placeholder="Email Address" 
                              style={styles.input}
                              value={email}
                              onChangeText={setEmail}
                              autoCapitalize="none"
                              keyboardType="email-address"
                              placeholderTextColor="#94a3b8"
                          />
                      </View>

                      <View style={styles.inputContainer}>
                          <Lock color="#94a3b8" size={20} style={styles.icon} />
                          <TextInput 
                              placeholder="Password" 
                              style={styles.input} 
                              value={password}
                              onChangeText={setPassword}
                              secureTextEntry={!showPassword}
                              placeholderTextColor="#94a3b8"
                          />
                          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                              {showPassword ? <EyeOff color="#94a3b8" size={20} /> : <Eye color="#94a3b8" size={20} />}
                          </TouchableOpacity>
                      </View>

                      <TouchableOpacity 
                          onPress={() => navigation.navigate('ForgotPassword')}
                          style={styles.forgotPasswordContainer}
                      >
                          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                      </TouchableOpacity>

                      <View style={styles.captchaContainer}>
                          <View style={styles.captchaLeft}>
                            <Text style={styles.captchaText}>Verify: {num1} + {num2} = ?</Text>
                            <TouchableOpacity onPress={refreshCaptcha} style={styles.refreshButton}>
                              <RotateCcw color="#0038A8" size={18} />
                            </TouchableOpacity>
                          </View>
                          <TextInput
                              style={styles.captchaInput}
                              placeholder="#"
                              value={captchaAnswer}
                              onChangeText={setCaptchaAnswer}
                              keyboardType="numeric"
                              maxLength={2}
                              placeholderTextColor="#94a3b8"
                          />
                      </View>

                      <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} disabled={loading}>
                          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.primaryButtonText}>Log In</Text>}
                      </TouchableOpacity>

                      <View style={styles.dividerContainer}>
                        <View style={styles.divider} />
                        <Text style={styles.dividerText}>OR</Text>
                        <View style={styles.divider} />
                      </View>

                      <TouchableOpacity style={styles.googleButton} onPress={signInWithGoogleAsync} disabled={loading}>
                        <Text style={styles.googleButtonText}>Sign in with Google</Text>
                      </TouchableOpacity>
                  </>
              ) : (
                  <>
                      <Text style={styles.mfaInstruction}>Enter the code sent to {email}</Text>
                      <View style={styles.inputContainer}>
                          <Key color="#94a3b8" size={20} style={styles.icon} />
                          <TextInput 
                              placeholder="123456" 
                              style={[styles.input, styles.otpInput]} 
                              value={otp}
                              onChangeText={setOtp}
                              keyboardType="number-pad"
                              maxLength={6}
                              placeholderTextColor="#94a3b8"
                          />
                      </View>

                      <TouchableOpacity style={styles.primaryButton} onPress={handleVerifyOtp} disabled={loading}>
                          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.primaryButtonText}>Verify Code</Text>}
                      </TouchableOpacity>

                      <TouchableOpacity onPress={() => { setMfaRequired(false); setOtp(''); }}>
                          <Text style={styles.cancelLink}>Cancel</Text>
                      </TouchableOpacity>
                  </>
              )}
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Text style={styles.linkText}>Sign Up</Text>
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
    backgroundColor: theme.primary,
    paddingTop: Platform.OS === 'android' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 60, // Space for overlapping card
    alignItems: 'center',
  },
  logo: {
    width: 90,
    height: 90,
    marginBottom: 16
  },
  title: { 
    fontSize: 26, 
    fontWeight: '800', 
    color: 'white',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)'
  },

  // OVERLAPPING CARD
  cardContainer: {
    backgroundColor: theme.surface,
    marginHorizontal: 16,
    borderRadius: 16,
    marginTop: -30,
    padding: 24,
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowRadius: 15, 
    elevation: 6,
  },
  form: { 
    gap: 14 
  },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: theme.surfaceSecondary, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: theme.border, 
    paddingHorizontal: 16, 
    height: 54 
  },
  icon: { 
    marginRight: 12 
  },
  input: { 
    flex: 1, 
    fontSize: 15, 
    color: theme.text,
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
    paddingHorizontal: 10
  },
  primaryButton: { 
    backgroundColor: theme.primary, 
    height: 54, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 4 
  },
  primaryButtonText: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  cancelLink: {
    textAlign: 'center',
    color: theme.danger,
    marginTop: 10,
    fontWeight: '600'
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: theme.border,
  },
  dividerText: {
    marginHorizontal: 10,
    color: theme.textSecondary,
    fontWeight: '600',
    fontSize: 13
  },
  googleButton: {
    backgroundColor: theme.surface,
    height: 54,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleButtonText: {
    color: theme.text,
    fontSize: 15,
    fontWeight: '600',
  },
  footer: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    marginTop: 24 
  },
  footerText: { 
    color: theme.textSecondary, 
    fontSize: 14 
  },
  linkText: { 
    color: theme.primary, 
    fontSize: 14, 
    fontWeight: '700' 
  },
  forgotPasswordContainer: { alignSelf: 'flex-end', marginTop: -6, marginBottom: 6 },
  forgotPasswordText: { color: theme.textSecondary, fontSize: 13, fontWeight: '600' },
  captchaContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, backgroundColor: theme.primaryLight, borderRadius: 12, borderWidth: 1, borderColor: theme.border },
  captchaLeft: { flexDirection: 'row', alignItems: 'center' },
  refreshButton: { marginLeft: 12, padding: 4 },
  captchaText: { fontSize: 15, fontWeight: '600', color: theme.primary, flexShrink: 1 },
  captchaInput: { width: 50, height: 40, borderColor: theme.primary, borderWidth: 1, borderRadius: 8, textAlign: 'center', backgroundColor: theme.surface, color: theme.text, fontWeight: 'bold' },
});
