import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import FormInput from '../FormInput';
import CustomDropdown from '../CustomDropdown';

interface SignupStep2Props {
  formData: any;
  handleInputChange: (field: string, value: string) => void;
  showDatePicker: boolean;
  setShowDatePicker: (val: boolean) => void;
  dateObj: Date;
  handleDateChange: (event: any, selectedDate?: Date) => void;
  nextStep: () => void;
}

const SignupStep2 = ({ 
  formData, 
  handleInputChange, 
  showDatePicker, 
  setShowDatePicker, 
  dateObj, 
  handleDateChange, 
  nextStep 
}: SignupStep2Props) => {
  return (
    <View style={styles.form}>
      <Text style={styles.sectionTitle}>Basic Information</Text>
      
      {Platform.OS === 'web' ? (
        <FormInput
          placeholder="Birthdate (MM/DD/YYYY)"
          value={formData.birthDate}
          onChangeText={(val) => handleInputChange("birthDate", val)}
          required
        />
      ) : (
        <>
          <TouchableOpacity 
            style={styles.inputContainer} 
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={{ flex: 1, fontSize: 15, color: formData.birthDate ? '#1e293b' : '#94a3b8' }}>
              {formData.birthDate || "Birthdate (MM/DD/YYYY)"}
              {!formData.birthDate && <Text style={{ color: '#ef4444', fontWeight: 'bold' }}> *</Text>}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={dateObj}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              maximumDate={new Date()}
              onChange={handleDateChange}
            />
          )}

          {Platform.OS === 'ios' && showDatePicker && (
            <TouchableOpacity 
              style={{ backgroundColor: '#0038A8', padding: 10, borderRadius: 8, alignItems: 'center', marginBottom: 10 }}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={{ color: 'white', fontWeight: 'bold' }}>Confirm Date</Text>
            </TouchableOpacity>
          )}
        </>
      )}
      
      <FormInput
        placeholder="Age"
        value={formData.age}
        onChangeText={(val) => handleInputChange("age", val)}
        keyboardType="numeric"
      />
      
      <CustomDropdown 
        label="Gender" 
        value={formData.gender} 
        options={["Male", "Female", "Other", "Prefer not to say"]} 
        onSelect={(val) => handleInputChange("gender", val)} 
        required
      />
      
      <CustomDropdown 
        label="Civil Status" 
        value={formData.civilStatus} 
        options={["Single", "Married", "Widowed", "Separated"]} 
        onSelect={(val) => handleInputChange("civilStatus", val)} 
        required
      />

      <Text style={styles.sectionTitle}>Demographics & Contact</Text>
      
      <FormInput
        placeholder="Mobile Number (Example: 09***)"
        value={formData.mobileNumber}
        onChangeText={(val) => handleInputChange("mobileNumber", val)}
        keyboardType="phone-pad"
        required
      />

      <FormInput
        placeholder="Nationality"
        value={formData.nationality}
        onChangeText={(val) => handleInputChange("nationality", val)}
        required
      />

      <FormInput
        placeholder="Complete Address"
        value={formData.completeAddress}
        onChangeText={(val) => handleInputChange("completeAddress", val)}
        required
      />

      <CustomDropdown 
        label="Voter Status" 
        value={formData.voterStatus} 
        options={["Registered", "Not Registered"]} 
        onSelect={(val) => handleInputChange("voterStatus", val)} 
        required
      />
      
      <CustomDropdown 
        label="Employment Status" 
        value={formData.employmentStatus} 
        options={["Employed", "Self-Employed", "Unemployed", "Student", "Retired"]} 
        onSelect={(val) => handleInputChange("employmentStatus", val)} 
      />

      <View style={styles.navButtonsContainer}>
        <TouchableOpacity style={styles.primaryButtonBlue} onPress={nextStep}>
          <Text style={styles.primaryButtonTextBlue}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  form: { gap: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginTop: 10, marginBottom: 4 },
  inputContainer: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', 
    borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 16, height: 54,
  },
  primaryButtonBlue: { backgroundColor: '#0038A8', height: 54, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  primaryButtonTextBlue: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  navButtonsContainer: { marginTop: 16 },
});

export default SignupStep2;
