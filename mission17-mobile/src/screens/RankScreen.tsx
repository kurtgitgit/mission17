import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Platform, 
  ViewStyle, 
  SafeAreaView,
  TextStyle,
  ActivityIndicator
} from 'react-native';
import { User, Crown } from 'lucide-react-native';
import { useIsFocused } from '@react-navigation/native';
import { GlobalState } from '../config/api';

const RankScreen = () => {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();
  const userId = GlobalState.userId;

  const RootComponent = (Platform.OS === 'web' ? View : SafeAreaView) as React.ElementType;

  // 1. Fetch Live Leaderboard
  const fetchLeaderboard = async () => {
    try {
      const res = await fetch("http://localhost:5001/api/auth/leaderboard");
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

  // 2. Split Data: Top 3 vs. The Rest
  const topThree = leaders.slice(0, 3);
  const restOfList = leaders.slice(3);

  // Helper to render a Podium User (Rank 1, 2, or 3)
  const renderPodiumUser = (item: any, size: number, zIndex: number, rank: number) => {
    if (!item) return <View style={styles.podiumItem} />;

    let borderColor = '#fbbf24'; // Gold
    if (rank === 2) borderColor = '#e2e8f0'; // Silver
    if (rank === 3) borderColor = '#b45309'; // Bronze

    return (
      <View style={[styles.podiumItem, { zIndex }]}>
        {rank === 1 && (
          <View style={styles.crownContainer}>
            <Crown size={24} color="#fbbf24" fill="#fbbf24" />
          </View>
        )}
        
        <View style={[styles.podiumAvatar, { width: size, height: size, borderColor }]}>
          <User size={size * 0.5} color="white" />
          <View style={[styles.rankBadge, { backgroundColor: borderColor }]}>
            <Text style={styles.rankBadgeText}>{rank}</Text>
          </View>
        </View>

        <Text style={styles.podiumName} numberOfLines={1}>{item.username}</Text>
        <Text style={styles.podiumPoints}>{item.points || 0}</Text>
      </View>
    );
  };

  // Helper for List Items (Rank 4+)
  const renderListItem = ({ item, index }: { item: any, index: number }) => {
    const actualRank = index + 4;
    const isMe = item._id === userId;

    return (
      <View style={[styles.row, isMe && styles.myRow]}>
        <View style={styles.rankContainer}>
          <Text style={styles.rankText}>{actualRank}</Text>
        </View>
        <View style={styles.userContainer}>
          <View style={[styles.listAvatar, { backgroundColor: isMe ? '#3b82f6' : '#e2e8f0' }]}>
            <User size={20} color={isMe ? 'white' : '#64748b'} />
          </View>
          <Text style={[styles.userName, isMe && styles.myText]}>
            {item.username} {isMe && '(You)'}
          </Text>
        </View>
        <Text style={[styles.pointsText, isMe && styles.myText]}>{item.points || 0}</Text>
      </View>
    );
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="white" /></View>;

  return (
    <RootComponent style={styles.container}>
      
      {/* --- BLUE HEADER WITH PODIUM --- */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        
        <View style={styles.podiumContainer}>
          {/* Rank 2 (Left) */}
          <View style={{ marginTop: 20 }}>
            {renderPodiumUser(topThree[1], 70, 1, 2)}
          </View>

          {/* Rank 1 (Center) */}
          <View style={{ marginBottom: 20 }}>
            {renderPodiumUser(topThree[0], 90, 2, 1)}
          </View>

          {/* Rank 3 (Right) */}
          <View style={{ marginTop: 20 }}>
            {renderPodiumUser(topThree[2], 70, 1, 3)}
          </View>
        </View>
      </View>

      {/* --- WHITE LIST FOR EVERYONE ELSE --- */}
      <View style={styles.listWrapper}>
        <FlatList
          data={restOfList}
          renderItem={renderListItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.emptyText}>No more agents yet.</Text>}
        />
      </View>

    </RootComponent>
  );
};

// ... Styles stay the same ...
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f6bba' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f6bba' },
  header: { alignItems: 'center', paddingTop: 20, paddingBottom: 30 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: 'white', marginBottom: 20 },
  podiumContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 15 },
  podiumItem: { alignItems: 'center', width: 80 },
  crownContainer: { marginBottom: -10, zIndex: 10 },
  podiumAvatar: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 50, borderWidth: 3, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  rankBadge: { position: 'absolute', bottom: -5, width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'white' },
  rankBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  podiumName: { color: 'white', fontWeight: '700', fontSize: 14, marginBottom: 2 },
  podiumPoints: { color: 'rgba(255,255,255,0.8)', fontWeight: '600', fontSize: 12 },
  listWrapper: { flex: 1, backgroundColor: '#f8fafc', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingTop: 20 },
  listContent: { paddingHorizontal: 20, paddingBottom: 20, maxWidth: 600, alignSelf: 'center', width: '100%' },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 16, paddingVertical: 15, paddingHorizontal: 20, marginBottom: 10, elevation: 2 },
  myRow: { borderWidth: 2, borderColor: '#3b82f6', backgroundColor: '#eff6ff' },
  rankContainer: { width: 30, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  rankText: { fontSize: 16, fontWeight: '700', color: '#64748b' },
  userContainer: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  listAvatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  userName: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  myText: { color: '#0f6bba' },
  pointsText: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 20 }
});

export default RankScreen;