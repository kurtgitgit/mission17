import React from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity,
  Platform,
  Dimensions
} from 'react-native';
import { Bell } from 'lucide-react-native';

const HomeScreen = () => {
  // Mock Data for "Started Missions"
  const activeMissions = [
    { id: 1, title: 'Campus Tree Planting', sdg: 'SDG 13', progress: 0.5, color: '#dcfce7' }, // Light Green
    { id: 2, title: 'No Poverty', sdg: 'SDG 1', progress: 0.7, color: '#fef9c3' }, // Light Yellow
    { id: 3, title: 'Zero Hunger', sdg: 'SDG 2', progress: 0.3, color: '#fee2e2' }, // Light Red
  ];

  // Mock Data for "Explore SDGs"
  const sdgCategories = [
    { id: 1, num: '01', label: 'No Poverty', color: '#fca5a5' }, // Red
    { id: 2, num: '02', label: 'Zero Hunger', color: '#fde047' }, // Yellow
    { id: 3, num: '03', label: 'Good Health', color: '#86efac' }, // Green
    { id: 4, num: '04', label: 'Quality Ed', color: '#fca5a5' }, // Red
    { id: 5, num: '05', label: 'Gender Eq', color: '#fde047' }, // Yellow
  ];

  // --- COMPONENT SELECTION (Web Fix) ---
  const RootComponent = Platform.OS === 'web' ? View : SafeAreaView;
  const rootStyle = Platform.OS === 'web' ? styles.webContainer : styles.mobileContainer;

  return (
    <RootComponent style={rootStyle}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        style={{ width: '100%' }}
      >
        
        {/* 1. HEADER SECTION */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.username}>Student User</Text>
          </View>
          <TouchableOpacity style={styles.bellButton}>
            <Bell size={24} color="#1e293b" />
            <View style={styles.bellBadge} />
          </TouchableOpacity>
        </View>

        {/* 2. RANK CARD */}
        <View style={styles.rankCard}>
          <View style={styles.rankHeader}>
            <View>
              <Text style={styles.rankLabel}>CURRENT RANK</Text>
              <Text style={styles.rankTitle}>SDG Advocate</Text>
            </View>
            <View style={styles.pointsContainer}>
              <Text style={styles.pointsValue}>700</Text>
              <Text style={styles.pointsLabel}>Total Points</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '65%' }]} />
          </View>
          <Text style={styles.nextRankText}>250 pts to next rank: Change Maker</Text>
        </View>

        {/* 3. STARTED MISSIONS */}
        <Text style={styles.sectionTitle}>Started Missions</Text>
        <View style={styles.missionsList}>
          {activeMissions.map((mission) => (
            <View key={mission.id} style={styles.missionCard}>
              {/* Left: Placeholder Image */}
              <View style={[styles.missionImage, { backgroundColor: mission.color }]} />
              
              {/* Right: Info */}
              <View style={styles.missionInfo}>
                <View style={styles.missionHeaderRow}>
                  <Text style={styles.missionTitle}>{mission.title}</Text>
                  <View style={styles.sdgBadge}>
                    <Text style={styles.sdgBadgeText}>{mission.sdg}</Text>
                  </View>
                </View>
                <Text style={styles.missionDesc}>Upload a photo of your activity.</Text>
                
                {/* Mini Progress Bar */}
                <View style={styles.miniProgressRow}>
                  <View style={styles.miniProgressBg}>
                    <View style={[styles.miniProgressFill, { width: `${mission.progress * 100}%` }]} />
                  </View>
                  <Text style={styles.progressText}>{mission.progress * 100}% Complete</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* 4. EXPLORE SDGS */}
        <Text style={styles.sectionTitle}>Explore SDGs</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sdgScroll}>
          {sdgCategories.map((item) => (
            <TouchableOpacity key={item.id} style={styles.sdgItem}>
              <View style={[styles.sdgCircle, { backgroundColor: item.color }]}>
                <Text style={styles.sdgNumber}>{item.num}</Text>
              </View>
              <Text style={styles.sdgLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {/* Padding for Bottom Tab Bar */}
        <View style={{ height: 100 }} />

      </ScrollView>
    </RootComponent>
  );
};

const styles = StyleSheet.create({
  // --- CONTAINER STYLES ---
  mobileContainer: { flex: 1, backgroundColor: '#f8fafc' },
  webContainer: { flex: 1, backgroundColor: '#f8fafc', height: '100vh', width: '100%', alignItems: 'center' },
  
  scrollContent: {
    padding: 20,
    maxWidth: 600, // Keeps it looking like an app on Desktop
    width: '100%',
    alignSelf: 'center',
  },

  // --- HEADER ---
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    marginTop: 10,
  },
  greeting: { fontSize: 14, color: '#64748b' },
  username: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  bellButton: {
    width: 45, height: 45, backgroundColor: 'white', borderRadius: 25,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  bellBadge: {
    position: 'absolute', top: 10, right: 12, width: 8, height: 8,
    backgroundColor: '#ef4444', borderRadius: 4,
  },

  // --- RANK CARD ---
  rankCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
  },
  rankHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  rankLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '700', marginBottom: 4 },
  rankTitle: { fontSize: 18, fontWeight: '700', color: '#3b82f6' }, // Mission17 Blue
  pointsContainer: { alignItems: 'flex-end' },
  pointsValue: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  pointsLabel: { fontSize: 11, color: '#64748b' },
  
  progressBarBg: { height: 10, backgroundColor: '#e2e8f0', borderRadius: 5, marginBottom: 10, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#3b82f6', borderRadius: 5 },
  nextRankText: { fontSize: 12, color: '#64748b', textAlign: 'center' },

  // --- TITLES ---
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 15 },

  // --- MISSIONS LIST ---
  missionsList: { gap: 15, marginBottom: 30 },
  missionCard: {
    backgroundColor: 'white', borderRadius: 16, padding: 12,
    flexDirection: 'row', alignItems: 'center', gap: 15,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 2,
  },
  missionImage: { width: 80, height: 80, borderRadius: 12 },
  missionInfo: { flex: 1 },
  missionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  missionTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  sdgBadge: { backgroundColor: '#dcfce7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  sdgBadgeText: { fontSize: 10, fontWeight: '700', color: '#166534' },
  missionDesc: { fontSize: 12, color: '#64748b', marginBottom: 10 },
  
  miniProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  miniProgressBg: { flex: 1, height: 6, backgroundColor: '#e2e8f0', borderRadius: 3 },
  miniProgressFill: { height: '100%', backgroundColor: '#166534', borderRadius: 3 },
  progressText: { fontSize: 10, color: '#64748b', fontWeight: '600' },

  // --- EXPLORE SDGS ---
  sdgScroll: { paddingBottom: 20, marginHorizontal: -20, paddingHorizontal: 20 },
  sdgItem: { alignItems: 'center', marginRight: 20 },
  sdgCircle: {
    width: 65, height: 65, borderRadius: 35,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3,
  },
  sdgNumber: { fontSize: 20, fontWeight: '700', color: '#0f172a', opacity: 0.8 },
  sdgLabel: { fontSize: 12, color: '#475569', fontWeight: '500' },
});

export default HomeScreen;