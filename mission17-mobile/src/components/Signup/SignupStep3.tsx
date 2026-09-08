import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Upload, Eye, EyeOff, Check } from 'lucide-react-native';
import FormInput from '../FormInput';

interface SignupStep3Props {
  formData: any;
  handleInputChange: (field: string, value: string) => void;
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
  validIdFront: any;
  validIdBack: any;
  profileImage: any;
  pickImage: (type: 'idFront' | 'idBack' | 'profile') => void;
  handleSignup: () => void;
  loading: boolean;
  privacyAccepted: boolean;
  setPrivacyAccepted: (value: boolean) => void;
  termsAccepted: boolean;
  setTermsAccepted: (value: boolean) => void;
  navigation: any;
}

const SignupStep3 = ({
  formData,
  handleInputChange,
  showPassword,
  setShowPassword,
  validIdFront,
  validIdBack,
  profileImage,
  pickImage,
  handleSignup,
  loading,
  privacyAccepted,
  setPrivacyAccepted,
  termsAccepted,
  setTermsAccepted,
  navigation
}: SignupStep3Props) => {
  return (
    <View style={styles.form}>
      <Text style={styles.sectionTitle}>Attachments</Text>
      
      <View style={styles.uploadRow}>
        <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage('idFront')}>
          <Upload color="#475569" size={20} />
          <Text style={styles.uploadButtonText}>Attach Valid ID (Front) <Text style={{ color: '#ef4444' }}>*</Text></Text>
        </TouchableOpacity>
        {validIdFront && <Text style={styles.fileLabel}>Front Selected</Text>}
      </View>

      <View style={styles.uploadRow}>
        <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage('idBack')}>
          <Upload color="#475569" size={20} />
          <Text style={styles.uploadButtonText}>Attach Valid ID (Back) <Text style={{ color: '#ef4444' }}>*</Text></Text>
        </TouchableOpacity>
        {validIdBack && <Text style={styles.fileLabel}>Back Selected</Text>}
      </View>



      <Text style={styles.sectionTitle}>Security</Text>
      
      <FormInput
        placeholder="Password (min 8 chars)"
        value={formData.password}
        onChangeText={(val) => handleInputChange('password', val)}
        secureTextEntry={!showPassword}
        required
        rightIcon={
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            {showPassword ? <Eye color="#94a3b8" size={20} /> : <EyeOff color="#94a3b8" size={20} />}
          </TouchableOpacity>
        }
      />

      <FormInput
        placeholder="Confirm Password"
        value={formData.confirmPassword}
        onChangeText={(val) => handleInputChange('confirmPassword', val)}
        secureTextEntry={!showPassword}
        required
      />

      <Text style={styles.sectionTitle}>Your agreement</Text>
      <Text style={styles.consentHint}>Please read and accept both items before creating your account.</Text>
      <View style={styles.consentRow}>
        <TouchableOpacity style={styles.checkboxHitArea} accessibilityRole="checkbox" accessibilityLabel="Accept Privacy Notice" accessibilityState={{ checked: privacyAccepted }} onPress={() => setPrivacyAccepted(!privacyAccepted)}>
          <View style={[styles.checkbox, privacyAccepted && styles.checkboxChecked]}>{privacyAccepted && <Check size={15} color="#fff" />}</View>
        </TouchableOpacity>
        <Text style={styles.consentText}>I have read and accept the </Text>
        <TouchableOpacity style={styles.linkHitArea} accessibilityRole="link" onPress={() => navigation.navigate('LegalInformation', { section: 'privacy' })}><Text style={styles.consentLink}>Privacy Notice</Text></TouchableOpacity>
      </View>
      <View style={styles.consentRow}>
        <TouchableOpacity style={styles.checkboxHitArea} accessibilityRole="checkbox" accessibilityLabel="Accept Terms of Use" accessibilityState={{ checked: termsAccepted }} onPress={() => setTermsAccepted(!termsAccepted)}>
          <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>{termsAccepted && <Check size={15} color="#fff" />}</View>
        </TouchableOpacity>
        <Text style={styles.consentText}>I have read and accept the </Text>
        <TouchableOpacity style={styles.linkHitArea} accessibilityRole="link" onPress={() => navigation.navigate('LegalInformation', { section: 'terms' })}><Text style={styles.consentLink}>Terms of Use</Text></TouchableOpacity>
      </View>
      <Text style={styles.prototypeNote}>Capstone prototype — subject to Barangay Bagong Pag-asa review and approval before official public deployment.</Text>

      <View style={styles.navButtonsContainer}>
        <TouchableOpacity 
          style={[styles.primaryButtonBlue, (loading || !privacyAccepted || !termsAccepted) && styles.disabledButton]}
          onPress={handleSignup}
          disabled={loading || !privacyAccepted || !termsAccepted}
        >
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.primaryButtonTextBlue}>Complete Registration</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  form: { gap: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginTop: 10, marginBottom: 4 },
  uploadRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  uploadButton: { 
    flexDirection: 'row', alignItems: 'center', gap: 8, 
    paddingVertical: 10, paddingHorizontal: 16, 
    borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' 
  },
  uploadButtonText: { fontSize: 14, color: '#475569', fontWeight: '500' },
  fileLabel: { fontSize: 12, color: '#10b981', fontWeight: '600' },
  consentHint: { fontSize: 13, color: '#64748b', lineHeight: 19, marginTop: -6 },
  consentRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4, paddingVertical: 4 },
  checkboxHitArea: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginLeft: -11, marginRight: -6 },
  checkbox: { width: 22, height: 22, borderWidth: 2, borderColor: '#64748b', borderRadius: 5, alignItems: 'center', justifyContent: 'center', marginRight: 5 },
  checkboxChecked: { borderColor: '#0038A8', backgroundColor: '#0038A8' },
  consentText: { fontSize: 13, color: '#334155' },
  consentLink: { fontSize: 13, color: '#0038A8', fontWeight: '800', textDecorationLine: 'underline' },
  linkHitArea: { minHeight: 44, justifyContent: 'center', marginVertical: -10 },
  prototypeNote: { fontSize: 11, color: '#64748b', lineHeight: 16, marginTop: 2 },
  navButtonsContainer: { marginTop: 16 },
  primaryButtonBlue: { backgroundColor: '#0038A8', height: 54, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  primaryButtonTextBlue: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  disabledButton: { backgroundColor: '#94a3b8' },
});

export default SignupStep3;
