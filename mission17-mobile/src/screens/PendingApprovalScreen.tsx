import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Clock3, ShieldCheck } from 'lucide-react-native';

const PendingApprovalScreen = ({ navigation }: any) => (
  <SafeAreaView style={styles.safeArea}>
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Clock3 size={48} color="#b45309" />
      </View>
      <Text style={styles.title}>Email Verified</Text>
      <Text style={styles.subtitle}>Your account is awaiting administrator approval.</Text>
      <View style={styles.notice}>
        <ShieldCheck size={20} color="#1d4ed8" />
        <Text style={styles.noticeText}>For your security, Barangay personnel review new resident accounts before access is granted.</Text>
      </View>
      <Text style={styles.detail}>You will be able to sign in once your account has been approved.</Text>
      <TouchableOpacity style={styles.button} onPress={() => navigation.replace('Login')} accessibilityRole="button">
        <Text style={styles.buttonText}>Back to Sign In</Text>
      </TouchableOpacity>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#eff6ff' },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28 },
  iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '800', color: '#0f172a', textAlign: 'center' },
  subtitle: { fontSize: 17, lineHeight: 25, color: '#334155', textAlign: 'center', marginTop: 12 },
  notice: { flexDirection: 'row', gap: 12, backgroundColor: '#dbeafe', borderRadius: 14, padding: 16, marginTop: 28, maxWidth: 420 },
  noticeText: { flex: 1, color: '#1e3a8a', fontSize: 14, lineHeight: 20 },
  detail: { color: '#64748b', fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 20 },
  button: { backgroundColor: '#0038A8', borderRadius: 12, paddingVertical: 15, paddingHorizontal: 26, marginTop: 30, minWidth: 210 },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 16, textAlign: 'center' },
});

export default PendingApprovalScreen;
