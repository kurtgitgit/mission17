import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, RefreshControl, Image, ActivityIndicator, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native';
import { Bell, FileText, ShieldAlert, Users, MessageSquare, Bot, ArrowUpRight, ChevronRight, Megaphone, ShieldCheck } from 'lucide-react-native';
import { GlobalState } from '../config/api';
import useHomeDashboard from '../hooks/useHomeDashboard';
import HomeHotlines from '../components/home/HomeHotlines';
import { styles } from './HomeScreen.styles';

const SERVICES = [
  { label: 'Clearance & ID', subtitle: 'Document requests & certificates', icon: FileText, screen: 'Services', color: '#0038a8', bg: '#eaf1ff' },
  { label: 'Blotter Incident', subtitle: 'File or track a blotter report', icon: ShieldAlert, screen: 'BlotterReport', color: '#b42336', bg: '#fff0f1' },
  { label: 'eFeedback', subtitle: 'Share a concern or suggestion', icon: MessageSquare, screen: 'Suggestion', color: '#7252a3', bg: '#f3edff' },
  { label: 'Barangay Council', subtitle: 'Your officials & directory', icon: Users, screen: 'Officials', color: '#137c69', bg: '#e6f5ef' },
];

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const focused = useIsFocused();
  const { width, fontScale } = useWindowDimensions();
  const singleColumn = width < 350 || fontScale >= 1.4;
  const userId = route.params?.userId || GlobalState.userId;
  const { fullName, announcements, hasUnread, loading, refreshing, bulletinsUnavailable, refresh } = useHomeDashboard(userId, focused);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Magandang umaga' : hour < 18 ? 'Magandang hapon' : 'Magandang gabi';
  const captain = GlobalState.role === 'super_admin';

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0038a8" />
      <View style={styles.body}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#0038a8" />}>
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <View style={styles.brand}>
                <Image source={require('../../assets/logo.png')} style={styles.logo} accessibilityIgnoresInvertColors />
                <View style={styles.flex}><Text style={styles.brandName}>BrgyLink</Text><Text style={styles.brandLocation}>Barangay Bagong Pag-asa</Text></View>
              </View>
              <TouchableOpacity style={styles.bell} onPress={() => navigation.navigate('Notifications')} accessibilityRole="button" accessibilityLabel={hasUnread ? 'Notifications, unread alerts' : 'Notifications'}>
                <Bell size={22} color="#fff" />{hasUnread && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            </View>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.name}>{fullName}</Text>
            <Text style={styles.welcomeText}>Your barangay services, within reach.</Text>
          </View>

          {captain && <View style={styles.section}>
            <TouchableOpacity style={styles.captainCard} onPress={() => navigation.navigate('CaptainControl')} accessibilityRole="button" accessibilityLabel="Open Captain Control Center">
              <ShieldCheck size={24} color="#0038a8" /><View style={styles.flex}><Text style={styles.cardTitle}>Captain Control Center</Text><Text style={styles.cardSubtitle}>Approvals & cases awaiting your decision</Text></View><ChevronRight size={20} color="#0038a8" />
            </TouchableOpacity>
            <View style={styles.shortcutRow}>
              <TouchableOpacity style={styles.shortcut} onPress={() => navigation.navigate('CaptainAnnouncements')} accessibilityRole="button"><Megaphone size={17} color="#0038a8" /><Text style={styles.shortcutText}>News & alerts</Text></TouchableOpacity>
              <TouchableOpacity style={styles.shortcut} onPress={() => navigation.navigate('CaptainFeedback')} accessibilityRole="button"><MessageSquare size={17} color="#0038a8" /><Text style={styles.shortcutText}>Resident feedback</Text></TouchableOpacity>
            </View>
          </View>}

          <View style={styles.section}>
            <View style={styles.sectionHeading}><View style={styles.flex}><Text style={styles.sectionTitle}>How can we help?</Text><Text style={styles.sectionSubtitle}>Choose a barangay service to get started.</Text></View></View>
            <View style={styles.serviceGrid}>{SERVICES.map(service => {
              const Icon = service.icon;
              return <TouchableOpacity key={service.screen} style={[styles.serviceCard, singleColumn && styles.singleColumn]} activeOpacity={0.75} onPress={() => navigation.navigate(service.screen)} accessibilityRole="button" accessibilityLabel={service.label + '. ' + service.subtitle}>
                <View style={styles.serviceTop}><View style={[styles.serviceIcon, { backgroundColor: service.bg }]}><Icon size={23} color={service.color} /></View><ArrowUpRight size={16} color="#94a3b8" /></View>
                <Text style={styles.serviceTitle}>{service.label}</Text><Text style={styles.serviceSubtitle}>{service.subtitle}</Text>
              </TouchableOpacity>;
            })}</View>
          </View>

          <View style={styles.section}>
            <TouchableOpacity style={styles.assistant} onPress={() => navigation.navigate('ChatBot')} accessibilityRole="button" accessibilityLabel="Open Barangay Assistant for help with BrgyLink and barangay services">
              <View style={styles.assistantIcon}><Bot size={25} color="#0038a8" /></View><View style={styles.flex}><Text style={styles.cardTitle}>Need a little guidance?</Text><Text style={styles.cardSubtitle}>Ask the Barangay Assistant</Text></View><ChevronRight size={20} color="#0038a8" />
            </TouchableOpacity>
          </View>

          <HomeHotlines />

          <View style={styles.section}>
            <View style={styles.sectionHeading}><View style={styles.flex}><Text style={styles.sectionTitle}>Barangay Bulletins</Text><Text style={styles.sectionSubtitle}>Updates from your barangay</Text></View><TouchableOpacity style={styles.seeAllButton} onPress={() => navigation.navigate('AnnouncementsTab')} accessibilityRole="button" accessibilityLabel="See all barangay announcements"><Text style={styles.seeAll}>See all</Text><ChevronRight size={16} color="#0038a8" /></TouchableOpacity></View>
            {loading && announcements.length === 0 ? <View style={styles.notice} accessibilityRole="progressbar"><ActivityIndicator color="#0038a8" /><Text style={styles.noticeText}>Loading bulletins…</Text></View> : bulletinsUnavailable ? <View style={styles.notice}><Megaphone size={22} color="#a15c0d" /><View style={styles.flex}><Text style={styles.cardTitle}>Bulletins temporarily unavailable</Text><Text style={styles.cardSubtitle}>You can still use barangay services.</Text></View><TouchableOpacity style={styles.retryButton} onPress={refresh} accessibilityRole="button"><Text style={styles.seeAll}>Retry</Text></TouchableOpacity></View> : announcements.length === 0 ? <View style={styles.notice}><Megaphone size={22} color="#64748b" /><Text style={styles.noticeText}>No bulletins posted at this time.</Text></View> : announcements.map(announcement => (
              <TouchableOpacity key={announcement._id} style={[styles.announcement, announcement.isUrgent && styles.urgentCard]} onPress={() => navigation.navigate('AnnouncementsTab')} accessibilityRole="button" accessibilityLabel={(announcement.isUrgent ? 'Urgent announcement: ' : 'Announcement: ') + announcement.title}>
                <View style={styles.announcementMeta}><Text style={[styles.announcementTag, announcement.isUrgent && styles.urgentText]}>{announcement.isUrgent ? 'URGENT ALERT' : announcement.isPinned ? 'PINNED UPDATE' : 'COMMUNITY UPDATE'}</Text><Text style={styles.date}>{new Date(announcement.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}</Text></View>
                <Text style={styles.announcementTitle} numberOfLines={3}>{announcement.title}</Text>
                {announcement.body ? <Text style={styles.announcementBody} numberOfLines={2}>{announcement.body}</Text> : null}
                <View style={styles.readMore}><Text style={styles.seeAll}>Read announcement</Text><ArrowUpRight size={15} color="#0038a8" /></View>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.footer}>Barangay Bagong Pag-asa · San Jacinto, Pangasinan</Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

