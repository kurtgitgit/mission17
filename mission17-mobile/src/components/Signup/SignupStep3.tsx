import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Upload, Eye, EyeOff, Check } from 'lucide-react-native';
import FormInput from '../FormInput';
import CustomDropdown from '../CustomDropdown';
import { getPasswordRequirements, isStrongSignupPassword } from '../../utils/signupValidation';

const ID_TYPES = [
  'PhilSys National ID / ePhilID',
  "Driver's License",
  'Passport',
  'UMID / SSS / GSIS ID',
  'Voter’s ID / Voter’s Certificate',
  'Postal ID',
  'PRC ID',
  'PWD ID',
  'Senior Citizen ID',
  'Other government-issued ID',
];

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
  const requiresIdBack = formData.idType !== 'Passport';
  const passwordRequirements = getPasswordRequirements(formData.password);
  const passwordsMatch = Boolean(formData.confirmPassword) && formData.password === formData.confirmPassword;
  const canSubmit = Boolean(
    !loading &&
    formData.idType &&
    validIdFront &&
    (!requiresIdBack || validIdBack) &&
    isStrongSignupPassword(formData.password) &&
    passwordsMatch &&
    privacyAccepted &&
    termsAccepted
  );
  const passwordRules = [
    ['At least 8 characters', passwordRequirements.minimumLength],
    ['One uppercase letter', passwordRequirements.uppercase],
    ['One lowercase letter', passwordRequirements.lowercase],
    ['One number', passwordRequirements.number],
    ['One special character (for example: ! @ # $)', passwordRequirements.specialCharacter],
  ] as const;

  return (
    <View style={styles.form}>
      <Text style={styles.sectionTitle}>Attachments</Text>
      <Text style={styles.attachmentHint}>
        Please capture a clear, readable photo. Ensure all details and your face are visible; avoid glare, blur, or cropped edges.
      </Text>

      <CustomDropdown
        label="ID Type"
        value={formData.idType}
        options={ID_TYPES}
        onSelect={(value) => handleInputChange('idType', value)}
        required
      />
      {formData.idType === 'PhilSys National ID / ePhilID' && (
        <Text style={styles.preferredIdHint}>Preferred ID for faster Barangay verification.</Text>
      )}
      
      <View style={styles.uploadRow}>
        <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage('idFront')}>
          <Upload color="#475569" size={20} />
          <Text style={styles.uploadButtonText}>{requiresIdBack ? 'Attach Valid ID (Front)' : 'Upload Passport Information Page'} <Text style={{ color: '#ef4444' }}>*</Text></Text>
        </TouchableOpacity>
        {validIdFront && <Text style={styles.fileLabel}>{requiresIdBack ? 'Front Selected' : 'Passport Page Selected'}</Text>}
      </View>

      {requiresIdBack && (
        <View style={styles.uploadRow}>
          <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage('idBack')}>
            <Upload color="#475569" size={20} />
            <Text style={styles.uploadButtonText}>Attach Valid ID (Back) <Text style={{ color: '#ef4444' }}>*</Text></Text>
          </TouchableOpacity>
          {validIdBack && <Text style={styles.fileLabel}>Back Selected</Text>}
        </View>
      )}



      <Text style={styles.sectionTitle}>Security</Text>
      
      <FormInput
        placeholder="Password (min 8 chars)"
        value={formData.password}
        onChangeText={(val) => handleInputChange('password', val)}
        secureTextEntry={!showPassword}
        maxLength={128}
        required
        rightIcon={
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            {showPassword ? <Eye color="#94a3b8" size={20} /> : <EyeOff color="#94a3b8" size={20} />}
          </TouchableOpacity>
        }
      />

      <View style={styles.passwordChecklist} accessibilityLiveRegion="polite">
        <Text style={styles.passwordChecklistTitle}>Password must include:</Text>
        {passwordRules.map(([label, isMet]) => (
          <Text
            key={label}
            style={[
              styles.passwordRule,
              isMet && styles.passwordRuleMet,
              Boolean(formData.password) && !isMet && styles.passwordRuleMissing,
            ]}
          >
            {isMet ? '✓' : '○'} {label}
          </Text>
        ))}
      </View>

      <FormInput
        placeholder="Confirm Password"
        value={formData.confirmPassword}
        onChangeText={(val) => handleInputChange('confirmPassword', val)}
        secureTextEntry={!showPassword}
        maxLength={128}
        required
      />
      {formData.confirmPassword ? (
        <Text style={passwordsMatch ? styles.passwordMatch : styles.passwordMismatch} accessibilityLiveRegion="polite">
          {passwordsMatch ? '✓ Passwords match.' : 'Passwords do not match.'}
        </Text>
      ) : null}

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
          style={[styles.primaryButtonBlue, !canSubmit && styles.disabledButton]}
          onPress={handleSignup}
          disabled={!canSubmit}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSubmit }}
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
  attachmentHint: { fontSize: 12.5, color: '#64748b', lineHeight: 18, marginTop: -6, marginBottom: 2 },
  preferredIdHint: { fontSize: 12.5, color: '#15803d', fontWeight: '600', marginTop: -6 },
  uploadRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  uploadButton: { 
    flexDirection: 'row', alignItems: 'center', gap: 8, 
    paddingVertical: 10, paddingHorizontal: 16, 
    borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' 
  },
  uploadButtonText: { fontSize: 14, color: '#475569', fontWeight: '500' },
  fileLabel: { fontSize: 12, color: '#10b981', fontWeight: '600' },
  passwordChecklist: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, gap: 3, marginTop: -7 },
  passwordChecklistTitle: { color: '#334155', fontSize: 12.5, fontWeight: '700', marginBottom: 2 },
  passwordRule: { color: '#64748b', fontSize: 12, lineHeight: 17 },
  passwordRuleMet: { color: '#15803d' },
  passwordRuleMissing: { color: '#b91c1c' },
  passwordMatch: { color: '#15803d', fontSize: 12, fontWeight: '600', marginTop: -8 },
  passwordMismatch: { color: '#b91c1c', fontSize: 12, fontWeight: '600', marginTop: -8 },
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
