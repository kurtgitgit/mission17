
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  SafeAreaView,
  Keyboard,
  Image,
  Platform
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ShieldCheck, Mail, ArrowLeft } from 'lucide-react-native';
import { useNotification } from '../context/NotificationContext';
import { endpoints } from '../config/api';

const missionLogo = require('../../assets/logo.png');

const VerifySignup = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { showNotification } = useNotification();
  
  const { userId, email } = route.params || {};
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    Keyboard.dismiss();
    
    if (otp.length !== 6) {
      showNotification('Please enter the 6-digit code.', 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(endpoints.auth.verifySignup, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, otp }),
      });

      const data = await response.json();

      if (response.ok) {
        showNotification('Verification successful! You can now log in.', 'success');
        navigation.navigate('Login');
      } else {
        showNotification(data.message || 'Verification failed', 'error');
      }
    } catch (error) {
      showNotification('Connection error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <ShieldCheck size={60} color="#0ea5e9" />
        </View>

        <Text style={styles.title}>Verify Your Email</Text>
        <Text style={styles.subtitle}>
          We've sent a 6-digit code to{'\n'}
          <Text style={styles.emailText}>{email || 'your email'}</Text>
        </Text>

        <View style={styles.inputWrapper}>
          <Mail size={20} color="#94a3b8" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter 6-digit code"
            placeholderTextColor="#94a3b8"
            keyboardType="number-pad"
            maxLength={6}
            value={otp}
            onChangeText={setOtp}
            {...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {})}
          />
        </View>

        <TouchableOpacity 
          style={[styles.verifyBtn, loading && styles.disabledBtn]} 
          onPress={handleVerify}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.verifyBtnText}>Verify Account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.resendBtn}
          onPress={() => showNotification('A new code has been sent.', 'info')}
        >
          <Text style={styles.resendText}>Didn't receive a code? <Text style={styles.resendLink}>Resend</Text></Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.footer}>
        <Image source={missionLogo} style={styles.logo} resizeMode="contain" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 20 },
  backBtn: { padding: 8, marginLeft: -10 },
  content: { flex: 1, paddingHorizontal: 30, alignItems: 'center', paddingTop: 40 },
  iconContainer: { 
    width: 120, 
    height: 120, 
    borderRadius: 60, 
    backgroundColor: '#f0f9ff', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 30
  },
  title: { fontSize: 24, fontWeight: '800', color: '#1e293b', marginBottom: 12 },
  subtitle: { fontSize: 15, color: '#64748b', textAlign: 'center', lineHeight: 22, marginBottom: 40 },
  emailText: { color: '#0ea5e9', fontWeight: 'bold' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 15,
    width: '100%',
    height: 56,
    marginBottom: 24
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 18, color: '#1e293b', fontWeight: '600', letterSpacing: 2 },
  verifyBtn: { 
    backgroundColor: '#0ea5e9', 
    width: '100%', 
    height: 56, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  disabledBtn: { backgroundColor: '#94a3b8', shadowOpacity: 0 },
  verifyBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  resendBtn: { marginTop: 24 },
  resendText: { color: '#64748b', fontSize: 14 },
  resendLink: { color: '#0ea5e9', fontWeight: 'bold' },
  footer: { paddingBottom: 30, alignItems: 'center' },
  logo: { width: 80, height: 40, opacity: 0.5 }
});

export default VerifySignup;
