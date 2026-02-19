import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, SafeAreaView } from 'react-native';
import { ChevronLeft, ShieldCheck, Clock, User, Globe } from 'lucide-react-native';
import { endpoints, GlobalState } from '../config/api';
import { getAuthData } from '../utils/storage';

export default function AuditLogScreen({ navigation }: any) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const data = await getAuthData();
      const response = await fetch(`${endpoints.auth.baseUrl}/audit-logs`, {
        headers: { 'Authorization': `Bearer ${data?.token}` },
      });
      const result = await response.json();
      if (response.ok) setLogs(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderLogItem = ({ item }: any) => (
    <View style={styles.logCard}>
      <View style={styles.logHeader}>
        <View style={[styles.badge, { backgroundColor: getActionColor(item.action) }]}>
          <Text style={styles.badgeText}>{item.action}</Text>
        </View>
        <Text style={styles.timeText}>
          <Clock size={12} color="#94a3b8" /> {new Date(item.timestamp).toLocaleTimeString()}
        </Text>
      </View>
      
      <Text style={styles.detailsText}>{item.details}</Text>
      
      <View style={styles.footer}>
        <Text style={styles.footerItem}><User size={12} color="#64748b" /> {item.username}</Text>
        <Text style={styles.footerItem}><Globe size={12} color="#64748b" /> {item.ipAddress}</Text>
      </View>
    </View>
  );

  const getActionColor = (action: string) => {
    if (action.includes('FAILED') || action.includes('DENIED')) return '#ef4444';
    if (action.includes('ADMIN')) return '#8b5cf6';
    if (action.includes('SUCCESS') || action.includes('APPROVE')) return '#10b981';
    return '#3b82f6';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>System Audit Logs</Text>
        <TouchableOpacity onPress={fetchLogs}><ShieldCheck size={24} color="#3b82f6" /></TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item: any) => item._id}
          renderItem={renderLogItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No logs found.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: 'white' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  backBtn: { padding: 8, borderRadius: 20, backgroundColor: '#f1f5f9' },
  list: { padding: 20 },
  logCard: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  timeText: { fontSize: 12, color: '#94a3b8' },
  detailsText: { fontSize: 14, color: '#1e293b', marginBottom: 12, fontWeight: '500' },
  footer: { flexDirection: 'row', gap: 15, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10 },
  footerItem: { fontSize: 11, color: '#64748b' },
  empty: { textAlign: 'center', marginTop: 50, color: '#64748b' }
});