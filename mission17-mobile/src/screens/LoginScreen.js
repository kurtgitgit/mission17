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
  Dimensions
} from 'react-native';
import { User, Lock, Eye, EyeOff } from 'lucide-react-native';

// Import Logo (Adjusted for your folder structure)
const logoImg = require('../../assets/logo.png');

const LoginScreen = ({ navigation }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // Navigate to your HomeScreen
    // We use 'replace' so the user can't go back to login
    navigation.replace('Home'); 
  };

  const handleSignup = () => {
     navigation.navigate('Signup');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.contentContainer}
      >
        
        {/* 1. LOGO SECTION */}
        <View style={styles.logoContainer}>
          <Image source={logoImg} style={styles.logoImage} resizeMode="contain" />
        </View>

        {/* 2. WHITE FLOATING CARD */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Login</Text>

          {/* Username Input */}
          <View style={styles.inputWrapper}>
            <User size={20} color="#64748b" style={styles.inputIcon} />
            <TextInput 
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#94a3b8"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
          </View>

          {/* Password Input */}
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
              {showPassword ? (
                <EyeOff size={20} color="#64748b" />
              ) : (
                <Eye size={20} color="#64748b" />
              )}
            </TouchableOpacity>
          </View>

          {/* Login Button (Blue Pill) */}
          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
            <Text style={styles.loginBtnText}>Login</Text>
          </TouchableOpacity>
        </View>

        {/* 3. FOOTER (Sign Up) */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? Sign Up</Text>
          
          <TouchableOpacity style={styles.signupBtn} onPress={handleSignup}>
            <Text style={styles.signupBtnText}>Sign up</Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9', // Light gray background
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  // Logo
  logoContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  logoImage: {
    width: 140, 
    height: 140,
  },

  // Card
  card: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 25,
    paddingVertical: 30,
    paddingHorizontal: 25,
    // Shadows
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0f6bba', // Blue title
    marginBottom: 25,
  },

  // Inputs
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1', // Light gray underline
    paddingVertical: 10,
    marginBottom: 20,
    width: '100%',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#334155',
    height: 40,
  },

  // Login Button
  loginBtn: {
    backgroundColor: '#0f6bba', // Main Blue
    width: '100%',
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    shadowColor: '#0f6bba',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loginBtnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Footer
  footer: {
    marginTop: 30,
    alignItems: 'center',
    width: '100%',
  },
  footerText: {
    color: '#64748b',
    fontSize: 14,
    marginBottom: 15,
  },
  signupBtn: {
    backgroundColor: '#0f6bba',
    width: '60%', // Smaller button for signup
    height: 45,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LoginScreen;