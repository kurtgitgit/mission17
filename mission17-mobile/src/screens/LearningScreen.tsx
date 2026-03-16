import React from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Platform, SafeAreaView, ScrollView 
} from 'react-native';
import { SDG_DATA, SDG_IMAGES } from '../data/SDGData'; 


const LearningHubScreen = ({ navigation }: any) => {
  const RootComponent = (Platform.OS === 'web' ? View : SafeAreaView) as React.ElementType;
  
  // Add 18th square to complete the grid (3x6)
  const fullData = [
    ...SDG_DATA,
    {
      id: 18,
      title: "The Global Goals",
      color: "#ffffff",
      isLogo: true
    }
  ];

  return (
    <RootComponent style={styles.container}>
      <View style={styles.header}>
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

      <ScrollView contentContainerStyle={styles.list}>
        {fullData.map((item: any) => (
          <TouchableOpacity 
            key={item.id}
            style={[styles.gridItem, { backgroundColor: item.color || '#f1f5f9' }]}
            onPress={() => !item.isLogo && navigation.navigate('SDGDetail', { sdg: item })}
            activeOpacity={item.isLogo ? 1 : 0.7}
          >
            <Image 
              source={SDG_IMAGES[item.id] || { uri: item.icon }} 
              style={styles.iconImage} 
              resizeMode="stretch" 
            /> 
          </TouchableOpacity>
        ))}
      </ScrollView>
    </RootComponent>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header: { 
    flexDirection: 'row', alignItems: 'center', padding: 20, 
    backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#eee',
    paddingTop: Platform.OS === 'android' ? 40 : 20 
  },
  logo: { width: 50, height: 50, marginRight: 15 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  headerSubtitle: { fontSize: 14, color: '#64748b' },
  
  list: { 
    flexDirection: 'row', 
    flexWrap: 'wrap',
    padding: 0 
  },
  gridItem: {
    width: '33.333%',
    aspectRatio: 1,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  iconImage: { 
    width: '100%', 
    height: '100%',
  }
});

export default LearningHubScreen;