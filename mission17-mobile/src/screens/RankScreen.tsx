import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Platform, 
  SafeAreaView,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { User, Crown, Target, Medal } from 'lucide-react-native';
import { useIsFocused } from '@react-navigation/native';
import { GlobalState, endpoints } from '../config/api';

const RankScreen = () => {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();
  const userId = GlobalState.userId;

  const RootComponent = (Platform.OS === 'web' ? View : SafeAreaView) as React.ElementType;

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`${endpoints.auth.baseUrl}/leaderboard`);
      const data = await res.json();
      setLeaders(data);
    } catch (error) {
      console.error("Leaderboard error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) fetchLeaderboard();
  }, [isFocused]);

  const topThree = leaders.slice(0, 3);
  const restOfList = leaders.slice(3);

  const renderPodiumUser = (item: any, size: number, rank: number) => {
    if (!item) return <View style={styles.podiumItem} />;

    const colors = {
      1: { border: '#FFD700', bg: 'rgba(255, 215, 0, 0.1)' },
      2: { border: '#C0C0C0', bg: 'rgba(192, 192, 192, 0.1)' },
      3: { border: '#CD7F32', bg: 'rgba(205, 127, 50, 0.1)' },
    };

    const currentRole = colors[rank as keyof typeof colors];

    return (
      <View style={[styles.podiumItem]}>
        <View style={styles.avatarWrapper}>
          {rank === 1 && (
            <View style={styles.crownWrapper}>
              <Crown size={size * 0.4} color="#FFD700" fill="#FFD700" />
            </View>
          )}
          <View style={[styles.podiumAvatar, { 
            width: size, 
            height: size, 
            borderRadius: size / 2, 
            borderColor: currentRole.border,
            backgroundColor: currentRole.bg 
          }]}>
            <User size={size * 0.5} color={currentRole.border} />
          </View>
          <View style={[styles.rankBadge, { backgroundColor: currentRole.border }]}>
            <Text style={styles.rankBadgeText}>{rank}</Text>
          </View>
        </View>
        <Text style={styles.podiumName} numberOfLines={1}>{item.username}</Text>
        <View style={styles.podiumPointsWrapper}>
          <Target size={12} color="#fff" style={{marginRight: 4}} />
          <Text style={styles.podiumPoints}>{item.points || 0}</Text>
        </View>
      </View>
    );
  };

  const renderListItem = ({ item, index }: { item: any, index: number }) => {
    const actualRank = index + 4;
    const isMe = item._id === userId;

    return (
      <View style={[styles.row, isMe && styles.myRow]}>
        <Text style={styles.listRankText}>{actualRank}</Text>
        <View style={styles.listAvatar}>
          <User size={18} color={isMe ? '#3b82f6' : '#94a3b8'} />
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.userName, isMe && styles.myText]}>
            {item.username} {isMe && ' (You)'}
          </Text>
          <Text style={styles.userRole}>Level {Math.floor((item.points || 0) / 500) + 1} Agent</Text>
        </View>
        <View style={styles.pointsContainer}>
          <Text style={[styles.pointsText, isMe && styles.myText]}>{item.points || 0}</Text>
          <Text style={styles.ptsLabel}>PTS</Text>
        </View>
      </View>
    );
  };

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="#3b82f6" />
    </View>
  );

  return (
    <RootComponent style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SDG CHAMPIONS</Text>
        
        <View style={styles.podiumSection}>
          {/* Rank 2 */}
          <View style={styles.sidePodium}>
            {renderPodiumUser(topThree[1], 75, 2)}
          </View>

          {/* Rank 1 */}
          <View style={styles.centerPodium}>
            {renderPodiumUser(topThree[0], 100, 1)}
          </View>

          {/* Rank 3 */}
          <View style={styles.sidePodium}>
            {renderPodiumUser(topThree[2], 75, 3)}
          </View>
        </View>
      </View>

      <View style={styles.body}>
        <FlatList
          data={restOfList}
          renderItem={renderListItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={<Text style={styles.listHeaderTitle}>Active Operatives</Text>}
          ListEmptyComponent={<Text style={styles.emptyText}>Recruiting more agents...</Text>}
        />
      </View>
    </RootComponent>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e293b' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e293b' },
  header: { 
    backgroundColor: '#0f172a', 
    paddingTop: Platform.OS === 'ios' ? 20 : 40, 
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    zIndex: 1,
  },
  headerTitle: { 
    textAlign: 'center', 
    fontSize: 14, 
    fontWeight: '900', 
    color: '#3b82f6', 
    letterSpacing: 2,
    marginBottom: 30 
  },
  podiumSection: { 
    flexDirection: 'row', 
    alignItems: 'flex-end', 
    justifyContent: 'center',
    paddingHorizontal: 20 
  },
  podiumItem: { alignItems: 'center', width: 100 },
  avatarWrapper: { position: 'relative', alignItems: 'center', marginBottom: 12 },
  centerPodium: { zIndex: 10, marginHorizontal: -10 },
  sidePodium: { opacity: 0.9 },
  podiumAvatar: { 
    borderWidth: 4, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  crownWrapper: { position: 'absolute', top: -25, zIndex: 11 },
  rankBadge: { 
    position: 'absolute', 
    bottom: -8, 
    width: 24, 
    height: 24, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0f172a'
  },
  rankBadgeText: { color: '#0f172a', fontSize: 12, fontWeight: '900' },
  podiumName: { color: 'white', fontWeight: '800', fontSize: 15, marginBottom: 4 },
  podiumPointsWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  podiumPoints: { color: '#fff', fontWeight: '700', fontSize: 12 },
  
  body: { flex: 1, backgroundColor: '#f8fafc', marginTop: -20, paddingTop: 30 },
  listHeaderTitle: { paddingHorizontal: 25, fontSize: 13, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 15, letterSpacing: 1 },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'white', 
    borderRadius: 20, 
    padding: 16, 
    marginBottom: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 3 },
      web: { boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }
    })
  },
  myRow: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' },
  listRankText: { width: 25, fontSize: 14, fontWeight: '900', color: '#64748b' },
  listAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  userRole: { fontSize: 11, color: '#94a3b8', fontWeight: '500', marginTop: 2 },
  pointsContainer: { alignItems: 'flex-end' },
  pointsText: { fontSize: 16, fontWeight: '900', color: '#1e293b' },
  ptsLabel: { fontSize: 9, color: '#94a3b8', fontWeight: 'bold' },
  myText: { color: '#3b82f6' },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 40, fontWeight: '600' }
});

export default RankScreen;