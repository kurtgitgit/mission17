import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ArrowLeft, Lightbulb, MessageSquare } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { endpoints, getAuthHeaders, GlobalState } from '../config/api';
import { fetchWithTimeout, getFriendlyNetworkMessage } from '../utils/network';

type Feedback = { _id: string; username: string; title: string; category?: string; description: string; sentiment?: string; status?: string; isAnonymous?: boolean; createdAt?: string };

const statusStyle = (status?: string) => status === 'Resolved' ? styles.resolved : status === 'Under Review' ? styles.review : status === 'Dismissed' ? styles.dismissed : styles.new;

const CaptainFeedbackScreen = () => {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (GlobalState.role !== 'super_admin') { setError('This screen is reserved for the Barangay Captain.'); setLoading(false); return; }
    try {
      setError(null);
      const response = await fetchWithTimeout(`${endpoints.auth.backendBaseUrl}/api/suggestions`, { headers: await getAuthHeaders() });
      if (!response.ok) throw new Error(`Feedback request failed (${response.status})`);
      const payload = await response.json();
      setItems(Array.isArray(payload) ? payload : []);
    } catch (cause) {
      setError(getFriendlyNetworkMessage(cause, 'Resident feedback is unavailable right now. Pull down to retry.'));
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);
  if (loading) return <SafeAreaView style={styles.center}><ActivityIndicator size="large" color="#0038A8" /></SafeAreaView>;
  if (error) return <SafeAreaView style={styles.center}><Text style={styles.error}>{error}</Text><TouchableOpacity onPress={() => { setLoading(true); void load(); }} style={styles.retry}><Text style={styles.retryText}>Retry</Text></TouchableOpacity></SafeAreaView>;

  return <SafeAreaView style={styles.safe}>
    <View style={styles.header}><TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Back"><ArrowLeft color="#fff" size={24} /></TouchableOpacity><View style={{ flex: 1 }}><Text style={styles.headerTitle}>Resident Feedback</Text><Text style={styles.headerSub}>Private community concerns</Text></View><MessageSquare color="#fff" size={25} /></View>
    <FlatList data={items} keyExtractor={(item) => item._id} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor="#0038A8" />} ListHeaderComponent={<View style={styles.notice}><Text style={styles.noticeTitle}>{items.length} feedback item{items.length === 1 ? '' : 's'}</Text><Text style={styles.noticeText}>Feedback is confidential. Anonymous residents remain anonymous.</Text></View>} ListEmptyComponent={<View style={styles.empty}><Lightbulb size={36} color="#94a3b8" /><Text style={styles.emptyTitle}>No feedback yet</Text><Text style={styles.emptyText}>New resident feedback will appear here.</Text></View>} renderItem={({ item }) => <View style={styles.card}><View style={styles.cardTop}><View style={{ flex: 1 }}><Text style={styles.title}>{item.title}</Text><Text style={styles.meta}>{item.isAnonymous ? 'Anonymous Resident' : item.username || 'Resident'} · {item.category || 'General'}</Text></View><Text style={[styles.badge, statusStyle(item.status)]}>{item.status || 'New'}</Text></View><Text style={styles.description}>{item.description}</Text><View style={styles.footer}><Text style={styles.sentiment}>{item.sentiment || 'Unclassified'}</Text><Text style={styles.date}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}</Text></View></View>} />
  </SafeAreaView>;
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' }, center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#f8fafc' }, error: { color: '#b91c1c', textAlign: 'center' }, retry: { marginTop: 14, backgroundColor: '#0038A8', padding: 11, borderRadius: 8 }, retryText: { color: '#fff', fontWeight: '800' }, header: { backgroundColor: '#0038A8', padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }, headerTitle: { color: '#fff', fontSize: 18, fontWeight: '900' }, headerSub: { color: '#bfdbfe', fontSize: 12, marginTop: 2 }, content: { padding: 16, paddingBottom: 36, flexGrow: 1 }, notice: { backgroundColor: '#dbeafe', padding: 14, borderRadius: 14, marginBottom: 14 }, noticeTitle: { color: '#0038A8', fontWeight: '900' }, noticeText: { color: '#475569', fontSize: 12, marginTop: 4, lineHeight: 17 }, card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, padding: 14, marginBottom: 10 }, cardTop: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' }, title: { color: '#0f172a', fontSize: 15, fontWeight: '900' }, meta: { color: '#64748b', fontSize: 12, marginTop: 4 }, badge: { fontSize: 10, fontWeight: '900', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999, overflow: 'hidden' }, new: { color: '#0369a1', backgroundColor: '#e0f2fe' }, review: { color: '#b45309', backgroundColor: '#fef3c7' }, resolved: { color: '#15803d', backgroundColor: '#dcfce7' }, dismissed: { color: '#475569', backgroundColor: '#f1f5f9' }, description: { color: '#334155', fontSize: 13, lineHeight: 19, marginTop: 12 }, footer: { borderTopWidth: 1, borderTopColor: '#f1f5f9', marginTop: 12, paddingTop: 9, flexDirection: 'row', justifyContent: 'space-between' }, sentiment: { color: '#64748b', fontSize: 11, fontWeight: '700' }, date: { color: '#94a3b8', fontSize: 11 }, empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 90 }, emptyTitle: { color: '#334155', fontWeight: '900', marginTop: 12 }, emptyText: { color: '#64748b', fontSize: 12, marginTop: 4 },
});

export default CaptainFeedbackScreen;
