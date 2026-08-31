import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Platform, 
  Image,
  KeyboardAvoidingView,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useSignup } from '../hooks/useSignup';
import SignupStep1 from '../components/Signup/SignupStep1';
import SignupStep2 from '../components/Signup/SignupStep2';
import SignupStep3 from '../components/Signup/SignupStep3';

const missionLogo = require('../../assets/logo.png');

export default function SignupScreen() {
  const signupHook = useSignup();
  const { step, prevStep, navigation } = signupHook;
  
  const RootComponent = (Platform.OS === 'web' ? View : SafeAreaView) as React.ElementType;

  return (
    <RootComponent style={styles.root}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
          
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => { step === 1 ? navigation.goBack() : prevStep() }}
            >
              <ArrowLeft color="white" size={24} />
            </TouchableOpacity>

            <Image 
              source={require('../../assets/logo.png')} 
              style={styles.logo} 
              resizeMode="contain"
            />
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Step {step} of 3</Text>
          </View>

          <View style={styles.cardContainer}>
            
            <View style={styles.topProgressBarContainer}>
              <View style={[styles.topProgressSegment, step >= 1 && styles.topProgressSegmentActive]} />
              <View style={[styles.topProgressSegment, step >= 2 && styles.topProgressSegmentActive]} />
              <View style={[styles.topProgressSegment, step >= 3 && styles.topProgressSegmentActive]} />
            </View>

            {step === 1 && <SignupStep1 {...signupHook} />}
            {step === 2 && <SignupStep2 {...signupHook} />}
            {step === 3 && <SignupStep3 {...signupHook} />}
            
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </RootComponent>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  header: { 
    backgroundColor: '#0038A8',
    paddingTop: Platform.OS === 'android' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 60,
    alignItems: 'center',
    position: 'relative'
  },
  backButton: { position: 'absolute', top: Platform.OS === 'android' ? 60 : 40, left: 24, zIndex: 10 },
  logo: { 
    width: 80, 
    height: 80, 
    marginBottom: 12,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10, 
  },
  title: { fontSize: 26, fontWeight: '800', color: 'white', marginBottom: 4 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  cardContainer: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 16,
    marginTop: -30,
    padding: 24,
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowRadius: 15, 
    elevation: 6,
  },
  topProgressBarContainer: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  topProgressSegment: { flex: 1, height: 4, backgroundColor: '#f1f5f9', borderRadius: 2 },
  topProgressSegmentActive: { backgroundColor: '#0038A8' },
});
