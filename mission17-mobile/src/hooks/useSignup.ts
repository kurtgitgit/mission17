import { useState } from 'react';
import { Keyboard, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useNotification } from '../context/NotificationContext';
import { endpoints } from '../config/api'; 
import * as ImagePicker from 'expo-image-picker';
import { auth } from '../config/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export const useSignup = () => {
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

    if (step === 2) {
      if (!formData.birthDate) {
        showNotification('Birthdate is required.', 'error');
        return;
      }
      if (!formData.gender) {
        showNotification('Gender is required.', 'error');
        return;
      }
      if (!formData.civilStatus) {
        showNotification('Civil Status is required.', 'error');
        return;
      }
      if (!formData.mobileNumber) {
        showNotification('Mobile Number is required.', 'error');
        return;
      }
      const mobileRegex = /^09\d{9}$/;
      if (!mobileRegex.test(formData.mobileNumber.trim())) {
        showNotification('Enter a valid PH mobile number (e.g. 09XXXXXXXXX).', 'error');
        return;
      }
      if (!formData.nationality) {
        showNotification('Nationality is required.', 'error');
        return;
      }
      if (!formData.completeAddress) {
        showNotification('Complete Address is required.', 'error');
        return;
      }
      if (!formData.voterStatus) {
        showNotification('Voter Status is required.', 'error');
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
    // Minimum 8 chars & 1 special character validation
    if (formData.password.length < 8 || !/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
      showNotification('Password must be 8+ chars and have a special symbol', 'error');
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
      // 1. Create User in Firebase
      const cleanEmail = formData.email.trim();
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, formData.password);
      const firebaseToken = await userCredential.user.getIdToken();

      // 2. Prepare Form Data for Sync
      const formPayload = new FormData();
      Object.keys(formData).forEach(key => {
        if (key !== 'confirmPassword' && key !== 'password') {
          if (key === 'middleName' && noMiddleName) {
            formPayload.append(key, '');
          } else {
            formPayload.append(key, formData[key as keyof typeof formData]);
          }
        }
      });
      formPayload.append('role', role.toLowerCase());

      const formatUri = (uri: string) => {
        return Platform.OS === 'android' && !uri.startsWith('file://') ? `file://${uri}` : uri;
      };

      if (validIdFront) {
        formPayload.append('validIdFront', {
          uri: formatUri(validIdFront.uri),
          name: 'valid_id_front.jpg',
          type: 'image/jpeg'
        } as any);
      }
      if (validIdBack) {
        formPayload.append('validIdBack', {
          uri: formatUri(validIdBack.uri),
          name: 'valid_id_back.jpg',
          type: 'image/jpeg'
        } as any);
      }
      
      if (profileImage) {
        formPayload.append('profileImage', {
          uri: formatUri(profileImage.uri),
          name: 'profile_img.jpg',
          type: 'image/jpeg'
        } as any);
      }

      // 3. Sync with Backend
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds timeout

      const response = await fetch(`${endpoints.auth.baseUrl}/sync-user`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${firebaseToken}` 
        },
        body: formPayload,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Handle HTML/Bad Gateway responses safely
      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("Backend returned non-JSON response:", responseText);
        throw new Error("Server returned an invalid response.");
      }

      if (response.ok) {
        showNotification('Account created! Please log in to verify your email address.', 'success');
        navigation.navigate('Login');
      } else {
        const msg = data.message || 'Something went wrong';
        showNotification(msg, 'error');
      }
    } catch (error: any) {
      console.error("Signup Catch Error:", error);
      if (error.name === 'AbortError') {
         showNotification('Request timed out. The server might be waking up or your internet is slow. Please try again.', 'error');
      } else if (error.code === 'auth/email-already-in-use') {
         showNotification('That email is already registered.', 'error');
      } else {
         showNotification('Connection Error or Server Error. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    step,
    formData,
    loading,
    showPassword,
    setShowPassword,
    noMiddleName,
    setNoMiddleName,
    showDatePicker,
    setShowDatePicker,
    dateObj,
    validIdFront,
    validIdBack,
    profileImage,
    handleInputChange,
    handleDateChange,
    pickImage,
    nextStep,
    prevStep,
    handleSignup,
    navigation
  };
};
