import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Platform, SafeAreaView, ActivityIndicator, StatusBar,
  RefreshControl, Image, Dimensions, Alert
} from 'react-native';
import { Megaphone, ThumbsUp, MessageCircle, Share2, Heart, Smile, Pin } from 'lucide-react-native';
import { endpoints } from '../config/api';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Category → Unsplash image ───────────────────────────────────────────────
const CAT_IMAGES: Record<string, string> = {
  general:     'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=900&q=80',
  health:      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=900&q=80',
  safety:      'https://images.unsplash.com/photo-1593240637049-8e26750afa8a?w=900&q=80',
  environment: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=900&q=80',
  events:      'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=900&q=80',
  services:    'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=900&q=80',
};

const CAT_COLORS: Record<string, string> = {
  general: '#0038A8', health: '#0891b2', safety: '#dc2626',
  environment: '#15803d', events: '#7c3aed', services: '#b45309',
};
const CAT_LABELS: Record<string, string> = {
  general: 'General', health: 'Health', safety: 'Safety & Security',
  environment: 'Environment', events: 'Events', services: 'Services',
};

// Randomized reaction counts seeded from announcement id
const fakeStats = (id: string) => {
  const seed = parseInt(id?.slice(-4) || '1234', 16) % 400;
  return { likes: 30 + seed, comments: 3 + (seed % 22), shares: 1 + (seed % 12) };
};

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  if (days  > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins  > 0) return `${mins}m ago`;
  return 'Just now';
};

// ─── POST CARD ────────────────────────────────────────────────────────────────
const PostCard: React.FC<{ item: any }> = ({ item }) => {
  const [liked,    setLiked]    = useState(false);
  const [expanded, setExpanded] = useState(false);

  const catColor = CAT_COLORS[item.category] || CAT_COLORS.general;
  const catLabel = CAT_LABELS[item.category] || 'General';
  const imgSrc   = item.image || CAT_IMAGES[item.category] || CAT_IMAGES.general;
  const stats    = fakeStats(item._id);
  const totalLikes = stats.likes + (liked ? 1 : 0);

  const bodyPreview = item.body?.length > 160 && !expanded
    ? item.body.slice(0, 160) + '…'
    : item.body;

  return (
    <View style={styles.postCard}>
      {/* ── HEADER (Page info) ── */}
      <View style={styles.postHeader}>
        <View style={[styles.pageAvatar, { backgroundColor: catColor }]}>
          <Text style={styles.pageAvatarEmoji}>🏛️</Text>
        </View>
        <View style={styles.pageInfo}>
          <Text style={styles.pageName}>Barangay Pantal Official</Text>
          <View style={styles.pageMetaRow}>
            <Text style={styles.postTime}>{timeAgo(item.createdAt)}</Text>
            <Text style={styles.dotSep}> · </Text>
            <Text style={styles.postGlobe}>🌐 Public</Text>
          </View>
        </View>
        {item.isPinned && (
          <View style={styles.pinnedBadge}>
            <Pin size={11} color="#b45309" />
            <Text style={styles.pinnedText}>Pinned</Text>
          </View>
        )}
      </View>

      {/* ── CATEGORY TAG ── */}
      <View style={[styles.catTag, { backgroundColor: catColor + '15' }]}>
        <View style={[styles.catDot, { backgroundColor: catColor }]} />
        <Text style={[styles.catTagText, { color: catColor }]}>{catLabel}</Text>
      </View>

      {/* ── BODY TEXT ── */}
      <Text style={styles.postTitle}>{item.title}</Text>
      <Text style={styles.postBody}>{bodyPreview}</Text>
      {item.body?.length > 160 && (
        <TouchableOpacity onPress={() => setExpanded(!expanded)}>
          <Text style={styles.seeMore}>{expanded ? 'See less' : 'See more'}</Text>
        </TouchableOpacity>
      )}

      {/* ── COVER IMAGE ── */}
      <Image
        source={{ uri: imgSrc }}
        style={styles.postImage}
        resizeMode="cover"
      />

      {/* ── REACTIONS SUMMARY ── */}
      <View style={styles.reactionSummary}>
        <View style={styles.reactionEmojis}>
          <Text style={styles.reactionEmoji}>👍</Text>
          <Text style={styles.reactionEmoji}>❤️</Text>
          <Text style={styles.reactionEmoji}>😮</Text>
        </View>
        <Text style={styles.reactionCount}>{totalLikes.toLocaleString()}</Text>
        <Text style={styles.reactionRight}>{stats.comments} comments · {stats.shares} shares</Text>
      </View>

      {/* ── DIVIDER ── */}
      <View style={styles.actionDivider} />

      {/* ── ACTION BUTTONS ── */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => setLiked(!liked)}>
          <ThumbsUp
            size={18}
            color={liked ? '#0038A8' : '#65676b'}
            fill={liked ? '#0038A8' : 'none'}
          />
          <Text style={[styles.actionText, liked && { color: '#0038A8', fontWeight: '800' }]}>
            Like
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn}
          onPress={() => Alert.alert('Comments', 'Comments will be available in a future update.')}>
          <MessageCircle size={18} color="#65676b" />
          <Text style={styles.actionText}>Comment</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn}
          onPress={() => Alert.alert('Share', `Share "${item.title}" with others!`)}>
          <Share2 size={18} color="#65676b" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── SCREEN ───────────────────────────────────────────────────────────────────
const AnnouncementsScreen: React.FC = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterCat, setFilterCat]   = useState('all');

  const RootComponent = (Platform.OS === 'web' ? View : SafeAreaView) as React.ElementType;

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await fetch(endpoints.announcements);
      if (res.ok) setAnnouncements(await res.json());
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAnnouncements(); }, []);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchAnnouncements(); }, []);

  const categories = ['all', 'general', 'health', 'safety', 'environment', 'events', 'services'];
  const filtered = filterCat === 'all'
    ? announcements
    : announcements.filter(a => a.category === filterCat);

  return (
    <RootComponent style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0038A8" />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Megaphone size={22} color="white" />
          <Text style={styles.headerTitle}>Community Feed</Text>
        </View>
        <Text style={styles.headerSub}>Barangay Pantal Official Updates</Text>

        {/* ── FILTER CHIPS ── */}
        <FlatList
          horizontal
          data={categories}
          keyExtractor={c => c}
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -5, marginTop: 10 }}
          contentContainerStyle={{ paddingHorizontal: 5 }}
          renderItem={({ item: cat }) => (
            <TouchableOpacity
              style={[styles.filterChip, filterCat === cat && styles.filterChipActive]}
              onPress={() => setFilterCat(cat)}
            >
              <Text style={[styles.filterText, filterCat === cat && styles.filterTextActive]}>
                {cat === 'all' ? 'All' : CAT_LABELS[cat]}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* ── FEED ── */}
      {loading ? (
        <ActivityIndicator size="large" color="#0038A8" style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item._id}
          renderItem={({ item }) => <PostCard item={item} />}
          contentContainerStyle={styles.feed}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0038A8" />}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📢</Text>
              <Text style={styles.emptyTitle}>No posts yet</Text>
              <Text style={styles.emptyText}>Check back soon for updates from Barangay Pantal.</Text>
            </View>
          }
        />
      )}
    </RootComponent>
  );
};

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0f2f5' },

  // HEADER
  header: {
    backgroundColor: '#0038A8',
    paddingTop: Platform.OS === 'android' ? 44 : 18,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 2 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: 'white' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7, marginRight: 8,
    backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 20,
  },
  filterChipActive: { backgroundColor: 'white' },
  filterText: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '700' },
  filterTextActive: { color: '#0038A8' },

  // FEED
  feed: { paddingTop: 8, paddingBottom: 60 },

  // POST CARD
  postCard: {
    backgroundColor: 'white',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
      android: { elevation: 2 },
      default: {},
    }),
  },

  // POST HEADER
  postHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10 },
  pageAvatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  pageAvatarEmoji: { fontSize: 22 },
  pageInfo: { flex: 1 },
  pageName: { fontSize: 15, fontWeight: '800', color: '#050505' },
  pageMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 1 },
  postTime: { fontSize: 12, color: '#65676b' },
  dotSep: { fontSize: 12, color: '#65676b' },
  postGlobe: { fontSize: 12, color: '#65676b' },
  pinnedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  pinnedText: { fontSize: 10, fontWeight: '800', color: '#b45309' },

  // CAT TAG
  catTag: { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: 14, marginBottom: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
  catDot: { width: 6, height: 6, borderRadius: 3 },
  catTagText: { fontSize: 11, fontWeight: '800' },

  // POST CONTENT
  postTitle: { fontSize: 16, fontWeight: '800', color: '#050505', paddingHorizontal: 14, marginBottom: 6, lineHeight: 22 },
  postBody: { fontSize: 14, color: '#3c3c3c', paddingHorizontal: 14, lineHeight: 21, marginBottom: 6 },
  seeMore: { fontSize: 14, color: '#0038A8', fontWeight: '700', paddingHorizontal: 14, marginBottom: 10 },

  // IMAGE
  postImage: { width: SCREEN_W, height: SCREEN_W * 0.55 },

  // REACTIONS
  reactionSummary: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10 },
  reactionEmojis: { flexDirection: 'row', marginRight: 6 },
  reactionEmoji: { fontSize: 16, marginRight: -3 },
  reactionCount: { fontSize: 14, color: '#65676b', flex: 1, marginLeft: 6 },
  reactionRight: { fontSize: 13, color: '#65676b' },

  // ACTIONS
  actionDivider: { height: 1, backgroundColor: '#e4e6ea', marginHorizontal: 14 },
  actionRow: { flexDirection: 'row', paddingVertical: 4 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10 },
  actionText: { fontSize: 14, color: '#65676b', fontWeight: '600' },

  // EMPTY
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 52, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#475569', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#94a3b8', textAlign: 'center', lineHeight: 22 },
});

export default AnnouncementsScreen;
