import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, 
  SafeAreaView, ActivityIndicator, Linking, Alert, Modal, FlatList, RefreshControl, StatusBar
} from 'react-native';
import { 
  User, Settings, ShieldCheck, Clock, XCircle, CheckCircle, 
  ChevronRight, HelpCircle, Info, ShieldAlert, PhoneCall, ThumbsUp, LogOut, X,
  Building, Lock, FileText, ChevronDown, Check
} from 'lucide-react-native'; 
import { useIsFocused, CommonActions } from '@react-navigation/native';
import { GlobalState, endpoints, getAuthHeaders } from '../config/api';
import { clearAuthData, getAuthData } from '../utils/storage';
import { useTheme } from '../context/ThemeContext';
import { useNotification } from '../context/NotificationContext';
import { sharedStyles } from '../config/theme';

// YOUR SYSTEM RELAYER ADDRESS
const WALLET_ADDRESS = "0x7dB79ec78E6e345fE23cf7fB790846365D107FFB";

const ProfileScreen = ({ navigation }: any) => { 
  const { theme } = useTheme();
  const { showNotification } = useNotification();
  const styles = getStyles(theme);

  const [userData, setUserData] = useState<any>(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [infoModal, setInfoModal] = useState<string | null>(null);
  
  const isFocused = useIsFocused();
  const userId = GlobalState.userId;

  const RootComponent = (Platform.OS === 'web' ? View : SafeAreaView) as React.ElementType;

  useEffect(() => {
    const hydrateSavedProfile = async () => {
      const savedAuth = await getAuthData();
      if (savedAuth?.user) setUserData(savedAuth.user);
    };

    hydrateSavedProfile();
  }, []);

  const fetchProfileData = useCallback(async () => {
    try {
      const authHeaders = await getAuthHeaders();
      const userRes = await fetch(endpoints.auth.getUser(userId), { headers: authHeaders });
      const userJson = await userRes.json();
      
      const histRes = await fetch(endpoints.auth.getUserSubmissions(userId), { headers: authHeaders });
      const histJson = await histRes.json();

      if (userRes.ok) setUserData(userJson);
      setHistory(Array.isArray(histJson) ? histJson : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId && isFocused) fetchProfileData();
  }, [userId, isFocused, fetchProfileData]);

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

  const handleComingSoon = (feature: string) => {
    Alert.alert(feature, "This feature will be available in the upcoming update.");
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0038A8" />
        <Text style={styles.loadingText}>Loading citizen profile...</Text>
      </View>
    );
  }

  const MenuItem = ({ icon, title, subtitle, onPress, isDestructive = false, isLast = false }: any) => (
    <TouchableOpacity 
      style={[styles.menuItem, !isLast && styles.menuItemBorder]} 
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={[styles.menuIconContainer, isDestructive && styles.destructiveIconBg]}>
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.menuText, isDestructive && styles.destructiveText]}>{title}</Text>
        {subtitle ? <Text style={styles.menuSubText}>{subtitle}</Text> : null}
      </View>
      <ChevronRight size={18} color={isDestructive ? '#dc2626' : '#94a3b8'} />
    </TouchableOpacity>
  );

  const renderInfoModalContent = () => {
    switch(infoModal) {
      case 'About Mission 17':
        return (
          <View style={{ gap: 10 }}>
            <Text style={styles.infoModalText}>
              Mission 17 (BrgyLink) is the official digital governance and community portal for Barangay Bagong Pag-asa, San Jacinto, Pangasinan.
            </Text>
            <Text style={styles.infoModalText}>
              It empowers residents to request official documents, file incident blotters, track civic tasks, and stay updated on community bulletins with transparency and security.
            </Text>
          </View>
        );
      case 'FAQs & Document Guide':
        return (
          <View style={{ gap: 12 }}>
            <Text style={styles.faqQuestion}>Q: How long does document processing take?</Text>
            <Text style={styles.faqAnswer}>A: Most clearances take 1–2 working days. You will receive an SMS and in-app notification when ready for pickup.</Text>
            
            <Text style={styles.faqQuestion}>Q: Are my blotter reports secure?</Text>
            <Text style={styles.faqAnswer}>A: Yes. Only authorized Barangay Desk Officers and the Punong Barangay have access to evaluated blotter statements.</Text>
            
            <Text style={styles.faqQuestion}>Q: How do I update my registered address or name?</Text>
            <Text style={styles.faqAnswer}>A: Because records are verified against official government IDs, please present your proof of billing or updated ID at the Barangay Hall.</Text>
          </View>
        );
      case 'Privacy Notice':
        return (
          <Text style={styles.infoModalText}>
            Your privacy is strictly safeguarded. Mission 17 only processes necessary citizen information required for official local government services in compliance with the Data Privacy Act of 2012 (RA 10173).
          </Text>
        );
      case 'Contact Barangay Hall':
        return (
          <View style={{ gap: 10 }}>
            <Text style={styles.contactItem}><Text style={styles.contactLabel}>Barangay Bagong Pag-asa Hall</Text></Text>
            <Text style={styles.contactItem}>📍 Location: San Jacinto, Pangasinan</Text>
            <Text style={styles.contactItem}>📞 Telephone: (075) 123-4567</Text>
            <Text style={styles.contactItem}>📧 Email: brgybagongpagasa@gmail.com</Text>
            <Text style={styles.contactItem}>🕒 Office Hours: Mon–Fri, 8:00 AM – 5:00 PM</Text>
          </View>
        );
      default:
        return null;
    }
  };

  const renderHeader = () => (
    <>
      {/* ── PROFILE HERO CARD (Hierarchy & Identity) ── */}
      <View style={styles.profileHeroCard}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>
              {(userData?.firstName || userData?.username || 'R').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.verifiedBadge}>
            <Check size={13} color="white" />
          </View>
        </View>

        <View style={styles.profileDetails}>
          <View style={styles.nameBadgeRow}>
            <Text style={styles.profileName} numberOfLines={1}>
              {userData?.firstName && userData?.lastName ? `${userData.firstName} ${userData.lastName}` : (userData?.username || 'Verified Resident')}
            </Text>
          </View>
          <View style={styles.verifiedTag}>
            <ShieldCheck size={12} color="#15803d" />
            <Text style={styles.verifiedTagText}>VERIFIED CITIZEN</Text>
          </View>
          <Text style={styles.contactEmail}>{userData?.email}</Text>
          {userData?.mobileNumber ? <Text style={styles.contactPhone}>📱 {userData.mobileNumber}</Text> : null}
        </View>
      </View>

      {/* ── DEMOGRAPHIC UPDATE GUIDANCE BANNER ── */}
      <View style={styles.noticeBanner}>
        <Info size={16} color="#0038A8" style={{ marginTop: 2 }} />
        <Text style={styles.noticeText}>
          To update your official registered name or Purok address, please visit the Barangay Hall with a valid ID.
        </Text>
      </View>

      {/* ── STATS SECTION ── */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{history.length}</Text>
          <Text style={styles.statLabel}>Total Tasks</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#15803d' }]}>{approvedCount}</Text>
          <Text style={styles.statLabel}>Approved</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#b45309' }]}>{pendingCount}</Text>
          <Text style={styles.statLabel}>In Review</Text>
        </View>
      </View>

      {/* ── SECTION 1: CITIZEN ACCOUNT & PREFERENCES ── */}
      <Text style={styles.menuGroupHeader}>Account & Preferences</Text>
      <View style={styles.menuGroupCard}>
        <MenuItem 
          icon={<User size={20} color="#0038A8" />} 
          title="Personal Information" 
          subtitle="View and manage personal details"
          onPress={() => navigation.navigate('EditProfile')} 
        />
        <MenuItem 
          icon={<Settings size={20} color="#0038A8" />} 
          title="Security & Password" 
          subtitle="Change password and login security"
          onPress={() => navigation.navigate('Settings')} 
        />
        <MenuItem 
          icon={<ShieldCheck size={20} color="#0038A8" />} 
          title="Blockchain Verification" 
          subtitle="Verify tamper-proof community records"
          onPress={openBlockchainHistory} 
          isLast={true}
        />
      </View>

      {/* ── SECTION 2: BARANGAY SUPPORT & INFORMATION ── */}
      <Text style={styles.menuGroupHeader}>Barangay Transparency & Help</Text>
      <View style={styles.menuGroupCard}>
        <MenuItem 
          icon={<HelpCircle size={20} color="#0038A8" />} 
          title="FAQs & Document Guide" 
          subtitle="Processing times and pickup instructions"
          onPress={() => setInfoModal('FAQs & Document Guide')} 
        />
        <MenuItem 
          icon={<Building size={20} color="#0038A8" />} 
          title="About Barangay Bagong Pag-asa" 
          subtitle="Mission 17 civic governance portal"
          onPress={() => setInfoModal('About Mission 17')} 
        />
        <MenuItem 
          icon={<PhoneCall size={20} color="#0038A8" />} 
          title="Contact Barangay Hall" 
          subtitle="Office hours and contact channels"
          onPress={() => setInfoModal('Contact Barangay Hall')} 
        />
        <MenuItem 
          icon={<ShieldAlert size={20} color="#0038A8" />} 
          title="Data Privacy & Protection" 
          subtitle="Data Privacy Act of 2012 compliance"
          onPress={() => setInfoModal('Privacy Notice')} 
          isLast={true}
        />
      </View>

      {/* ── SECTION 3: SESSION MANAGEMENT ── */}
      <Text style={styles.menuGroupHeader}>Session</Text>
      <View style={styles.menuGroupCard}>
        <MenuItem 
          icon={<LogOut size={20} color="#dc2626" />} 
          title="Sign Out" 
          subtitle="Securely log out of this device"
          onPress={() => setShowLogoutModal(true)} 
          isDestructive={true}
          isLast={true}
        />
      </View>

      {/* ── CIVIC TASK HISTORY HEADER ── */}
      <View style={styles.historyHeader}>
        <Text style={styles.sectionTitle}>Community Mission Submissions</Text>
      </View>
    </>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Clock size={36} color="#94a3b8" />
      <Text style={styles.emptyText}>No community task submissions yet.</Text>
    </View>
  );

  const renderHistoryItem = ({ item }: any) => (
    <View style={styles.historyCard}>
      <View style={styles.historyInfo}>
        <Text style={styles.missionTitle}>{item.missionTitle}</Text>
        <View style={styles.historyMeta}>
          <Text style={styles.date}>{item.createdAt ? new Date(item.createdAt).toDateString() : 'No Date'}</Text>
        </View>
        {item.status === 'Rejected' && <Text style={styles.reasonText}>Reason: {item.rejectionReason}</Text>}
      </View>
      
      <View style={[
        styles.statusBadge, 
        item.status === 'Approved' ? styles.bgSuccess : 
        item.status === 'Rejected' ? styles.bgDanger : 
        styles.bgWarning
      ]}>
        {item.status === 'Approved' ? <CheckCircle size={13} color="white" /> : 
         item.status === 'Rejected' ? <XCircle size={13} color="white" /> : 
         <Clock size={13} color="white" />}
        <Text style={styles.statusText}>{item.status}</Text>
      </View>
    </View>
  );

  return (
    <RootComponent style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0038A8" />

      {/* HEADER */}
      <View style={sharedStyles.header}>
        <Text style={sharedStyles.headerTitle}>Citizen Profile & Account</Text>
      </View>

      <FlatList
        data={history}
        keyExtractor={(item: any) => item._id || Math.random().toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        renderItem={renderHistoryItem}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProfileData(); }} tintColor="#0038A8" />
        }
      />

      {/* --- INFO MODALS --- */}
      <Modal visible={infoModal !== null} animationType="slide" transparent>
        <View style={styles.bottomSheetOverlay}>
          <View style={styles.bottomSheetCard}>
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>{infoModal}</Text>
              <TouchableOpacity onPress={() => setInfoModal(null)} style={styles.closeBtn}>
                <X size={22} color="#475569" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.bottomSheetContent}>
              {renderInfoModalContent()}
            </ScrollView>
            <View style={styles.bottomSheetFooter}>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => setInfoModal(null)}>
                <Text style={styles.primaryBtnText}>Close</Text>
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
              <LogOut size={30} color="#dc2626" />
            </View>
            <Text style={styles.modalTitle}>Sign Out</Text>
            <Text style={styles.modalMessage}>Are you sure you want to log out of Barangay Bagong Pag-asa?</Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalBtnCancel} 
                onPress={() => setShowLogoutModal(false)}
                accessibilityRole="button"
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalBtnConfirm} 
                onPress={performLogout}
                accessibilityRole="button"
              >
                <Text style={styles.modalBtnConfirmText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </RootComponent>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#64748b', fontWeight: '600' },
  content: { padding: 14, paddingBottom: 100 },

  // PROFILE HERO CARD
  profileHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  avatarContainer: { position: 'relative', marginRight: 14 },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0038A8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: { fontSize: 24, fontWeight: '900', color: '#ffffff' },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#16a34a',
    padding: 3,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  profileDetails: { flex: 1 },
  nameBadgeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  profileName: { fontSize: 16.5, fontWeight: '800', color: '#0f172a' },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  verifiedTagText: { fontSize: 10, fontWeight: '800', color: '#15803d', letterSpacing: 0.5 },
  contactEmail: { fontSize: 12.5, color: '#64748b' },
  contactPhone: { fontSize: 12, color: '#475569', marginTop: 2, fontWeight: '500' },

  // NOTICE BANNER
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  noticeText: { flex: 1, fontSize: 12, color: '#1e3a8a', lineHeight: 17, fontWeight: '500' },

  // STATS
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '900', color: '#0038A8' },
  statLabel: { fontSize: 11.5, color: '#64748b', marginTop: 2, fontWeight: '600' },
  statDivider: { width: 1, height: '70%', backgroundColor: '#e2e8f0', alignSelf: 'center' },

  // GROUPED MENUS
  menuGroupHeader: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0038A8',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuGroupCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  destructiveIconBg: {
    backgroundColor: '#fee2e2',
  },
  menuText: { fontSize: 14.5, color: '#0f172a', fontWeight: '700' },
  destructiveText: { color: '#dc2626' },
  menuSubText: { fontSize: 11.5, color: '#64748b', marginTop: 1 },

  // TASK HISTORY
  historyHeader: { marginTop: 6, marginBottom: 10, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#0038A8', textTransform: 'uppercase', letterSpacing: 0.5 },
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  historyInfo: { flex: 1, paddingRight: 12 },
  missionTitle: { fontSize: 14.5, fontWeight: '700', color: '#0f172a', marginBottom: 3 },
  historyMeta: { flexDirection: 'row', alignItems: 'center' },
  date: { fontSize: 11.5, color: '#64748b' },
  reasonText: { fontSize: 11.5, color: '#dc2626', marginTop: 4, fontWeight: '600' },
  
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 16 },
  statusText: { color: 'white', fontSize: 11, fontWeight: '800' },
  bgSuccess: { backgroundColor: '#15803d' },
  bgDanger: { backgroundColor: '#dc2626' },
  bgWarning: { backgroundColor: '#b45309' },

  emptyState: { alignItems: 'center', padding: 24, opacity: 0.7 },
  emptyText: { marginTop: 8, color: '#64748b', fontSize: 13, fontWeight: '500' },

  // INFO MODALS
  bottomSheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  bottomSheetCard: { backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%', minHeight: '40%' },
  bottomSheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  bottomSheetTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
  closeBtn: { padding: 4, backgroundColor: '#f1f5f9', borderRadius: 20 },
  bottomSheetContent: { padding: 20 },
  infoModalText: { fontSize: 14, lineHeight: 22, color: '#334155' },
  faqQuestion: { fontSize: 14, fontWeight: '800', color: '#0f172a', marginBottom: 2 },
  faqAnswer: { fontSize: 13, color: '#475569', lineHeight: 20, marginBottom: 12 },
  contactItem: { fontSize: 13.5, color: '#334155', marginBottom: 8 },
  contactLabel: { fontWeight: '800', color: '#0038A8', fontSize: 15 },
  bottomSheetFooter: { padding: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  primaryBtn: { backgroundColor: '#0038A8', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  primaryBtnText: { color: 'white', fontSize: 15, fontWeight: '800' },

  // LOGOUT MODAL
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 6 },
  modalIconContainer: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 19, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
  modalMessage: { fontSize: 14, color: '#475569', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  modalActions: { flexDirection: 'row', gap: 10, width: '100%' },
  modalBtnCancel: { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center' },
  modalBtnCancelText: { fontSize: 14.5, fontWeight: '700', color: '#475569' },
  modalBtnConfirm: { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: '#dc2626', alignItems: 'center' },
  modalBtnConfirmText: { fontSize: 14.5, fontWeight: '800', color: 'white' }
});

export default ProfileScreen;
