import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, 
  SafeAreaView, ActivityIndicator, Linking, Alert, Modal, FlatList
} from 'react-native';
import { 
  User, Settings, ShieldCheck, Clock, XCircle, CheckCircle, 
  ChevronRight, HelpCircle, Info, ShieldAlert, PhoneCall, ThumbsUp, LogOut, X
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
  const [infoModal, setInfoModal] = useState<string | null>(null);
  
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

  const renderInfoModalContent = () => {
    switch(infoModal) {
      case 'About Mission 17':
        return (
          <>
            <Text style={styles.infoModalText}>
              Mission 17 is a centralized digital governance platform for Barangay Pantal. It aims to streamline resident-to-LGU communications, digitize civic tasks, and create a transparent, efficient ecosystem for community feedback and announcements.
            </Text>
          </>
        );
      case 'FAQs':
        return (
          <>
            <Text style={styles.faqQuestion}>Q: How long does ID verification take?</Text>
            <Text style={styles.faqAnswer}>A: Verification typically takes 1-2 business days as it is manually reviewed by the Barangay Admin.</Text>
            
            <Text style={styles.faqQuestion}>Q: Are my feedback submissions really anonymous?</Text>
            <Text style={styles.faqAnswer}>A: Yes! If you toggle "Submit Anonymously", your account details are completely hidden from the Admin dashboard.</Text>
            
            <Text style={styles.faqQuestion}>Q: Why can't I edit my address?</Text>
            <Text style={styles.faqAnswer}>A: Critical demographic details are tied to your valid ID. To change them, please visit the Barangay Hall in person for reverification.</Text>
          </>
        );
      case 'Privacy Notice':
        return (
          <>
            <Text style={styles.infoModalText}>
              Your privacy is our priority. Mission 17 only collects necessary demographic information to verify your residency in Barangay Pantal. Your Valid ID uploads are securely stored and exclusively accessible by authorized Barangay Administrators. We do not share your data with third-party entities.
            </Text>
          </>
        );
      case 'Contact Us':
        return (
          <>
            <Text style={styles.contactItem}><Text style={styles.contactLabel}>Barangay Pantal Hall</Text></Text>
            <Text style={styles.contactItem}>📍 Address: Main St., Barangay Pantal, Dagupan City</Text>
            <Text style={styles.contactItem}>📞 Phone: (075) 123-4567</Text>
            <Text style={styles.contactItem}>📧 Email: admin@brgypantal.gov.ph</Text>
            <Text style={styles.contactItem}>🕒 Hours: Mon - Fri, 8:00 AM - 5:00 PM</Text>
          </>
        );
      default:
        return null;
    }
  };

  const renderHeader = () => (
    <>
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
          <Text style={styles.greeting}>Hi, {userData?.firstName?.toUpperCase() || userData?.username?.toUpperCase() || 'USER'}</Text>
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
          onPress={() => setInfoModal('FAQs')} 
        />
        <MenuItem 
          icon={<Info size={22} color={theme.primary} />} 
          title="About Mission 17" 
          onPress={() => setInfoModal('About Mission 17')} 
        />
        <MenuItem 
          icon={<ShieldAlert size={22} color={theme.primary} />} 
          title="Privacy Notice" 
          onPress={() => setInfoModal('Privacy Notice')} 
        />
        <MenuItem 
          icon={<PhoneCall size={22} color={theme.primary} />} 
          title="Contact Us" 
          onPress={() => setInfoModal('Contact Us')} 
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
          <Text style={[styles.statValue, { color: theme.success }]}>{approvedCount}</Text>
          <Text style={styles.statLabel}>Approved</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.warning }]}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      {/* ── TASK HISTORY ── */}
      <View style={styles.historyHeader}>
        <Text style={styles.sectionTitle}>Civic Task History</Text>
      </View>
    </>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Clock size={40} color={theme.textTertiary} />
      <Text style={styles.emptyText}>No missions yet. Start one today!</Text>
    </View>
  );

  const renderHistoryItem = ({ item }: any) => (
    <View style={styles.historyCard}>
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
  );

  return (
    <RootComponent style={styles.container}>
      <FlatList
        data={history}
        keyExtractor={(item: any) => item._id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        renderItem={renderHistoryItem}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      />

      {/* --- INFO MODALS --- */}
      <Modal visible={infoModal !== null} animationType="slide" transparent>
        <View style={styles.bottomSheetOverlay}>
          <View style={styles.bottomSheetCard}>
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>{infoModal}</Text>
              <TouchableOpacity onPress={() => setInfoModal(null)} style={styles.closeBtn}>
                <X size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.bottomSheetContent}>
              {renderInfoModalContent()}
            </ScrollView>
            <View style={styles.bottomSheetFooter}>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => setInfoModal(null)}>
                <Text style={styles.primaryBtnText}>Got it</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  content: { padding: 24, paddingBottom: 100 },
  
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

  // INFO MODALS
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end'
  },
  bottomSheetCard: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    minHeight: '40%'
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.text
  },
  closeBtn: {
    padding: 4,
    backgroundColor: theme.background,
    borderRadius: 20
  },
  bottomSheetContent: {
    padding: 24
  },
  infoModalText: {
    fontSize: 15,
    lineHeight: 24,
    color: theme.textSecondary
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.text,
    marginTop: 16,
    marginBottom: 4
  },
  faqAnswer: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 22,
    marginBottom: 8
  },
  contactItem: {
    fontSize: 15,
    color: theme.textSecondary,
    marginBottom: 12
  },
  contactLabel: {
    fontWeight: '700',
    color: theme.text,
    fontSize: 16
  },
  bottomSheetFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: theme.border
  },
  primaryBtn: {
    backgroundColor: theme.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  primaryBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700'
  },

  // LOGOUT MODAL STYLES
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: theme.surface, borderRadius: 20, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, elevation: 10 },
  modalIconContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: theme.dangerLight, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: theme.text, marginBottom: 8 },
  modalMessage: { fontSize: 15, color: theme.textSecondary, textAlign: 'center', marginBottom: 24, paddingHorizontal: 10 },
  modalActions: { flexDirection: 'row', gap: 12, width: '100%' },
  modalBtnCancel: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, alignItems: 'center' },
  modalBtnCancelText: { fontSize: 15, fontWeight: '700', color: theme.textSecondary },
  modalBtnConfirm: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: theme.danger, alignItems: 'center' },
  modalBtnConfirmText: { fontSize: 15, fontWeight: '700', color: 'white' }
});

export default ProfileScreen;
