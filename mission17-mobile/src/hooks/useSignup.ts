import { useState } from 'react';
import { Keyboard, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useNotification } from '../context/NotificationContext';
import { endpoints } from '../config/api'; 
import * as ImagePicker from 'expo-image-picker';
import { auth } from '../config/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { fetchWithTimeout, getFriendlyNetworkMessage } from '../utils/network';
import { isDirectoryPurok } from '../config/addressDirectory';
import {
  calculateAge,
  formatBirthDate,
  getLatestEligibleBirthDate,
  isStrongSignupPassword,
  isValidPersonName,
  MAXIMUM_RESIDENT_AGE,
  MINIMUM_SIGNUP_AGE,
  parseBirthDate,
} from '../utils/signupValidation';

export const LEGAL_POLICY_VERSION = '2026-09-08-capstone-v1';

export const useSignup = () => {
  const { showNotification, registerPendingPushToken } = useNotification();
  const navigation = useNavigation<any>();
  
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    firstName: '', middleName: '', lastName: '', suffix: '', birthDate: '', age: '',
    placeOfBirth: '', gender: '', civilStatus: '', nationality: '', religion: '',
    completeAddress: '', purok: '', yearsOfResidency: '', mobileNumber: '',
    email: '', voterStatus: '', employmentStatus: '', occupation: '',
    educationalAttainment: '', disability: '', idType: '',
    password: '', confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [noMiddleName, setNoMiddleName] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateObj, setDateObj] = useState(getLatestEligibleBirthDate());

  const [validIdFront, setValidIdFront] = useState<any>(null);
  const [validIdBack, setValidIdBack] = useState<any>(null);
  const [profileImage, setProfileImage] = useState<any>(null);
  const [nationalitySelection, setNationalitySelection] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [emailVerificationPending, setEmailVerificationPending] = useState(false);
  const [signupVerificationToken, setSignupVerificationToken] = useState('');
  const [signupVerificationEmail, setSignupVerificationEmail] = useState('');

  const handleInputChange = (field: string, value: string) => {
    if (field === 'email' && value.trim().toLowerCase() !== formData.email.trim().toLowerCase()) {
      setSignupVerificationToken('');
      setSignupVerificationEmail('');
      setEmailVerificationPending(false);
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDateObj(selectedDate);
      const formattedDate = formatBirthDate(selectedDate);
      handleInputChange('birthDate', formattedDate);

      // Auto calculate age
      const calculatedAge = calculateAge(selectedDate);
      handleInputChange('age', calculatedAge === null ? '' : String(calculatedAge));
    }
  };

  const pickImage = async (type: 'idFront' | 'idBack' | 'profile') => {
    let result;
    
    if (type === 'idFront' || type === 'idBack') {
      if (!formData.idType) {
        showNotification('Select the type of valid ID before attaching its photos.', 'error');
        return;
      }
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

  const startSignupVerification = async () => {
    setLoading(true);
    try {
      const response = await fetchWithTimeout(endpoints.auth.startSignupVerification, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email.trim(), firstName: formData.firstName.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not send the verification code.');
      setSignupVerificationEmail(formData.email.trim().toLowerCase());
      setEmailVerificationPending(true);
      showNotification('Verification code sent. Check your inbox and Spam or Junk folder.', 'success');
      return true;
    } catch (error) {
      const message = error instanceof Error && error.message
        ? error.message
        : getFriendlyNetworkMessage(error, 'Could not send the verification code. Please try again.');
      showNotification(message, 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const verifySignupEmail = async (otp: string) => {
    setLoading(true);
    try {
      const response = await fetchWithTimeout(endpoints.auth.verifySignupEmail, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email.trim(), otp }),
      });
      const data = await response.json();
      if (!response.ok || !data.verificationToken) throw new Error(data.message || 'Could not verify your email.');
      setSignupVerificationToken(data.verificationToken);
      setEmailVerificationPending(false);
      setStep(2);
      showNotification('Email verified. Continue your registration.', 'success');
      return true;
    } catch (error) {
      const message = error instanceof Error && error.message
        ? error.message
        : getFriendlyNetworkMessage(error, 'Could not verify your email. Please try again.');
      showNotification(message, 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const nextStep = async () => {
    if (step === 1) {
      if (!formData.firstName || !formData.lastName) {
        showNotification('First and Last Name are required.', 'error');
        return;
      }
      if (!isValidPersonName(formData.firstName) || !isValidPersonName(formData.lastName)) {
        showNotification('First and Last Name may contain letters, spaces, hyphens, apostrophes, and periods only.', 'error');
        return;
      }
      if (formData.middleName && !isValidPersonName(formData.middleName)) {
        showNotification('Middle Name may contain letters, spaces, hyphens, apostrophes, and periods only.', 'error');
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
      if (!signupVerificationToken) {
        if (signupVerificationEmail === formData.email.trim().toLowerCase()) {
          setEmailVerificationPending(true);
          return;
        }
        await startSignupVerification();
        return;
      }
    }

    if (step === 2) {
      if (!formData.birthDate) {
        showNotification('Birthdate is required.', 'error');
        return;
      }
      const parsedBirthDate = parseBirthDate(formData.birthDate);
      if (!parsedBirthDate) {
        showNotification('Please enter a valid birthdate that is not in the future.', 'error');
        return;
      }
      const calculatedAge = calculateAge(parsedBirthDate);
      if (calculatedAge === null || calculatedAge < 0 || calculatedAge > MAXIMUM_RESIDENT_AGE) {
        showNotification('Please enter a realistic birthdate.', 'error');
        return;
      }
      if (calculatedAge < MINIMUM_SIGNUP_AGE) {
        showNotification(`You must be at least ${MINIMUM_SIGNUP_AGE} years old to create an account.`, 'error');
        return;
      }
      if (formData.age !== String(calculatedAge)) handleInputChange('age', String(calculatedAge));
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
      const normalizedNationality = formData.nationality.trim();
      if (!normalizedNationality) {
        showNotification(nationalitySelection === 'Other' ? 'Please specify your nationality.' : 'Nationality is required.', 'error');
        return;
      }
      if (normalizedNationality !== formData.nationality) {
        handleInputChange('nationality', normalizedNationality);
      }
      if (!isDirectoryPurok(formData.purok)) {
        showNotification('Please select your Purok.', 'error');
        return;
      }
      if (formData.completeAddress.trim().length < 5) {
        showNotification('Enter your street (at least 5 characters).', 'error');
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

    if (!privacyAccepted || !termsAccepted) {
      showNotification('Please accept both the Privacy Notice and Terms of Use to continue.', 'error');
      return;
    }

    if (!formData.password) {
      showNotification('Password is required.', 'error');
      return;
    }
    // Match the password-change policy: length plus every character class.
    if (!isStrongSignupPassword(formData.password)) {
      showNotification('Use 8+ characters with uppercase, lowercase, a number, and a special character.', 'error');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showNotification('Passwords do not match.', 'error');
      return;
    }

    const requiresIdBack = formData.idType !== 'Passport';
    if (!formData.idType) {
      showNotification('Please select the type of valid ID you are submitting.', 'error');
      return;
    }
    if (!validIdFront || (requiresIdBack && !validIdBack)) {
      showNotification(requiresIdBack ? 'Please attach both the front and back of your valid ID.' : 'Please attach your passport information page.', 'error');
      return;
    }

    setLoading(true);
    let signupStage: 'firebase-account' | 'registration-upload' = 'firebase-account';

    try {
      // 1. Create the Firebase credential only after the email was verified.
      // If a previous sync attempt timed out, reuse the same credential so a
      // resident can safely retry instead of being told their email is taken.
      const cleanEmail = formData.email.trim();
      let userCredential;
      try {
        userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, formData.password);
      } catch (firebaseError: any) {
        if (firebaseError?.code !== 'auth/email-already-in-use') throw firebaseError;
        userCredential = await signInWithEmailAndPassword(auth, cleanEmail, formData.password);
      }
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
      formPayload.append('signupVerificationToken', signupVerificationToken);
      formPayload.append('privacyAccepted', 'true');
      formPayload.append('termsAccepted', 'true');
      formPayload.append('policyVersion', LEGAL_POLICY_VERSION);
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
      if (validIdBack && formData.idType !== 'Passport') {
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
      signupStage = 'registration-upload';
      const response = await fetchWithTimeout(`${endpoints.auth.baseUrl}/sync-user`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${firebaseToken}` 
        },
        body: formPayload
      }, 60000);

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
        // Pending residents cannot sign in yet, so ask for notification permission
        // here and bind the device token to their verified Firebase identity. This
        // lets them receive an approval or rejection update from barangay staff.
        try {
          const notificationStatus = await registerPendingPushToken(firebaseToken);
          if (notificationStatus === 'denied') {
            showNotification('Approval updates will not alert this device until notifications are enabled in your phone settings.', 'info');
          }
        } catch (pushError) {
          // A push-provider/device issue must never make a successfully submitted
          // registration look like a failed registration.
          console.warn('Could not register pending-account notifications:', pushError);
        }
        navigation.replace('SignupSuccess');
      } else {
        const msg = data.message || 'Something went wrong';
        if (/verify your email in step 1/i.test(msg)) {
          setSignupVerificationToken('');
          setSignupVerificationEmail('');
          setEmailVerificationPending(false);
          setStep(1);
        }
        showNotification(msg, 'error');
      }
    } catch (error: any) {
      const errorCode = typeof error?.code === 'string' ? error.code : '';
      console.error('Signup failed', {
        stage: signupStage,
        code: errorCode || undefined,
        message: error?.message || String(error)
      });

      if (signupStage === 'firebase-account') {
        if (errorCode === 'auth/email-already-in-use') {
          showNotification('That email is already registered. Use Sign In instead.', 'error');
        } else if (errorCode === 'auth/network-request-failed') {
          showNotification('Firebase could not create the account. Check your internet connection and try again.', 'error');
        } else if (errorCode === 'auth/operation-not-allowed') {
          showNotification('Email sign-up is temporarily unavailable. Please contact the barangay administrator.', 'error');
        } else {
          showNotification('We could not create your Firebase account. Please try again.', 'error');
        }
      } else {
        showNotification(
          getFriendlyNetworkMessage(error, 'Your account was created, but we could not submit your registration details. Please try again.'),
          'error'
        );
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
    nationalitySelection,
    setNationalitySelection,
    privacyAccepted,
    setPrivacyAccepted,
    termsAccepted,
    setTermsAccepted,
    emailVerificationPending,
    setEmailVerificationPending,
    startSignupVerification,
    verifySignupEmail,
    handleInputChange,
    handleDateChange,
    pickImage,
    nextStep,
    prevStep,
    handleSignup,
    navigation
  };
};
