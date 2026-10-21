import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Platform, RefreshControl, StatusBar,
  AppState
} from 'react-native';
import {
  Bell, CheckCircle, FileText,
  ChevronRight, Megaphone,
  MessageSquare, Users, ShieldAlert
} from 'lucide-react-native';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { endpoints, GlobalState, getAuthHeadersIfAvailable } from '../config/api';
import { getAuthData } from '../utils/storage';
import { fetchWithTimeout } from '../utils/network';

const SERVICES = [
  {
    id: 'clearance',
    label: 'Documents',
    subtitle: 'Request certificates',
    icon: FileText,
    screen: 'Services',
    color: '#0038A8',
    bgLight: '#EFF6FF'
  },
  {
    id: 'blotter',
    label: 'Blotter report',
    subtitle: 'File or track a case',
    icon: ShieldAlert,
    screen: 'BlotterReport',
    color: '#0038A8',
    bgLight: '#EFF6FF'
  },
  {
    id: 'suggestions',
    label: 'eFeedback',
    subtitle: 'Share a concern',
    icon: MessageSquare,
    screen: 'Suggestion',
    color: '#0038A8',
    bgLight: '#EFF6FF'
  },
  {
    id: 'officials',
    label: 'Officials',
    subtitle: 'View the directory',
    icon: Users,
    screen: 'Officials',
    color: '#0038A8',
    bgLight: '#EFF6FF'
  },
];

// ─── TIME-AWARE GREETING HELPER ──────────────────────────────────────────────
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Magandang Umaga';
  if (hour < 18) return 'Magandang Hapon';
  return 'Magandang Gabi';
};

// ─── COMPONENT ──────────────────────────────────────────────────────────────
const HomeScreen: React.FC = () => {
  const navigation  = useNavigation<any>();
  const route       = useRoute<any>();
  const isFocused   = useIsFocused();
  const styles = getStyles();

  const userId = route.params?.userId || GlobalState.userId;

  const [fullName, setFullName]           = useState('Resident');
  const [refreshing, setRefreshing]       = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [hasUnread, setHasUnread]         = useState(false);
  const [bulletinsUnavailable, setBulletinsUnavailable] = useState(false);

  useEffect(() => {
    const hydrateSavedUser = async () => {
      const savedAuth = await getAuthData();
      const savedUser = savedAuth?.user;
      if (!savedUser) return;
      setFullName(
        savedUser.firstName && savedUser.lastName
          ? `${savedUser.firstName} ${savedUser.lastName}`
          : (savedUser.username || savedUser.firstName || 'Resident'),
      );
    };

    hydrateSavedUser();
  }, []);

  const fetchAll = useCallback(async () => {
    // Bulletin availability must never make the whole resident dashboard look offline.
    // A short retry absorbs intermittent mobile-network and DNS failures.
    let bulletinRequestSucceeded = false;
    for (let attempt = 0; attempt < 2 && !bulletinRequestSucceeded; attempt += 1) {
      try {
        const annRes = await fetchWithTimeout(endpoints.announcements);
        if (!annRes.ok) throw new Error('Could not load community updates.');

        const data = await annRes.json();
        const bulletinList = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []);
        setAnnouncements(bulletinList.slice(0, 2));
        setBulletinsUnavailable(false);
        bulletinRequestSucceeded = true;
      } catch (error) {
        if (attempt === 0) {
          await new Promise<void>((resolve) => setTimeout(resolve, 750));
        } else {
          console.warn('Could not load community updates:', error);
          setBulletinsUnavailable(true);
        }
      }
    }

    if (userId) {
      try {
        const authHeaders = await getAuthHeadersIfAvailable();
        if (authHeaders) {
          const [userRes, notificationRes] = await Promise.all([
            fetchWithTimeout(endpoints.auth.getUser(userId), { headers: authHeaders }),
            fetchWithTimeout(endpoints.auth.getNotifications(userId), { headers: authHeaders }),
          ]);
          if (!userRes.ok || !notificationRes.ok) {
            throw new Error('Could not load personal dashboard information.');
          }

          const [user, notifications] = await Promise.all([
            userRes.json(), notificationRes.json(),
          ]);
          setFullName(user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : (user.username || user.firstName || 'Resident'));

          setHasUnread(Array.isArray(notifications) ? notifications.some((n: any) => !n.read) : false);
        }
      } catch (error) {
        // Public services must remain usable while a personal session restores.
        console.warn('Could not load personal dashboard information:', error);
      }
    }

    setRefreshing(false);
  }, [userId]);

  useEffect(() => {
    if (isFocused) fetchAll();
    const subscription = AppState.addEventListener('change', state => { if (state === 'active' && isFocused) void fetchAll(); });
    return () => subscription.remove();
  }, [isFocused, fetchAll]);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchAll(); }, [fetchAll]);

  const RootComponent = (Platform.OS === 'web' ? View : SafeAreaView) as React.ElementType;

  return (
    <RootComponent style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0038A8" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0038A8" />}
      >
        {/* ══════════ CITIZEN HEADER ══════════ */}
        <LinearGradient colors={['#0038A8', '#001a5e']} style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.brgyBadge}>REPUBLIC OF THE PHILIPPINES</Text>
              <Text style={styles.brgyCity}>Barangay Bagong Pag-asa, San Jacinto</Text>
            </View>
            <TouchableOpacity
              style={styles.bellBtn}
              onPress={() => navigation.navigate('Notifications')}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
            >
              <Bell size={19} color="#FFFFFF" />
              {hasUnread && <View style={styles.bellDot} />}
            </TouchableOpacity>
          </View>

          {/* Welcome greeting with avatar */}
          <View style={styles.welcomeRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitial}>{fullName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.welcomeGreet}>{getGreeting()},</Text>
              <Text style={styles.welcomeName} numberOfLines={1}>{fullName}</Text>
              <View style={styles.homeVerifiedBadge}>
                <CheckCircle size={12} color="#BBF7D0" />
                <Text style={styles.homeVerifiedText}>Verified citizen</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {GlobalState.role === 'super_admin' && (
          <View style={styles.section}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={{ flex: 1, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 14, padding: 13 }} onPress={() => navigation.navigate('CaptainAnnouncements')} accessibilityRole="button" accessibilityLabel="Open Captain News and Alerts">
                <Megaphone size={21} color="#0038A8" />
                <Text style={{ color: '#0f172a', fontSize: 13, fontWeight: '900', marginTop: 8 }}>News & Alerts</Text>
                <Text style={{ color: '#64748b', fontSize: 11, lineHeight: 15, marginTop: 3 }}>Post official updates</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 14, padding: 13 }} onPress={() => navigation.navigate('CaptainFeedback')} accessibilityRole="button" accessibilityLabel="Open Resident Feedback">
                <MessageSquare size={21} color="#0038A8" />
                <Text style={{ color: '#0f172a', fontSize: 13, fontWeight: '900', marginTop: 8 }}>Resident Feedback</Text>
                <Text style={{ color: '#64748b', fontSize: 11, lineHeight: 15, marginTop: 3 }}>Review private concerns</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ══════════ 2-COLUMN ESSENTIAL SERVICES GRID ══════════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick services</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Services')}
              accessibilityRole="button"
              accessibilityLabel="See all services"
            >
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.servicesGrid}>
            {SERVICES.map(svc => {
              const IconComp = svc.icon;
              return (
                <TouchableOpacity
                  key={svc.id}
                  style={styles.svcCard}
                  onPress={() => navigation.navigate(svc.screen)}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel={`${svc.label}: ${svc.subtitle}`}
                >
                  <View style={[styles.svcIconBox, { backgroundColor: svc.bgLight }]}>
                    <IconComp size={22} color={svc.color} />
                  </View>
                  <View style={styles.svcTextContent}>
                    <Text style={styles.svcLabel} numberOfLines={2}>{svc.label}</Text>
                    <Text style={styles.svcSub} numberOfLines={2}>{svc.subtitle}</Text>
                  </View>
                  <ChevronRight size={15} color="#94A3B8" />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ══════════ ANNOUNCEMENTS & BULLETINS ══════════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Barangay Bulletins</Text>
              <Text style={styles.sectionSub}>Official announcements</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('AnnouncementsTab')}
              accessibilityRole="button"
              accessibilityLabel="See all announcements"
            >
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>

          {bulletinsUnavailable ? (
            <View style={styles.bulletinsUnavailable}>
              <Megaphone size={20} color="#B45309" />
              <View style={{ flex: 1 }}>
                <Text style={styles.bulletinsUnavailableTitle}>Bulletins temporarily unavailable</Text>
                <Text style={styles.bulletinsUnavailableText}>Your barangay services are still available.</Text>
              </View>
              <TouchableOpacity
                onPress={fetchAll}
                accessibilityRole="button"
                accessibilityLabel="Retry loading bulletins"
              >
                <Text style={styles.bulletinsRetry}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : announcements.length === 0 ? (
            <View style={styles.emptyState}>
              <Megaphone size={24} color="#94A3B8" />
              <Text style={styles.emptyText}>No bulletins posted at this time.</Text>
            </View>
          ) : (
            announcements.map(ann => (
              <TouchableOpacity
                key={ann._id}
                style={styles.annCard}
                onPress={() => navigation.navigate('AnnouncementsTab')}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`Announcement: ${ann.title}`}
              >
                {ann.isPinned && (
                  <View style={styles.pinTagBadge}>
                    <Text style={styles.pinTag}>PINNED ANNOUNCEMENT</Text>
                  </View>
                )}
                <Text style={styles.annTitle} numberOfLines={2}>{ann.title}</Text>
                <Text style={styles.annBody} numberOfLines={3}>{ann.body}</Text>
                <View style={styles.annFooter}>
                  <Text style={styles.annDate}>
                    {new Date(ann.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                  <Text style={styles.readMoreText}>Read details →</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* ══════════ EMERGENCY HOTLINES ══════════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Emergency Hotlines</Text>
              <Text style={styles.sectionSub}>Official San Jacinto emergency contacts</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('EmergencyContacts')}
              style={styles.hotlinesAction}
              accessibilityRole="button"
              accessibilityLabel="View all emergency contacts"
            >
              <Text style={styles.seeAll}>View all →</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

    </RootComponent>
  );
};

// ─── STYLES ───────────────────────────────────────────────────────────────────
const getStyles = () => StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },

  // HEADER
  header: {
    paddingTop: Platform.OS === 'android' ? 44 : 20,
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16
  },
  brgyBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#93C5FD',
    letterSpacing: 1.2,
    textTransform: 'uppercase'
  },
  brgyCity:  {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 1
  },
  bellBtn:   {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    position: 'relative'
  },
  bellDot:   {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#0F2942'
  },

  welcomeRow:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)'
  },
  avatarInitial: { fontSize: 20, fontWeight: '900', color: '#FFFFFF' },
  welcomeGreet:  { fontSize: 13, color: '#93C5FD', fontWeight: '600' },
  welcomeName:   { fontSize: 19, fontWeight: '800', color: '#FFFFFF', marginTop: 1, letterSpacing: -0.2 },
  homeVerifiedBadge: {
    alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 5, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999,
    backgroundColor: 'rgba(22, 163, 74, 0.22)', borderWidth: 1, borderColor: 'rgba(187, 247, 208, 0.5)',
  },
  homeVerifiedText: { color: '#DCFCE7', fontSize: 10.5, fontWeight: '800', letterSpacing: 0.2 },

  // SECTIONS
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', letterSpacing: -0.2 },
  sectionSub: { fontSize: 12, color: '#64748B', marginTop: 1, fontWeight: '500' },
  seeAll: { fontSize: 12.5, color: '#1D4ED8', fontWeight: '700' },

  // 2-COLUMN SERVICES GRID
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  svcCard: {
    // Two cards per row on narrow Android devices. A 45% basis leaves room
    // for the fixed grid gap; flexGrow then divides the remaining row evenly.
    flexBasis: '45%',
    flexGrow: 1,
    minWidth: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1.5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 76,
  },
  svcIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  svcTextContent: { flex: 1, minWidth: 0 },
  svcLabel:  { fontSize: 12, fontWeight: '800', color: '#0F172A', lineHeight: 16 },
  svcSub:    { fontSize: 10.5, color: '#64748B', marginTop: 1, fontWeight: '500', lineHeight: 14 },

  // ANNOUNCEMENTS
  annCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderLeftWidth: 3.5,
    borderLeftColor: '#0F2942',
    shadowColor: '#0F172A',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1.5,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  pinTagBadge: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 2.5,
    paddingHorizontal: 7,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  bulletinsUnavailable: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: 12,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bulletinsUnavailableTitle: { color: '#92400E', fontSize: 13, fontWeight: '800' },
  bulletinsUnavailableText: { color: '#A16207', fontSize: 11.5, lineHeight: 16, marginTop: 2 },
  bulletinsRetry: { color: '#1D4ED8', fontSize: 12, fontWeight: '800', padding: 5 },
  pinTag:   { fontSize: 9.5, fontWeight: '800', color: '#B45309', letterSpacing: 0.5 },
  annTitle: { fontSize: 14.5, fontWeight: '800', color: '#0F172A', marginBottom: 4, lineHeight: 20 },
  annBody:  { fontSize: 12.5, color: '#475569', lineHeight: 18, marginBottom: 8 },
  annFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  annDate:  { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  readMoreText: { fontSize: 11.5, fontWeight: '700', color: '#1D4ED8' },
  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  emptyText:  { color: '#64748B', fontSize: 13, fontWeight: '500' },

  // EVENTS
  evtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#0F172A',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1.5,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  evtDate: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  evtMon:  { fontSize: 9.5, fontWeight: '800', color: '#FFFFFF', textTransform: 'uppercase' },
  evtDay:  { fontSize: 16, fontWeight: '800', color: '#FFFFFF', lineHeight: 19 },
  evtInfo: { flex: 1 },
  evtTitle: { fontSize: 13.5, fontWeight: '700', color: '#0F172A', marginBottom: 2 },
  evtLocRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  evtLoc:    { fontSize: 11.5, color: '#64748B', flex: 1, fontWeight: '500' },

  hotlinesAction: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4, marginLeft: 12 },

});

export default HomeScreen;

