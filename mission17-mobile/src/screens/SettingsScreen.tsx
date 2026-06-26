import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, 
  Platform, SafeAreaView, Alert, Modal, TextInput, ActivityIndicator 
} from 'react-native';
import { ChevronLeft, Bell, Lock, ChevronRight, X, Shield, Eye, EyeOff, Moon } from 'lucide-react-native';
import { getAuthData } from '../utils/storage'; 
import { GlobalState, endpoints } from '../config/api';     
import { useNotification } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';

const SettingsScreen = ({ navigation }: any) => {
  const { showNotification } = useNotification();
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const styles = getStyles(theme);
  
  // App Preferences
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  // Account Security
  const [mfaEnabled, setMfaEnabled] = useState(false);
  
  // Password Change Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const RootComponent = (Platform.OS === 'web' ? View : SafeAreaView) as React.ElementType;

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const data = await getAuthData();
    if (data && data.user) {
        setMfaEnabled(data.user.mfaEnabled || false);
    }
  };

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
            setMfaEnabled(!value);
            Alert.alert("Error", result.message || "Failed to update MFA settings");
        }
    } catch (error) {
        setMfaEnabled(!value);
        showNotification("Network error updating security settings", "error");
    }
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
            setShowPasswordModal(false);
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

  // --- RENDER HELPERS ---

  const SettingItem = ({ icon: Icon, label, onPress, isSwitch, value, onValueChange, isLast = false }: any) => (
    <TouchableOpacity 
      style={[styles.row, !isLast && styles.rowBorder]} 
      onPress={onPress} 
      disabled={isSwitch}
      activeOpacity={0.7}
    >
      <View style={styles.rowLeft}>
        <View style={styles.iconBox}>
          <Icon size={22} color={theme.primary} />
        </View>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      
      {isSwitch ? (
        <Switch 
          value={value} 
          onValueChange={onValueChange}
          trackColor={{ false: theme.border, true: theme.primaryLight }}
          thumbColor={value ? theme.primary : theme.surfaceSecondary}
        />
      ) : (
        <ChevronRight size={20} color={theme.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <RootComponent style={styles.container}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color={theme.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* SECTION 1: SECURITY */}
        <Text style={styles.sectionTitle}>Account Security</Text>
        <View style={styles.menuContainer}>
          <SettingItem 
            icon={Lock} 
            label="Change Password" 
            onPress={() => setShowPasswordModal(true)} 
          />
          <SettingItem 
            icon={Shield} 
            label="Two-Factor Auth (Email)" 
            isSwitch 
            value={mfaEnabled} 
            onValueChange={toggleMFA} 
            isLast
          />
        </View>

        {/* SECTION 2: PREFERENCES */}
        <Text style={styles.sectionTitle}>App Preferences</Text>
        <View style={styles.menuContainer}>
          <SettingItem 
            icon={Bell} 
            label="Push Notifications" 
            isSwitch 
            value={notificationsEnabled} 
            onValueChange={setNotificationsEnabled} 
          />
          <SettingItem 
            icon={Moon} 
            label="Dark Mode" 
            isSwitch 
            value={isDarkMode} 
            onValueChange={toggleTheme} 
            isLast
          />
        </View>

        <Text style={styles.versionText}>Version 1.0.0 (Beta)</Text>

      </ScrollView>

      {/* --- PASSWORD MODAL --- */}
      <Modal visible={showPasswordModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Change Password</Text>
                    <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                        <X size={24} color={theme.textSecondary} />
                    </TouchableOpacity>
                </View>
                
                <View style={styles.passwordInputContainer}>
                    <TextInput 
                        placeholder="Old Password" 
                        style={styles.modalInput} 
                        secureTextEntry={!showOldPass}
                        value={oldPass}
                        onChangeText={setOldPass}
                        placeholderTextColor={theme.textTertiary}
                    />
                    <TouchableOpacity onPress={() => setShowOldPass(!showOldPass)} style={styles.eyeIcon}>
                        {showOldPass ? <EyeOff size={20} color={theme.textSecondary} /> : <Eye size={20} color={theme.textSecondary} />}
                    </TouchableOpacity>
                </View>

                <View style={styles.passwordInputContainer}>
                    <TextInput 
                        placeholder="New Password (min 8 chars)" 
                        style={styles.modalInput} 
                        secureTextEntry={!showNewPass}
                        value={newPass}
                        onChangeText={setNewPass}
                        placeholderTextColor={theme.textTertiary}
                    />
                    <TouchableOpacity onPress={() => setShowNewPass(!showNewPass)} style={styles.eyeIcon}>
                        {showNewPass ? <EyeOff size={20} color={theme.textSecondary} /> : <Eye size={20} color={theme.textSecondary} />}
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.saveBtn} onPress={handleChangePassword} disabled={loading}>
                    {loading ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Update Password</Text>}
                </TouchableOpacity>
            </View>
        </View>
      </Modal>

    </RootComponent>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: Platform.OS === 'android' ? 40 : 20, backgroundColor: theme.surface },
  headerTitle: { fontSize: 18, fontWeight: '700', color: theme.text },
  backBtn: { padding: 8, borderRadius: 20, backgroundColor: theme.surfaceSecondary },
  content: { padding: 24, paddingTop: 10 },
  
  sectionTitle: { fontSize: 14, fontWeight: '700', color: theme.textSecondary, marginBottom: 12, marginTop: 24, marginLeft: 4 },
  
  menuContainer: { marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: theme.border },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 32, alignItems: 'center', marginRight: 12 },
  rowLabel: { fontSize: 16, fontWeight: '600', color: theme.primary },

  versionText: { textAlign: 'center', color: theme.textTertiary, fontSize: 13, marginTop: 40 },

  // MODAL STYLES
  modalOverlay: { flex: 1, backgroundColor: theme.overlay, justifyContent: 'flex-end', padding: 0 },
  modalCard: { backgroundColor: theme.surface, width: '100%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: theme.text },
  
  passwordInputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: theme.background, 
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12, 
    marginBottom: 16,
    paddingRight: 12
  },
  modalInput: { 
    flex: 1,
    padding: 16, 
    fontSize: 16, 
    color: theme.text,
    ...Platform.select({ web: { outlineStyle: 'none' } })
  },
  eyeIcon: { padding: 4 },
  saveBtn: { backgroundColor: theme.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});

export default SettingsScreen;
