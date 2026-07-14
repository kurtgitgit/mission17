import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Platform, 
  Image,
  KeyboardAvoidingView,
  ScrollView,
  SafeAreaView,
  Keyboard,
  Modal,
  TouchableWithoutFeedback
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Eye, EyeOff, Upload, CheckSquare, Square, ChevronDown } from 'lucide-react-native';
import { useNotification } from '../context/NotificationContext';
import { endpoints } from '../config/api'; 
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

const missionLogo = require('../../assets/logo.png');

// Custom Cross-Platform Dropdown
const CustomDropdown = ({ label, value, options, onSelect, required = false }: { label: string, value: string, options: string[], onSelect: (val: string) => void, required?: boolean }) => {
  const [visible, setVisible] = useState(false);
  return (
    <View style={styles.inputContainer}>
      <TouchableOpacity 
        style={styles.dropdownTrigger}
        onPress={() => { Keyboard.dismiss(); setVisible(true); }}
      >
        <Text style={{ color: value ? '#1e293b' : '#94a3b8', fontSize: 15 }}>
          {value || label}
          {required && !value && <Text style={{ color: '#ef4444', fontWeight: 'bold' }}> *</Text>}
        </Text>
        <ChevronDown color="#94a3b8" size={20} />
      </TouchableOpacity>
      
      <Modal visible={visible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select {label}</Text>
              <ScrollView style={{ maxHeight: 300 }}>
                {options.map((opt) => (
                  <TouchableOpacity 
                    key={opt} 
                    style={styles.modalOption}
                    onPress={() => { onSelect(opt); setVisible(false); }}
                  >
                    <Text style={[styles.modalOptionText, value === opt && styles.modalOptionTextSelected]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export default function SignupScreen() {
  const { showNotification } = useNotification();
  const navigation = useNavigation<any>();
  
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    firstName: '', middleName: '', lastName: '', suffix: '', birthDate: '', age: '',
    placeOfBirth: '', gender: '', civilStatus: '', nationality: '', religion: '',
    completeAddress: '', purok: '', yearsOfResidency: '', mobileNumber: '',
    email: '', voterStatus: '', employmentStatus: '', occupation: '',
    educationalAttainment: '', disability: '',
    password: '', confirmPassword: ''
  });

  const [role, setRole] = useState('Resident'); 
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [noMiddleName, setNoMiddleName] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateObj, setDateObj] = useState(new Date());

  const [validIdFront, setValidIdFront] = useState<any>(null);
  const [validIdBack, setValidIdBack] = useState<any>(null);
  const [profileImage, setProfileImage] = useState<any>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDateObj(selectedDate);
      const formattedDate = selectedDate.toLocaleDateString('en-US', {
        month: '2-digit', day: '2-digit', year: 'numeric'
      });
      handleInputChange('birthDate', formattedDate);

      // Auto calculate age
      const today = new Date();
      let calcAge = today.getFullYear() - selectedDate.getFullYear();
      const m = today.getMonth() - selectedDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < selectedDate.getDate())) {
        calcAge--;
      }
      handleInputChange('age', calcAge.toString());
    }
  };

  const pickImage = async (type: 'idFront' | 'idBack' | 'profile') => {
    let result;
    
    if (type === 'idFront' || type === 'idBack') {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (permissionResult.granted === false) {
        showNotification('Camera permission is required to take a photo of your ID.', 'error');
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
    }

    if (!result.canceled) {
      if (type === 'idFront') setValidIdFront(result.assets[0]);
      if (type === 'idBack') setValidIdBack(result.assets[0]);
      if (type === 'profile') setProfileImage(result.assets[0]);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.firstName || !formData.lastName) {
        showNotification('First and Last Name are required.', 'error');
        return;
      }
      if (!formData.email) {
        showNotification('Email Address is required.', 'error');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        showNotification('Please enter a valid email address.', 'error');
        return;
      }
    }
    setStep(prev => Math.min(prev + 1, 3));
  };

  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const handleSignup = async () => {
    Keyboard.dismiss();

    if (!formData.password) {
      showNotification('Password is required.', 'error');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      showNotification('Passwords do not match.', 'error');
      return;
    }

    if (!validIdFront || !validIdBack) {
      showNotification('Please attach both the front and back of a Valid ID.', 'error');
      return;
    }

    setLoading(true);

    try {
      const formPayload = new FormData();
      Object.keys(formData).forEach(key => {
        if (key !== 'confirmPassword') {
          if (key === 'middleName' && noMiddleName) {
            formPayload.append(key, '');
          } else {
            formPayload.append(key, formData[key as keyof typeof formData]);
          }
        }
      });
      formPayload.append('role', role.toLowerCase());

      if (validIdFront) {
        formPayload.append('validIdFront', {
          uri: validIdFront.uri,
          name: 'valid_id_front.jpg',
          type: 'image/jpeg'
        } as any);
      }
      if (validIdBack) {
        formPayload.append('validIdBack', {
          uri: validIdBack.uri,
          name: 'valid_id_back.jpg',
          type: 'image/jpeg'
        } as any);
      }
      
      if (profileImage) {
        formPayload.append('profileImage', {
          uri: profileImage.uri,
          name: 'profile_img.jpg',
          type: 'image/jpeg'
        } as any);
      }

      const response = await fetch(endpoints.auth.signup, {
        method: 'POST',
        body: formPayload,
      });

      const data = await response.json();

      if (response.ok) {
        showNotification('Account created successfully! It is now pending admin approval.', 'success');
        navigation.navigate('VerifySignup', { 
          userId: data.userId, 
          email: formData.email.trim() 
        });
      } else {
        const msg = data.message || 'Something went wrong';
        showNotification(msg, 'error');
      }
    } catch (error) {
      console.error(error);
      showNotification('Connection Error. Is the backend running?', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const RootComponent = (Platform.OS === 'web' ? View : SafeAreaView) as React.ElementType;
  const webInputStyle = Platform.OS === 'web' ? { outlineStyle: 'none' } : {};

  const renderInput = (placeholder: string, field: string, keyboardType: any = "default", required: boolean = false) => (
    <View style={styles.inputContainer}>
      <TextInput 
        placeholder={placeholder} 
        style={[styles.input, webInputStyle as any]} 
        value={(formData as any)[field]}
        onChangeText={(val) => handleInputChange(field, val)}
        keyboardType={keyboardType}
        placeholderTextColor="#94a3b8"
      />
      {required && <Text style={{ color: '#ef4444', fontSize: 16, fontWeight: 'bold', marginLeft: 8 }}>*</Text>}
    </View>
  );

  return (
    <RootComponent style={styles.root}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
          
          {/* HEADER WITH LOGO (Blue) */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => { step === 1 ? navigation.goBack() : prevStep() }}
            >
              <ArrowLeft color="white" size={24} />
            </TouchableOpacity>

            <Image 
              source={missionLogo} 
              style={styles.logo} 
              resizeMode="contain"
            />
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Step {step} of 3</Text>
          </View>

          {/* OVERLAPPING WHITE CARD */}
          <View style={styles.cardContainer}>
            
            <View style={styles.topProgressBarContainer}>
              <View style={[styles.topProgressSegment, step >= 1 && styles.topProgressSegmentActive]} />
              <View style={[styles.topProgressSegment, step >= 2 && styles.topProgressSegmentActive]} />
              <View style={[styles.topProgressSegment, step >= 3 && styles.topProgressSegmentActive]} />
            </View>

            <View style={styles.form}>
              {step === 1 && (
                <>
                  <View style={styles.row}>
                    <View style={{ flex: 2, marginRight: 10 }}>
                      {renderInput("First Name", "firstName", "default", true)}
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

                  <View style={[styles.inputContainer, noMiddleName && { backgroundColor: '#f1f5f9' }]}>
                    <TextInput 
                      placeholder="Middle Name" 
                      style={[styles.input, webInputStyle as any]} 
                      value={noMiddleName ? '' : formData.middleName}
                      onChangeText={(val) => handleInputChange("middleName", val)}
                      placeholderTextColor="#94a3b8"
                      editable={!noMiddleName}
                    />
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.checkboxRowRight} 
                    onPress={() => setNoMiddleName(!noMiddleName)}
                  >
                    {noMiddleName ? <CheckSquare color="#0038A8" size={18} /> : <Square color="#cbd5e1" size={18} />}
                    <Text style={styles.checkboxLabelRight}>I have no middle name</Text>
                  </TouchableOpacity>

                  {renderInput("Last Name", "lastName", "default", true)}
                  {renderInput("Email Address", "email", "email-address", true)}

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
                </>
              )}

              {step === 2 && (
                <>
                  <Text style={styles.sectionTitle}>Basic Information</Text>
                  
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
                  {renderInput("Age", "age", "numeric")}
                  {renderInput("Place of Birth", "placeOfBirth", "default", true)}
                  
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
                  {renderInput("Mobile Number (Example: 09***)", "mobileNumber", "phone-pad", true)}
                  {renderInput("Nationality", "nationality", "default", true)}
                  {renderInput("Religion", "religion")}
                  {renderInput("Complete Address", "completeAddress", "default", true)}

                  {renderInput("Years of Residency", "yearsOfResidency", "numeric")}

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
                  
                  {renderInput("Occupation", "occupation")}
                  
                  
                  <CustomDropdown 
                    label="Educational Attainment" 
                    value={formData.educationalAttainment} 
                    options={["Elementary", "High School", "College", "Post-Graduate", "None"]} 
                    onSelect={(val) => handleInputChange("educationalAttainment", val)} 
                  />

                  {renderInput("Disability / Special Needs (if any)", "disability")}

                  <View style={styles.navButtonsContainer}>
                    <TouchableOpacity style={styles.primaryButtonBlue} onPress={nextStep}>
                      <Text style={styles.primaryButtonTextBlue}>Continue</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {step === 3 && (
                <>
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
                  <View style={styles.inputContainer}>
                    <TextInput 
                      placeholder="Password (min 8 chars)" 
                      style={[styles.input, webInputStyle as any]} 
                      value={formData.password}
                      onChangeText={(val) => handleInputChange('password', val)}
                      secureTextEntry={!showPassword}
                      placeholderTextColor="#94a3b8"
                    />
                    <Text style={{ color: '#ef4444', fontSize: 16, fontWeight: 'bold', marginRight: 12 }}>*</Text>
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      {showPassword ? <Eye color="#94a3b8" size={20} /> : <EyeOff color="#94a3b8" size={20} />}
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputContainer}>
                    <TextInput 
                      placeholder="Confirm Password" 
                      style={[styles.input, webInputStyle as any]} 
                      value={formData.confirmPassword}
                      onChangeText={(val) => handleInputChange('confirmPassword', val)}
                      secureTextEntry={!showPassword}
                      placeholderTextColor="#94a3b8"
                    />
                    <Text style={{ color: '#ef4444', fontSize: 16, fontWeight: 'bold', marginLeft: 8 }}>*</Text>
                  </View>

                  <View style={styles.navButtonsContainer}>
                    <TouchableOpacity 
                      style={[styles.primaryButtonBlue, loading && styles.disabledButton]} 
                      onPress={handleSignup}
                      disabled={loading}
                    >
                      {loading ? <ActivityIndicator color="white" /> : <Text style={styles.primaryButtonTextBlue}>Complete Registration</Text>}
                    </TouchableOpacity>
                  </View>
                </>
              )}

            </View>
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
    paddingBottom: 60, // Space for overlapping card
    alignItems: 'center',
    position: 'relative'
  },
  backButton: { position: 'absolute', top: Platform.OS === 'android' ? 60 : 40, left: 24, zIndex: 10 },
  logo: { width: 80, height: 80, marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '800', color: 'white', marginBottom: 4 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  
  // OVERLAPPING CARD
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
  
  form: { gap: 14 },
  row: { flexDirection: 'row' },

  inputContainer: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', 
    borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 16, height: 54,
  },
  input: { flex: 1, fontSize: 15, color: '#1e293b', height: '100%' },

  checkboxRowRight: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: -6, marginBottom: 6 },
  checkboxLabelRight: { fontSize: 13, color: '#64748b' },

  disclaimerText: { fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 20, marginTop: 10, paddingHorizontal: 10 },
  linkTextBlue: { color: '#0038A8', fontWeight: 'bold' },

  primaryButtonBlue: { 
    backgroundColor: '#0038A8', height: 54, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10
  },
  primaryButtonTextBlue: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  
  disabledButton: { backgroundColor: '#94a3b8' },

  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
  dividerText: { marginHorizontal: 16, color: '#94a3b8', fontSize: 13 },

  alreadyHaveText: { textAlign: 'center', color: '#475569', fontSize: 14, marginBottom: 12 },
  outlineButton: { 
    borderWidth: 1, borderColor: '#0038A8', height: 54, borderRadius: 12, justifyContent: 'center', alignItems: 'center'
  },
  outlineButtonText: { color: '#0038A8', fontSize: 15, fontWeight: '600' },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginTop: 10, marginBottom: 4 },
  
  dropdownTrigger: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
  modalContent: { backgroundColor: 'white', borderRadius: 12, padding: 16, maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 16, textAlign: 'center' },
  modalOption: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalOptionText: { fontSize: 16, color: '#475569', textAlign: 'center' },
  modalOptionTextSelected: { color: '#0038A8', fontWeight: 'bold' },
  
  uploadRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  uploadButton: { 
    flexDirection: 'row', alignItems: 'center', gap: 8, 
    paddingVertical: 10, paddingHorizontal: 16, 
    borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' 
  },
  uploadButtonText: { fontSize: 14, color: '#475569', fontWeight: '500' },
  fileLabel: { fontSize: 12, color: '#10b981', fontWeight: '600' },

  navButtonsContainer: { marginTop: 16 },
});
