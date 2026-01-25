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
  ScrollView
} from 'react-native';
import { User, Lock, Mail, MapPin, Eye, EyeOff } from 'lucide-react-native';

const logoImg = require('../../assets/logo.png');

const SignupScreen = ({ navigation }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  // Form State
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

  // --- COMPONENT SELECTION ---
  // On Web: Use a simple View so the browser handles scrolling naturally.
  // On Mobile: Use SafeAreaView + KeyboardAvoidingView for app behavior.
  const RootComponent = Platform.OS === 'web' ? View : SafeAreaView;
  const Wrapper = Platform.OS === 'web' ? View : KeyboardAvoidingView;

  const rootProps = Platform.OS === 'web' ? { style: styles.webContainer } : { style: styles.mobileContainer };
  const wrapperProps = Platform.OS === 'web' 
    ? { style: styles.webWrapper } 
    : { behavior: Platform.OS === 'ios' ? 'padding' : 'height', style: styles.mobileWrapper };

  return (
    <RootComponent {...rootProps}>
      <Wrapper {...wrapperProps}>
        
        <ScrollView 
          // On web, we let it flow naturally. On mobile, we fill the screen.
          style={Platform.OS === 'web' ? styles.webScrollView : styles.mobileScrollView}
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
        >
          
          {/* 1. LOGO */}
          <View style={styles.logoContainer}>
            <Image source={logoImg} style={styles.logoImage} resizeMode="contain" />
          </View>

          {/* 2. CARD */}
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

            {/* Register Button */}
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
  // --- WEB STYLES (Browser Logic) ---
  webContainer: {
    backgroundColor: '#f1f5f9',
    minHeight: '100%', // Allows page to grow infinitely
    width: '100%',
    alignItems: 'center', // Centers the card horizontally
  },
  webWrapper: {
    width: '100%',
    maxWidth: 500, // Limits width on desktop so it looks like an app
    alignItems: 'center',
  },
  webScrollView: {
    width: '100%',
    // No flex: 1 here! Let it grow with content.
  },

  // --- MOBILE STYLES (App Logic) ---
  mobileContainer: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  mobileWrapper: {
    flex: 1,
  },
  mobileScrollView: {
    flex: 1,
    width: '100%',
  },

  // --- SHARED STYLES ---
  scrollContent: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },

  // Logo
  logoContainer: { marginBottom: 20, alignItems: 'center' },
  logoImage: { width: 100, height: 100 },

  // Card
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
  },
  cardTitle: { fontSize: 26, fontWeight: '900', color: '#0f6bba', marginBottom: 25 },

  // Inputs
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingVertical: 10,
    marginBottom: 20,
    width: '100%',
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#334155',
    height: 40,
    outlineStyle: 'none', 
  },

  // Buttons
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
  },
  registerBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  loginLink: { marginTop: 10, cursor: 'pointer' },
  footerText: { color: '#64748b', fontSize: 13, fontWeight: '500' },
});

export default SignupScreen;