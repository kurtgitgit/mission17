import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity,
  Platform,
  ViewStyle,
  ActivityIndicator,
  Image,
  RefreshControl,
  StatusBar
} from 'react-native';
import { Bell, ScanLine, Trophy, History, ChevronRight, TrendingUp } from 'lucide-react-native';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native'; 
import { endpoints } from '../config/api'; 

// 👇 Helper for Dynamic Ranking
const getRank = (points: number) => {
  if (points >= 1000) return { title: "SDG Champion", color: "#8b5cf6", next: 5000 };
  if (points >= 500) return { title: "SDG Advocate", color: "#3b82f6", next: 1000 };
  if (points >= 200) return { title: "Active Agent", color: "#10b981", next: 500 };
  return { title: "Rookie Scout", color: "#94a3b8", next: 200 };
};

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const isFocused = useIsFocused(); 
  const userId = route.params?.userId; 

  const [username, setUsername] = useState('Loading...');
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUserData = async () => {
    try {
      const response = await fetch(endpoints.auth.getUser(userId));
      const data = await response.json();
      if (response.ok) {
        setUsername(data.username);
        setPoints(data.points || 0);
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!userId) {
      setUsername("Guest User");
      setLoading(false);
      return;
    }
    if (isFocused) {
      fetchUserData(); 
    }
  }, [userId, isFocused]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserData();
  }, []);

  const currentRank = getRank(points); 
  // Calculate progress percentage to next rank
  const progressPercent = Math.min((points / currentRank.next) * 100, 100);

  const handleMissionClick = (missionItem: any) => {
    navigation.navigate('MissionDetail', { mission: missionItem, userId: userId });
  };

  const handleSdgClick = () => {
    navigation.navigate('Missions', { userId: userId });
  };

  // Mock Data for "In Progress"
  const activeMissions = [
    { id: '13', title: 'Campus Tree Planting', sdg: 'SDG 13', progress: 0.5, color: '#16a34a' },
    { id: '1', title: 'Food Drive Donation', sdg: 'SDG 2', progress: 0.8, color: '#eab308' },
  ];

  const sdgCategories = [
    { id: '1', num: '01', label: 'No Poverty', color: '#E5243B' },
    { id: '2', num: '02', label: 'Zero Hunger', color: '#DDA63A' },
    { id: '3', num: '03', label: 'Good Health', color: '#4C9F38' },
    { id: '4', num: '04', label: 'Quality Ed', color: '#C5192D' },
    { id: '5', num: '05', label: 'Gender Eq', color: '#FF3A21' },
    { id: '6', num: '06', label: 'Clean Water', color: '#26BDE2' },
  ];

  const RootComponent = (Platform.OS === 'web' ? View : SafeAreaView) as React.ElementType;

  return (
    <RootComponent style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        
        {/* HEADER SECTION */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarContainer}>
               <Text style={styles.avatarText}>{username.charAt(0).toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.greeting}>Welcome Back 👋</Text>
              {loading ? (
                <ActivityIndicator size="small" color="#0f172a" style={{alignSelf: 'flex-start'}}/> 
              ) : (
                <Text style={styles.username}>{username}</Text>
              )}
            </View>
          </View>
          <TouchableOpacity style={styles.bellButton}>
            <Bell size={22} color="#1e293b" />
            <View style={styles.bellBadge} />
          </TouchableOpacity>
        </View>

        {/* HERO RANK CARD (Modern Dark Theme) */}
        <View style={styles.rankCard}>
          <View style={styles.cardPatternCircle} /> 
          
          <View style={styles.rankCardContent}>
            <View style={styles.rankTopRow}>
              <View>
                <Text style={styles.rankLabel}>CURRENT RANK</Text>
                <Text style={styles.rankTitle}>{currentRank.title}</Text>
              </View>
              <View style={styles.pointsBadge}>
                <TrendingUp size={16} color="#FFD700" style={{marginRight: 4}} />
                <Text style={styles.pointsValue}>{points} PTS</Text>
              </View>
            </View>

            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
              </View>
              <View style={styles.progressLabels}>
                <Text style={styles.progressText}>{points} / {currentRank.next} pts</Text>
                <Text style={styles.progressText}>{Math.round(progressPercent)}% to next level</Text>
              </View>
            </View>
          </View>
        </View>

        {/* QUICK ACTIONS GRID */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          <TouchableOpacity style={styles.quickActionItem} onPress={() => navigation.navigate('Missions', { userId })}>
             <View style={[styles.quickIcon, { backgroundColor: '#e0f2fe' }]}>
               <ScanLine size={24} color="#0284c7" />
             </View>
             <Text style={styles.quickText}>Scan QR</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionItem} onPress={() => navigation.navigate('Rank', { userId })}>
             <View style={[styles.quickIcon, { backgroundColor: '#fef9c3' }]}>
               <Trophy size={24} color="#ca8a04" />
             </View>
             <Text style={styles.quickText}>Leaderboard</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionItem} onPress={() => navigation.navigate('Profile', { userId })}>
             <View style={[styles.quickIcon, { backgroundColor: '#dcfce7' }]}>
               <History size={24} color="#16a34a" />
             </View>
             <Text style={styles.quickText}>History</Text>
          </TouchableOpacity>
        </View>

        {/* ACTIVE MISSIONS (Ticket Style) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Continue Missions</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Missions', { userId })}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.missionsList}>
          {activeMissions.length > 0 ? activeMissions.map((mission) => (
            <TouchableOpacity key={mission.id} style={styles.missionCard} onPress={() => handleMissionClick(mission)}>
              <View style={[styles.missionLeftStripe, { backgroundColor: mission.color }]} />
              <View style={styles.missionContent}>
                <Text style={styles.missionTitle}>{mission.title}</Text>
                <Text style={styles.missionSdg}>{mission.sdg}</Text>
                
                <View style={styles.miniProgressContainer}>
                  <View style={styles.miniProgressBg}>
                    <View style={[styles.miniProgressFill, { width: `${mission.progress * 100}%`, backgroundColor: mission.color }]} />
                  </View>
                  <Text style={styles.miniProgressText}>{mission.progress * 100}%</Text>
                </View>
              </View>
              <ChevronRight size={20} color="#cbd5e1" />
            </TouchableOpacity>
          )) : (
            <View style={styles.emptyState}>
              <Text style={{color: '#94a3b8'}}>No active missions. Start one now!</Text>
            </View>
          )}
        </View>

        {/* EXPLORE SDGS (Horizontal Scroll) */}
        <Text style={styles.sectionTitle}>Explore Goals</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sdgScroll}>
          {sdgCategories.map((item) => (
            <TouchableOpacity key={item.id} style={styles.sdgItem} onPress={handleSdgClick}>
              <View style={[styles.sdgCircle, { backgroundColor: item.color }]}>
                <Text style={styles.sdgNumber}>{item.num}</Text>
              </View>
              <Text style={styles.sdgLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
          {/* Padding at end of scroll */}
          <View style={{width: 20}} />
        </ScrollView>

        <View style={{ height: 100 }} />
      </ScrollView>
    </RootComponent>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { padding: 20, paddingTop: 10 },
  
  // HEADER
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '700', color: '#475569' },
  greeting: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  username: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  bellButton: { width: 45, height: 45, backgroundColor: 'white', borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
  bellBadge: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, backgroundColor: '#ef4444', borderRadius: 4, borderWidth: 1, borderColor: 'white' },

  // RANK CARD
  rankCard: { 
    backgroundColor: '#1e293b', // Dark Navy
    borderRadius: 24, 
    padding: 24, 
    marginBottom: 30, 
    overflow: 'hidden',
    shadowColor: '#1e293b', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 
  },
  cardPatternCircle: {
    position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: 100, backgroundColor: '#334155', opacity: 0.3
  },
  rankCardContent: { zIndex: 1 },
  rankTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  rankLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  rankTitle: { fontSize: 24, fontWeight: '800', color: 'white' },
  pointsBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  pointsValue: { fontSize: 14, fontWeight: '700', color: '#FFD700' },
  
  progressBarContainer: {},
  progressBarBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, marginBottom: 8 },
  progressBarFill: { height: '100%', backgroundColor: '#38bdf8', borderRadius: 4 }, // Cyan Blue
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressText: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },

  // SECTION TITLES
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  seeAllText: { fontSize: 13, color: '#3b82f6', fontWeight: '600' },

  // QUICK ACTIONS
  quickGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  quickActionItem: { flex: 1, alignItems: 'center', backgroundColor: 'white', padding: 15, borderRadius: 16, marginHorizontal: 4, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
  quickIcon: { width: 45, height: 45, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  quickText: { fontSize: 12, fontWeight: '600', color: '#475569' },

  // ACTIVE MISSIONS
  missionsList: { marginBottom: 30 },
  missionCard: { 
    backgroundColor: 'white', 
    borderRadius: 16, 
    marginBottom: 12, 
    flexDirection: 'row', 
    alignItems: 'center',
    paddingRight: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 1
  },
  missionLeftStripe: { width: 6, height: '100%' },
  missionContent: { flex: 1, padding: 15, paddingLeft: 12 },
  missionTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 2 },
  missionSdg: { fontSize: 12, color: '#64748b', fontWeight: '500', marginBottom: 10 },
  miniProgressContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  miniProgressBg: { flex: 1, height: 6, backgroundColor: '#f1f5f9', borderRadius: 3 },
  miniProgressFill: { height: '100%', borderRadius: 3 },
  miniProgressText: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  emptyState: { padding: 20, alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 12 },

  // SDG EXPLORER
  sdgScroll: { marginHorizontal: -20, paddingHorizontal: 20 },
  sdgItem: { alignItems: 'center', marginRight: 16 },
  sdgCircle: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 5, elevation: 4 },
  sdgNumber: { fontSize: 18, fontWeight: '900', color: 'white' },
  sdgLabel: { fontSize: 11, color: '#64748b', fontWeight: '600' },
});

export default HomeScreen;