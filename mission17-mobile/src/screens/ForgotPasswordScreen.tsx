import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Platform, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  ScrollView,
  Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Mail, ArrowLeft } from 'lucide-react-native';
import { useNotification } from '../context/NotificationContext';
import { auth } from '../config/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

const missionLogo = require('../../assets/logo.png');

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<any>();
  const { showNotification } = useNotification();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestCode = async () => {
    if (!email) {
      showNotification("Please enter your email", "error");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      showNotification("Reset link sent! Check your email inbox.", "success");
      setTimeout(() => {
        navigation.navigate('Login');
      }, 2000);
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/user-not-found') {
        showNotification("No account found with this email.", "error");
      } else if (error.code === 'auth/invalid-email') {
        showNotification("Invalid email address.", "error");
      } else {
        showNotification("Failed to send reset email.", "error");
      }
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
              Enter your email and we'll send you a link to securely reset your password.
            </Text>
          </View>

          <View style={styles.form}>
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
              {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Send Reset Link</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Back to Login</Text>
            </TouchableOpacity>
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
