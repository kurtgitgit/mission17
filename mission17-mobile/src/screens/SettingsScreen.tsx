import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, 
  Platform, SafeAreaView, Alert 
} from 'react-native';
import { ChevronLeft, Bell, Lock, HelpCircle, LogOut, ChevronRight, FileText } from 'lucide-react-native';
import { CommonActions } from '@react-navigation/native';
import { clearAuthData } from '../utils/storage'; 
import { GlobalState } from '../config/api';     

const SettingsScreen = ({ navigation }: any) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const RootComponent = (Platform.OS === 'web' ? View : SafeAreaView) as React.ElementType;

  // 1. Separate the logic into its own function
  const executeLogout = async () => {
    try {
        await clearAuthData();
        GlobalState.userId = null;

        // Reset navigation to Login
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

  // 2. Handle the User Interface (Web vs Mobile)
  const handleLogout = () => {
    if (Platform.OS === 'web') {
        // 🌐 WEB: Use browser confirmation
        const confirmed = window.confirm("Are you sure you want to log out?");
        if (confirmed) {
            executeLogout();
        }
    } else {
        // 📱 MOBILE: Use Native Alert
        Alert.alert(
            "Log Out",
            "Are you sure you want to log out?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Log Out", 
                    style: 'destructive',
                    onPress: executeLogout
                }
            ]
        );
    }
  };

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
          <SettingItem icon={Lock} label="Change Password" onPress={() => Alert.alert("Coming Soon", "Password change feature is in development.")} />
          <View style={styles.divider} />
          <SettingItem icon={FileText} label="Privacy Policy" onPress={() => {}} />
        </View>

        {/* SECTION 3: SUPPORT */}
        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.sectionCard}>
          <SettingItem icon={HelpCircle} label="Help & Support" onPress={() => {}} />
        </View>

        {/* LOGOUT BUTTON */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={20} color="#ef4444" style={{ marginRight: 10 }} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Version 1.0.0 (Beta)</Text>

      </ScrollView>
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
  versionText: { textAlign: 'center', color: '#94a3b8', fontSize: 12, marginTop: 20 }
});

export default SettingsScreen;