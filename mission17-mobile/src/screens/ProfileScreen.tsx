import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, 
  SafeAreaView, ActivityIndicator, Linking, Alert, Modal
} from 'react-native';
import { 
  User, Settings, ShieldCheck, Clock, XCircle, CheckCircle, 
  ChevronRight, HelpCircle, Info, ShieldAlert, PhoneCall, ThumbsUp, LogOut
} from 'lucide-react-native'; 
import { useIsFocused, CommonActions } from '@react-navigation/native';
import { GlobalState, endpoints } from '../config/api';
import { clearAuthData } from '../utils/storage';
import { useTheme } from '../context/ThemeContext';
import { useNotification } from '../context/NotificationContext';

// YOUR SYSTEM RELAYER ADDRESS
const WALLET_ADDRESS = "0x7dB79ec78E6e345fE23cf7fB790846365D107FFB";

const ProfileScreen = ({ navigation }: any) => { 
  const { theme } = useTheme();
  const { showNotification } = useNotification();
  const styles = getStyles(theme);

  const [userData, setUserData] = useState<any>(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const isFocused = useIsFocused();
  const userId = GlobalState.userId;

  const RootComponent = (Platform.OS === 'web' ? View : SafeAreaView) as React.ElementType;

  const fetchProfileData = async () => {
    try {
      const userRes = await fetch(endpoints.auth.getUser(userId));
      const userJson = await userRes.json();
      
      const histRes = await fetch(endpoints.auth.getUserSubmissions(userId));
      const histJson = await histRes.json();

      setUserData(userJson);
      setHistory(histJson);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId && isFocused) fetchProfileData();
  }, [userId, isFocused]);

  const approvedCount = history.filter((h: any) => h.status === 'Approved').length;
  const pendingCount = history.filter((h: any) => h.status === 'Pending').length;

  const openBlockchainHistory = () => {
    const url = `https://sepolia.etherscan.io/address/${WALLET_ADDRESS}`;
    Linking.openURL(url);
  };

  const performLogout = async () => {
    try {
      setShowLogoutModal(false);
      await clearAuthData();
      GlobalState.userId = null;
      GlobalState.token = null;
      GlobalState.auth = null;

      showNotification({
        title: "Success",
        message: "Logged out successfully",
        type: "success"
      });
      
      // In a nested navigator (Profile -> Tabs -> Stack), getParent() returns Tabs.
      // We need to go one level higher to the Root Stack to reset to Login.
      const rootNav = navigation.getParent('RootStack') || navigation.getParent()?.getParent() || navigation;
      
      rootNav.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        })
      );
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const handleComingSoon = (feature: string) => {
    Alert.alert(feature, "This feature will be available soon.");
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={theme.primary} /></View>;

  const MenuItem = ({ icon, title, onPress, isLast = false }: any) => (
    <TouchableOpacity style={[styles.menuItem, !isLast && styles.menuItemBorder]} onPress={onPress}>
      <View style={styles.menuIconContainer}>{icon}</View>
      <Text style={styles.menuText}>{title}</Text>
      <ChevronRight size={20} color={theme.primary} />
    </TouchableOpacity>
  );

  return (
    <RootComponent style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <Text style={styles.pageTitle}>Account</Text>

        {/* ── PROFILE INFO ── */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
             <View style={styles.avatarCircle}>
                 <User size={38} color="white" />
             </View>
             <View style={styles.verifiedBadge}>
                 <ShieldCheck size={14} color="white" />
             </View>
          </View>
          <View style={styles.profileDetails}>
            <Text style={styles.greeting}>Hi, {userData?.username?.toUpperCase() || 'USER'}</Text>
            {userData?.mobileNumber && <Text style={styles.contactText}>{userData.mobileNumber}</Text>}
            <Text style={styles.contactText}>{userData?.email}</Text>
          </View>
        </View>

        {/* ── ACTION MENU ── */}
        <View style={styles.menuContainer}>
          <MenuItem 
            icon={<User size={22} color={theme.primary} />} 
            title="Personal Information" 
            onPress={() => navigation.navigate('EditProfile')} 
          />
          <MenuItem 
            icon={<HelpCircle size={22} color={theme.primary} />} 
            title="FAQs" 
            onPress={() => handleComingSoon("FAQs")} 
          />
          <MenuItem 
            icon={<Info size={22} color={theme.primary} />} 
            title="About Mission 17" 
            onPress={() => handleComingSoon("About Mission 17")} 
          />
          <MenuItem 
            icon={<ShieldAlert size={22} color={theme.primary} />} 
            title="Privacy Notice" 
            onPress={() => handleComingSoon("Privacy Notice")} 
          />
          <MenuItem 
            icon={<PhoneCall size={22} color={theme.primary} />} 
            title="Contact Us" 
            onPress={() => handleComingSoon("Contact Us")} 
          />
          <MenuItem 
            icon={<ThumbsUp size={22} color={theme.primary} />} 
            title="Rate our app" 
            onPress={() => handleComingSoon("Rate our app")} 
          />
          <MenuItem 
            icon={<Settings size={22} color={theme.primary} />} 
            title="Settings" 
            onPress={() => navigation.navigate('Settings')} 
          />
          <MenuItem 
            icon={<ShieldCheck size={22} color={theme.primary} />} 
            title="Blockchain Verified" 
            onPress={openBlockchainHistory} 
          />
          <MenuItem 
            icon={<LogOut size={22} color={theme.primary} />} 
            title="Logout" 
            onPress={handleLogout} 
            isLast={true}
          />
        </View>

        {/* ── STATS SECTION ── */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{history.length}</Text>
            <Text style={styles.statLabel}>Submitted</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#16a34a' }]}>{approvedCount}</Text>
            <Text style={styles.statLabel}>Approved</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#b45309' }]}>{pendingCount}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        {/* ── TASK HISTORY ── */}
        <View style={styles.historyHeader}>
          <Text style={styles.sectionTitle}>Civic Task History</Text>
        </View>

        {history.length === 0 ? (
          <View style={styles.emptyState}>
            <Clock size={40} color={theme.textTertiary} />
            <Text style={styles.emptyText}>No missions yet. Start one today!</Text>
          </View>
        ) : (
          history.map((item: any) => (
            <View key={item._id} style={styles.historyCard}>
              <View style={styles.historyInfo}>
                <Text style={styles.missionTitle}>{item.missionTitle}</Text>
                <View style={styles.historyMeta}>
                  <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
                {item.status === 'Rejected' && <Text style={styles.reasonText}>Reason: {item.rejectionReason}</Text>}
              </View>
              
              <View style={[
                styles.statusBadge, 
                item.status === 'Approved' ? styles.bgSuccess : 
                item.status === 'Rejected' ? styles.bgDanger : 
                styles.bgWarning
              ]}>
                {item.status === 'Approved' ? <CheckCircle size={14} color="white" /> : 
                 item.status === 'Rejected' ? <XCircle size={14} color="white" /> : 
                 <Clock size={14} color="white" />}
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>
          ))
        )}
        
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* --- LOGOUT CONFIRMATION MODAL --- */}
      <Modal visible={showLogoutModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconContainer}>
              <LogOut size={32} color={theme.danger} />
            </View>
            <Text style={styles.modalTitle}>Confirm Logout</Text>
            <Text style={styles.modalMessage}>Are you sure you want to log out?</Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setShowLogoutModal(false)}>
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnConfirm} onPress={performLogout}>
                <Text style={styles.modalBtnConfirmText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </RootComponent>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 24 },
  
  pageTitle: { fontSize: 18, fontWeight: '700', color: theme.text, textAlign: 'center', marginBottom: 24, marginTop: Platform.OS === 'android' ? 24 : 0 },

  // PROFILE HEADER
  profileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  avatarContainer: { position: 'relative', marginRight: 16 },
  avatarCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center' },
  verifiedBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: theme.success, padding: 3, borderRadius: 12, borderWidth: 2, borderColor: theme.background },
  profileDetails: { flex: 1 },
  greeting: { fontSize: 18, fontWeight: '800', color: theme.text, marginBottom: 4 },
  contactText: { fontSize: 14, color: theme.textSecondary, marginBottom: 2 },

  // MENU
  menuContainer: { marginBottom: 30 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: theme.border },
  menuIconContainer: { width: 24, alignItems: 'center', marginRight: 16 },
  menuText: { flex: 1, fontSize: 16, color: theme.primary, fontWeight: '600' },

  // STATS
  statsCard: { flexDirection: 'row', backgroundColor: theme.surface, borderRadius: 16, paddingVertical: 16, marginBottom: 30, borderWidth: 1, borderColor: theme.border },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: theme.primary },
  statLabel: { fontSize: 12, color: theme.textSecondary, marginTop: 4, fontWeight: '500' },
  statDivider: { width: 1, height: '80%', backgroundColor: theme.border, alignSelf: 'center' },

  // TASK HISTORY
  historyHeader: { marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: theme.text },
  historyCard: { backgroundColor: theme.surface, borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: theme.border },
  historyInfo: { flex: 1, paddingRight: 12 },
  missionTitle: { fontSize: 15, fontWeight: '700', color: theme.text, marginBottom: 4 },
  historyMeta: { flexDirection: 'row', alignItems: 'center' },
  date: { fontSize: 12, color: theme.textSecondary },
  reasonText: { fontSize: 12, color: theme.danger, marginTop: 6, fontWeight: '600' },
  
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusText: { color: 'white', fontSize: 11, fontWeight: '700' },
  bgSuccess: { backgroundColor: theme.success },
  bgDanger: { backgroundColor: theme.danger },
  bgWarning: { backgroundColor: theme.warning },

  emptyState: { alignItems: 'center', padding: 30, opacity: 0.6 },
  emptyText: { marginTop: 10, color: theme.textSecondary, fontSize: 14 },

  // MODAL STYLES
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: theme.surface, borderRadius: 20, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, elevation: 10 },
  modalIconContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: theme.danger + '1A', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: theme.text, marginBottom: 8 },
  modalMessage: { fontSize: 15, color: theme.textSecondary, textAlign: 'center', marginBottom: 24, paddingHorizontal: 10 },
  modalActions: { flexDirection: 'row', gap: 12, width: '100%' },
  modalBtnCancel: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, alignItems: 'center' },
  modalBtnCancelText: { fontSize: 15, fontWeight: '700', color: theme.textSecondary },
  modalBtnConfirm: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: theme.danger, alignItems: 'center' },
  modalBtnConfirmText: { fontSize: 15, fontWeight: '700', color: 'white' }
});

export default ProfileScreen;
