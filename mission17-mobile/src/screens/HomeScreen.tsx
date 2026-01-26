import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity,
  Platform,
  ViewStyle,
  ActivityIndicator
} from 'react-native';
import { Bell } from 'lucide-react-native';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native'; // 👈 Added useIsFocused
import { endpoints } from '../config/api'; 

// 👇 Helper for Dynamic Ranking
const getRank = (points: number) => {
  if (points >= 1000) return { title: "SDG Champion", color: "#7c3aed" };
  if (points >= 500) return { title: "SDG Advocate", color: "#3b82f6" };
  if (points >= 200) return { title: "Active Agent", color: "#10b981" };
  return { title: "Rookie Scout", color: "#64748b" };
};

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const isFocused = useIsFocused(); // 👈 Detects when Kurt is looking at this screen
  const userId = route.params?.userId; 

  const [username, setUsername] = useState('Loading...');
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);

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
    }
  };

  useEffect(() => {
    if (!userId) {
      setUsername("Guest User");
      setLoading(false);
      return;
    }
    if (isFocused) {
      fetchUserData(); // 👈 Re-fetch data every time the screen is focused
    }
  }, [userId, isFocused, route.params?.refresh]);

  const currentRank = getRank(points); // 👈 Calculate rank based on real points

  const handleMissionClick = (missionItem: any) => {
    navigation.navigate('MissionDetail', { mission: missionItem, userId: userId });
  };

  const handleSdgClick = () => {
    navigation.navigate('Missions', { userId: userId });
  };

  // Mock Data
  const activeMissions = [
    { id: '13', title: 'Campus Tree Planting', sdg: 'SDG 13', progress: 0.5, color: '#dcfce7' },
    { id: '1', title: 'No Poverty', sdg: 'SDG 1', progress: 0.7, color: '#fef9c3' },
    { id: '2', title: 'Zero Hunger', sdg: 'SDG 2', progress: 0.3, color: '#fee2e2' },
  ];

  const sdgCategories = [
    { id: '1', num: '01', label: 'No Poverty', color: '#fca5a5' },
    { id: '2', num: '02', label: 'Zero Hunger', color: '#fde047' },
    { id: '3', num: '03', label: 'Good Health', color: '#86efac' },
    { id: '4', num: '04', label: 'Quality Ed', color: '#fca5a5' },
    { id: '5', num: '05', label: 'Gender Eq', color: '#fde047' },
  ];

  const RootComponent = Platform.OS === 'web' ? View : SafeAreaView;
  const rootStyle = (Platform.OS === 'web' ? styles.webContainer : styles.mobileContainer) as ViewStyle;

  return (
    <RootComponent style={rootStyle}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} style={{ width: '100%' }}>
        
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            {loading ? <ActivityIndicator size="small" color="#0f172a"/> : <Text style={styles.username}>{username}</Text>}
          </View>
          <TouchableOpacity style={styles.bellButton}>
            <Bell size={24} color="#1e293b" />
            <View style={styles.bellBadge} />
          </TouchableOpacity>
        </View>

        {/* DYNAMIC RANK CARD */}
        <View style={styles.rankCard}>
          <View style={styles.rankHeader}>
            <View>
              <Text style={styles.rankLabel}>CURRENT RANK</Text>
              <Text style={[styles.rankTitle, { color: currentRank.color }]}>{currentRank.title}</Text>
            </View>
            <View style={styles.pointsContainer}>
              <Text style={styles.pointsValue}>{points}</Text>
              <Text style={styles.pointsLabel}>Total Points</Text>
            </View>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${Math.min((points / 1000) * 100, 100)}%`, backgroundColor: currentRank.color }]} />
          </View>
          <Text style={styles.nextRankText}>{points < 1000 ? `${1000 - points} pts to Champion rank` : "Maximum Rank Achieved!"}</Text>
        </View>

        <Text style={styles.sectionTitle}>Started Missions</Text>
        <View style={styles.missionsList}>
          {activeMissions.map((mission) => (
            <TouchableOpacity key={mission.id} style={styles.missionCard} onPress={() => handleMissionClick(mission)}>
              <View style={[styles.missionImage, { backgroundColor: mission.color }]} />
              <View style={styles.missionInfo}>
                <View style={styles.missionHeaderRow}>
                  <Text style={styles.missionTitle}>{mission.title}</Text>
                  <View style={styles.sdgBadge}>
                    <Text style={styles.sdgBadgeText}>{mission.sdg}</Text>
                  </View>
                </View>
                <Text style={styles.missionDesc}>Tap to continue mission.</Text>
                <View style={styles.miniProgressRow}>
                  <View style={styles.miniProgressBg}>
                    <View style={[styles.miniProgressFill, { width: `${mission.progress * 100}%` }]} />
                  </View>
                  <Text style={styles.progressText}>{mission.progress * 100}%</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Explore SDGs</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sdgScroll}>
          {sdgCategories.map((item) => (
            <TouchableOpacity key={item.id} style={styles.sdgItem} onPress={handleSdgClick}>
              <View style={[styles.sdgCircle, { backgroundColor: item.color }]}>
                <Text style={styles.sdgNumber}>{item.num}</Text>
              </View>
              <Text style={styles.sdgLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={{ height: 100 }} />
      </ScrollView>
    </RootComponent>
  );
};

// ... Styles remain the same ...
const styles = StyleSheet.create({
  mobileContainer: { flex: 1, backgroundColor: '#f8fafc' },
  webContainer: { flex: 1, backgroundColor: '#f8fafc', height: '100%', width: '100%', alignItems: 'center' },
  scrollContent: { padding: 20, maxWidth: 600, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, marginTop: 10 },
  greeting: { fontSize: 14, color: '#64748b' },
  username: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  bellButton: { width: 45, height: 45, backgroundColor: 'white', borderRadius: 25, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  bellBadge: { position: 'absolute', top: 10, right: 12, width: 8, height: 8, backgroundColor: '#ef4444', borderRadius: 4 },
  rankCard: { backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  rankHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  rankLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '700', marginBottom: 4 },
  rankTitle: { fontSize: 18, fontWeight: '700', color: '#3b82f6' },
  pointsContainer: { alignItems: 'flex-end' },
  pointsValue: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  pointsLabel: { fontSize: 11, color: '#64748b' },
  progressBarBg: { height: 10, backgroundColor: '#e2e8f0', borderRadius: 5, marginBottom: 10, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#3b82f6', borderRadius: 5 },
  nextRankText: { fontSize: 12, color: '#64748b', textAlign: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 15 },
  missionsList: { gap: 15, marginBottom: 30 },
  missionCard: { backgroundColor: 'white', borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 15, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
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
  sdgScroll: { paddingBottom: 20, marginHorizontal: -20, paddingHorizontal: 20 },
  sdgItem: { alignItems: 'center', marginRight: 20 },
  sdgCircle: { width: 65, height: 65, borderRadius: 35, alignItems: 'center', justifyContent: 'center', marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  sdgNumber: { fontSize: 20, fontWeight: '700', color: '#0f172a', opacity: 0.8 },
  sdgLabel: { fontSize: 12, color: '#475569', fontWeight: '500' },
});

export default HomeScreen;