import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image, 
  Platform, ViewStyle, SafeAreaView, Alert, ActivityIndicator, TextStyle, Modal 
} from 'react-native';
import { GlobalState } from '../config/api';
import { LinearGradient } from 'expo-linear-gradient'; 
import { MapPin, Clock, X, Calendar, Target } from 'lucide-react-native';

const MissionsScreen = ({ navigation, route }: any) => {
  const [missions, setMissions] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'missions' | 'events'>('missions');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const RootComponent = (Platform.OS === 'web' ? View : SafeAreaView) as React.ElementType;
  const userId = route.params?.userId || GlobalState.userId;

  // ⚠️ REPLACE 'localhost' with your computer's IP (e.g. 192.168.1.5) if using a physical device
  const API_URL = "http://192.168.1.101:5001";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const missionRes = await fetch(`${API_URL}/api/auth/all-missions`);
        const missionData = await missionRes.json();
        setMissions(missionData);

        const eventRes = await fetch(`${API_URL}/api/auth/events`);
        const eventData = await eventRes.json();
        setEvents(eventData);
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
    if (!userId) Alert.alert("Notice", "Please log in to save points.");
    navigation.navigate('MissionDetail', { mission: item, userId: userId });
  };

  const renderCard = ({ item }: { item: any }) => {
    const hasImage = !!item.image;

    return (
      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.9} 
        onPress={() => handlePressMission(item)}
      >
        {/* RENDER LOGIC: Custom Image OR Color Block */}
        {hasImage ? (
          <Image source={{ uri: item.image }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImage, { backgroundColor: item.color || '#3b82f6', justifyContent: 'center', alignItems: 'center' }]}>
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
             <View style={styles.pointsBadge}>
               <Text style={styles.pointsText}>{item.points} PTS</Text>
             </View>
          </View>
          
          <View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDesc} numberOfLines={2}>
              {item.description || 'Tap to view mission details and start contributing.'}
            </Text>
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

    return (
      <TouchableOpacity 
        style={styles.eventCard}
        onPress={() => setSelectedEvent(item)}
      >
          <View style={[styles.dateBadge, { backgroundColor: item.color || '#3b82f6' }]}>
              <Text style={styles.dateText}>{month}</Text>
              <Text style={styles.dateNum}>{day}</Text>
          </View>
          <View style={styles.eventInfo}>
              <Text style={styles.eventTitle} numberOfLines={1}>{item.title}</Text>
              <View style={styles.eventRow}>
                  <Clock size={12} color="#64748b" />
                  <Text style={styles.eventDetail}>{timeStr}</Text>
              </View>
              <View style={styles.eventRow}>
                  <MapPin size={12} color="#64748b" />
                  <Text style={styles.eventDetail}>{item.location}</Text>
              </View>
          </View>
      </TouchableOpacity>
    );
  };

  return (
    <RootComponent style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Explore</Text>
        <Text style={styles.subTitle}>Find missions and events near you.</Text>
        
        {/* TAB SWITCHER */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'missions' && styles.activeTabBtn]} 
            onPress={() => setActiveTab('missions')}
          >
            <Target size={16} color={activeTab === 'missions' ? 'white' : '#64748b'} style={{marginRight: 6}} />
            <Text style={[styles.tabText, activeTab === 'missions' && styles.activeTabText]}>Missions</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'events' && styles.activeTabBtn]} 
            onPress={() => setActiveTab('events')}
          >
            <Calendar size={16} color={activeTab === 'events' ? 'white' : '#64748b'} style={{marginRight: 6}} />
            <Text style={[styles.tabText, activeTab === 'events' && styles.activeTabText]}>Events</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={activeTab === 'missions' ? missions : events}
          renderItem={activeTab === 'missions' ? renderCard : renderEventCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.emptyText}>No items found.</Text>}
        />
      )}

      {/* EVENT DETAILS MODAL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={!!selectedEvent}
        onRequestClose={() => setSelectedEvent(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedEvent && (
              <>
                  <View style={[styles.modalHeader, { backgroundColor: selectedEvent.color || '#3b82f6' }]}>
                      <View style={{flex: 1}}>
                          <Text style={styles.modalHeaderDate}>
                              {new Date(selectedEvent.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                          </Text>
                          <Text style={styles.modalHeaderTime}>{selectedEvent.time}</Text>
                      </View>
                      <TouchableOpacity onPress={() => setSelectedEvent(null)} style={styles.closeButton}>
                          <X size={24} color="white" />
                      </TouchableOpacity>
                  </View>
                  
                  <View style={styles.modalBody}>
                      <Text style={styles.modalTitle}>{selectedEvent.title}</Text>
                      <View style={styles.modalInfoRow}><MapPin size={20} color="#64748b" /><Text style={styles.modalInfoText}>{selectedEvent.location}</Text></View>
                      <View style={styles.modalInfoRow}><Clock size={20} color="#64748b" /><Text style={styles.modalInfoText}>{selectedEvent.time}</Text></View>
                      <Text style={styles.modalDescription}>Join us for this event! Make sure to arrive 15 minutes early.</Text>
                      <TouchableOpacity style={[styles.modalActionBtn, { backgroundColor: selectedEvent.color || '#3b82f6' }]} onPress={() => Alert.alert("Interested", "Event saved!")}>
                          <Text style={styles.modalActionBtnText}>I'm Interested</Text>
                      </TouchableOpacity>
                  </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </RootComponent>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' } as ViewStyle,
  header: { padding: 20, backgroundColor: 'white', paddingBottom: 15 } as ViewStyle,
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#0f172a' } as ViewStyle,
  subTitle: { fontSize: 14, color: '#64748b', marginTop: 4 } as ViewStyle,
  listContent: { padding: 20, paddingBottom: 40 } as ViewStyle,
  emptyText: { textAlign: 'center', marginTop: 40, color: '#94a3b8' } as TextStyle,

  // TABS
  tabContainer: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 12, padding: 4, marginTop: 20 } as ViewStyle,
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10 } as ViewStyle,
  activeTabBtn: { backgroundColor: '#3b82f6', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 } as ViewStyle,
  tabText: { fontSize: 14, fontWeight: '600', color: '#64748b' } as TextStyle,
  activeTabText: { color: 'white' } as TextStyle,
  
  card: { height: 240, marginBottom: 20, borderRadius: 20, overflow: 'hidden', backgroundColor: 'white', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5 } as ViewStyle,
  cardImage: { width: '100%', height: '100%' } as any, 
  cardOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '100%', justifyContent: 'space-between', padding: 20 } as ViewStyle,
  
  placeholderNumber: { fontSize: 100, fontWeight: '900', color: 'rgba(255,255,255,0.15)' } as TextStyle,

  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' } as ViewStyle,
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 } as ViewStyle,
  badgeText: { color: 'white', fontWeight: '800', fontSize: 12 } as ViewStyle,
  pointsBadge: { backgroundColor: 'white', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 } as ViewStyle,
  pointsText: { color: '#0f172a', fontWeight: '800', fontSize: 12 } as ViewStyle,

  cardTitle: { color: 'white', fontSize: 24, fontWeight: '800', marginBottom: 6 } as ViewStyle,
  cardDesc: { color: '#e2e8f0', fontSize: 14, lineHeight: 20 } as ViewStyle,

  // EVENT CARD STYLES
  eventCard: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 16, padding: 10, marginBottom: 15, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 } as ViewStyle,
  dateBadge: { width: 50, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 } as ViewStyle,
  dateText: { color: 'white', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' } as TextStyle,
  dateNum: { color: 'white', fontSize: 18, fontWeight: '800' } as TextStyle,
  eventInfo: { flex: 1 } as ViewStyle,
  eventTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b', marginBottom: 4 } as TextStyle,
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 } as ViewStyle,
  eventDetail: { fontSize: 11, color: '#64748b' } as TextStyle,

  // MODAL STYLES
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 } as ViewStyle,
  modalContainer: { backgroundColor: 'white', width: '100%', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, elevation: 5 } as ViewStyle,
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 } as ViewStyle,
  modalHeaderDate: { color: 'white', fontSize: 18, fontWeight: '700' } as TextStyle,
  modalHeaderTime: { color: 'rgba(255,255,255,0.9)', fontSize: 14, marginTop: 2 } as TextStyle,
  closeButton: { padding: 5, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 } as ViewStyle,
  modalBody: { padding: 24 } as ViewStyle,
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 20 } as TextStyle,
  modalInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 } as ViewStyle,
  modalInfoText: { fontSize: 16, color: '#475569' } as TextStyle,
  modalDescription: { marginTop: 10, marginBottom: 25, color: '#64748b', lineHeight: 22, fontSize: 14 } as TextStyle,
  modalActionBtn: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' } as ViewStyle,
  modalActionBtnText: { color: 'white', fontSize: 16, fontWeight: '700' } as TextStyle,
});

export default MissionsScreen;