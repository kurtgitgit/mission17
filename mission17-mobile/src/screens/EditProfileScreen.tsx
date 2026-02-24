import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, StyleSheet, TouchableOpacity, 
  SafeAreaView, Platform, ActivityIndicator, Alert 
} from 'react-native';
import { Save, X, User, FileText } from 'lucide-react-native';
import { GlobalState, endpoints } from '../config/api';

const EditProfileScreen = ({ navigation }: any) => {
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  const userId = GlobalState.userId;
  const RootComponent = (Platform.OS === 'web' ? View : SafeAreaView) as React.ElementType;

  // ⚠️ REPLACE 'localhost' with your computer's IP (e.g. 192.168.1.5) if using a physical device
  const API_URL = "http://192.168.1.101:5001";

  // 1. Load current data
  useEffect(() => {
    const fetchCurrentData = async () => {
      try {
        const res = await fetch(endpoints.auth.getUser(userId));
        const data = await res.json();
        setUsername(data.username || '');
        setBio(data.bio || '');
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchCurrentData();
  }, []);

  // 2. Save Changes
  const handleSave = async () => {
    if (!username.trim()) {
      Alert.alert("Error", "Username cannot be empty.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/update-profile/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, bio })
      });

      if (res.ok) {
        Alert.alert("Success", "Profile updated!");
        navigation.goBack(); // Go back to Profile page
      } else {
        Alert.alert("Error", "Failed to update profile.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Network error.");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <View style={styles.centered}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  return (
    <RootComponent style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <X size={24} color="#64748b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <View style={styles.formContent}>
        
        {/* Username Field */}
        <Text style={styles.label}>Display Name</Text>
        <View style={styles.inputRow}>
          <User size={20} color="#94a3b8" style={{ marginRight: 10 }} />
          <TextInput 
            style={styles.input} 
            value={username} 
            onChangeText={setUsername} 
            placeholder="Enter your name"
          />
        </View>

        {/* Bio Field */}
        <Text style={styles.label}>Bio / Tagline</Text>
        <View style={styles.inputRow}>
          <FileText size={20} color="#94a3b8" style={{ marginRight: 10 }} />
          <TextInput 
            style={styles.input} 
            value={bio} 
            onChangeText={setBio} 
            placeholder="Agent status..."
            multiline
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="white" /> : (
            <>
              <Save size={20} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>

      </View>
    </RootComponent>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: 'white' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  iconBtn: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 20 },
  formContent: { padding: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#64748b', marginBottom: 8, marginTop: 15 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 15, paddingVertical: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  input: { flex: 1, fontSize: 16, color: '#0f172a' },
  saveBtn: { flexDirection: 'row', backgroundColor: '#3b82f6', borderRadius: 12, padding: 16, alignItems: 'center', justifyContent: 'center', marginTop: 40, shadowColor: '#3b82f6', shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '700' }
});

export default EditProfileScreen;