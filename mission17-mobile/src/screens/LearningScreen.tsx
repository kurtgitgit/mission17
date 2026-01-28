import React from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Platform, SafeAreaView 
} from 'react-native';
import { SDG_DATA } from '../data/SDGData'; 

const LearningHubScreen = ({ navigation }: any) => {
  const RootComponent = (Platform.OS === 'web' ? View : SafeAreaView) as React.ElementType;

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.gridItem, { backgroundColor: item.color }]}
      onPress={() => navigation.navigate('SDGDetail', { sdg: item })}
    >
      <Text style={styles.gridNumber}>{item.id}</Text>
      <Text style={styles.gridTitle}>{item.title.toUpperCase()}</Text>
      
      {/* Icon Image */}
      <View style={styles.iconContainer}>
         <Image source={{ uri: item.icon }} style={styles.icon} resizeMode="contain" /> 
      </View>
    </TouchableOpacity>
  );

  return (
    <RootComponent style={styles.container}>
      <View style={styles.header}>
        
        {/* 👇 FIXED: Use require() for local assets */}
        <Image 
          source={require('../../assets/logo.png')} 
          style={styles.logo} 
          resizeMode="contain"
        />
        
        <View>
          <Text style={styles.headerTitle}>SDG Learning Hub</Text>
          <Text style={styles.headerSubtitle}>Select one SDG to view</Text>
        </View>
      </View>

      <FlatList
        data={SDG_DATA}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={3}
        contentContainerStyle={styles.list}
      />
    </RootComponent>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { 
    flexDirection: 'row', alignItems: 'center', padding: 20, 
    backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#eee',
    paddingTop: Platform.OS === 'android' ? 40 : 20 
  },
  logo: { width: 50, height: 50, marginRight: 15 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  headerSubtitle: { fontSize: 14, color: '#64748b' },
  
  list: { padding: 10 },
  gridItem: {
    flex: 1,
    margin: 6,
    height: 110,
    borderRadius: 12,
    padding: 8,
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity:0.2, shadowRadius:3,
  },
  gridNumber: { color: 'white', fontWeight: '900', fontSize: 16 },
  gridTitle: { color: 'white', fontWeight: '700', fontSize: 10, maxWidth: '80%' },
  iconContainer: { position: 'absolute', bottom: 5, right: 5, opacity: 0.9 },
  icon: { width: 40, height: 40, tintColor: 'white' }
});

export default LearningHubScreen;