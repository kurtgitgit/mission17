import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform, Image, Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Mail, Lock } from 'lucide-react-native';
import { endpoints, GlobalState } from '../config/api';
import { saveAuthData } from '../utils/storage'; 

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    Keyboard.dismiss(); // 📱 UX Fix: Hide keyboard on press

    if (!email || !password) {
      const msg = 'Please enter both email and password';
      Platform.OS === 'web' ? alert(msg) : Alert.alert('Error', msg);
      return; 
    }

    setLoading(true);

    try {
      // 🛡️ DATA CLEANING: Trim spaces before sending
      const cleanEmail = email.trim();

      const response = await fetch(endpoints.auth.login, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Login Token:', data.token); 
        
        // 🚨 SAFETY CHECK: Ensure we get an ID
        const userId = data.user._id || data.user.id; 
        
        // Normalize user data to ensure _id is present
        const userData = { ...data.user, _id: userId };

        // 1. Set Global State
        GlobalState.userId = userId;

        // 2. Save Securely
        await saveAuthData(data.token, userData);
        
        navigation.replace('Home', { 
          screen: 'HomeTab', 
          params: { userId: userId } 
        }); 
      } else {
        const msg = data.message || 'Invalid credentials';
        Platform.OS === 'web' ? alert(msg) : Alert.alert('Login Failed', msg);
      }
    } catch (error) {
      const msg = 'Could not connect to server.';
      Platform.OS === 'web' ? alert(msg) : Alert.alert('Error', msg);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      
      {/* HEADER WITH LOGO */}
      <View style={styles.header}>
        {/* Make sure this image exists, or remove if not needed */}
        <Image 
          source={require('../../assets/logo.png')} 
          style={styles.logo} 
          resizeMode="contain"
        />
        <Text style={styles.title}>Login</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Mail color="#94a3b8" size={20} style={styles.icon} />
          <TextInput 
            placeholder="Email Address" 
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputContainer}>
          <Lock color="#94a3b8" size={20} style={styles.icon} />
          <TextInput 
            placeholder="Password" 
            style={styles.input} 
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity 
          style={styles.loginButton} 
          onPress={handleLogin} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.loginButtonText}>Log In</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
          <Text style={styles.linkText}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8fafc', 
    padding: 24, 
    justifyContent: 'center' 
  },
  header: { 
    alignItems: 'center', 
    marginBottom: 32 
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#0ea5e9' 
  },
  form: { 
    gap: 16 
  },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'white', 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    paddingHorizontal: 16, 
    height: 56 
  },
  icon: { 
    marginRight: 12 
  },
  input: { 
    flex: 1, 
    fontSize: 16, 
    color: '#1e293b',
    ...Platform.select({
      web: { outlineStyle: 'none' as any }
    }) 
  },
  loginButton: { 
    backgroundColor: '#0ea5e9', 
    height: 56, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 8 
  },
  loginButtonText: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  footer: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    marginTop: 32 
  },
  footerText: { 
    color: '#64748b', 
    fontSize: 14 
  },
  linkText: { 
    color: '#0ea5e9', 
    fontSize: 14, 
    fontWeight: '600' 
  },
});