import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, SafeAreaView, ActivityIndicator } from 'react-native';
import { User, Mail, Award, Clock, XCircle, CheckCircle } from 'lucide-react-native';
import { useIsFocused } from '@react-navigation/native'; // 👈 Added useIsFocused
import { GlobalState, endpoints } from '../config/api';

// 👇 Shared Helper for Ranking
const getRank = (points: number) => {
  if (points >= 1000) return { title: "SDG Champion", color: "#7c3aed" };
  if (points >= 500) return { title: "SDG Advocate", color: "#3b82f6" };
  if (points >= 200) return { title: "Active Agent", color: "#10b981" };
  return { title: "Rookie Scout", color: "#64748b" };
};

const ProfileScreen = () => {
  const [userData, setUserData] = useState<any>(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused(); // 👈 Detects focus

  const userId = GlobalState.userId;
  const RootComponent = (Platform.OS === 'web' ? View : SafeAreaView);

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
    if (userId && isFocused) {
      fetchProfileData(); // 👈 Refreshes on focus
    }
  }, [userId, isFocused]);

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  const currentRank = getRank(userData?.points || 0);

  return (
    <RootComponent style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={styles.headerCard}>
          <View style={[styles.avatarCircle, { borderColor: currentRank.color, borderWidth: 2 }]}>
             <User size={40} color={currentRank.color} />
          </View>
          <Text style={styles.name}>{userData?.username || 'Kurt Perez'}</Text>
          <Text style={styles.email}>{userData?.email}</Text>
          
          {/* 👇 Added Rank Badge to Profile */}
          <View style={[styles.rankBadge, { backgroundColor: currentRank.color }]}>
            <Award size={14} color="white" />
            <Text style={styles.rankBadgeText}>{currentRank.title}</Text>
          </View>

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
          </View>
        </View>

        <Text style={styles.sectionTitle}>Recent Submissions</Text>
        
        {history.length === 0 ? (
          <Text style={styles.emptyText}>No missions submitted yet.</Text>
        ) : (
          history.map((item: any) => (
            <View key={item._id} style={styles.historyCard}>
              <View style={styles.historyInfo}>
                <Text style={styles.missionTitle}>{item.missionTitle}</Text>
                <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                
                {item.status === 'Rejected' && (
                  <Text style={styles.reasonText}>Reason: {item.rejectionReason}</Text>
                )}
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
      </ScrollView>
    </RootComponent>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },
  headerCard: { backgroundColor: 'white', borderRadius: 24, padding: 30, alignItems: 'center', marginBottom: 30, elevation: 2 },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  name: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  email: { fontSize: 14, color: '#64748b', marginBottom: 10 },
  rankBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 20 },
  rankBadgeText: { color: 'white', fontSize: 12, fontWeight: '700' },
  statsRow: { flexDirection: 'row', width: '100%', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 20 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: '#3b82f6' },
  statLabel: { fontSize: 12, color: '#64748b' },
  statDivider: { width: 1, backgroundColor: '#f1f5f9' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 15 },
  historyCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyInfo: { flex: 1 },
  missionTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  date: { fontSize: 12, color: '#94a3b8' },
  reasonText: { fontSize: 12, color: '#ef4444', marginTop: 5, fontWeight: '600' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusText: { color: 'white', fontSize: 12, fontWeight: '700' },
  bgSuccess: { backgroundColor: '#22c55e' },
  bgDanger: { backgroundColor: '#ef4444' },
  bgWarning: { backgroundColor: '#f59e0b' },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 20 }
});

export default ProfileScreen;