import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform, Image, Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Mail, Lock, Key } from 'lucide-react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { endpoints, GlobalState } from '../config/api';
import { saveAuthData } from '../utils/storage';

GoogleSignin.configure({
  webClientId: '273385582923-o4esb9aj3t3ssnmfm4j1mbq9jp5d1dnm.apps.googleusercontent.com',
  // Native configuration handles the Android and iOS Client IDs automatically behind the scenes.
});

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [num1, setNum1] = useState(Math.floor(Math.random() * 10) + 1);
  const [num2, setNum2] = useState(Math.floor(Math.random() * 10) + 1);

  // 🛡️ MFA STATE
  const [mfaRequired, setMfaRequired] = useState(false);
  const [otp, setOtp] = useState('');
  const [tempUserId, setTempUserId] = useState('');

  // 🌐 GOOGLE AUTH STATE
  const signInWithGoogleAsync = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      
      // Force sign out first so the user is always presented with the account picker
      try {
        await GoogleSignin.signOut();
      } catch (e) {
        // Ignore errors if they aren't signed in yet
      }

      const userInfo = await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens(); // The safest way to guarantee idToken extraction
      
      console.log("================ Google Native Sign-in Response ================");
      console.log("✅ ID Token Received Length:", tokens.idToken.length);

      if (tokens.idToken) {
        handleGoogleLogin(tokens.idToken);
      } else {
        Alert.alert("Google Sign-in", "No ID token received from Google.");
      }
    } catch (error: any) {
      console.error("❌ Google Native Auth Error:", error.message);
      if (error.code !== 'ASYNC_OP_IN_PROGRESS') { // Ignore user cancellation panics
          Alert.alert("Google Login Error", "Authentication was cancelled or failed.");
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
        Alert.alert("Google Login Failed", data.message || "Invalid Google token");
      }
    } catch (error) {
      Alert.alert("Error", "Could not connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    Keyboard.dismiss();  

    if (!captchaAnswer.trim()) {
      const msg = "Please answer the math question.";
      Platform.OS === 'web' ? alert(msg) : Alert.alert("Security Check", msg);
      return;
    }

    if (parseInt(captchaAnswer) !== num1 + num2) {
      const msg = "Incorrect math answer. Please try again.";
      Platform.OS === 'web' ? alert(msg) : Alert.alert("Verification Failed", msg);
      setNum1(Math.floor(Math.random() * 10) + 1);
      setNum2(Math.floor(Math.random() * 10) + 1);
      setCaptchaAnswer('');
      return;
    }

    if (!email || !password) {
      const msg = 'Please enter both email and password';
      Platform.OS === 'web' ? alert(msg) : Alert.alert('Error', msg);
      return; 
    }

    setLoading(true);

    try {
      const cleanEmail = email.trim();

      const response = await fetch(endpoints.auth.login, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const data = await response.json();

      // CASE 1: MFA REQUIRED (Status 202)
      if (response.status === 202) {
        setMfaRequired(true);
        setTempUserId(data.userId);
        Alert.alert("Security Check", "We sent a 6-digit code to your email.");
        setLoading(false);
        return;
      }

      // CASE 2: SUCCESS (Status 200)
      if (response.ok) {
        await processLoginSuccess(data);
      } else {
        const msg = data.message || 'Invalid credentials';
        Platform.OS === 'web' ? alert(msg) : Alert.alert('Login Failed', msg);
      }
    } catch (error) {
      const msg = 'Could not connect to server.';
      Platform.OS === 'web' ? alert(msg) : Alert.alert('Error', msg);
      console.error(error);
    } finally {
      if (!mfaRequired) setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) {
        Alert.alert("Invalid Code", "Please enter the full 6-digit code.");
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
        Alert.alert("Invalid Code", "Please try again.");
      }
    } catch (error) {
      Alert.alert("Error", "Could not verify code.");
    } finally {
      setLoading(false);
    }
  };

  // Helper to handle saving and navigation
  const processLoginSuccess = async (data: any) => {
    const userId = data.user._id || data.user.id; 
    const userData = { ...data.user, _id: userId };

    GlobalState.userId = userId;
    await saveAuthData(data.token, userData);
    
    navigation.replace('Home', { 
        screen: 'HomeTab', 
        params: { userId: userId } 
    });
  };

  return (
    <View style={styles.container}>
      
      {/* HEADER WITH LOGO */}
      <View style={styles.header}>
        <Image 
          source={require('../../assets/logo.png')} 
          style={styles.logo} 
          resizeMode="contain"
        />
        <Text style={styles.title}>{mfaRequired ? 'Security Check' : 'Login'}</Text>
      </View>

      <View style={styles.form}>
        
        {/* 🛡️ CONDITIONAL RENDERING */}
        {!mfaRequired ? (
            // STANDARD LOGIN UI
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
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Lock color="#94a3b8" size={20} style={styles.icon} />
                    <TextInput 
                        placeholder="Password" 
                        style={styles.input} 
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                </View>

                {/* CAPTCHA SECTION */}
                <View style={styles.captchaContainer}>
                    <Text style={styles.captchaText}>Security Check: {num1} + {num2} = ?</Text>
                    <TextInput
                        style={styles.captchaInput}
                        placeholder="#"
                        value={captchaAnswer}
                        onChangeText={setCaptchaAnswer}
                        keyboardType="numeric"
                        maxLength={2}
                    />
                </View>

                <TouchableOpacity 
                    style={styles.loginButton} 
                    onPress={handleLogin} 
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.loginButtonText}>Log In</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.dividerContainer}>
                  <View style={styles.divider} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.divider} />
                </View>

                {/* GOOGLE SIGN IN BUTTON */}
                <TouchableOpacity 
                  style={styles.googleButton}
                  onPress={signInWithGoogleAsync}
                  disabled={loading}
                >
                  <Text style={styles.googleButtonText}>Sign in with Google</Text>
                </TouchableOpacity>
            </>
        ) : (
            // MFA OTP UI
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
                    />
                </View>

                <TouchableOpacity 
                    style={styles.loginButton} 
                    onPress={handleVerifyOtp} 
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.loginButtonText}>Verify Code</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => {
                    setMfaRequired(false);
                    setOtp('');
                }}>
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
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8fafc', 
    padding: 24, 
    justifyContent: 'center' 
  },
  header: { 
    alignItems: 'center', 
    marginBottom: 32 
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#0ea5e9' 
  },
  form: { 
    gap: 16 
  },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'white', 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    paddingHorizontal: 16, 
    height: 56 
  },
  icon: { 
    marginRight: 12 
  },
  input: { 
    flex: 1, 
    fontSize: 16, 
    color: '#1e293b',
    ...Platform.select({
      web: { outlineStyle: 'none' as any }
    }) 
  },
  // OTP SPECIFIC STYLE
  otpInput: {
    letterSpacing: 8,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  mfaInstruction: {
    textAlign: 'center',
    color: '#64748b',
    marginBottom: 10
  },
  loginButton: { 
    backgroundColor: '#0ea5e9', 
    height: 56, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 8 
  },
  loginButtonText: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  cancelLink: {
    textAlign: 'center',
    color: '#ef4444',
    marginTop: 10,
    fontWeight: '600'
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  googleButton: {
    backgroundColor: 'white',
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleButtonText: {
    color: '#1e293b',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    marginTop: 32 
  },
  footerText: { 
    color: '#64748b', 
    fontSize: 14 
  },
  linkText: { 
    color: '#0ea5e9', 
    fontSize: 14, 
    fontWeight: '600' 
  },
  // Captcha Styles
  captchaContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, padding: 15, backgroundColor: '#f0f8ff', borderRadius: 12, borderWidth: 1, borderColor: '#cce4ff' },
  captchaText: { fontSize: 16, fontWeight: '600', color: '#0056b3' },
  captchaInput: { width: 50, height: 40, borderColor: '#0056b3', borderWidth: 1, borderRadius: 8, textAlign: 'center', backgroundColor: '#fff' },
});