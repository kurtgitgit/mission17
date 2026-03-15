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
  SafeAreaView, 
  KeyboardAvoidingView, 
  ScrollView,
  Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Mail, ArrowLeft, Key, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react-native';
import { endpoints } from '../config/api';
import { useNotification } from '../context/NotificationContext';

const missionLogo = require('../../assets/logo.png');

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<any>();
  const { showNotification } = useNotification();

  const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- STEP 1: REQUEST CODE ---
  const handleRequestCode = async () => {
    if (!email) {
      showNotification("Please enter your email", "error");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(endpoints.auth.forgotPassword, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setStep(2);
        showNotification("Reset code sent! Check your email.", "success");
      } else {
        showNotification(data.message || "Failed to send code", "error");
      }
    } catch (error) {
      showNotification("Connection error. Is the backend running?", "error");
    } finally {
      setLoading(false);
    }
  };

  // --- STEP 2: RESET PASSWORD ---
  const handleResetPassword = async () => {
    if (!otp || !newPassword) {
      showNotification("Please fill in all fields", "error");
      return;
    }

    if (newPassword.length < 8) {
      showNotification("Password must be at least 8 characters", "error");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(endpoints.auth.resetPassword, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.trim(), 
          otp: otp.trim(), 
          newPassword 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showNotification("Password reset successfully!", "success");
        setTimeout(() => {
          navigation.navigate('Login');
        }, 1500);
      } else {
        showNotification(data.message || "Failed to reset password", "error");
      }
    } catch (error) {
      showNotification("Connection error", "error");
    } finally {
      setLoading(false);
    }
  };

  const RootComponent = (Platform.OS === 'web' ? View : SafeAreaView) as React.ElementType;

  return (
    <RootComponent style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container}>
          
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft color="#1e293b" size={24} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Image source={missionLogo} style={styles.logo} resizeMode="contain" />
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              {step === 1 
                ? "Enter your email to receive a password reset code." 
                : "Enter the code sent to your email and choose a new password."}
            </Text>
          </View>

          <View style={styles.form}>
            {step === 1 ? (
              <>
                <View style={styles.inputContainer}>
                  <Mail color="#94a3b8" size={20} style={styles.icon} />
                  <TextInput 
                    placeholder="Email Address" 
                    style={styles.input} 
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                <TouchableOpacity 
                   style={[styles.primaryButton, loading && styles.disabledButton]} 
                   onPress={handleRequestCode}
                   disabled={loading}
                >
                  {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Send Reset Code</Text>}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.inputContainer}>
                  <Key color="#94a3b8" size={20} style={styles.icon} />
                  <TextInput 
                    placeholder="6-Digit Code" 
                    style={styles.input} 
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                <View style={styles.inputContainer}>
                    <Lock color="#94a3b8" size={20} style={styles.icon} />
                    <TextInput 
                        placeholder="New Password" 
                        style={styles.input} 
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry={!showPassword}
                        placeholderTextColor="#94a3b8"
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff color="#94a3b8" size={20} /> : <Eye color="#94a3b8" size={20} />}
                    </TouchableOpacity>
                </View>

                <TouchableOpacity 
                   style={[styles.primaryButton, loading && styles.disabledButton]} 
                   onPress={handleResetPassword}
                   disabled={loading}
                >
                  {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Reset Password</Text>}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setStep(1)} style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>Back to Email</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </RootComponent>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  backButton: { position: 'absolute', top: 20, left: 24, zIndex: 10 },
  header: { alignItems: 'center', marginBottom: 32, marginTop: 40 },
  logo: { width: 80, height: 80, marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#64748b', textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },
  form: { gap: 16 },
  inputContainer: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', 
    borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 16, height: 56,
  },
  icon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#1e293b' },
  primaryButton: { 
    backgroundColor: '#3b82f6', height: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 10,
    shadowColor: '#3b82f6', shadowOpacity: 0.2, shadowRadius: 8, elevation: 4
  },
  disabledButton: { backgroundColor: '#94a3b8' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  secondaryButton: { marginTop: 15, alignItems: 'center' },
  secondaryButtonText: { color: '#64748b', fontSize: 14, fontWeight: '600' }
});
