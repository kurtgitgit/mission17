import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const LearningScreen = () => {
  // Static data for the 17 SDGs
  const sdgs = [
    { id: '1', title: 'No Poverty', color: '#E5243B' },
    { id: '2', title: 'Zero Hunger', color: '#DDA63A' },
    { id: '3', title: 'Good Health', color: '#4C9F38' },
    { id: '4', title: 'Quality Education', color: '#C5192D' },
    { id: '5', title: 'Gender Equality', color: '#FF3A21' },
    { id: '6', title: 'Clean Water', color: '#26BDE2' },
    // ... add more as needed
  ];

  const renderItem = ({ item }) => (
    <TouchableOpacity style={[styles.card, { backgroundColor: item.color }]}>
      <Text style={styles.cardTitle}>{item.id}</Text>
      <Text style={styles.cardText}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>SDG Learning Hub</Text>
      <Text style={styles.subHeader}>Click on a goal to learn more</Text>
      
      <FlatList
        data={sdgs}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        numColumns={2} // Grid layout
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 20 },
  header: { fontSize: 28, fontWeight: 'bold', color: '#0f172a' },
  subHeader: { fontSize: 16, color: '#64748b', marginBottom: 20 },
  list: { paddingBottom: 20 },
  card: {
    flex: 1,
    margin: 8,
    height: 120,
    borderRadius: 12,
    padding: 15,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: { fontSize: 24, fontWeight: 'bold', color: 'rgba(255,255,255,0.8)' },
  cardText: { fontSize: 16, fontWeight: 'bold', color: 'white' },
});

export default LearningScreen;
