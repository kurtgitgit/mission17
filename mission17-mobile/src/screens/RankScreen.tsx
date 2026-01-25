import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  Platform, 
  ViewStyle, 
  SafeAreaView,
  TextStyle,
  ImageStyle
} from 'react-native';
import { User, Crown } from 'lucide-react-native';

// --- MOCK DATA ---
const LEADERBOARD_DATA = [
  { id: '1', name: 'Sarah', points: 1250, rank: 1, color: '#fbbf24' }, // Gold
  { id: '2', name: 'Mike', points: 1100, rank: 2, color: '#94a3b8' }, // Silver
  { id: '3', name: 'Jessica', points: 980, rank: 3, color: '#b45309' }, // Bronze
  { id: '4', name: 'David Kim', points: 850, rank: 4, color: '#cbd5e1' },
  { id: '5', name: 'Emily Chen', points: 720, rank: 5, color: '#cbd5e1' },
  { id: '6', name: 'Tom Holland', points: 690, rank: 6, color: '#cbd5e1' },
  { id: '7', name: 'Kurt Perez', points: 650, rank: 7, color: '#3b82f6', isMe: true },
  { id: '8', name: 'Anna Smith', points: 600, rank: 8, color: '#cbd5e1' },
  { id: '9', name: 'John Doe', points: 540, rank: 9, color: '#cbd5e1' },
];

const RankScreen = () => {
  const RootComponent = (Platform.OS === 'web' ? View : SafeAreaView) as React.ElementType;

  // 1. Split Data: Top 3 vs. The Rest
  const topThree = LEADERBOARD_DATA.slice(0, 3);
  const restOfList = LEADERBOARD_DATA.slice(3);

  // Helper to render a Podium User (Rank 1, 2, or 3)
  const renderPodiumUser = (item: typeof LEADERBOARD_DATA[0], size: number, zIndex: number) => {
    // Determine colors
    let borderColor = '#fbbf24'; // Gold
    if (item.rank === 2) borderColor = '#e2e8f0'; // Silver-ish/White
    if (item.rank === 3) borderColor = '#b45309'; // Bronze

    return (
      <View style={[styles.podiumItem, { zIndex }]}>
        {/* Crown for #1 */}
        {item.rank === 1 && (
          <View style={styles.crownContainer}>
            <Crown size={24} color="#fbbf24" fill="#fbbf24" />
          </View>
        )}
        
        {/* Avatar Circle */}
        <View style={[styles.podiumAvatar, { width: size, height: size, borderColor }]}>
          <User size={size * 0.5} color="white" />
          <View style={[styles.rankBadge, { backgroundColor: borderColor }]}>
            <Text style={styles.rankBadgeText}>{item.rank}</Text>
          </View>
        </View>

        {/* Name & Points */}
        <Text style={styles.podiumName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.podiumPoints}>{item.points}</Text>
      </View>
    );
  };

  // Helper for List Items (Rank 4+)
  const renderListItem = ({ item }: { item: typeof LEADERBOARD_DATA[0] }) => (
    <View style={[styles.row, item.isMe && styles.myRow]}>
      <View style={styles.rankContainer}>
        <Text style={styles.rankText}>{item.rank}</Text>
      </View>
      <View style={styles.userContainer}>
        <View style={[styles.listAvatar, { backgroundColor: item.isMe ? '#3b82f6' : '#e2e8f0' }]}>
          <User size={20} color={item.isMe ? 'white' : '#64748b'} />
        </View>
        <Text style={[styles.userName, item.isMe && styles.myText]}>
          {item.name} {item.isMe && '(You)'}
        </Text>
      </View>
      <Text style={[styles.pointsText, item.isMe && styles.myText]}>{item.points}</Text>
    </View>
  );

  return (
    <RootComponent style={styles.container}>
      
      {/* --- BLUE HEADER WITH PODIUM --- */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        
        {/* THE PODIUM VIEW */}
        <View style={styles.podiumContainer}>
          {/* Rank 2 (Left) */}
          <View style={{ marginTop: 20 }}>
            {renderPodiumUser(topThree[1], 70, 1)}
          </View>

          {/* Rank 1 (Center, Higher up) */}
          <View style={{ marginBottom: 20 }}>
            {renderPodiumUser(topThree[0], 90, 2)}
          </View>

          {/* Rank 3 (Right) */}
          <View style={{ marginTop: 20 }}>
            {renderPodiumUser(topThree[2], 70, 1)}
          </View>
        </View>
      </View>

      {/* --- WHITE LIST FOR EVERYONE ELSE --- */}
      <View style={styles.listWrapper}>
        <FlatList
          data={restOfList}
          renderItem={renderListItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>

    </RootComponent>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f6bba', // Blue background for header
  } as ViewStyle,

  // HEADER
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 30, // Space for the bottom of the podium
  } as ViewStyle,
  headerTitle: {
    fontSize: 22, fontWeight: '800', color: 'white', marginBottom: 20,
  } as TextStyle,

  // PODIUM
  podiumContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end', // Aligns them so 1 stands taller
    justifyContent: 'center',
    gap: 15,
  } as ViewStyle,
  podiumItem: {
    alignItems: 'center',
  } as ViewStyle,
  crownContainer: {
    marginBottom: -10, // Pull crown closer to head
    zIndex: 10,
  } as ViewStyle,
  podiumAvatar: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 50,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  } as ViewStyle,
  rankBadge: {
    position: 'absolute',
    bottom: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'white',
  } as ViewStyle,
  rankBadgeText: {
    color: 'white', fontSize: 10, fontWeight: 'bold',
  } as TextStyle,
  podiumName: {
    color: 'white', fontWeight: '700', fontSize: 14, marginBottom: 2,
  } as TextStyle,
  podiumPoints: {
    color: 'rgba(255,255,255,0.8)', fontWeight: '600', fontSize: 12,
  } as TextStyle,

  // LIST SECTION
  listWrapper: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
  } as ViewStyle,
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  } as ViewStyle,

  // LIST ROW
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  } as ViewStyle,
  myRow: {
    borderWidth: 2, borderColor: '#3b82f6', backgroundColor: '#eff6ff',
  } as ViewStyle,
  rankContainer: {
    width: 30, alignItems: 'center', justifyContent: 'center', marginRight: 10,
  } as ViewStyle,
  rankText: {
    fontSize: 16, fontWeight: '700', color: '#64748b',
  } as TextStyle,
  userContainer: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
  } as ViewStyle,
  listAvatar: {
    width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12,
  } as ViewStyle,
  userName: {
    fontSize: 15, fontWeight: '700', color: '#1e293b',
  } as TextStyle,
  myText: {
    color: '#0f6bba',
  } as TextStyle,
  pointsText: {
    fontSize: 16, fontWeight: '800', color: '#0f172a',
  } as TextStyle,
});

export default RankScreen;