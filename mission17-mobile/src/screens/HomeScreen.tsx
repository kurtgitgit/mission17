import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Platform, RefreshControl, StatusBar,
  Linking, Alert
} from 'react-native';
import {
  Bell, CheckCircle, Clock, FileText,
  Phone, MapPin, ChevronRight, Leaf, Megaphone,
  UserCheck, Shield, Calendar, MessageSquare, Bot
} from 'lucide-react-native';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native';
import { endpoints, GlobalState } from '../config/api';
import { getAuthData } from '../utils/storage';
import { useTheme } from '../context/ThemeContext';

// ─── QUICK SERVICES ─────────────────────────────────────────────────────────
const SERVICES = [
  { id: 'clearance',  label: 'eBrgy',         emoji: '📄', screen: 'Services' },
  { id: 'officials',  label: 'eOfficials',    emoji: '👥', screen: 'Officials' },
  { id: 'tasks',      label: 'eMissions',     emoji: '🌿', screen: 'MissionsTab' },
  { id: 'news',       label: 'eNews',         emoji: '📢', screen: 'AnnouncementsTab' },
  { id: 'suggestions',label: 'eFeedback',     emoji: '💡', screen: 'Suggestion' },
];

// ─── HOTLINES ───────────────────────────────────────────────────────────────
const HOTLINES = [
  { label: 'Barangay Hall',      number: '075-529-9999', emoji: '🏛️' },
  { label: 'PNP Dagupan',        number: '075-515-2262', emoji: '👮' },
  { label: 'BFP Dagupan',        number: '075-522-2222', emoji: '🚒' },
  { label: 'City DRRMO',         number: '075-529-7911', emoji: '🆘' },
];

// ─── COMPONENT ──────────────────────────────────────────────────────────────
const HomeScreen: React.FC = () => {
  const navigation  = useNavigation<any>();
  const route       = useRoute<any>();
  const isFocused   = useIsFocused();
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);

  const userId = route.params?.userId || GlobalState.userId;

  const [username, setUsername]           = useState('Resident');
  const [refreshing, setRefreshing]       = useState(false);
  const [stats, setStats]                 = useState({ approved: 0, pending: 0, total: 0 });
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [events, setEvents]               = useState<any[]>([]);
  const [hasUnread, setHasUnread]         = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      if (userId) {
        const [userRes, subRes] = await Promise.all([
          fetch(endpoints.auth.getUser(userId)),
          fetch(endpoints.auth.getUserSubmissions(userId)),
        ]);
        if (userRes.ok)  {
          const u = await userRes.json();
          setUsername(u.username || 'Resident');
        }
        if (subRes.ok)   {
          const s = await subRes.json();
          const sArray = Array.isArray(s) ? s : [];
          setStats({
            total:    sArray.length,
            approved: sArray.filter((x: any) => x.status === 'Approved').length,
            pending:  sArray.filter((x: any) => x.status === 'Pending').length,
          });
        }
        // unread notifications
        const auth = await getAuthData();
        if (auth?.token) {
          const nr = await fetch(endpoints.auth.getNotifications(userId), { headers: { 'auth-token': auth.token } });
          if (nr.ok) { const notifs = await nr.json(); setHasUnread(Array.isArray(notifs) ? notifs.some((n: any) => !n.read) : false); }
        }
      }
      // public endpoints
      const [annRes, evtRes] = await Promise.all([
        fetch(endpoints.announcements),
        fetch(endpoints.events),
      ]);
      if (annRes.ok) { 
        const d = await annRes.json(); 
        const dArr = Array.isArray(d) ? d : (Array.isArray(d.data) ? d.data : []);
        setAnnouncements(dArr.slice(0, 3)); 
      }
      if (evtRes.ok) { 
        const d = await evtRes.json(); 
        const dArr = Array.isArray(d) ? d : (Array.isArray(d.data) ? d.data : []);
        setEvents(dArr.slice(0, 4)); 
      }
    } catch (e) {
      console.error('Home fetch error:', e);
    } finally {
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => { fetchAll(); }, [isFocused]);
  // Also fetch once on mount in case isFocused doesn't fire first time
  useEffect(() => { fetchAll(); }, []);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchAll(); }, [fetchAll]);

  const call = (number: string) => {
    Linking.openURL(`tel:${number}`).catch(() => Alert.alert('Error', 'Cannot open dialer.'));
  };

  const RootComponent = (Platform.OS === 'web' ? View : SafeAreaView) as React.ElementType;

  return (
    <RootComponent style={styles.root}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "light-content"} backgroundColor={theme.primary} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        {/* ══════════ HEADER ══════════ */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.brgyBadge}>🇵🇭 REPUBLIC OF THE PHILIPPINES</Text>
              <Text style={styles.brgyCity}>Barangay Pantal, Dagupan City</Text>
            </View>
            <TouchableOpacity style={styles.bellBtn} onPress={() => navigation.navigate('Notifications')}>
              <Bell size={19} color="white" />
              {hasUnread && <View style={styles.bellDot} />}
            </TouchableOpacity>
          </View>

          {/* Welcome pill */}
          <View style={styles.welcomeRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitial}>{username.charAt(0).toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.welcomeGreet}>Good day,</Text>
              <Text style={styles.welcomeName}>{username}!</Text>
            </View>
          </View>
        </View>

        {/* ══════════ DIGITAL ID (STATS) ══════════ */}
        <View style={styles.statsStrip}>
          <View style={styles.idHeader}>
            <Text style={styles.idHeaderText}>DIGITAL RESIDENT ID</Text>
            <Shield size={16} color="#FCD116" />
          </View>
          <View style={styles.idBody}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{stats.total}</Text>
              <Text style={styles.statLbl}>Activities</Text>
            </View>
            <View style={styles.statDiv} />
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: theme.primary }]}>{stats.approved}</Text>
              <Text style={styles.statLbl}>Verified</Text>
            </View>
            <View style={styles.statDiv} />
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: theme.danger }]}>{stats.pending}</Text>
              <Text style={styles.statLbl}>Pending</Text>
            </View>
          </View>
        </View>

        {/* ══════════ QUICK SERVICES ══════════ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Services</Text>
          <View style={styles.servicesGrid}>
            {SERVICES.map(svc => (
              <TouchableOpacity
                key={svc.id}
                style={styles.svcCard}
                onPress={() => navigation.navigate(svc.screen)}
                activeOpacity={0.8}
              >
                <View style={styles.svcIconBox}>
                  <Text style={styles.svcEmoji}>{svc.emoji}</Text>
                </View>
                <Text style={styles.svcLabel}>{svc.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ══════════ DOCUMENT REQUESTS BANNER ══════════ */}
        <TouchableOpacity style={styles.docBanner} onPress={() => navigation.navigate('Services')} activeOpacity={0.85}>
          <View style={styles.docBannerLeft}>
            <FileText size={22} color={theme.primary} />
            <View>
              <Text style={styles.docBannerTitle}>Request Barangay Documents</Text>
              <Text style={styles.docBannerSub}>Clearance • Indigency • Residency</Text>
            </View>
          </View>
          <ChevronRight size={18} color={theme.primary} />
        </TouchableOpacity>

        {/* ══════════ BLOTTER REPORT BANNER ══════════ */}
        <TouchableOpacity style={[styles.docBanner, { backgroundColor: theme.dangerLight, borderColor: theme.dangerLight, marginTop: 10 }]} onPress={() => navigation.navigate('BlotterReport')} activeOpacity={0.85}>
          <View style={styles.docBannerLeft}>
            <Shield size={22} color={theme.danger} />
            <View>
              <Text style={[styles.docBannerTitle, { color: theme.danger }]}>File a Blotter Report</Text>
              <Text style={[styles.docBannerSub, { color: theme.danger }]}>Report incidents directly to the barangay</Text>
            </View>
          </View>
          <ChevronRight size={18} color={theme.danger} />
        </TouchableOpacity>
        
        <TouchableOpacity style={{ alignItems: 'center', marginTop: 8 }} onPress={() => navigation.navigate('BlotterHistory')}>
          <Text style={{ fontSize: 13, color: theme.danger, fontWeight: '600' }}>View My Past Reports →</Text>
        </TouchableOpacity>

        {/* ══════════ ANNOUNCEMENTS ══════════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Latest Announcements</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AnnouncementsTab')}>
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>

          {announcements.length === 0 ? (
            <View style={styles.emptyState}>
              <Megaphone size={28} color={theme.textTertiary} />
              <Text style={styles.emptyText}>No announcements yet.</Text>
            </View>
          ) : (
            announcements.map(ann => (
              <TouchableOpacity
                key={ann._id}
                style={styles.annCard}
                onPress={() => navigation.navigate('AnnouncementsTab')}
                activeOpacity={0.85}
              >
                {ann.isPinned && <Text style={styles.pinTag}>📌 PINNED</Text>}
                <Text style={styles.annTitle} numberOfLines={2}>{ann.title}</Text>
                <Text style={styles.annBody} numberOfLines={3}>{ann.body}</Text>
                <Text style={styles.annDate}>
                  {new Date(ann.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* ══════════ UPCOMING EVENTS ══════════ */}
        {events.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Events</Text>
              <TouchableOpacity onPress={() => navigation.navigate('MissionsTab')}>
                <Text style={styles.seeAll}>See all →</Text>
              </TouchableOpacity>
            </View>
            {events.map(evt => {
              const d    = new Date(evt.date + 'T00:00:00');
              const mon  = d.toLocaleString('default', { month: 'short' }).toUpperCase();
              const day  = d.getDate();
              return (
                <TouchableOpacity
                  key={evt._id}
                  style={styles.evtRow}
                  onPress={() => navigation.navigate('MissionsTab')}
                  activeOpacity={0.85}
                >
                  <View style={[styles.evtDate, { backgroundColor: evt.color || theme.primary }]}>
                    <Text style={[styles.evtMon, { color: 'white' }]}>{mon}</Text>
                    <Text style={[styles.evtDay, { color: 'white' }]}>{day}</Text>
                  </View>
                  <View style={styles.evtInfo}>
                    <Text style={styles.evtTitle} numberOfLines={1}>{evt.title}</Text>
                    <View style={styles.evtLocRow}>
                      <MapPin size={12} color={theme.textTertiary} />
                      <Text style={styles.evtLoc} numberOfLines={1}>{evt.location}</Text>
                    </View>
                  </View>
                  <ChevronRight size={16} color={theme.textTertiary} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ══════════ EMERGENCY HOTLINES ══════════ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Hotlines</Text>
          <View style={styles.hotlinesCard}>
            {HOTLINES.map((h, i) => (
              <TouchableOpacity
                key={h.label}
                style={[styles.hotlineRow, i < HOTLINES.length - 1 && styles.hotlineDivider]}
                onPress={() => call(h.number)}
                activeOpacity={0.75}
              >
                <Text style={styles.hotlineEmoji}>{h.emoji}</Text>
                <View style={styles.hotlineInfo}>
                  <Text style={styles.hotlineLabel}>{h.label}</Text>
                  <Text style={styles.hotlineNumber}>{h.number}</Text>
                </View>
                <Phone size={15} color={theme.primary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>

      {/* FAB FOR CHATBOT */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => navigation.navigate('ChatBot')}
        activeOpacity={0.9}
      >
        <Bot size={28} color="#0038A8" />
      </TouchableOpacity>
    </RootComponent>
  );
};

// ─── STYLES ──────────────────────────────────────────────────────────────────
const getStyles = (theme: any) => StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.background },

  // HEADER
  header: {
    backgroundColor: '#0038A8', // Brand blue stays same for header
    paddingTop: Platform.OS === 'android' ? 44 : 18,
    paddingHorizontal: 20,
    paddingBottom: 40, // More space for overlapping card
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 },
  brgyBadge: { fontSize: 13, fontWeight: '900', color: '#FCD116', letterSpacing: 0.3 },
  brgyCity: { fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 2, fontWeight: '600' },
  bellBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  bellDot: { position: 'absolute', top: 9, right: 9, width: 7, height: 7, borderRadius: 4, backgroundColor: theme.danger, borderWidth: 1.5, borderColor: '#0038A8' },
  welcomeRow: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FCD116' },
  avatarInitial: { fontSize: 20, fontWeight: '900', color: 'white' },
  welcomeGreet: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  welcomeName: { fontSize: 20, fontWeight: '800', color: 'white' },

  // DIGITAL ID / STATS STRIP
  statsStrip: {
    backgroundColor: theme.surface, marginHorizontal: 16,
    borderRadius: 16, marginTop: -30,
    shadowColor: '#000', shadowOpacity: theme.isDark ? 0.3 : 0.1, shadowRadius: 15, elevation: 6,
    overflow: 'hidden', borderWidth: 1, borderColor: theme.border
  },
  idHeader: { backgroundColor: theme.surfaceSecondary, paddingVertical: 8, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: theme.border },
  idHeaderText: { fontSize: 11, fontWeight: '800', color: theme.primary, letterSpacing: 1 },
  idBody: { flexDirection: 'row', paddingVertical: 16 },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statNum:  { fontSize: 22, fontWeight: '900', color: theme.text },
  statLbl:  { fontSize: 11, color: theme.textSecondary, fontWeight: '700', textTransform: 'uppercase' },
  statDiv:  { width: 1, backgroundColor: theme.border, alignSelf: 'stretch', marginVertical: 4 },

  // SECTIONS
  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: theme.primary },
  seeAll: { fontSize: 13, color: theme.danger, fontWeight: '700' },

  // QUICK SERVICES
  servicesGrid: { flexDirection: 'row', gap: 10 },
  svcCard: {
    flex: 1, backgroundColor: theme.surface, borderRadius: 14, paddingVertical: 16, alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOpacity: theme.isDark ? 0.2 : 0.06, shadowRadius: 8, elevation: 3, borderWidth: 1, borderColor: theme.border
  },
  svcIconBox: { width: 46, height: 46, borderRadius: 12, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.border },
  svcEmoji:  { fontSize: 22 },
  svcLabel:  { fontSize: 11, fontWeight: '700', color: theme.primary, textAlign: 'center' },

  // DOC BANNER
  docBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: theme.isDark ? 'rgba(59, 130, 246, 0.15)' : theme.primaryLight, borderRadius: 14, padding: 16, marginHorizontal: 16, marginTop: 14,
    borderWidth: 1.5, borderColor: theme.isDark ? 'rgba(59, 130, 246, 0.3)' : '#bfdbfe',
  },
  docBannerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  docBannerTitle: { fontSize: 14, fontWeight: '800', color: theme.isDark ? theme.text : theme.primary },
  docBannerSub:   { fontSize: 12, color: theme.primary, marginTop: 1 },

  // ANNOUNCEMENTS
  annCard: {
    backgroundColor: theme.surface, borderRadius: 14, padding: 16, marginBottom: 10,
    borderLeftWidth: 4, borderLeftColor: theme.primary,
    shadowColor: '#000', shadowOpacity: theme.isDark ? 0.2 : 0.03, shadowRadius: 6, elevation: 1,
    borderWidth: 1, borderColor: theme.border
  },
  pinTag:   { fontSize: 10, fontWeight: '800', color: theme.warning, marginBottom: 5 },
  annTitle: { fontSize: 15, fontWeight: '800', color: theme.text, marginBottom: 5, lineHeight: 22 },
  annBody:  { fontSize: 13, color: theme.textSecondary, lineHeight: 20, marginBottom: 8 },
  annDate:  { fontSize: 11, color: theme.textTertiary },
  emptyState: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: theme.surface, borderRadius: 14, padding: 20, marginBottom: 10, borderWidth: 1, borderColor: theme.border },
  emptyText:  { color: theme.textTertiary, fontStyle: 'italic', fontSize: 14 },

  // EVENTS
  evtRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: theme.surface, borderRadius: 14, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOpacity: theme.isDark ? 0.2 : 0.03, shadowRadius: 6, elevation: 1,
    borderWidth: 1, borderColor: theme.border
  },
  evtDate: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  evtMon:  { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  evtDay:  { fontSize: 18, fontWeight: '900', lineHeight: 22 },
  evtInfo: { flex: 1 },
  evtTitle: { fontSize: 14, fontWeight: '700', color: theme.text, marginBottom: 3 },
  evtLocRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  evtLoc:    { fontSize: 12, color: theme.textTertiary, flex: 1 },

  // HOTLINES
  hotlinesCard: { backgroundColor: theme.surface, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: theme.isDark ? 0.2 : 0.04, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: theme.border },
  hotlineRow:   { flexDirection: 'row', alignItems: 'center', padding: 16 },
  hotlineDivider: { borderBottomWidth: 1, borderBottomColor: theme.border },
  hotlineEmoji:  { fontSize: 22, marginRight: 12 },
  hotlineInfo:   { flex: 1 },
  hotlineLabel:  { fontSize: 14, fontWeight: '700', color: theme.text },
  hotlineNumber: { fontSize: 13, color: theme.primary, fontWeight: '600', marginTop: 1 },
  
  // FAB
  fab: {
    position: 'absolute', bottom: 24, right: 20, width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#FCD116', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, elevation: 8, shadowOffset: { width: 0, height: 4 },
    borderWidth: 2, borderColor: '#fff'
  }
});

export default HomeScreen;
