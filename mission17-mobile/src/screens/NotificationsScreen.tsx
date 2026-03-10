import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Platform, ActivityIndicator
} from 'react-native';
import { ChevronLeft, Bell, CheckCircle, Info, AlertTriangle, Trash2 } from 'lucide-react-native';
import { GlobalState, endpoints } from '../config/api';
import { getAuthData } from '../utils/storage';

export default function NotificationsScreen({ navigation, route }: any) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const userId = route.params?.userId || GlobalState.userId;
  const RootComponent = (Platform.OS === 'web' ? View : SafeAreaView) as React.ElementType;

  useEffect(() => {
    fetchNotifications();
  }, [userId]);

  const fetchNotifications = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      const auth = await getAuthData();
      const token = auth?.token;
      const res = await fetch(endpoints.auth.getNotifications(userId), {
        headers: { 'auth-token': token || '' }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notifId: string) => {
    // Optimistic UI update
    setNotifications(prev => prev.map(n => n._id === notifId ? { ...n, read: true } : n));
    try {
      const auth = await getAuthData();
      const token = auth?.token;
      await fetch(endpoints.auth.markNotificationRead(notifId), {
        method: 'PUT',
        headers: { 'auth-token': token || '' }
      });
    } catch (error) {
      console.error('Failed to mark read:', error);
    }
  };

  const handleClearAll = () => {
    // Note: If you want to delete them from backend, you'd add a DELETE endpoint.
    // For now we just clear the list from UI.
    setNotifications([]);
  };

  const renderItem = ({ item }: any) => {
    let Icon = Info;
    let color = '#3b82f6';
    let bgColor = '#eff6ff';

    if (item.type === 'success') { Icon = CheckCircle; color = '#22c55e'; bgColor = '#f0fdf4'; }
    if (item.type === 'error' || item.type === 'alert') { Icon = AlertTriangle; color = '#ef4444'; bgColor = '#fee2e2'; }

    // Format time roughly
    const dateObj = new Date(item.createdAt);
    const timeStr = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

    return (
      <TouchableOpacity 
        style={[styles.card, !item.read && styles.unreadCard]}
        onPress={() => { if (!item.read) handleMarkAsRead(item._id); }}
      >
        <View style={[styles.iconBox, { backgroundColor: bgColor }]}>
          <Icon size={20} color={color} />
        </View>
        <View style={styles.content}>
          <View style={styles.row}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.time}>{timeStr}</Text>
          </View>
          <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
        </View>
        {!item.read && <View style={styles.dot} />}
      </TouchableOpacity>
    );
  };

  return (
    <RootComponent style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={handleClearAll} disabled={notifications.length === 0}>
          <Trash2 size={20} color={notifications.length === 0 ? '#cbd5e1' : '#ef4444'} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item._id || Math.random().toString()}
          renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Bell size={40} color="#cbd5e1" />
            <Text style={styles.emptyText}>No new notifications</Text>
          </View>
        }
      />
      )}
    </RootComponent>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#f1f5f9' 
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  backBtn: { padding: 8, borderRadius: 20, backgroundColor: '#f1f5f9' },
  
  list: { padding: 20 },
  card: { 
    flexDirection: 'row', backgroundColor: 'white', padding: 16, borderRadius: 16, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 2, alignItems: 'center'
  },
  unreadCard: { borderLeftWidth: 4, borderLeftColor: '#3b82f6' },
  
  iconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  content: { flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  title: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  time: { fontSize: 11, color: '#94a3b8' },
  message: { fontSize: 13, color: '#64748b', lineHeight: 18 },
  
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3b82f6', marginLeft: 8 },
  
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#94a3b8', marginTop: 10, fontWeight: '500' }
});