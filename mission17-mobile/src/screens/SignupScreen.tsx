import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Mail, Lock, User } from 'lucide-react-native';
// 👇 This is the secret sauce: It links to your api.ts file!
import { endpoints } from '../config/api'; 

export default function SignupScreen() {
  const navigation = useNavigation<any>();
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    // 1. Validation
    if (!username || !email || !password) {
      const msg = 'Please fill in all fields';
      Platform.OS === 'web' ? alert(msg) : Alert.alert('Error', msg);
      return;
    }

    setLoading(true);

    try {
      console.log("Attempting signup to:", endpoints.auth.signup); // Debug Log

      // 2. Connect to Backend
      const response = await fetch(endpoints.auth.signup, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // SUCCESS
        if (Platform.OS === 'web') {
           alert('Account created! Please log in.');
           navigation.navigate('Login');
        } else {
           Alert.alert('Success', 'Account created! Please log in.', [
             { text: 'OK', onPress: () => navigation.navigate('Login') }
           ]);
        }
      } else {
        // SERVER ERROR (e.g. Email taken)
        const msg = data.message || 'Something went wrong';
        Platform.OS === 'web' ? alert(msg) : Alert.alert('Signup Failed', msg);
      }
    } catch (error) {
      console.error(error);
      const msg = 'Could not connect to server. Check your Terminal!';
      Platform.OS === 'web' ? alert(msg) : Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <ArrowLeft color="#1e293b" size={24} />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join Mission 17 today</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <User color="#94a3b8" size={20} style={styles.icon} />
          <TextInput 
            placeholder="Username" 
            style={styles.input}
            value={username}
            onChangeText={setUsername}
          />
        </View>

        <View style={styles.inputContainer}>
          <Mail color="#94a3b8" size={20} style={styles.icon} />
          <TextInput 
            placeholder="Email Address" 
            style={styles.input}
            value={email}
            onChangeText={setEmail}
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

        <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.signupButtonText}>Sign Up</Text>}
        </TouchableOpacity>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.linkText}>Log In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 24, justifyContent: 'center' },
  backButton: { position: 'absolute', top: 50, left: 24, padding: 8, zIndex: 10 },
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#64748b' },
  form: { gap: 16 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 16, height: 56 },
  icon: { marginRight: 12 },
  input: { 
    flex: 1, 
    fontSize: 16, 
    color: '#1e293b', 
    ...Platform.select({ web: { outlineStyle: 'none' as any } }) 
  }, 
  signupButton: { backgroundColor: '#3b82f6', height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  signupButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerText: { color: '#64748b', fontSize: 14 },
  linkText: { color: '#3b82f6', fontSize: 14, fontWeight: '600' },
});