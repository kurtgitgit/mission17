import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, SafeAreaView, ActivityIndicator, Image } from 'react-native';
import { User, Mail, Award, Clock, XCircle, CheckCircle, Settings, Edit3 } from 'lucide-react-native'; 
import { useIsFocused } from '@react-navigation/native';
import { GlobalState, endpoints } from '../config/api';

const BADGES = [
  { id: 1, name: 'First Step', icon: '🌱', desc: 'Completed 1st Mission', color: '#dcfce7', text: '#166534' },
  { id: 2, name: 'Eco Warrior', icon: '🌍', desc: '3 Environmental Missions', color: '#e0f2fe', text: '#075985' },
  { id: 3, name: 'Social Star', icon: '🤝', desc: 'Invited a Friend', color: '#fef3c7', text: '#b45309' },
  { id: 4, name: 'Streaker', icon: '🔥', desc: '3 Days in a Row', color: '#fee2e2', text: '#991b1b' },
];

const ProfileScreen = ({ navigation }: any) => { 
  const [userData, setUserData] = useState<any>(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();
  const userId = GlobalState.userId;

  const RootComponent = (Platform.OS === 'web' ? View : SafeAreaView) as React.ElementType;

  const fetchProfileData = async () => {
    try {
      const userRes = await fetch(endpoints.auth.getUser(userId));
      const userJson = await userRes.json();
      
      const histRes = await fetch(`http://localhost:5001/api/auth/user-submissions/${userId}`);
      const histJson = await histRes.json();

      setUserData(userJson);
      setHistory(histJson);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId && isFocused) fetchProfileData();
  }, [userId, isFocused]);

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  return (
    <RootComponent style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* HEADER WITH EDIT BUTTON */}
        <View style={styles.headerCard}>
          <View style={styles.headerTopRow}>
             <TouchableOpacity 
             style={styles.iconBtn} 
             onPress={() => navigation.navigate('Settings')} // 👈 Added navigation
            >
            <Settings size={20} color="#94a3b8" />
             </TouchableOpacity>
             
             {/* 👇 WIRED UP THE EDIT BUTTON HERE 👇 */}
             <TouchableOpacity 
               style={styles.iconBtn} 
               onPress={() => navigation.navigate('EditProfile')}
             >
               <Edit3 size={20} color="#3b82f6" />
             </TouchableOpacity>
          </View>

          <View style={styles.avatarCircle}>
             <User size={40} color="#3b82f6" />
          </View>
          <Text style={styles.name}>{userData?.username || 'Agent'}</Text>
          <Text style={styles.email}>{userData?.email}</Text>
          {userData?.bio && <Text style={styles.bio}>{userData.bio}</Text>}
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userData?.points || 0}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{history.length}</Text>
              <Text style={styles.statLabel}>Missions</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{BADGES.length}</Text>
              <Text style={styles.statLabel}>Badges</Text>
            </View>
          </View>
        </View>

        {/* ACHIEVEMENTS */}
        <Text style={styles.sectionTitle}>Achievements</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgeScroll}>
          {BADGES.map((badge) => (
            <View key={badge.id} style={[styles.badgeCard, { backgroundColor: badge.color }]}>
              <Text style={styles.badgeIcon}>{badge.icon}</Text>
              <View>
                <Text style={[styles.badgeName, { color: badge.text }]}>{badge.name}</Text>
                <Text style={[styles.badgeDesc, { color: badge.text }]}>{badge.desc}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* RECENT SUBMISSIONS */}
        <Text style={styles.sectionTitle}>Mission History</Text>
        {history.length === 0 ? (
          <View style={styles.emptyState}>
            <Clock size={40} color="#cbd5e1" />
            <Text style={styles.emptyText}>No missions yet. Start one today!</Text>
          </View>
        ) : (
          history.map((item: any) => (
            <View key={item._id} style={styles.historyCard}>
              <View style={styles.historyInfo}>
                <Text style={styles.missionTitle}>{item.missionTitle}</Text>
                <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                {item.status === 'Rejected' && <Text style={styles.reasonText}>Reason: {item.rejectionReason}</Text>}
              </View>
              <View style={[styles.statusBadge, item.status === 'Approved' ? styles.bgSuccess : item.status === 'Rejected' ? styles.bgDanger : styles.bgWarning]}>
                {item.status === 'Approved' ? <CheckCircle size={14} color="white" /> : 
                 item.status === 'Rejected' ? <XCircle size={14} color="white" /> : 
                 <Clock size={14} color="white" />}
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>
          ))
        )}
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </RootComponent>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },
  
  headerCard: { backgroundColor: 'white', borderRadius: 24, padding: 20, alignItems: 'center', marginBottom: 25, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  headerTopRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  iconBtn: { padding: 8, borderRadius: 20, backgroundColor: '#f1f5f9' },
  
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  name: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  email: { fontSize: 14, color: '#64748b', marginBottom: 5 },
  bio: { fontSize: 13, color: '#3b82f6', fontStyle: 'italic', marginBottom: 15, textAlign: 'center' }, // Added bio style
  
  statsRow: { flexDirection: 'row', width: '100%', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 15 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: '#3b82f6' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 2 },
  statDivider: { width: 1, height: '80%', backgroundColor: '#f1f5f9' },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 15, marginTop: 10 },
  
  badgeScroll: { marginBottom: 25, marginHorizontal: -20, paddingHorizontal: 20 },
  badgeCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, marginRight: 12, width: 160 },
  badgeIcon: { fontSize: 24, marginRight: 10 },
  badgeName: { fontSize: 13, fontWeight: '700' },
  badgeDesc: { fontSize: 10, opacity: 0.8 },

  historyCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5 },
  historyInfo: { flex: 1 },
  missionTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  date: { fontSize: 12, color: '#94a3b8' },
  reasonText: { fontSize: 12, color: '#ef4444', marginTop: 4, fontWeight: '600' },
  
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusText: { color: 'white', fontSize: 11, fontWeight: '700' },
  bgSuccess: { backgroundColor: '#22c55e' },
  bgDanger: { backgroundColor: '#ef4444' },
  bgWarning: { backgroundColor: '#f59e0b' },

  emptyState: { alignItems: 'center', padding: 30, opacity: 0.5 },
  emptyText: { marginTop: 10, color: '#64748b' }
});

export default ProfileScreen;