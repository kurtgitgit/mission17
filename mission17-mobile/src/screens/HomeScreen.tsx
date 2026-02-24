import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity,
  Platform,
  RefreshControl,
  StatusBar,
  Alert,
} from 'react-native';
import { Bell, TrendingUp, CheckCircle, Clock, Globe, Lightbulb, ArrowRight, Target, MapPin } from 'lucide-react-native';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native'; 
import { endpoints, GlobalState } from '../config/api'; 

const getRank = (points: number) => {
  if (points >= 1000) return { title: "SDG Champion", color: "#8b5cf6", next: 5000 };
  if (points >= 500) return { title: "SDG Advocate", color: "#3b82f6", next: 1000 };
  if (points >= 200) return { title: "Active Agent", color: "#10b981", next: 500 };
  return { title: "Rookie Scout", color: "#94a3b8", next: 200 };
};

const ECO_TIPS = [
  "Recycling one aluminum can saves enough energy to run a TV for three hours.",
  "27,000 trees are cut down each day for toilet paper.",
  "Glass is 100% recyclable and can be recycled endlessly without loss in quality.",
  "Rainforests are cut down at a rate of 100 acres per minute."
];

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const isFocused = useIsFocused(); 
  
  const userId = route.params?.userId || GlobalState.userId; 

  const [username, setUsername] = useState('Loading...');
  const [points, setPoints] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  
  const [activeMissions, setActiveMissions] = useState<any[]>([]);
  const [stats, setStats] = useState({ completed: 0, pending: 0, rank: '--' }); // Added rank to state
  const [featuredMission, setFeaturedMission] = useState<any>(null);
  const [dailyTip, setDailyTip] = useState(ECO_TIPS[0]);
  const [events, setEvents] = useState<any[]>([]);

  // ⚠️ REPLACE 'localhost' with your computer's IP (e.g. 192.168.1.5) if using a physical device
  const API_URL = "http://192.168.1.101:5001";

  const fetchUserData = async () => {
    if (!userId) return;

    try {
      // 1. Get User Profile
      const userRes = await fetch(endpoints.auth.getUser(userId));
      const userData = await userRes.json();
      
      if (userRes.ok) {
        setUsername(userData.username);
        setPoints(userData.points || 0);
      }

      // 2. Get User Submissions
      const subRes = await fetch(endpoints.auth.getUserSubmissions(userId));
      const subData = await subRes.json();
      
      let completedCount = 0;
      let pendingCount = 0;

      if (subRes.ok) {
        const pending = subData.filter((s: any) => s.status === 'Pending');
        const completed = subData.filter((s: any) => s.status === 'Approved');
        setActiveMissions(pending);
        completedCount = completed.length;
        pendingCount = pending.length;
      }

      // 3. 👇 NEW: Calculate Global Rank
      // We fetch the leaderboard (which is already sorted by points) and find our index
      const leaderboardRes = await fetch(`${endpoints.auth.signup.replace('/signup', '')}/leaderboard`); 
      // (Using a trick to get base URL, or you can add 'leaderboard' to api.ts)
      
      let globalRank = '--';
      if (leaderboardRes.ok) {
        const leaderboard = await leaderboardRes.json();
        // Find index of current user
        const myIndex = leaderboard.findIndex((u: any) => u._id === userId || u.username === userData.username);
        if (myIndex !== -1) {
            globalRank = `#${myIndex + 1}`;
        } else {
            globalRank = 'N/A';
        }
      }

      // 4. Get Featured Mission (Random)
      const missionsRes = await fetch(`${API_URL}/api/auth/all-missions`);
      if (missionsRes.ok) {
        const missions = await missionsRes.json();
        if (missions.length > 0) {
            setFeaturedMission(missions[Math.floor(Math.random() * missions.length)]);
        }
      }

      // 5. Get Events
      const eventsRes = await fetch(`${API_URL}/api/auth/events`);
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(eventsData);
      }

      setStats({ 
        completed: completedCount, 
        pending: pendingCount,
        rank: globalRank 
      });

    } catch (error) {
      console.error("Failed to fetch home data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isFocused && userId) fetchUserData(); 
    setDailyTip(ECO_TIPS[Math.floor(Math.random() * ECO_TIPS.length)]);
  }, [userId, isFocused]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserData();
  }, [userId]);

  const currentRank = getRank(points); 
  const progressPercent = Math.min((points / currentRank.next) * 100, 100);
  const RootComponent = (Platform.OS === 'web' ? View : SafeAreaView) as React.ElementType;

  return (
    <RootComponent style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarContainer}>
               <Text style={styles.avatarText}>{username.charAt(0).toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.greeting}>Welcome Back 👋</Text>
              <Text style={styles.username}>{username}</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.bellButton}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Bell size={22} color="#1e293b" />
            <View style={styles.redDot} />
          </TouchableOpacity>
        </View>

        {/* RANK CARD */}
        <TouchableOpacity 
          style={styles.rankCard}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('RankTab')}
        >
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
        </TouchableOpacity>

        {/* IMPACT STATS ROW */}
        <View style={styles.statsRow}>
            <View style={styles.statItem}>
                <CheckCircle size={20} color="#16a34a" style={{marginBottom: 4}} />
                <Text style={styles.statValue}>{stats.completed}</Text>
                <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
                <Clock size={20} color="#eab308" style={{marginBottom: 4}} />
                <Text style={styles.statValue}>{stats.pending}</Text>
                <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
                <Globe size={20} color="#3b82f6" style={{marginBottom: 4}} />
                
                {/* 👇 SHOWING REAL RANK HERE */}
                <Text style={styles.statValue}>{stats.rank}</Text>
                <Text style={styles.statLabel}>Global Rank</Text>
            </View>
        </View>

        {/* FEATURED MISSION */}
        {featuredMission && (
          <>
            <Text style={styles.sectionTitle}>Daily Challenge</Text>
            <TouchableOpacity 
              style={[styles.featuredCard, { backgroundColor: featuredMission.color || '#3b82f6' }]}
              onPress={() => navigation.navigate('MissionDetail', { mission: featuredMission, userId })}
            >
              <View style={styles.featuredContent}>
                <View style={styles.featuredBadge}>
                  <Target size={16} color={featuredMission.color || '#3b82f6'} />
                  <Text style={[styles.featuredBadgeText, { color: featuredMission.color || '#3b82f6' }]}>
                    {featuredMission.points} PTS
                  </Text>
                </View>
                <Text style={styles.featuredTitle}>{featuredMission.title}</Text>
                <Text style={styles.featuredDesc} numberOfLines={2}>{featuredMission.description}</Text>
                <View style={styles.featuredBtn}>
                  <Text style={styles.featuredBtnText}>Start Mission</Text>
                  <ArrowRight size={16} color="white" />
                </View>
              </View>
            </TouchableOpacity>
          </>
        )}

        {/* HAPPENING NEARBY */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Happening Nearby</Text>
          <TouchableOpacity onPress={() => navigation.navigate('MissionsTab', { initialTab: 'events' })}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.eventsScroll}
        >
            {events.length > 0 ? events.map((event) => {
                const dateObj = new Date(event.date);
                const month = dateObj.toLocaleString('default', { month: 'short' });
                const day = dateObj.getDate();
                const timeStr = event.time || dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                return (
                  <TouchableOpacity 
                    key={event._id || event.id} 
                    style={styles.eventCard}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('MissionsTab', { initialTab: 'events' })}
                  >
                    <View style={[styles.dateBadge, { backgroundColor: event.color || '#3b82f6' }]}>
                        <Text style={styles.dateText}>{month}</Text>
                        <Text style={styles.dateNum}>{day}</Text>
                    </View>
                    <View style={styles.eventInfo}>
                        <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
                        <View style={styles.eventRow}>
                            <Clock size={12} color="#64748b" /><Text style={styles.eventDetail}>{timeStr}</Text>
                        </View>
                        <View style={styles.eventRow}>
                            <MapPin size={12} color="#64748b" /><Text style={styles.eventDetail}>{event.location}</Text>
                        </View>
                    </View>
                  </TouchableOpacity>
                );
            }) : (
              <Text style={{ color: '#94a3b8', fontStyle: 'italic' }}>No upcoming events found.</Text>
            )}
        </ScrollView>

        {/* DID YOU KNOW? */}
        <Text style={styles.sectionTitle}>Did You Know?</Text>
        <View style={styles.tipCard}>
          <Lightbulb size={24} color="#eab308" style={{ marginBottom: 10 }} />
          <Text style={styles.tipText}>"{dailyTip}"</Text>
        </View>

        <View style={{ height: 50 }} />
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
  redDot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444', borderWidth: 1, borderColor: 'white' },

  // RANK CARD
  rankCard: { 
    backgroundColor: '#1e293b', 
    borderRadius: 24, 
    padding: 24, 
    marginBottom: 20, 
    overflow: 'hidden',
    shadowColor: '#1e293b', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 
  },
  cardPatternCircle: { position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: 100, backgroundColor: '#334155', opacity: 0.3 },
  rankCardContent: { zIndex: 1 },
  rankTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  rankLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  rankTitle: { fontSize: 24, fontWeight: '800', color: 'white' },
  pointsBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  pointsValue: { fontSize: 14, fontWeight: '700', color: '#FFD700' },
  progressBarContainer: {},
  progressBarBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, marginBottom: 8 },
  progressBarFill: { height: '100%', backgroundColor: '#38bdf8', borderRadius: 4 }, 
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressText: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },

  // STATS ROW
  statsRow: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 16, padding: 15, marginBottom: 30, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 2, justifyContent: 'space-between' },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  statLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#f1f5f9', height: '80%', alignSelf: 'center' },

  // SECTIONS
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  seeAllText: { fontSize: 13, fontWeight: '600', color: '#3b82f6' },

  // FEATURED CARD
  featuredCard: { borderRadius: 20, padding: 20, marginBottom: 30, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  featuredContent: { },
  featuredBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, marginBottom: 10, gap: 5 },
  featuredBadgeText: { fontWeight: '800', fontSize: 12 },
  featuredTitle: { fontSize: 22, fontWeight: '800', color: 'white', marginBottom: 5 },
  featuredDesc: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginBottom: 15, lineHeight: 20 },
  featuredBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  featuredBtnText: { color: 'white', fontWeight: '700', fontSize: 14 },

  // EVENTS SECTION
  eventsScroll: { marginHorizontal: -20, paddingHorizontal: 20, marginBottom: 15 },
  eventCard: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 16, padding: 10, marginRight: 15, width: 280, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  dateBadge: { width: 50, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  dateText: { color: 'white', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  dateNum: { color: 'white', fontSize: 18, fontWeight: '800' },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  eventDetail: { fontSize: 11, color: '#64748b' },

  // TIP CARD
  tipCard: { backgroundColor: '#fefce8', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#fef08a', alignItems: 'center' },
  tipText: { fontSize: 14, color: '#854d0e', fontStyle: 'italic', textAlign: 'center', lineHeight: 22, fontWeight: '500' },
});

export default HomeScreen;