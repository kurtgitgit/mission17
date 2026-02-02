import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator, 
  Platform, 
  Image,
  KeyboardAvoidingView,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff } from 'lucide-react-native';
import { endpoints } from '../config/api'; 

export default function SignupScreen() {
  const navigation = useNavigation<any>();
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Student'); 
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Available Roles
  const roles = ['Student', 'Teacher', 'LGU', 'NGO'];

  const handleSignup = async () => {
    if (!username || !email || !password) {
      const msg = 'Please fill in all fields';
      Platform.OS === 'web' ? alert(msg) : Alert.alert('Missing Info', msg);
      return;
    }

    setLoading(true);

    try {
      console.log("Attempting signup to:", endpoints.auth.signup);

      const response = await fetch(endpoints.auth.signup, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username, 
          email, 
          password,
          role 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (Platform.OS === 'web') {
           alert('Account created! Please log in.');
           navigation.navigate('Login');
        } else {
           Alert.alert('Success', 'Account created! Please log in.', [
             { text: 'OK', onPress: () => navigation.navigate('Login') }
           ]);
        }
      } else {
        const msg = data.message || 'Something went wrong';
        Platform.OS === 'web' ? alert(msg) : Alert.alert('Signup Failed', msg);
      }
    } catch (error) {
      console.error(error);
      const msg = 'Connection Error. Is the backend running?';
      Platform.OS === 'web' ? alert(msg) : Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };
  
  const RootComponent = (Platform.OS === 'web' ? View : SafeAreaView) as React.ElementType;

  // Helper for web styles to avoid TypeScript errors
  const webInputStyle = Platform.OS === 'web' ? { outlineStyle: 'none' } : {};

  return (
    <RootComponent style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft color="#1e293b" size={24} />
          </TouchableOpacity>

          <View style={styles.header}>
            {/* Using a web URL for the logo to prevent crashes if file is missing */}
            <Image 
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/6182/6182992.png' }}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join Mission 17 to start your journey.</Text>
          </View>

          <View style={styles.form}>
            {/* Username */}
            <View style={styles.inputContainer}>
              <User color="#94a3b8" size={20} style={styles.icon} />
              <TextInput 
                placeholder="Full Name / Username" 
                style={[styles.input, webInputStyle as any]} // 👈 Fix applied here
                value={username}
                onChangeText={setUsername}
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* Email */}
            <View style={styles.inputContainer}>
              <Mail color="#94a3b8" size={20} style={styles.icon} />
              <TextInput 
                placeholder="Email Address" 
                style={[styles.input, webInputStyle as any]} // 👈 Fix applied here
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <Lock color="#94a3b8" size={20} style={styles.icon} />
              <TextInput 
                placeholder="Password" 
                style={[styles.input, webInputStyle as any]} // 👈 Fix applied here
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor="#94a3b8"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff color="#94a3b8" size={20} /> : <Eye color="#94a3b8" size={20} />}
              </TouchableOpacity>
            </View>

            {/* Role Selection */}
            <View style={styles.roleSection}>
              <Text style={styles.roleLabel}>I am a:</Text>
              <View style={styles.roleContainer}>
                {roles.map((r) => (
                  <TouchableOpacity 
                    key={r} 
                    style={[styles.roleChip, role === r && styles.roleChipActive]}
                    onPress={() => setRole(r)}
                  >
                    <Text style={[styles.roleText, role === r && styles.roleTextActive]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.signupButton, loading && styles.disabledButton]} 
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="white" /> : <Text style={styles.signupButtonText}>Sign Up</Text>}
            </TouchableOpacity>

          </View>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkText}>Log In</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </RootComponent>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  backButton: { position: 'absolute', top: 20, left: 24, zIndex: 10 },
  header: { alignItems: 'center', marginBottom: 32, marginTop: 40 },
  logo: { width: 80, height: 80, marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#64748b', textAlign: 'center' },
  
  form: { gap: 16 },
  
  inputContainer: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', 
    borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 16, height: 56,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 2
  },
  icon: { marginRight: 12 },
  
  // 👇 FIXED: Removed 'outlineStyle' from here to stop the crash
  input: { flex: 1, fontSize: 16, color: '#1e293b', height: '100%' },
  
  roleSection: { marginTop: 8, marginBottom: 8 },
  roleLabel: { fontSize: 14, fontWeight: '600', color: '#64748b', marginBottom: 10, marginLeft: 4 },
  roleContainer: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  roleChip: { 
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, 
    backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' 
  },
  roleChipActive: { backgroundColor: '#eff6ff', borderColor: '#3b82f6' },
  roleText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  roleTextActive: { color: '#3b82f6' },

  signupButton: { 
    backgroundColor: '#3b82f6', height: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 10,
    shadowColor: '#3b82f6', shadowOpacity: 0.2, shadowRadius: 8, elevation: 4
  },
  disabledButton: { backgroundColor: '#94a3b8' },
  signupButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerText: { color: '#64748b', fontSize: 14 },
  linkText: { color: '#3b82f6', fontSize: 14, fontWeight: '700' },
});