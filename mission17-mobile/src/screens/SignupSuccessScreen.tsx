import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CircleCheckBig, MailCheck } from 'lucide-react-native';

const SignupSuccessScreen = ({ navigation }: any) => (
  <SafeAreaView style={styles.safeArea}>
    <View style={styles.container}>
      <View style={styles.iconCircle} accessibilityElementsHidden>
        <CircleCheckBig size={58} color="#15803d" />
      </View>

      <Text style={styles.title}>Your account was created</Text>
      <Text style={styles.subtitle}>
        One more step is needed before you can use BrgyLink.
      </Text>

      <View style={styles.nextStep}>
        <MailCheck size={26} color="#0038A8" />
        <View style={styles.nextStepTextContainer}>
          <Text style={styles.nextStepTitle}>Verify your email</Text>
          <Text style={styles.nextStepText}>
            Sign in using the email and password you just created. We will send a verification code to your email.
          </Text>
        </View>
      </View>

      <Text style={styles.helpText}>
        If you do not see the code, check your Spam or Junk folder.
      </Text>

      <TouchableOpacity
        style={styles.exitButton}
        onPress={() => navigation.replace('Login')}
        accessibilityRole="button"
        accessibilityLabel="Exit to sign in"
        accessibilityHint="Returns to the sign in screen so you can verify your email"
      >
        <Text style={styles.exitButtonText}>Exit to Sign In</Text>
      </TouchableOpacity>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#eff6ff' },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28 },
  iconCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 26,
  },
  title: { fontSize: 29, fontWeight: '800', color: '#0f172a', textAlign: 'center' },
  subtitle: { fontSize: 17, lineHeight: 25, color: '#334155', textAlign: 'center', marginTop: 12, maxWidth: 390 },
  nextStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    maxWidth: 420,
    gap: 14,
    backgroundColor: '#dbeafe',
    borderRadius: 16,
    padding: 18,
    marginTop: 30,
  },
  nextStepTextContainer: { flex: 1 },
  nextStepTitle: { fontSize: 18, fontWeight: '800', color: '#1e3a8a', marginBottom: 5 },
  nextStepText: { fontSize: 15, lineHeight: 22, color: '#1e3a8a' },
  helpText: { fontSize: 14, lineHeight: 20, color: '#64748b', textAlign: 'center', marginTop: 20, maxWidth: 360 },
  exitButton: { backgroundColor: '#0038A8', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 28, marginTop: 32, minWidth: 230 },
  exitButtonText: { color: '#fff', fontWeight: '800', fontSize: 17, textAlign: 'center' },
});

export default SignupSuccessScreen;
