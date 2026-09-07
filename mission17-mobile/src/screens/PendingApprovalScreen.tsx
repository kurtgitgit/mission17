import React, { useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BellRing, Clock3, ShieldCheck } from 'lucide-react-native';
import { useRoute } from '@react-navigation/native';
import { useNotification } from '../context/NotificationContext';

const PendingApprovalScreen = ({ navigation }: any) => {
  const route = useRoute<any>();
  const { registerPendingPushToken } = useNotification();
  const [notificationState, setNotificationState] = useState<'idle' | 'loading' | 'enabled' | 'denied' | 'unavailable' | 'error'>('idle');
  const firebaseToken = route.params?.firebaseToken;

  const enableNotifications = async () => {
    if (!firebaseToken) {
      setNotificationState('error');
      return;
    }

    setNotificationState('loading');
    try {
      setNotificationState(await registerPendingPushToken(firebaseToken));
    } catch (error) {
      console.error('Unable to save pending-account push preference:', error);
      setNotificationState('error');
    }
  };

  return (
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
      <View style={styles.notificationCard}>
        <BellRing size={22} color="#0038A8" />
        <View style={styles.notificationTextContainer}>
          <Text style={styles.notificationTitle}>Get an update on this phone</Text>
          <Text style={styles.notificationText}>Allow notifications so BrgyLink can tell you when your account has been approved or needs follow-up.</Text>
        </View>
      </View>
      {notificationState === 'enabled' ? (
        <Text style={styles.enabledText}>Notifications are enabled for account updates.</Text>
      ) : (
        <TouchableOpacity
          style={[styles.enableButton, notificationState === 'loading' && styles.disabledButton]}
          onPress={enableNotifications}
          disabled={notificationState === 'loading'}
          accessibilityRole="button"
          accessibilityLabel="Allow account update notifications"
        >
          {notificationState === 'loading' ? <ActivityIndicator color="#0038A8" /> : <Text style={styles.enableButtonText}>Allow Notifications</Text>}
        </TouchableOpacity>
      )}
      {notificationState === 'denied' && <Text style={styles.statusText}>Notifications are off. You can enable them later in your phone settings.</Text>}
      {notificationState === 'unavailable' && <Text style={styles.statusText}>Notifications can be enabled after you install the app on your phone.</Text>}
      {notificationState === 'error' && <Text style={styles.statusText}>We could not save your preference. You can try again by signing in later.</Text>}
      <TouchableOpacity style={styles.button} onPress={() => navigation.replace('Login')} accessibilityRole="button">
        <Text style={styles.buttonText}>Exit to Sign In</Text>
      </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#eff6ff' },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28 },
  iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '800', color: '#0f172a', textAlign: 'center' },
  subtitle: { fontSize: 17, lineHeight: 25, color: '#334155', textAlign: 'center', marginTop: 12 },
  notice: { flexDirection: 'row', gap: 12, backgroundColor: '#dbeafe', borderRadius: 14, padding: 16, marginTop: 28, maxWidth: 420 },
  noticeText: { flex: 1, color: '#1e3a8a', fontSize: 14, lineHeight: 20 },
  detail: { color: '#64748b', fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 20 },
  notificationCard: { flexDirection: 'row', gap: 12, backgroundColor: '#eff6ff', borderRadius: 14, padding: 16, marginTop: 24, maxWidth: 420 },
  notificationTextContainer: { flex: 1 },
  notificationTitle: { color: '#1e3a8a', fontSize: 16, fontWeight: '800', marginBottom: 4 },
  notificationText: { color: '#1e3a8a', fontSize: 14, lineHeight: 20 },
  enableButton: { borderWidth: 1.5, borderColor: '#0038A8', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24, marginTop: 14, minWidth: 230 },
  disabledButton: { opacity: 0.65 },
  enableButtonText: { color: '#0038A8', fontWeight: '800', fontSize: 16, textAlign: 'center' },
  enabledText: { color: '#15803d', fontSize: 14, fontWeight: '700', textAlign: 'center', marginTop: 16 },
  statusText: { color: '#64748b', fontSize: 13, lineHeight: 18, textAlign: 'center', marginTop: 12, maxWidth: 360 },
  button: { backgroundColor: '#0038A8', borderRadius: 12, paddingVertical: 15, paddingHorizontal: 26, marginTop: 26, minWidth: 210 },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 16, textAlign: 'center' },
});

export default PendingApprovalScreen;
