import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Upload, Eye, EyeOff } from 'lucide-react-native';
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
  loading
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

      <View style={styles.uploadRow}>
        <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage('profile')}>
          <Upload color="#475569" size={20} />
          <Text style={styles.uploadButtonText}>Profile Image</Text>
        </TouchableOpacity>
        {profileImage && <Text style={styles.fileLabel}>Image Selected</Text>}
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

      <View style={styles.navButtonsContainer}>
        <TouchableOpacity 
          style={[styles.primaryButtonBlue, loading && styles.disabledButton]} 
          onPress={handleSignup}
          disabled={loading}
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
  navButtonsContainer: { marginTop: 16 },
  primaryButtonBlue: { backgroundColor: '#0038A8', height: 54, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  primaryButtonTextBlue: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  disabledButton: { backgroundColor: '#94a3b8' },
});

export default SignupStep3;
