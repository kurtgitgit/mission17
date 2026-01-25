import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Award, Star, TrendingUp } from 'lucide-react-native'; // Icons

const ProfileScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* User Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>JP</Text>
          </View>
          <Text style={styles.name}>Juan Perez</Text>
          <Text style={styles.role}>Student • Level 5</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Star size={24} color="#eab308" />
            <Text style={styles.statValue}>1,250</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <TrendingUp size={24} color="#22c55e" />
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Missions</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Award size={24} color="#3b82f6" />
            <Text style={styles.statValue}>4</Text>
            <Text style={styles.statLabel}>Badges</Text>
          </View>
        </View>

        {/* Badges Section */}
        <Text style={styles.sectionTitle}>Earned Badges</Text>
        <View style={styles.badgesGrid}>
          <View style={[styles.badgeCard, { backgroundColor: '#dcfce7' }]}>
            <Award color="#166534" size={32} />
            <Text style={styles.badgeText}>Eco Hero</Text>
          </View>
          <View style={[styles.badgeCard, { backgroundColor: '#dbeafe' }]}>
            <Award color="#1e40af" size={32} />
            <Text style={styles.badgeText}>Educator</Text>
          </View>
          <View style={[styles.badgeCard, { backgroundColor: '#fce7f3' }]}>
            <Award color="#9d174d" size={32} />
            <Text style={styles.badgeText}>Equality</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarText: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  role: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 5,
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 20,
    marginTop: 30,
    marginBottom: 15,
    color: '#0f172a',
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 15,
  },
  badgeCard: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    color: '#334155',
  },
});

export default ProfileScreen;