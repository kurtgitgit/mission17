import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CheckSquare, Square } from 'lucide-react-native';
import FormInput from '../FormInput';
import CustomDropdown from '../CustomDropdown';

interface SignupStep1Props {
  formData: any;
  handleInputChange: (field: string, value: string) => void;
  noMiddleName: boolean;
  setNoMiddleName: (val: boolean) => void;
  nextStep: () => void;
  navigation: any;
}

const SignupStep1 = ({ formData, handleInputChange, noMiddleName, setNoMiddleName, nextStep, navigation }: SignupStep1Props) => {
  return (
    <View style={styles.form}>
      <View style={styles.row}>
        <View style={{ flex: 2, marginRight: 10 }}>
          <FormInput
            placeholder="First Name"
            value={formData.firstName}
            onChangeText={(val) => handleInputChange("firstName", val)}
            required
          />
        </View>
        <View style={{ flex: 1 }}>
          <CustomDropdown 
            label="Suffix" 
            value={formData.suffix} 
            options={["None", "Jr.", "Sr.", "II", "III", "IV"]} 
            onSelect={(val) => handleInputChange("suffix", val === "None" ? "" : val)} 
          />
        </View>
      </View>

      <FormInput
        placeholder="Middle Name"
        value={noMiddleName ? '' : formData.middleName}
        onChangeText={(val) => handleInputChange("middleName", val)}
        editable={!noMiddleName}
      />
      
      <TouchableOpacity 
        style={styles.checkboxRowRight} 
        onPress={() => setNoMiddleName(!noMiddleName)}
      >
        {noMiddleName ? <CheckSquare color="#0038A8" size={18} /> : <Square color="#cbd5e1" size={18} />}
        <Text style={styles.checkboxLabelRight}>I have no middle name</Text>
      </TouchableOpacity>

      <FormInput
        placeholder="Last Name"
        value={formData.lastName}
        onChangeText={(val) => handleInputChange("lastName", val)}
        required
      />

      <FormInput
        placeholder="Email Address"
        value={formData.email}
        onChangeText={(val) => handleInputChange("email", val)}
        keyboardType="email-address"
        required
      />

      <Text style={styles.disclaimerText}>
        By tapping <Text style={{fontWeight: 'bold', color: '#1e293b'}}>Continue</Text>, you agree with the <Text style={styles.linkTextBlue}>Terms and Conditions</Text> and <Text style={styles.linkTextBlue}>Privacy Notice</Text>
      </Text>

      <TouchableOpacity style={styles.primaryButtonBlue} onPress={nextStep}>
        <Text style={styles.primaryButtonTextBlue}>Continue</Text>
      </TouchableOpacity>

      <View style={styles.dividerContainer}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      <Text style={styles.alreadyHaveText}>Already have an account?</Text>
      <TouchableOpacity style={styles.outlineButton} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.outlineButtonText}>Login here</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  form: { gap: 14 },
  row: { flexDirection: 'row' },
  checkboxRowRight: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: -6, marginBottom: 6 },
  checkboxLabelRight: { fontSize: 13, color: '#64748b' },
  disclaimerText: { fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 20, marginTop: 10, paddingHorizontal: 10 },
  linkTextBlue: { color: '#0038A8', fontWeight: 'bold' },
  primaryButtonBlue: { backgroundColor: '#0038A8', height: 54, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  primaryButtonTextBlue: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
  dividerText: { marginHorizontal: 16, color: '#94a3b8', fontSize: 13 },
  alreadyHaveText: { textAlign: 'center', color: '#475569', fontSize: 14, marginBottom: 12 },
  outlineButton: { borderWidth: 1, borderColor: '#0038A8', height: 54, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  outlineButtonText: { color: '#0038A8', fontSize: 15, fontWeight: '600' },
});

export default SignupStep1;
