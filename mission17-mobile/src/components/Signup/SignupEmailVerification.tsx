import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { CircleAlert, MailCheck } from 'lucide-react-native';

interface SignupEmailVerificationProps {
  email: string;
  loading: boolean;
  onVerify: (otp: string) => Promise<boolean>;
  onResend: () => Promise<boolean>;
  onEditEmail: () => void;
}

const RESEND_COOLDOWN_SECONDS = 180;

const SignupEmailVerification = ({ email, loading, onVerify, onResend, onEditEmail }: SignupEmailVerificationProps) => {
  const [otp, setOtp] = useState('');
  const [remainingSeconds, setRemainingSeconds] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (remainingSeconds <= 0) return undefined;
    const timer = setInterval(() => setRemainingSeconds((current) => Math.max(0, current - 1)), 1000);
    return () => clearInterval(timer);
  }, [remainingSeconds]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = String(remainingSeconds % 60).padStart(2, '0');

  const resend = async () => {
    const sent = await onResend();
    if (sent) {
      setOtp('');
      setRemainingSeconds(RESEND_COOLDOWN_SECONDS);
    }
  };

  return (
    <View style={styles.form}>
      <View style={styles.iconCircle} accessibilityElementsHidden>
        <MailCheck size={48} color="#0038A8" />
      </View>
      <Text style={styles.title}>One-Time Code Sent</Text>
      <Text style={styles.subtitle}>Check your email inbox</Text>
      <Text style={styles.description}>We sent a six-digit code to{`\n`}<Text style={styles.email}>{email}</Text></Text>

      <Text style={styles.inputLabel}>Enter email code</Text>
      <TextInput
        style={styles.input}
        value={otp}
        onChangeText={(value) => setOtp(value.replace(/\D/g, '').slice(0, 6))}
        placeholder="6-digit code"
        placeholderTextColor="#94a3b8"
        keyboardType="number-pad"
        maxLength={6}
        autoFocus
        accessibilityLabel="Six-digit email verification code"
      />

      <TouchableOpacity
        style={[styles.verifyButton, (loading || otp.length !== 6) && styles.disabledButton]}
        disabled={loading || otp.length !== 6}
        onPress={() => onVerify(otp)}
        accessibilityRole="button"
        accessibilityLabel="Verify email code"
        accessibilityState={{ disabled: loading || otp.length !== 6 }}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.verifyButtonText}>Verify Email</Text>}
      </TouchableOpacity>

      <Text style={styles.resendText}>
        {remainingSeconds > 0 ? `Resend code in ${minutes}:${seconds}` : 'Didn\'t receive the email?'}
      </Text>
      <TouchableOpacity disabled={loading || remainingSeconds > 0} onPress={resend} accessibilityRole="button">
        <Text style={[styles.resendLink, (loading || remainingSeconds > 0) && styles.resendLinkDisabled]}>Resend verification code</Text>
      </TouchableOpacity>

      <View style={styles.spamReminder} accessibilityRole="alert">
        <CircleAlert size={24} color="#c2410c" />
        <Text style={styles.spamReminderText}>
          <Text style={styles.spamReminderTitle}>Important: Check your Spam or Junk folder.</Text>{'\n'}
          Verification emails may be filtered there. Mark the BrgyLink email as “Not spam” to receive future messages in your inbox.
        </Text>
      </View>

      <TouchableOpacity onPress={onEditEmail} accessibilityRole="button" style={styles.editEmailButton}>
        <Text style={styles.editEmailText}>Wrong email? Edit it here</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  form: { gap: 14, alignItems: 'center', paddingVertical: 8 },
  iconCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#dbeafe', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  title: { color: '#0f172a', fontSize: 27, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: '#1e293b', fontSize: 20, fontWeight: '700', textAlign: 'center', marginTop: -5 },
  description: { color: '#475569', fontSize: 16, lineHeight: 24, textAlign: 'center', marginTop: 8 },
  email: { color: '#0038A8', fontWeight: '800' },
  inputLabel: { alignSelf: 'stretch', color: '#334155', fontSize: 14, fontWeight: '700', marginTop: 14 },
  input: { alignSelf: 'stretch', height: 58, borderRadius: 12, borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#fff', paddingHorizontal: 16, color: '#0f172a', fontSize: 20, fontWeight: '700', letterSpacing: 4, textAlign: 'center' },
  verifyButton: { alignSelf: 'stretch', height: 54, borderRadius: 12, backgroundColor: '#0038A8', justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  disabledButton: { backgroundColor: '#94a3b8' },
  verifyButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  resendText: { color: '#475569', fontSize: 14, marginTop: 4 },
  resendLink: { color: '#0038A8', fontSize: 14, fontWeight: '800', paddingVertical: 4 },
  resendLinkDisabled: { color: '#94a3b8' },
  spamReminder: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, alignSelf: 'stretch', marginTop: 12, backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fdba74', borderRadius: 14, padding: 14 },
  spamReminderText: { flex: 1, color: '#9a3412', fontSize: 13.5, lineHeight: 19 },
  spamReminderTitle: { fontWeight: '800', color: '#9a3412' },
  editEmailButton: { paddingVertical: 10 },
  editEmailText: { color: '#0038A8', fontWeight: '800', textDecorationLine: 'underline' },
});

export default SignupEmailVerification;
