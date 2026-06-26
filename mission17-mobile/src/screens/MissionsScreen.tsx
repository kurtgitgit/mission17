import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image, 
  Platform, ViewStyle, SafeAreaView, Alert, ActivityIndicator, TextStyle, Modal, ScrollView
} from 'react-native';
import { GlobalState, endpoints, formatImageUri } from '../config/api';
import { LinearGradient } from 'expo-linear-gradient'; 
import { MapPin, Clock, X, Calendar, Target } from 'lucide-react-native';
import { useNotification } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';

const MissionsScreen = ({ navigation, route }: any) => {
  const { showNotification } = useNotification();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  
  const [missions, setMissions] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [completedMissions, setCompletedMissions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'missions' | 'events'>('missions');
  const [selectedSDG, setSelectedSDG] = useState<string | null>(null);

  const RootComponent = (Platform.OS === 'web' ? View : SafeAreaView) as React.ElementType;
  const userId = route.params?.userId || GlobalState.userId;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const missionRes = await fetch(endpoints.missions);
        const missionData = await missionRes.json();
        setMissions(missionData);

        const eventRes = await fetch(endpoints.events);
        const eventData = await eventRes.json();
        setEvents(eventData);

        if (userId) {
          const subRes = await fetch(endpoints.auth.getUserSubmissions(userId));
          if (subRes.ok) {
            const subData = await subRes.json();
            const completedIds = new Set(
              subData
                .filter((s: any) => s.status === 'Approved')
                .map((s: any) => s.missionId)
            );
            setCompletedMissions(completedIds as Set<string>);
          }
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Effect to handle initial tab from navigation params
  useEffect(() => {
    if (route.params?.initialTab) {
      setActiveTab(route.params.initialTab);
      navigation.setParams({ initialTab: null }); // Reset param to avoid sticky state
    }
  }, [route.params?.initialTab]);

  const handlePressMission = (item: any) => {
    if (!userId) {
      showNotification("Please log in to save points.", "info");
      return navigation.navigate('MissionDetail', { mission: item, userId: userId });
    }
    
    if (completedMissions.has(item._id)) {
      showNotification("You have already completed this mission!", "success");
      return; // Do not navigate if completed, or we could navigate but disable submission button there. Let's just navigate so they can see details.
    }
    
    navigation.navigate('MissionDetail', { mission: item, userId: userId });
  };

  const renderCard = ({ item }: { item: any }) => {
    const hasImage = !!item.image;
    const isCompleted = completedMissions.has(item._id);

    return (
      <TouchableOpacity 
        style={[styles.card, isCompleted && { opacity: 0.85 }]} 
        activeOpacity={0.9} 
        onPress={() => handlePressMission(item)}
      >
        {/* RENDER LOGIC: Custom Image OR Color Block */}
        {hasImage ? (
          <Image source={{ uri: formatImageUri(item.image)! }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImage, { backgroundColor: item.color || theme.primary, justifyContent: 'center', alignItems: 'center' }]}>
             <Text style={styles.placeholderNumber}>
               {item.sdgNumber}
             </Text>
          </View>
        )}
        
        {/* Gradient Overlay */}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.cardOverlay}>
          <View style={styles.cardHeader}>
             <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
               <Text style={styles.badgeText}>SDG {item.sdgNumber}</Text>
             </View>
             <View style={[styles.badge, { backgroundColor: 'rgba(26,107,58,0.8)' }]}>
               <Text style={styles.badgeText}>Civic Task</Text>
             </View>
          </View>
          
          <View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDesc} numberOfLines={2}>
              {item.description || 'Tap to participate in this barangay civic program.'}
            </Text>
            {isCompleted && (
              <View style={styles.completedBadgeRow}>
                <Target size={16} color="#fff" />
                <Text style={styles.completedBadgeText}>Mission Completed</Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderEventCard = ({ item }: { item: any }) => {
    const dateObj = new Date(item.date);
    const month = dateObj.toLocaleString('default', { month: 'short' });
    const day = dateObj.getDate();
    const timeStr = item.time || dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const hasImage = !!item.image;

    return (
      <TouchableOpacity 
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => {
          if (!userId) showNotification("Please log in to participate.", "info");
          navigation.navigate('EventDetail', { event: item, userId: userId });
        }}
      >
        {/* RENDER LOGIC: Image or Color Block */}
        {hasImage ? (
          <Image source={{ uri: formatImageUri(item.image)! }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImage, { backgroundColor: item.color || theme.primary, justifyContent: 'center', alignItems: 'center' }]}>
             <Calendar size={60} color="rgba(255,255,255,0.2)" />
          </View>
        )}

        {/* Gradient Overlay */}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.cardOverlay}>
          <View style={styles.cardHeader}>
             <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
               <Text style={styles.badgeText}>{month} {day}</Text>
             </View>
             <View style={[styles.badge, { backgroundColor: 'rgba(26,107,58,0.8)' }]}>
               <Text style={styles.badgeText}>Brgy. Event</Text>
             </View>
          </View>
          
          <View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
               <View style={styles.eventRowCompact}>
                  <Clock size={12} color="#cbd5e1" />
                  <Text style={styles.cardDescMini}>{timeStr}</Text>
               </View>
               <View style={styles.eventRowCompact}>
                  <MapPin size={12} color="#cbd5e1" />
                  <Text style={styles.cardDescMini} numberOfLines={1}>{item.location}</Text>
               </View>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <RootComponent style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Civic Tasks & Events</Text>
        <Text style={styles.subTitle}>Participate in barangay programs near you.</Text>
        
        {/* TAB SWITCHER */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'missions' && styles.activeTabBtn]} 
            onPress={() => setActiveTab('missions')}
          >
            <Target size={16} color={activeTab === 'missions' ? 'white' : theme.textSecondary} style={{marginRight: 6}} />
            <Text style={[styles.tabText, activeTab === 'missions' && styles.activeTabText]}>Civic Tasks</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'events' && styles.activeTabBtn]} 
            onPress={() => setActiveTab('events')}
          >
            <Calendar size={16} color={activeTab === 'events' ? 'white' : theme.textSecondary} style={{marginRight: 6}} />
            <Text style={[styles.tabText, activeTab === 'events' && styles.activeTabText]}>Events</Text>
          </TouchableOpacity>
        </View>
        
        {/* SDG FILTER CHIPS */}
        {activeTab === 'missions' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sdgScroll} contentContainerStyle={{ paddingRight: 20 }}>
            <TouchableOpacity 
              style={[styles.sdgChip, selectedSDG === null && styles.activeSdgChip]}
              onPress={() => setSelectedSDG(null)}
            >
              <Text style={[styles.sdgChipText, selectedSDG === null && styles.activeSdgChipText]}>All SDGs</Text>
            </TouchableOpacity>
            
            {Array.from(new Set(missions.map(m => m.sdgNumber?.toString()))).filter(Boolean).sort((a, b) => Number(a) - Number(b)).map(sdg => (
              <TouchableOpacity 
                key={sdg} 
                style={[styles.sdgChip, selectedSDG === sdg && styles.activeSdgChip]}
                onPress={() => setSelectedSDG(sdg as string)}
              >
                <Text style={[styles.sdgChipText, selectedSDG === sdg && styles.activeSdgChipText]}>SDG {sdg}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={activeTab === 'missions' ? (selectedSDG ? missions.filter(m => m.sdgNumber?.toString() === selectedSDG) : missions) : events}
          renderItem={activeTab === 'missions' ? renderCard : renderEventCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.emptyText}>No items found.</Text>}
        />
      )}

    </RootComponent>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background } as ViewStyle,
  header: { padding: 20, backgroundColor: theme.surface, paddingBottom: 15 } as ViewStyle,
  pageTitle: { fontSize: 26, fontWeight: '800', color: theme.text } as ViewStyle,
  subTitle: { fontSize: 14, color: theme.textSecondary, marginTop: 4 } as ViewStyle,
  listContent: { padding: 20, paddingBottom: 40 } as ViewStyle,
  emptyText: { textAlign: 'center', marginTop: 40, color: theme.textTertiary } as TextStyle,

  // TABS
  tabContainer: { flexDirection: 'row', backgroundColor: theme.surfaceSecondary, borderRadius: 12, padding: 4, marginTop: 20 } as ViewStyle,
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10 } as ViewStyle,
  activeTabBtn: { backgroundColor: theme.primary, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 } as ViewStyle,
  tabText: { fontSize: 14, fontWeight: '600', color: theme.textSecondary } as TextStyle,
  activeTabText: { color: 'white' } as TextStyle,
  
  // SDG FILTERS
  sdgScroll: { marginTop: 15, flexDirection: 'row' } as ViewStyle,
  sdgChip: { backgroundColor: theme.surfaceSecondary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: theme.border } as ViewStyle,
  activeSdgChip: { backgroundColor: theme.primary, borderColor: theme.primary } as ViewStyle,
  sdgChipText: { color: theme.textSecondary, fontWeight: '600', fontSize: 13 } as TextStyle,
  activeSdgChipText: { color: 'white' } as TextStyle,

  card: { height: 240, marginBottom: 20, borderRadius: 20, overflow: 'hidden', backgroundColor: theme.surface, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5 } as ViewStyle,
  cardImage: { width: '100%', height: '100%' } as any, 
  cardOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '100%', justifyContent: 'space-between', padding: 20 } as ViewStyle,
  
  placeholderNumber: { fontSize: 100, fontWeight: '900', color: 'rgba(255,255,255,0.15)' } as TextStyle,

  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' } as ViewStyle,
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 } as ViewStyle,
  badgeText: { color: 'white', fontWeight: '800', fontSize: 12 } as ViewStyle,
  pointsBadge: { backgroundColor: 'white', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 } as ViewStyle,
  pointsText: { color: theme.text, fontWeight: '800', fontSize: 12 } as ViewStyle,

  cardTitle: { color: 'white', fontSize: 24, fontWeight: '800', marginBottom: 6 } as ViewStyle,
  cardDesc: { color: '#e2e8f0', fontSize: 14, lineHeight: 20 } as ViewStyle,
  cardDescMini: { color: '#cbd5e1', fontSize: 12, fontWeight: '600' } as TextStyle,
  eventRowCompact: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  
  completedBadgeRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.success, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginTop: 12, alignSelf: 'flex-start', gap: 6 } as ViewStyle,
  completedBadgeText: { color: 'white', fontWeight: 'bold', fontSize: 13 } as TextStyle,

  // EVENT CARD STYLES
  eventCard: { flexDirection: 'row', backgroundColor: theme.surface, borderRadius: 16, padding: 10, marginBottom: 15, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 } as ViewStyle,
  dateBadge: { width: 50, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 } as ViewStyle,
  dateText: { color: 'white', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' } as TextStyle,
  dateNum: { color: 'white', fontSize: 18, fontWeight: '800' } as TextStyle,
  eventInfo: { flex: 1 } as ViewStyle,
  eventTitle: { fontSize: 14, fontWeight: '700', color: theme.text, marginBottom: 4 } as TextStyle,
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 } as ViewStyle,
  eventDetail: { fontSize: 11, color: theme.textSecondary } as TextStyle,

});

export default MissionsScreen;
