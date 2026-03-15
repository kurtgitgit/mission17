import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, 
  Platform, SafeAreaView, Alert, Modal, TextInput, Linking, ActivityIndicator 
} from 'react-native';
import { ChevronLeft, Bell, Lock, HelpCircle, LogOut, ChevronRight, FileText, X, Mail, Shield, Eye, EyeOff } from 'lucide-react-native';
import { CommonActions } from '@react-navigation/native';
import { clearAuthData, getAuthData } from '../utils/storage'; 
import { GlobalState, endpoints } from '../config/api';     
import { useNotification } from '../context/NotificationContext';

const SettingsScreen = ({ navigation }: any) => {
  const { showNotification } = useNotification();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [mfaEnabled, setMfaEnabled] = useState(false); // 🛡️ MFA STATE
  
  // Modal States
  const [activeModal, setActiveModal] = useState<null | 'password' | 'privacy' | 'help'>(null);
  
  // Password Change States
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [loading, setLoading] = useState(false);

  // Logout Confirmation State
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const RootComponent = (Platform.OS === 'web' ? View : SafeAreaView) as React.ElementType;

  // --- 🆕 LOAD INITIAL SETTINGS ---
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const data = await getAuthData();
    if (data && data.user) {
        // If your login response includes mfaEnabled, use it.
        // Otherwise, you might need a dedicated /me endpoint.
        setMfaEnabled(data.user.mfaEnabled || false);
    }
  };

  // --- 🛡️ TOGGLE MFA ACTION ---
  const toggleMFA = async (value: boolean) => {
    const data = await getAuthData();
    if (!data || !data.token) return;

    try {
        const response = await fetch(`${endpoints.auth.baseUrl}/toggle-mfa`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${data.token}`
            },
            body: JSON.stringify({ userId: GlobalState.userId, enable: value })
        });

        const result = await response.json();
        
        if (response.ok) {
            setMfaEnabled(value);
            showNotification(`Two-Factor Authentication is now ${value ? 'ON' : 'OFF'}`, "success");
        } else {
            setMfaEnabled(!value); // Revert switch if failed
            Alert.alert("Error", result.message || "Failed to update MFA settings");
        }
    } catch (error) {
        setMfaEnabled(!value);
        showNotification("Network error updating security settings", "error");
    }
  };

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
    setShowLogoutConfirm(true);
  };

  const handleChangePassword = async () => {
    if (!oldPass || !newPass) {
        showNotification("Please fill in both fields.", "error");
        return;
    }
    if (newPass.length < 8) {
        showNotification("New password must be at least 8 characters.", "error");
        return;
    }

    setLoading(true);
    try {
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
            showNotification("Password updated successfully!", "success");
            setActiveModal(null);
            setOldPass('');
            setNewPass('');
        } else {
            showNotification(data.message || "Could not update password.", "error");
        }
    } catch (error) {
        showNotification("Server connection failed.", "error");
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
          {/* 🛡️ NEW MFA TOGGLE */}
          <SettingItem 
            icon={Shield} 
            label="Two-Factor Auth (Email)" 
            isSwitch 
            value={mfaEnabled} 
            onValueChange={toggleMFA} 
          />
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

      {/* --- MODALS (Password, Privacy, Help) --- */}
      {/* (Kept your existing modal code exactly as is below) */}
      <Modal visible={activeModal === 'password'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Change Password</Text>
                    <TouchableOpacity onPress={() => setActiveModal(null)}>
                        <X size={24} color="#64748b" />
                    </TouchableOpacity>
                </View>
                
                <View style={styles.passwordInputContainer}>
                    <TextInput 
                        placeholder="Old Password" 
                        style={styles.modalInput} 
                        secureTextEntry={!showOldPass}
                        value={oldPass}
                        onChangeText={setOldPass}
                    />
                    <TouchableOpacity onPress={() => setShowOldPass(!showOldPass)} style={styles.eyeIcon}>
                        {showOldPass ? <EyeOff size={20} color="#94a3b8" /> : <Eye size={20} color="#94a3b8" />}
                    </TouchableOpacity>
                </View>

                <View style={styles.passwordInputContainer}>
                    <TextInput 
                        placeholder="New Password (min 8 chars)" 
                        style={styles.modalInput} 
                        secureTextEntry={!showNewPass}
                        value={newPass}
                        onChangeText={setNewPass}
                    />
                    <TouchableOpacity onPress={() => setShowNewPass(!showNewPass)} style={styles.eyeIcon}>
                        {showNewPass ? <EyeOff size={20} color="#94a3b8" /> : <Eye size={20} color="#94a3b8" />}
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.saveBtn} onPress={handleChangePassword} disabled={loading}>
                    {loading ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Update Password</Text>}
                </TouchableOpacity>
            </View>
        </View>
      </Modal>

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

      {/* LOGOUT CONFIRMATION MODAL */}
      <Modal visible={showLogoutConfirm} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { maxWidth: 340 }]}>
                <View style={{ alignItems: 'center', marginBottom: 20 }}>
                    <View style={[styles.iconCircle, { backgroundColor: '#fef2f2', marginBottom: 16 }]}>
                        <LogOut size={32} color="#ef4444" />
                    </View>
                    <Text style={styles.modalTitle}>Confirm Logout</Text>
                    <Text style={{ textAlign: 'center', color: '#64748b', fontSize: 15, marginTop: 8 }}>
                        Are you sure you want to end your session?
                    </Text>
                </View>

                <View style={{ gap: 12 }}>
                    <TouchableOpacity 
                        style={[styles.saveBtn, { backgroundColor: '#ef4444' }]} 
                        onPress={() => {
                            setShowLogoutConfirm(false);
                            executeLogout();
                        }}
                    >
                        <Text style={styles.saveBtnText}>Log Out</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[styles.saveBtn, { backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0' }]} 
                        onPress={() => setShowLogoutConfirm(false)}
                    >
                        <Text style={[styles.saveBtnText, { color: '#64748b' }]}>Cancel</Text>
                    </TouchableOpacity>
                </View>
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
  passwordInputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f1f5f9', 
    borderRadius: 12, 
    marginBottom: 12,
    paddingRight: 12
  },
  modalInput: { 
    flex: 1,
    padding: 16, 
    fontSize: 16, 
    color: '#0f172a' 
  },
  eyeIcon: {
    padding: 4
  },
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