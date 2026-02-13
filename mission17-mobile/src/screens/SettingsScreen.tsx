import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, 
  Platform, SafeAreaView, Alert, Modal, TextInput, Linking, ActivityIndicator 
} from 'react-native';
import { ChevronLeft, Bell, Lock, HelpCircle, LogOut, ChevronRight, FileText, X, Mail } from 'lucide-react-native';
import { CommonActions } from '@react-navigation/native';
import { clearAuthData } from '../utils/storage'; 
import { GlobalState, endpoints } from '../config/api';     

const SettingsScreen = ({ navigation }: any) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  // Modal States
  const [activeModal, setActiveModal] = useState<null | 'password' | 'privacy' | 'help'>(null);
  
  // Password Change States
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [loading, setLoading] = useState(false);

  const RootComponent = (Platform.OS === 'web' ? View : SafeAreaView) as React.ElementType;

  // --- ACTIONS ---

  const executeLogout = async () => {
    try {
        await clearAuthData();
        GlobalState.userId = null;
        navigation.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [{ name: 'Login' }],
            })
        );
    } catch (error) {
        console.error("Logout failed:", error);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
        if (window.confirm("Are you sure you want to log out?")) executeLogout();
    } else {
        Alert.alert("Log Out", "Are you sure you want to log out?", [
            { text: "Cancel", style: "cancel" },
            { text: "Log Out", style: 'destructive', onPress: executeLogout }
        ]);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPass || !newPass) {
        Alert.alert("Error", "Please fill in both fields.");
        return;
    }
    if (newPass.length < 8) {
        Alert.alert("Weak Password", "New password must be at least 8 characters.");
        return;
    }

    setLoading(true);
    try {
        // ✅ FIXED: Now using the correct endpoint from api.ts
        const response = await fetch(endpoints.auth.changePassword, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                userId: GlobalState.userId,
                oldPassword: oldPass,
                newPassword: newPass
            })
        });

        const data = await response.json();

        if (response.ok) {
            Alert.alert("Success", "Password updated successfully!");
            setActiveModal(null);
            setOldPass('');
            setNewPass('');
        } else {
            Alert.alert("Failed", data.message || "Could not update password.");
        }
    } catch (error) {
        Alert.alert("Error", "Server connection failed.");
    } finally {
        setLoading(false);
    }
  };

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@mission17.com?subject=Help Request');
  };

  // --- RENDER HELPERS ---

  const SettingItem = ({ icon: Icon, label, onPress, isSwitch, value, onValueChange }: any) => (
    <TouchableOpacity 
      style={styles.row} 
      onPress={onPress} 
      disabled={isSwitch}
      activeOpacity={0.7}
    >
      <View style={styles.rowLeft}>
        <View style={styles.iconBox}>
          <Icon size={20} color="#3b82f6" />
        </View>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      
      {isSwitch ? (
        <Switch 
          value={value} 
          onValueChange={onValueChange}
          trackColor={{ false: '#e2e8f0', true: '#bfdbfe' }}
          thumbColor={value ? '#3b82f6' : '#f1f5f9'}
        />
      ) : (
        <ChevronRight size={20} color="#cbd5e1" />
      )}
    </TouchableOpacity>
  );

  return (
    <RootComponent style={styles.container}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* SECTION 1: PREFERENCES */}
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.sectionCard}>
          <SettingItem 
            icon={Bell} 
            label="Push Notifications" 
            isSwitch 
            value={notificationsEnabled} 
            onValueChange={setNotificationsEnabled} 
          />
        </View>

        {/* SECTION 2: ACCOUNT */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.sectionCard}>
          <SettingItem icon={Lock} label="Change Password" onPress={() => setActiveModal('password')} />
          <View style={styles.divider} />
          <SettingItem icon={FileText} label="Privacy Policy" onPress={() => setActiveModal('privacy')} />
        </View>

        {/* SECTION 3: SUPPORT */}
        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.sectionCard}>
          <SettingItem icon={HelpCircle} label="Help & Support" onPress={() => setActiveModal('help')} />
        </View>

        {/* LOGOUT BUTTON */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={20} color="#ef4444" style={{ marginRight: 10 }} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Version 1.0.0 (Beta)</Text>

      </ScrollView>

      {/* --- MODALS --- */}

      {/* 1. PASSWORD MODAL */}
      <Modal visible={activeModal === 'password'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Change Password</Text>
                    <TouchableOpacity onPress={() => setActiveModal(null)}>
                        <X size={24} color="#64748b" />
                    </TouchableOpacity>
                </View>
                
                <TextInput 
                    placeholder="Old Password" 
                    style={styles.input} 
                    secureTextEntry 
                    value={oldPass}
                    onChangeText={setOldPass}
                />
                <TextInput 
                    placeholder="New Password (min 8 chars)" 
                    style={styles.input} 
                    secureTextEntry 
                    value={newPass}
                    onChangeText={setNewPass}
                />

                <TouchableOpacity style={styles.saveBtn} onPress={handleChangePassword} disabled={loading}>
                    {loading ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Update Password</Text>}
                </TouchableOpacity>
            </View>
        </View>
      </Modal>

      {/* 2. PRIVACY MODAL */}
      <Modal visible={activeModal === 'privacy'} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { height: '70%' }]}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Privacy Policy</Text>
                    <TouchableOpacity onPress={() => setActiveModal(null)}>
                        <X size={24} color="#64748b" />
                    </TouchableOpacity>
                </View>
                <ScrollView>
                    <Text style={styles.legalText}>
                        **Mission 17 Privacy Policy**{'\n\n'}
                        1. **Data Collection**: We collect uploaded images to verify your SDG contributions.{'\n\n'}
                        2. **Usage**: Your data is used solely for verification, leaderboard ranking, and academic research.{'\n\n'}
                        3. **Security**: We use industry-standard encryption for passwords and secure tokens for API access.{'\n\n'}
                        4. **Blockchain**: Verified missions generate a public hash on the Sepolia testnet. No personal data is stored on-chain.{'\n\n'}
                        (Last Updated: Feb 2026)
                    </Text>
                </ScrollView>
            </View>
        </View>
      </Modal>

      {/* 3. HELP MODAL */}
      <Modal visible={activeModal === 'help'} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Help & Support</Text>
                    <TouchableOpacity onPress={() => setActiveModal(null)}>
                        <X size={24} color="#64748b" />
                    </TouchableOpacity>
                </View>
                <Text style={styles.helpText}>Need assistance with a mission or account issue?</Text>
                
                <TouchableOpacity style={styles.contactRow} onPress={handleEmailSupport}>
                    <View style={styles.iconCircle}>
                        <Mail size={24} color="#3b82f6" />
                    </View>
                    <View>
                        <Text style={styles.contactLabel}>Email Support</Text>
                        <Text style={styles.contactValue}>support@mission17.com</Text>
                    </View>
                </TouchableOpacity>

                <Text style={styles.helpSubtext}>Available Mon-Fri, 9AM - 5PM</Text>
            </View>
        </View>
      </Modal>

    </RootComponent>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: 'white' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  backBtn: { padding: 8, borderRadius: 20, backgroundColor: '#f1f5f9' },
  content: { padding: 20 },
  
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#64748b', marginBottom: 10, marginTop: 10, marginLeft: 5 },
  sectionCard: { backgroundColor: 'white', borderRadius: 16, overflow: 'hidden', marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 5 },
  
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  rowLabel: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginLeft: 60 },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fef2f2', padding: 16, borderRadius: 16, marginTop: 10 },
  logoutText: { color: '#ef4444', fontWeight: '700', fontSize: 15 },
  versionText: { textAlign: 'center', color: '#94a3b8', fontSize: 12, marginTop: 20 },

  // MODAL STYLES
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { backgroundColor: 'white', width: '100%', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  
  input: { backgroundColor: '#f1f5f9', padding: 16, borderRadius: 12, marginBottom: 12, fontSize: 16, color: '#0f172a' },
  saveBtn: { backgroundColor: '#3b82f6', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  legalText: { fontSize: 14, color: '#475569', lineHeight: 22 },
  
  helpText: { fontSize: 16, color: '#475569', marginBottom: 20 },
  contactRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', padding: 16, borderRadius: 16, marginBottom: 16 },
  iconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  contactLabel: { fontSize: 14, color: '#64748b', fontWeight: '600' },
  contactValue: { fontSize: 16, color: '#3b82f6', fontWeight: 'bold' },
  helpSubtext: { fontSize: 12, color: '#94a3b8', textAlign: 'center' }
});

export default SettingsScreen;