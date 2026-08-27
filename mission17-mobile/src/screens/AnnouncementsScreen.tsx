import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Platform, SafeAreaView, ActivityIndicator, StatusBar,
  RefreshControl, Image, Dimensions
} from 'react-native';
import { Megaphone, Pin, Calendar, Building, Globe, ChevronRight } from 'lucide-react-native';
import { endpoints } from '../config/api';
import { useTheme } from '../context/ThemeContext';
import { sharedStyles } from '../config/theme';

const { width: SCREEN_W } = Dimensions.get('window');

const CAT_LABELS: Record<string, string> = {
  general: 'General',
  health: 'Health & Wellness',
  safety: 'Public Safety',
  environment: 'Environment',
  events: 'Community Events',
  services: 'Public Services',
};

const CAT_COLORS: Record<string, string> = {
  general: '#0F2942',
  health: '#0891B2',
  safety: '#DC2626',
  environment: '#16A34A',
  events: '#7C3AED',
  services: '#B45309',
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

const PostCard = React.memo(({ item }: { item: any }) => {
  const [expanded, setExpanded] = useState(false);
  const catColor = CAT_COLORS[item.category] || '#0F2942';
  const catLabel = CAT_LABELS[item.category] || 'General';

  const bodyPreview = item.body?.length > 180 && !expanded
    ? item.body.slice(0, 180) + '…'
    : item.body;

  return (
    <View style={styles.postCard}>
      {/* HEADER */}
      <View style={styles.postHeader}>
        <View style={styles.avatarCircle}>
          <Building size={18} color="#0F2942" />
        </View>
        <View style={styles.pageInfo}>
          <Text style={styles.pageName}>Barangay Bagong Pag-asa</Text>
          <View style={styles.pageMetaRow}>
            <Text style={styles.postTime}>{timeAgo(item.createdAt)}</Text>
            <Text style={styles.dotSep}> · </Text>
            <Text style={styles.postGlobe}>Official Bulletin</Text>
          </View>
        </View>
        {item.isPinned && (
          <View style={styles.pinnedBadge}>
            <Pin size={11} color="#B45309" />
            <Text style={styles.pinnedText}>PINNED</Text>
          </View>
        )}
      </View>

      {/* CATEGORY PILL */}
      <View style={styles.catTagRow}>
        <View style={[styles.catTag, { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' }]}>
          <View style={[styles.catDot, { backgroundColor: catColor }]} />
          <Text style={[styles.catTagText, { color: '#334155' }]}>{catLabel}</Text>
        </View>
      </View>

      {/* BODY */}
      <Text style={styles.postTitle}>{item.title}</Text>
      <Text style={styles.postBody}>{bodyPreview}</Text>
      {item.body?.length > 180 && (
        <TouchableOpacity onPress={() => setExpanded(!expanded)} style={styles.seeMoreBtn}>
          <Text style={styles.seeMoreText}>{expanded ? 'Show less' : 'Read full announcement →'}</Text>
        </TouchableOpacity>
      )}

      {/* IMAGE (IF PRESENT) */}
      {item.image ? (
        <Image
          source={{ uri: item.image }}
          style={styles.postImage}
          resizeMode="cover"
        />
      ) : null}

      <View style={styles.cardFooter}>
        <Text style={styles.footerDate}>
          📅 {new Date(item.createdAt).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
        </Text>
      </View>
    </View>
  );
});

const AnnouncementsScreen: React.FC = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterCat, setFilterCat] = useState('all');

  const RootComponent = (Platform.OS === 'web' ? View : SafeAreaView) as React.ElementType;

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await fetch(endpoints.announcements);
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const categories = ['all', 'general', 'health', 'safety', 'environment', 'events', 'services'];
  const filtered = filterCat === 'all'
    ? announcements
    : announcements.filter(a => a.category === filterCat);

  return (
    <RootComponent style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0038A8" />

      {/* HEADER */}
      <View style={sharedStyles.header}>
        <Text style={sharedStyles.headerTitle}>Barangay Bulletins & News</Text>
      </View>

      {/* CATEGORY FILTER STRIP */}
      <View style={styles.filterStrip}>
        <FlatList
          horizontal
          data={categories}
          keyExtractor={c => c}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 14, gap: 8 }}
          renderItem={({ item: cat }) => (
            <TouchableOpacity
              style={[styles.filterChip, filterCat === cat && styles.filterChipActive]}
              onPress={() => setFilterCat(cat)}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${cat === 'all' ? 'All' : CAT_LABELS[cat]}`}
            >
              <Text style={[styles.filterText, filterCat === cat && styles.filterTextActive]}>
                {cat === 'all' ? 'All Bulletins' : CAT_LABELS[cat]}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* FEED */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#0038A8" />
          <Text style={styles.loadingText}>Fetching official bulletins...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item._id || Math.random().toString()}
          renderItem={({ item }) => <PostCard item={item} />}
          contentContainerStyle={styles.feed}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0038A8" />}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Megaphone size={36} color="#0038A8" />
              </View>
              <Text style={styles.emptyTitle}>No Bulletins Posted</Text>
              <Text style={styles.emptyText}>There are no announcements in this category right now. Check back soon!</Text>
            </View>
          }
        />
      )}
    </RootComponent>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },

  filterStrip: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#0038A8',
    borderColor: '#0038A8',
  },
  filterText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  feed: { padding: 14, paddingBottom: 60 },

  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  pageInfo: { flex: 1 },
  pageName: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  pageMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 1 },
  postTime: { fontSize: 11.5, color: '#64748B' },
  dotSep: { fontSize: 11.5, color: '#94A3B8' },
  postGlobe: { fontSize: 11.5, color: '#64748B', fontWeight: '500' },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pinnedText: { fontSize: 9.5, fontWeight: '800', color: '#B45309', letterSpacing: 0.5 },

  catTagRow: { marginBottom: 8 },
  catTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  catDot: { width: 6, height: 6, borderRadius: 3 },
  catTagText: { fontSize: 11, fontWeight: '700' },

  postTitle: { fontSize: 15.5, fontWeight: '800', color: '#0F172A', marginBottom: 4, lineHeight: 21 },
  postBody: { fontSize: 13.5, color: '#475569', lineHeight: 20, marginBottom: 8 },
  seeMoreBtn: { marginBottom: 8 },
  seeMoreText: { fontSize: 12.5, color: '#1D4ED8', fontWeight: '700' },

  postImage: { width: '100%', height: 180, borderRadius: 12, marginBottom: 10, backgroundColor: '#F1F5F9' },

  cardFooter: { borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 8, marginTop: 4 },
  footerDate: { fontSize: 11.5, color: '#94A3B8' },

  centerLoading: { alignItems: 'center', marginTop: 60 },
  loadingText: { fontSize: 13.5, color: '#64748B', marginTop: 12, fontWeight: '600' },

  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 30 },
  emptyIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#BFDBFE' },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  emptyText: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 19 },
});

export default AnnouncementsScreen;
