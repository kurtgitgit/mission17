import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Platform, ActivityIndicator,
  RefreshControl, StatusBar
} from 'react-native';
import { ArrowLeft, Bell, CheckCircle, Info, AlertTriangle, Trash2, CheckCheck } from 'lucide-react-native';
import { GlobalState, endpoints } from '../config/api';
import { getAuthData } from '../utils/storage';
import { sharedStyles } from '../config/theme';

export default function NotificationsScreen({ navigation, route }: any) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const userId = route.params?.userId || GlobalState.userId;
  const RootComponent = (Platform.OS === 'web' ? View : SafeAreaView) as React.ElementType;

  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setRefreshing(false);
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
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

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

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    // Silently mark each on server
    try {
      const auth = await getAuthData();
      const token = auth?.token;
      const unread = notifications.filter(n => !n.read);
      await Promise.all(
        unread.map(n => 
          fetch(endpoints.auth.markNotificationRead(n._id), {
            method: 'PUT',
            headers: { 'auth-token': token || '' }
          })
        )
      );
    } catch (e) {
      console.error('Failed to mark all read:', e);
    }
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const renderItem = ({ item }: any) => {
    let Icon = Info;
    let color = '#0038A8';
    let bgColor = '#eff6ff';
    let borderColor = '#bfdbfe';

    if (item.type === 'success') { 
      Icon = CheckCircle; 
      color = '#15803d'; 
      bgColor = '#dcfce7'; 
      borderColor = '#86efac';
    }
    if (item.type === 'error' || item.type === 'alert') { 
      Icon = AlertTriangle; 
      color = '#991b1b'; 
      bgColor = '#fee2e2'; 
      borderColor = '#fca5a5';
    }

    const dateObj = new Date(item.createdAt);
    const timeStr = dateObj.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) + ' • ' + 
                    dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <TouchableOpacity 
        style={[styles.card, !item.read && styles.unreadCard]}
        onPress={() => { if (!item.read) handleMarkAsRead(item._id); }}
        accessibilityRole="button"
        accessibilityLabel={`${item.read ? 'Read' : 'Unread'} notification: ${item.title}`}
      >
        <View style={[styles.iconBox, { backgroundColor: bgColor, borderColor: borderColor }]}>
          <Icon size={20} color={color} />
        </View>
        <View style={styles.content}>
          <View style={styles.row}>
            <Text style={[styles.title, !item.read && styles.unreadTitle]}>{item.title}</Text>
            <Text style={styles.time}>{timeStr}</Text>
          </View>
          <Text style={styles.message}>{item.message}</Text>
        </View>
        {!item.read ? <View style={styles.dot} /> : null}
      </TouchableOpacity>
    );
  };

  return (
    <RootComponent style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0038A8" />

      {/* HEADER */}
      <View style={sharedStyles.header}>
        <TouchableOpacity 
          style={sharedStyles.backBtn} 
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back to dashboard"
        >
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={sharedStyles.headerTitle}>Barangay Alerts</Text>
        <View style={styles.headerRight}>
          {unreadCount > 0 ? (
            <TouchableOpacity 
              style={styles.headerBtn} 
              onPress={handleMarkAllRead}
              accessibilityRole="button"
              accessibilityLabel="Mark all notifications as read"
            >
              <CheckCheck size={20} color="white" />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity 
            style={styles.headerBtn} 
            onPress={handleClearAll}
            disabled={notifications.length === 0}
            accessibilityRole="button"
            accessibilityLabel="Clear notifications list"
          >
            <Trash2 size={19} color={notifications.length === 0 ? 'rgba(255,255,255,0.4)' : 'white'} />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#0038A8" />
          <Text style={styles.loadingText}>Fetching your notifications...</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item._id || Math.random().toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifications(); }} tintColor="#0038A8" />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Bell size={40} color="#0038A8" />
              </View>
              <Text style={styles.emptyTitle}>All Caught Up!</Text>
              <Text style={styles.emptyText}>You have no new alerts or notifications at this time.</Text>
            </View>
          }
        />
      )}
    </RootComponent>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerBtn: { padding: 4 },
  
  list: { padding: 14, paddingBottom: 40 },
  card: { 
    flexDirection: 'row', 
    backgroundColor: '#ffffff', 
    padding: 14, 
    borderRadius: 16, 
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, 
    shadowRadius: 4, 
    elevation: 2, 
    alignItems: 'center' 
  },
  unreadCard: { 
    borderLeftWidth: 4, 
    borderLeftColor: '#0038A8',
    backgroundColor: '#ffffff',
    borderColor: '#bfdbfe',
  },
  
  iconBox: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 12,
    borderWidth: 1,
  },
  content: { flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 14.5, fontWeight: '700', color: '#1e293b' },
  unreadTitle: { fontWeight: '800', color: '#0f172a' },
  time: { fontSize: 11, color: '#64748b', fontWeight: '500' },
  message: { fontSize: 13, color: '#475569', lineHeight: 18 },
  
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#0038A8', marginLeft: 8 },
  
  centerLoading: { alignItems: 'center', marginTop: 50 },
  loadingText: { fontSize: 13.5, color: '#64748b', marginTop: 12, fontWeight: '600' },

  emptyState: { alignItems: 'center', marginTop: 80, paddingHorizontal: 30 },
  emptyIconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginBottom: 14, borderWidth: 1.5, borderColor: '#bfdbfe' },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
  emptyText: { color: '#64748b', textAlign: 'center', fontSize: 13, lineHeight: 19 },
});

