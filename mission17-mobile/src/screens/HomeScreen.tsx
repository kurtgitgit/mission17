import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Platform, RefreshControl, StatusBar,
  Linking, Alert
} from 'react-native';
import {
  Bell, CheckCircle, Clock, FileText,
  Phone, MapPin, ChevronRight, Megaphone,
  UserCheck, Shield, Calendar, MessageSquare, Bot, Users, Lightbulb,
  Landmark, ShieldAlert, Flame, PhoneCall, ArrowRight
} from 'lucide-react-native';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { endpoints, GlobalState, getAuthHeaders } from '../config/api';
import { getAuthData } from '../utils/storage';
import { useTheme } from '../context/ThemeContext';

const SERVICES = [
  { 
    id: 'clearance',  
    label: 'Clearance & ID', 
    subtitle: 'Certificates & Permits', 
    icon: FileText, 
    screen: 'Services',
    color: '#0038A8',
    bgLight: '#EFF6FF'
  },
  { 
    id: 'blotter',    
    label: 'Blotter Incident',   
    subtitle: 'File or Track Report',  
    icon: ShieldAlert, 
    screen: 'BlotterReport',
    color: '#DC2626',
    bgLight: '#FEF2F2'
  },
  { 
    id: 'officials',  
    label: 'Barangay Council', 
    subtitle: 'Officials & Directory',     
    icon: Users,    
    screen: 'Officials',
    color: '#0284C7',
    bgLight: '#F0F9FF'
  },
  { 
    id: 'suggestions',
    label: 'eFeedback',   
    subtitle: 'Citizen Voice',     
    icon: Lightbulb, 
    screen: 'Suggestion',
    color: '#7C3AED',
    bgLight: '#F5F3FF'
  },
];

// ─── EMERGENCY HOTLINES (VECTOR ICONS) ───────────────────────────────────────
const HOTLINES = [
  { label: 'Barangay Hall',      number: '075-529-9999', icon: Landmark,    color: '#0038A8' },
  { label: 'PNP San Jacinto',    number: '0998-598-5123', icon: ShieldAlert, color: '#1e40af' },
  { label: 'BFP Fire Station',   number: '0923-456-7890', icon: Flame,       color: '#dc2626' },
  { label: 'City DRRMO Rescue',  number: '075-529-7911', icon: PhoneCall,   color: '#ea580c' },
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
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);

  const userId = route.params?.userId || GlobalState.userId;

  const [username, setUsername]           = useState('Resident');
  const [fullName, setFullName]           = useState('Resident');
  const [refreshing, setRefreshing]       = useState(false);
  const [stats, setStats]                 = useState({ approved: 0, pending: 0, total: 0 });
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [events, setEvents]               = useState<any[]>([]);
  const [hasUnread, setHasUnread]         = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      if (userId) {
        const authHeaders = await getAuthHeaders();
        const [userRes, subRes] = await Promise.all([
          fetch(endpoints.auth.getUser(userId), { headers: authHeaders }),
          fetch(endpoints.auth.getUserSubmissions(userId), { headers: authHeaders }),
        ]);
        if (userRes.ok)  {
          const u = await userRes.json();
          setUsername(u.username || 'Resident');
          setFullName(u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : (u.username || 'Resident'));
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
        if (authHeaders) {
          const nr = await fetch(endpoints.auth.getNotifications(userId), { headers: authHeaders });
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

  const call = (number: string, label: string) => {
    Alert.alert(
      `Call ${label}?`,
      `Would you like to connect to ${number}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call Now', onPress: () => Linking.openURL(`tel:${number}`).catch(() => Alert.alert('Error', 'Cannot open phone dialer on this device.')) }
      ]
    );
  };

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
            </View>
          </View>
        </LinearGradient>

        {/* ══════════ CITIZEN ID & STATS CARD ══════════ */}
        <View style={styles.statsStrip}>
          <View style={styles.idHeader}>
            <View style={styles.verifiedBadge}>
              <CheckCircle size={13} color="#047857" />
              <Text style={styles.verifiedBadgeText}>VERIFIED CITIZEN</Text>
            </View>
            <Text style={styles.idHeaderText}>PORTAL ACTIVITY</Text>
          </View>
          <View style={styles.idBody}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{stats.total}</Text>
              <Text style={styles.statLbl}>Submitted</Text>
            </View>
            <View style={styles.statDiv} />
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: '#047857' }]}>{stats.approved}</Text>
              <Text style={styles.statLbl}>Approved</Text>
            </View>
            <View style={styles.statDiv} />
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: '#B45309' }]}>{stats.pending}</Text>
              <Text style={styles.statLbl}>In Progress</Text>
            </View>
          </View>
        </View>

        {/* ══════════ 2-COLUMN ESSENTIAL SERVICES GRID ══════════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Barangay E-Services</Text>
            <Text style={styles.sectionSub}>Official community services</Text>
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
                    <Text style={styles.svcLabel} numberOfLines={1}>{svc.label}</Text>
                    <Text style={styles.svcSub} numberOfLines={1}>{svc.subtitle}</Text>
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

          {announcements.length === 0 ? (
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

        {/* ══════════ UPCOMING EVENTS ══════════ */}
        {events.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Upcoming Activities</Text>
                <Text style={styles.sectionSub}>Community events schedule</Text>
              </View>
              <TouchableOpacity 
                onPress={() => navigation.navigate('MissionsTab', { initialTab: 'events' })}
                accessibilityRole="button"
                accessibilityLabel="See all events"
              >
                <Text style={styles.seeAll}>See all →</Text>
              </TouchableOpacity>
            </View>

            {events.map(ev => {
              const d = new Date(ev.date);
              const mon = d.toLocaleString('en-PH', { month: 'short' });
              const day = d.getDate();
              return (
                <TouchableOpacity
                  key={ev._id}
                  style={styles.evtRow}
                  onPress={() => navigation.navigate('EventDetail', { event: ev, userId })}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`Event: ${ev.title}`}
                >
                  <View style={[styles.evtDate, { backgroundColor: ev.color || '#0F2942' }]}>
                    <Text style={styles.evtMon}>{mon}</Text>
                    <Text style={styles.evtDay}>{day}</Text>
                  </View>
                  <View style={styles.evtInfo}>
                    <Text style={styles.evtTitle} numberOfLines={1}>{ev.title}</Text>
                    <View style={styles.evtLocRow}>
                      <MapPin size={12} color="#64748B" />
                      <Text style={styles.evtLoc} numberOfLines={1}>{ev.location || 'Barangay Hall'}</Text>
                    </View>
                  </View>
                  <ChevronRight size={16} color="#94A3B8" />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ══════════ EMERGENCY HOTLINES ══════════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Emergency Hotlines</Text>
              <Text style={styles.sectionSub}>24/7 San Jacinto emergency response</Text>
            </View>
          </View>

          <View style={styles.hotlinesCard}>
            {HOTLINES.map((h, i) => {
              const IconComp = h.icon;
              return (
                <TouchableOpacity
                  key={h.number}
                  style={[styles.hotlineRow, i < HOTLINES.length - 1 && styles.hotlineDivider]}
                  onPress={() => call(h.number, h.label)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Call ${h.label} at ${h.number}`}
                >
                  <View style={[styles.hotlineIconCircle, { backgroundColor: '#F1F5F9' }]}>
                    <IconComp size={18} color={h.color} />
                  </View>
                  <View style={styles.hotlineInfo}>
                    <Text style={styles.hotlineLabel}>{h.label}</Text>
                    <Text style={styles.hotlineNumber}>{h.number}</Text>
                  </View>
                  <View style={styles.callBadge}>
                    <Text style={styles.callBadgeText}>Call</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

      </ScrollView>

      {/* FLOATING ACTION BUTTON (AI ASSISTANT) */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('ChatBot')}
        accessibilityRole="button"
        accessibilityLabel="Open Barangay AI Assistant"
        activeOpacity={0.85}
      >
        <Bot size={24} color="#0038A8" />
      </TouchableOpacity>
    </RootComponent>
  );
};

// ─── STYLES ───────────────────────────────────────────────────────────────────
const getStyles = (theme: any) => StyleSheet.create({
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

  // STATS STRIP
  statsStrip: {
    marginHorizontal: 16,
    marginTop: -16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  idHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingHorizontal: 14, 
    paddingVertical: 10, 
    alignItems: 'center', 
    borderBottomWidth: 1, 
    borderBottomColor: '#F1F5F9' 
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  verifiedBadgeText: { fontSize: 10, fontWeight: '800', color: '#047857', letterSpacing: 0.5 },
  idHeaderText: { fontSize: 10, fontWeight: '800', color: '#64748B', letterSpacing: 0.8 },
  idBody: { flexDirection: 'row', paddingVertical: 12 },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statNum:  { fontSize: 19, fontWeight: '800', color: '#0F172A' },
  statLbl:  { fontSize: 11, color: '#64748B', fontWeight: '600' },
  statDiv:  { width: 1, backgroundColor: '#E2E8F0', alignSelf: 'stretch', marginVertical: 2 },

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
    width: '48.5%', 
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
    minHeight: 64,
  },
  svcIconBox: { 
    width: 38, 
    height: 38, 
    borderRadius: 10, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  svcTextContent: { flex: 1 },
  svcLabel:  { fontSize: 12, fontWeight: '800', color: '#0F172A' },
  svcSub:    { fontSize: 10.5, color: '#64748B', marginTop: 1, fontWeight: '500' },

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

  // HOTLINES
  hotlinesCard: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 14, 
    overflow: 'hidden', 
    shadowColor: '#0F172A', 
    shadowOpacity: 0.04, 
    shadowRadius: 6, 
    elevation: 2, 
    borderWidth: 1, 
    borderColor: '#E2E8F0' 
  },
  hotlineRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 12,
    paddingHorizontal: 14 
  },
  hotlineDivider: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  hotlineIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  hotlineInfo: { flex: 1 },
  hotlineLabel: { fontSize: 13.5, fontWeight: '700', color: '#0F172A' },
  hotlineNumber: { fontSize: 12, color: '#64748B', fontWeight: '500', marginTop: 1 },
  callBadge: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  callBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  
  // FAB
  fab: {
    position: 'absolute', 
    bottom: 24, 
    right: 20, 
    width: 58, 
    height: 58, 
    borderRadius: 29, 
    backgroundColor: '#FCD116', 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: '#0F172A', 
    shadowOpacity: 0.2, 
    shadowRadius: 8, 
    elevation: 6, 
    shadowOffset: { width: 0, height: 3 },
    borderWidth: 2, 
    borderColor: '#FFFFFF'
  }
});

export default HomeScreen;

