import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const HomeScreen = ({ navigation }) => {
  // Dummy Data
  const missions = [
    { id: '1', title: 'Coastal Cleanup', category: 'Environment', points: 50, date: 'Feb 15' },
    { id: '2', title: 'Math Tutoring', category: 'Education', points: 30, date: 'Feb 20' },
    { id: '3', title: 'Tree Planting', category: 'Environment', points: 100, date: 'Mar 01' },
  ];

  const renderMission = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('MissionDetail', { mission: item })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.category}>{item.category}</Text>
        <Text style={styles.points}>+{item.points} pts</Text>
      </View>
      <Text style={styles.missionTitle}>{item.title}</Text>
      <Text style={styles.date}>Due: {item.date}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Available Missions</Text>
      <FlatList
        data={missions}
        keyExtractor={item => item.id}
        renderItem={renderMission}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9', padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#1e293b' },
  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  category: { 
    fontSize: 12, fontWeight: 'bold', color: '#3b82f6', 
    backgroundColor: '#eff6ff', padding: 4, borderRadius: 6 
  },
  points: { color: '#22c55e', fontWeight: 'bold' },
  missionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 5, color: '#0f172a' },
  date: { color: '#64748b', fontSize: 14 }
});

export default HomeScreen;