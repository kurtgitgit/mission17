import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Platform 
} from 'react-native';
import { ChevronLeft, Bell, CheckCircle, Info, AlertTriangle, Trash2 } from 'lucide-react-native';

const INITIAL_NOTIFICATIONS = [
  { id: '1', title: 'Welcome Agent!', message: 'Welcome to Mission 17. Start your first mission today to earn points.', type: 'info', time: '2h ago', read: false },
  { id: '2', title: 'Mission Approved', message: 'Your "Tree Planting" mission has been verified by HQ.', type: 'success', time: '1d ago', read: true },
  { id: '3', title: 'New Event Nearby', message: 'Join the Coastal Cleanup this Saturday at 8:00 AM.', type: 'alert', time: '2d ago', read: true },
];

export default function NotificationsScreen({ navigation }: any) {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const RootComponent = (Platform.OS === 'web' ? View : SafeAreaView) as React.ElementType;

  const handleClearAll = () => {
    setNotifications([]);
  };

  const renderItem = ({ item }: any) => {
    let Icon = Info;
    let color = '#3b82f6';
    let bgColor = '#eff6ff';

    if (item.type === 'success') { Icon = CheckCircle; color = '#22c55e'; bgColor = '#f0fdf4'; }
    if (item.type === 'alert') { Icon = AlertTriangle; color = '#f59e0b'; bgColor = '#fefce8'; }

    return (
      <TouchableOpacity style={[styles.card, !item.read && styles.unreadCard]}>
        <View style={[styles.iconBox, { backgroundColor: bgColor }]}>
          <Icon size={20} color={color} />
        </View>
        <View style={styles.content}>
          <View style={styles.row}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.time}>{item.time}</Text>
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

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Bell size={40} color="#cbd5e1" />
            <Text style={styles.emptyText}>No new notifications</Text>
          </View>
        }
      />
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