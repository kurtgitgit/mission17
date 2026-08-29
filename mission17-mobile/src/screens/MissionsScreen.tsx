import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image, 
  Platform, ViewStyle, SafeAreaView, Alert, ActivityIndicator, TextStyle, Modal, ScrollView,
  RefreshControl, StatusBar
} from 'react-native';
import { GlobalState, endpoints, formatImageUri } from '../config/api';
import { LinearGradient } from 'expo-linear-gradient'; 
import { MapPin, Clock, X, Calendar, Target, CheckCircle, Award, Sparkles, ArrowLeft } from 'lucide-react-native';
import { useNotification } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import { sharedStyles } from '../config/theme';

const MissionsScreen = ({ navigation, route }: any) => {
  const { showNotification } = useNotification();
  const { theme } = useTheme();
  
  const [missions, setMissions] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [completedMissions, setCompletedMissions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'missions' | 'events'>('missions');
  const [selectedSDG, setSelectedSDG] = useState<string | null>(null);

  const RootComponent = (Platform.OS === 'web' ? View : SafeAreaView) as React.ElementType;
  const userId = route.params?.userId || GlobalState.userId;

  const fetchData = useCallback(async () => {
    try {
      const [missionRes, eventRes] = await Promise.all([
        fetch(endpoints.missions),
        fetch(endpoints.events),
      ]);

      if (missionRes.ok) {
        const missionData = await missionRes.json();
        setMissions(Array.isArray(missionData) ? missionData : (Array.isArray(missionData.data) ? missionData.data : []));
      }

      if (eventRes.ok) {
        const eventData = await eventRes.json();
        setEvents(Array.isArray(eventData) ? eventData : (Array.isArray(eventData.data) ? eventData.data : []));
      }

      if (userId) {
        const subRes = await fetch(endpoints.auth.getUserSubmissions(userId));
        if (subRes.ok) {
          const subData = await subRes.json();
          const completedIds = new Set(
            (Array.isArray(subData) ? subData : [])
              .filter((s: any) => s.status === 'Approved')
              .map((s: any) => s.missionId)
          );
          setCompletedMissions(completedIds as Set<string>);
        }
      }
    } catch (error) {
      console.error("Failed to load missions data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Effect to handle initial tab or selectedSDG from navigation params
  useEffect(() => {
    if (route.params?.initialTab) {
      setActiveTab(route.params.initialTab);
      navigation.setParams({ initialTab: null });
    }
    if (route.params?.selectedSDG) {
      setSelectedSDG(route.params.selectedSDG.toString());
      setActiveTab('missions');
      navigation.setParams({ selectedSDG: null });
    }
  }, [route.params?.initialTab, route.params?.selectedSDG, navigation]);


  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handlePressMission = (item: any) => {
    if (!userId) {
      showNotification({ message: "Please log in to participate and earn points.", type: "info" });
    }
    navigation.navigate('MissionDetail', { mission: item, userId: userId });
  };

  const renderCard = ({ item }: { item: any }) => {
    const hasImage = !!item.image;
    const isCompleted = completedMissions.has(item._id);

    return (
      <TouchableOpacity 
        style={[styles.card, isCompleted && { opacity: 0.9 }]} 
        activeOpacity={0.9} 
        onPress={() => handlePressMission(item)}
        accessibilityRole="button"
        accessibilityLabel={`Civic Task: ${item.title}`}
      >
        {/* RENDER LOGIC: Custom Image OR Color Block */}
        {hasImage ? (
          <Image source={{ uri: formatImageUri(item.image)! }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImage, { backgroundColor: item.color || '#0038A8', justifyContent: 'center', alignItems: 'center' }]}>
             <Text style={styles.placeholderNumber}>
               {item.sdgNumber || '17'}
             </Text>
          </View>
        )}
        
        {/* Gradient Overlay */}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.88)']} style={styles.cardOverlay}>
          <View style={styles.cardHeader}>
             <View style={styles.badgeSdg}>
               <Text style={styles.badgeText}>SDG {item.sdgNumber || '17'}</Text>
             </View>
             {item.points ? (
               <View style={styles.badgePoints}>
                 <Award size={13} color="#b45309" />
                 <Text style={styles.badgePointsText}>+{item.points} Points</Text>
               </View>
             ) : null}
          </View>
          
          <View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDesc} numberOfLines={2}>
              {item.description || 'Participate in this official barangay civic initiative.'}
            </Text>
            {isCompleted ? (
              <View style={styles.completedBadgeRow}>
                <CheckCircle size={14} color="#ffffff" />
                <Text style={styles.completedBadgeText}>Completed & Verified</Text>
              </View>
            ) : null}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderEventCard = ({ item }: { item: any }) => {
    const dateObj = new Date(item.date);
    const month = dateObj.toLocaleString('en-PH', { month: 'short' });
    const day = dateObj.getDate();
    const timeStr = item.time || dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const hasImage = !!item.image;

    return (
      <TouchableOpacity 
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => {
          if (!userId) showNotification({ message: "Please log in to participate.", type: "info" });
          navigation.navigate('EventDetail', { event: item, userId: userId });
        }}
        accessibilityRole="button"
        accessibilityLabel={`Event: ${item.title}`}
      >
        {/* RENDER LOGIC: Image or Color Block */}
        {hasImage ? (
          <Image source={{ uri: formatImageUri(item.image)! }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImage, { backgroundColor: item.color || '#0038A8', justifyContent: 'center', alignItems: 'center' }]}>
             <Calendar size={60} color="rgba(255,255,255,0.2)" />
          </View>
        )}

        {/* Gradient Overlay */}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.88)']} style={styles.cardOverlay}>
          <View style={styles.cardHeader}>
             <View style={styles.badgeDate}>
               <Calendar size={12} color="white" />
               <Text style={styles.badgeText}>{month} {day}</Text>
             </View>
             <View style={styles.badgeCategory}>
               <Text style={styles.badgeText}>Barangay Event</Text>
             </View>
          </View>
          
          <View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <View style={styles.eventMetaRow}>
               <View style={styles.eventMetaItem}>
                  <Clock size={13} color="#cbd5e1" />
                  <Text style={styles.eventMetaText}>{timeStr}</Text>
               </View>
               <View style={styles.eventMetaItem}>
                  <MapPin size={13} color="#cbd5e1" />
                  <Text style={styles.eventMetaText} numberOfLines={1}>{item.location || 'Barangay Hall'}</Text>
               </View>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const filteredMissions = activeTab === 'missions'
    ? (selectedSDG ? missions.filter(m => m.sdgNumber?.toString() === selectedSDG) : missions)
    : events;

  return (
    <RootComponent style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0038A8" />

      {/* HEADER */}
      <View style={sharedStyles.header}>
        <Text style={sharedStyles.headerTitle}>Civic Tasks & Community Events</Text>
      </View>

      {/* SEGMENTED TAB SWITCHER */}
      <View style={styles.segmentStrip}>
        <View style={styles.segmentContainer}>
          <TouchableOpacity 
            style={[styles.segmentBtn, activeTab === 'missions' && styles.segmentBtnActive]} 
            onPress={() => setActiveTab('missions')}
            accessibilityRole="button"
            accessibilityLabel={`Civic Tasks tab, ${missions.length} tasks`}
          >
            <Target size={16} color={activeTab === 'missions' ? '#ffffff' : '#64748b'} style={{ marginRight: 6 }} />
            <Text style={[styles.segmentText, activeTab === 'missions' && styles.segmentTextActive]}>
              Civic Tasks {missions.length > 0 ? `(${missions.length})` : ''}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.segmentBtn, activeTab === 'events' && styles.segmentBtnActive]} 
            onPress={() => setActiveTab('events')}
            accessibilityRole="button"
            accessibilityLabel={`Barangay Events tab, ${events.length} events`}
          >
            <Calendar size={16} color={activeTab === 'events' ? '#ffffff' : '#64748b'} style={{ marginRight: 6 }} />
            <Text style={[styles.segmentText, activeTab === 'events' && styles.segmentTextActive]}>
              Events {events.length > 0 ? `(${events.length})` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {/* SDG FILTER CHIPS */}
        {activeTab === 'missions' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sdgScroll} contentContainerStyle={{ paddingHorizontal: 2, gap: 8 }}>
            <TouchableOpacity 
              style={[styles.sdgChip, selectedSDG === null && styles.activeSdgChip]}
              onPress={() => setSelectedSDG(null)}
              accessibilityRole="button"
              accessibilityLabel="Show All SDGs"
            >
              <Text style={[styles.sdgChipText, selectedSDG === null && styles.activeSdgChipText]}>All SDGs</Text>
            </TouchableOpacity>
            
            {Array.from(new Set(missions.map(m => m.sdgNumber?.toString()))).filter(Boolean).sort((a, b) => Number(a) - Number(b)).map(sdg => (
              <TouchableOpacity 
                key={sdg} 
                style={[styles.sdgChip, selectedSDG === sdg && styles.activeSdgChip]}
                onPress={() => setSelectedSDG(sdg as string)}
                accessibilityRole="button"
                accessibilityLabel={`Filter by SDG ${sdg}`}
              >
                <Text style={[styles.sdgChipText, selectedSDG === sdg && styles.activeSdgChipText]}>SDG {sdg}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#0038A8" />
          <Text style={styles.loadingText}>Loading civic opportunities...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredMissions}
          renderItem={activeTab === 'missions' ? renderCard : renderEventCard}
          keyExtractor={(item) => item._id || Math.random().toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0038A8" />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Target size={40} color="#0038A8" />
              </View>
              <Text style={styles.emptyTitle}>
                {activeTab === 'missions' ? 'No Civic Tasks Available' : 'No Upcoming Events'}
              </Text>
              <Text style={styles.emptyText}>
                {activeTab === 'missions'
                  ? 'Check back later for new community missions and SDG action items.'
                  : 'There are currently no scheduled barangay activities.'}
              </Text>
            </View>
          }
        />
      )}
    </RootComponent>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },

  // SEGMENT STRIP
  segmentStrip: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  segmentBtnActive: {
    backgroundColor: '#0038A8',
    shadowColor: '#0038A8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#64748b',
  },
  segmentTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  
  // SDG FILTERS
  sdgScroll: { marginTop: 10 },
  sdgChip: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  activeSdgChip: {
    backgroundColor: '#0038A8',
    borderColor: '#0038A8',
  },
  sdgChipText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 12,
  },
  activeSdgChipText: {
    color: '#ffffff',
    fontWeight: '800',
  },

  listContent: { padding: 14, paddingBottom: 60 },

  // CARDS
  card: {
    height: 230,
    marginBottom: 14,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardImage: { width: '100%', height: '100%' },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
    justifyContent: 'space-between',
    padding: 16,
  },
  
  placeholderNumber: { fontSize: 90, fontWeight: '900', color: 'rgba(255,255,255,0.18)' },

  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badgeSdg: {
    backgroundColor: 'rgba(0, 56, 168, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 56, 168, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeCategory: {
    backgroundColor: 'rgba(22, 163, 74, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgePoints: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  badgePointsText: { color: '#b45309', fontWeight: '800', fontSize: 12 },
  badgeText: { color: '#ffffff', fontWeight: '800', fontSize: 12 },

  cardTitle: { color: '#ffffff', fontSize: 20, fontWeight: '900', marginBottom: 4, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  cardDesc: { color: '#e2e8f0', fontSize: 13, lineHeight: 18 },
  
  eventMetaRow: { flexDirection: 'row', gap: 14, marginTop: 4 },
  eventMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  eventMetaText: { color: '#cbd5e1', fontSize: 12, fontWeight: '600' },
  
  completedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#15803d',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
    gap: 6,
  },
  completedBadgeText: { color: '#ffffff', fontWeight: '800', fontSize: 12 },

  centerLoading: { alignItems: 'center', marginTop: 60 },
  loadingText: { fontSize: 13.5, color: '#64748b', marginTop: 12, fontWeight: '600' },

  emptyState: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 30 },
  emptyIconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginBottom: 14, borderWidth: 1.5, borderColor: '#bfdbfe' },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
  emptyText: { color: '#64748b', textAlign: 'center', fontSize: 13, lineHeight: 20 },
});

export default MissionsScreen;

