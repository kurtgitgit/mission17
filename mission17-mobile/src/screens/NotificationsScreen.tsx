import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Platform, ActivityIndicator,
  RefreshControl, StatusBar, Modal
} from 'react-native';
import { ArrowLeft, Bell, CheckCircle, Info, AlertTriangle, Trash2, CheckCheck, X } from 'lucide-react-native';
import { GlobalState, endpoints, getAuthHeaders } from '../config/api';
import { sharedStyles } from '../config/theme';
import ScreenErrorState from '../components/ScreenErrorState';
import { fetchPrivateCollection, fetchWithTimeout, getFriendlyNetworkMessage } from '../utils/network';

export default function NotificationsScreen({ navigation, route }: any) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [confirmClearVisible, setConfirmClearVisible] = useState(false);
  const [clearError, setClearError] = useState('');
  
  const userId = route.params?.userId || GlobalState.userId;
  const RootComponent = (Platform.OS === 'web' ? View : SafeAreaView) as React.ElementType;

  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      setLoadError(null);
      const data = await fetchPrivateCollection<any>(
        endpoints.auth.getNotifications(userId),
        await getAuthHeaders(),
      );
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setLoadError(getFriendlyNetworkMessage(error, 'Your alerts are unavailable right now. Please try again.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (notifId: string) => {
    const previousNotifications = notifications;
    setNotifications(prev => prev.map(n => n._id === notifId ? { ...n, read: true } : n));
    try {
      const response = await fetchWithTimeout(endpoints.auth.markNotificationRead(notifId), {
        method: 'PUT',
        headers: await getAuthHeaders(),
      });
      if (!response.ok) throw new Error(`Notification update failed (${response.status})`);
    } catch (error) {
      console.error('Failed to mark read:', error);
      setNotifications(previousNotifications);
    }
  };

  const handleMarkAllRead = async () => {
    const previousNotifications = notifications;
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      const unread = notifications.filter(n => !n.read);
      const authHeaders = await getAuthHeaders();
      const responses = await Promise.all(
        unread.map(n => fetchWithTimeout(endpoints.auth.markNotificationRead(n._id), { method: 'PUT', headers: authHeaders }))
      );
      if (responses.some(response => !response.ok)) throw new Error('One or more notification updates failed.');
    } catch (e) {
      console.error('Failed to mark all read:', e);
      setNotifications(previousNotifications);
    }
  };

  const clearAllNotifications = async () => {
    if (!userId || clearing) return;
    setClearing(true);
    try {
      const response = await fetchWithTimeout(endpoints.auth.clearNotifications(userId), {
        method: 'DELETE',
        headers: await getAuthHeaders(),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || `Notification clearing failed (${response.status})`);
      setNotifications([]);
      setConfirmClearVisible(false);
      setClearError('');
    } catch (error) {
      console.error('Failed to clear notifications:', error);
      setClearError(getFriendlyNetworkMessage(error, 'Please try again.'));
    } finally {
      setClearing(false);
    }
  };

  const handleClearAll = () => {
    if (!notifications.length || clearing) return;
    setClearError('');
    setConfirmClearVisible(true);
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
    const timeStr = Number.isNaN(dateObj.getTime()) ? '' : `${dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' })} · ${dateObj.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;

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
            <Text numberOfLines={2} style={[styles.title, !item.read && styles.unreadTitle]}>{item.title}</Text>
          </View>
          <Text style={styles.message}>{item.message}</Text>
          {timeStr ? <Text style={styles.time}>{timeStr}</Text> : null}
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
            disabled={notifications.length === 0 || clearing}
            accessibilityRole="button"
            accessibilityLabel="Clear notifications list"
          >
            <Trash2 size={19} color={notifications.length === 0 || clearing ? 'rgba(255,255,255,0.4)' : 'white'} />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#0038A8" />
          <Text style={styles.loadingText}>Fetching your notifications...</Text>
        </View>
      ) : loadError ? (
        <ScreenErrorState title="Alerts are unavailable" message={loadError} onRetry={fetchNotifications} />
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

      <Modal
        visible={confirmClearVisible}
        transparent
        animationType="fade"
        onRequestClose={() => { if (!clearing) setConfirmClearVisible(false); }}
      >
        <View style={styles.dialogBackdrop}>
          <View style={styles.dialogCard} accessibilityRole="alert">
            <View style={styles.dialogHeader}>
              <View style={styles.dialogIcon}><Trash2 size={21} color="#b42318" /></View>
              <TouchableOpacity
                onPress={() => { if (!clearing) setConfirmClearVisible(false); }}
                disabled={clearing}
                style={styles.dialogClose}
                accessibilityRole="button"
                accessibilityLabel="Close clear alerts confirmation"
              >
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
            <Text style={styles.dialogTitle}>Clear all alerts?</Text>
            <Text style={styles.dialogMessage}>This removes your notification history. Your document requests, blotter reports, and account will not be affected.</Text>
            {clearError ? <Text style={styles.dialogError}>{clearError}</Text> : null}
            <View style={styles.dialogActions}>
              <TouchableOpacity disabled={clearing} onPress={() => setConfirmClearVisible(false)} style={styles.dialogCancel} accessibilityRole="button">
                <Text style={styles.dialogCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity disabled={clearing} onPress={() => void clearAllNotifications()} style={[styles.dialogConfirm, clearing && styles.dialogDisabled]} accessibilityRole="button">
                {clearing ? <ActivityIndicator size="small" color="#fff" /> : <Trash2 size={16} color="#fff" />}
                <Text style={styles.dialogConfirmText}>{clearing ? 'Clearing…' : 'Clear alerts'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  row: { marginBottom: 4 },
  title: { fontSize: 14.5, fontWeight: '700', color: '#1e293b', flexShrink: 1 },
  unreadTitle: { fontWeight: '800', color: '#0f172a' },
  time: { fontSize: 11, color: '#64748b', fontWeight: '500', marginTop: 8, alignSelf: 'flex-end' },
  message: { fontSize: 13, color: '#475569', lineHeight: 18 },
  
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#0038A8', marginLeft: 8 },
  
  centerLoading: { alignItems: 'center', marginTop: 50 },
  loadingText: { fontSize: 13.5, color: '#64748b', marginTop: 12, fontWeight: '600' },

  emptyState: { alignItems: 'center', marginTop: 80, paddingHorizontal: 30 },
  emptyIconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginBottom: 14, borderWidth: 1.5, borderColor: '#bfdbfe' },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
  emptyText: { color: '#64748b', textAlign: 'center', fontSize: 13, lineHeight: 19 },
  dialogBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: 'rgba(15, 23, 42, 0.58)' },
  dialogCard: { width: '100%', maxWidth: 440, backgroundColor: '#fff', borderRadius: 22, padding: 22, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#0f172a', shadowOpacity: 0.22, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 12 },
  dialogHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  dialogIcon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff1f0' },
  dialogClose: { padding: 6 },
  dialogTitle: { color: '#0f172a', fontSize: 21, lineHeight: 27, fontWeight: '900' },
  dialogMessage: { color: '#475569', fontSize: 14, lineHeight: 21, marginTop: 9 },
  dialogError: { color: '#b42318', backgroundColor: '#fff1f0', borderColor: '#fecaca', borderWidth: 1, borderRadius: 10, padding: 11, marginTop: 14, fontSize: 13, lineHeight: 18, fontWeight: '600' },
  dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 10, marginTop: 22 },
  dialogCancel: { minHeight: 44, paddingHorizontal: 14, borderRadius: 11, borderWidth: 1, borderColor: '#cbd5e1', justifyContent: 'center' },
  dialogCancelText: { color: '#334155', fontSize: 14, fontWeight: '800' },
  dialogConfirm: { minHeight: 44, paddingHorizontal: 15, borderRadius: 11, backgroundColor: '#b42318', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  dialogConfirmText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  dialogDisabled: { opacity: 0.65 },
});

