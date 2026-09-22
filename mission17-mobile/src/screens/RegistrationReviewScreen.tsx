import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CircleAlert, FilePenLine, LogOut } from 'lucide-react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';

const RegistrationReviewScreen = ({ navigation, route }: any) => {
  const reason = typeof route.params?.reason === 'string' && route.params.reason.trim()
    ? route.params.reason.trim()
    : 'Please review your registration details and submit the corrected information.';

  const exit = async () => {
    await signOut(auth).catch(() => undefined);
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.icon}><CircleAlert size={48} color="#b45309" /></View>
        <Text style={styles.title}>Registration needs correction</Text>
        <Text style={styles.subtitle}>Your account is not approved yet. Correct the details below, then submit it for another Barangay review.</Text>
        <View style={styles.reasonCard}>
          <Text style={styles.reasonLabel}>REVIEWER NOTE</Text>
          <Text style={styles.reason}>{reason}</Text>
        </View>
        <TouchableOpacity style={styles.primary} onPress={() => navigation.navigate('EditProfile', { registrationReview: true })} accessibilityRole="button">
          <FilePenLine size={19} color="#fff" />
          <Text style={styles.primaryText}>Review and correct details</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondary} onPress={() => void exit()} accessibilityRole="button">
          <LogOut size={18} color="#334155" />
          <Text style={styles.secondaryText}>Exit to sign in</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fffbeb' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  icon: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  title: { color: '#0f172a', fontSize: 26, fontWeight: '900', textAlign: 'center' },
  subtitle: { color: '#475569', fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 12, maxWidth: 390 },
  reasonCard: { width: '100%', maxWidth: 420, backgroundColor: '#fff', borderColor: '#fcd34d', borderWidth: 1, borderRadius: 14, padding: 17, marginTop: 26 },
  reasonLabel: { color: '#92400e', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  reason: { color: '#1e293b', fontSize: 15, lineHeight: 22, marginTop: 7 },
  primary: { width: '100%', maxWidth: 420, backgroundColor: '#0038A8', borderRadius: 12, paddingVertical: 15, marginTop: 24, flexDirection: 'row', gap: 9, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  secondary: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 20, padding: 10 },
  secondaryText: { color: '#334155', fontSize: 14, fontWeight: '800' },
});

export default RegistrationReviewScreen;
