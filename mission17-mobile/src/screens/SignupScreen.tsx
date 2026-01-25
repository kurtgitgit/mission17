import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  ViewStyle,
  TextStyle,
  KeyboardAvoidingViewProps
} from 'react-native';
import { User, Lock, Mail, MapPin, Eye, EyeOff } from 'lucide-react-native';

// Use 'any' for the image require to avoid TS issues if assets aren't typed
const logoImg = require('../../assets/logo.png');

const SignupScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = () => {
    alert("Account Created!"); 
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login'); 
  };

  // --- THE FIXES START HERE ---

  // Fix 1: Explicitly tell TS that RootComponent is just a Component that accepts any props
  const RootComponent = (Platform.OS === 'web' ? View : SafeAreaView) as React.ElementType;
  
  // Fix 2: Define the wrapper props with 'any' to stop the "behavior" mismatch complaint
  const Wrapper = (Platform.OS === 'web' ? View : KeyboardAvoidingView) as React.ElementType;
  const wrapperProps: any = Platform.OS === 'web' 
    ? { style: styles.webWrapper } 
    : { behavior: Platform.OS === 'ios' ? 'padding' : 'height', style: styles.mobileWrapper };

  return (
    <RootComponent style={Platform.OS === 'web' ? styles.webContainer : styles.mobileContainer}>
      <Wrapper {...wrapperProps}>
        
        <ScrollView 
          style={Platform.OS === 'web' ? styles.webScrollView : styles.mobileScrollView}
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
        >
          
          <View style={styles.logoContainer}>
            <Image source={logoImg} style={styles.logoImage} resizeMode="contain" />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign-up</Text>

            {/* Address */}
            <View style={styles.inputWrapper}>
              <MapPin size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                placeholder="Address"
                placeholderTextColor="#94a3b8"
                value={address}
                onChangeText={setAddress}
              />
            </View>

            {/* Email */}
            <View style={styles.inputWrapper}>
              <Mail size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Username */}
            <View style={styles.inputWrapper}>
              <User size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                value={username}
                onChangeText={setUsername}
              />
            </View>

            {/* Password */}
            <View style={styles.inputWrapper}>
              <Lock size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={20} color="#64748b"/> : <Eye size={20} color="#64748b"/>}
              </TouchableOpacity>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputWrapper}>
              <Lock size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showConfirm}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? <EyeOff size={20} color="#64748b"/> : <Eye size={20} color="#64748b"/>}
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.registerBtn} onPress={handleRegister}>
              <Text style={styles.registerBtnText}>Register</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleBackToLogin} style={styles.loginLink}>
              <Text style={styles.footerText}>Already have an account? Login</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </Wrapper>
    </RootComponent>
  );
};

const styles = StyleSheet.create({
  webContainer: {
    backgroundColor: '#f1f5f9',
    minHeight: '100%', 
    width: '100%',
    alignItems: 'center',
  } as ViewStyle, // Explicit casting
  webWrapper: {
    width: '100%',
    maxWidth: 500, 
    alignItems: 'center',
  } as ViewStyle,
  webScrollView: {
    width: '100%',
  } as ViewStyle,

  mobileContainer: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  } as ViewStyle,
  mobileWrapper: {
    flex: 1,
  } as ViewStyle,
  mobileScrollView: {
    flex: 1,
    width: '100%',
  } as ViewStyle,

  scrollContent: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  } as ViewStyle,

  logoContainer: { marginBottom: 20, alignItems: 'center' } as ViewStyle,
  logoImage: { width: 100, height: 100 } as any, 

  card: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 25,
    paddingVertical: 30,
    paddingHorizontal: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    alignItems: 'center',
  } as ViewStyle,
  cardTitle: { fontSize: 26, fontWeight: '900', color: '#0f6bba', marginBottom: 25 } as TextStyle,

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingVertical: 10,
    marginBottom: 20,
    width: '100%',
  } as ViewStyle,
  inputIcon: { marginRight: 10 } as ViewStyle,
  
  // Fix 3: 'as any' silences the outlineStyle error
  input: {
    flex: 1,
    fontSize: 15,
    color: '#334155',
    height: 40,
    outlineStyle: 'none', 
  } as any, 

  registerBtn: {
    backgroundColor: '#0f6bba',
    width: '100%',
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#0f6bba',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    cursor: 'pointer',
  } as any, // 'as any' for cursor pointer on web
  
  registerBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold' } as TextStyle,
  loginLink: { marginTop: 10, cursor: 'pointer' } as any,
  footerText: { color: '#64748b', fontSize: 13, fontWeight: '500' } as TextStyle,
});

export default SignupScreen;