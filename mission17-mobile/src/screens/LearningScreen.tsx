import React from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Platform, SafeAreaView, ScrollView 
} from 'react-native';
import { SDG_DATA } from '../data/SDGData'; 

const SDG_IMAGES: { [key: number]: any } = {
  1: require('../../assets/sdg/sdg01.png'),
  2: require('../../assets/sdg/sdg02.png'),
  3: require('../../assets/sdg/sdg03.png'),
  4: require('../../assets/sdg/sdg04.png'),
  5: require('../../assets/sdg/sdg05.png'),
  6: require('../../assets/sdg/sdg06.png'),
  7: require('../../assets/sdg/sdg07.png'),
  8: require('../../assets/sdg/sdg08.png'),
  9: require('../../assets/sdg/sdg09.png'),
  10: require('../../assets/sdg/sdg10.png'),
  11: require('../../assets/sdg/sdg11.png'),
  12: require('../../assets/sdg/sdg12.png'),
  13: require('../../assets/sdg/sdg13.png'),
  14: require('../../assets/sdg/sdg14.png'),
  15: require('../../assets/sdg/sdg15.png'),
  16: require('../../assets/sdg/sdg16.png'),
  17: require('../../assets/sdg/sdg17.png'),
  // 18 is the logo, using our main logo as fallback if not provided
  18: require('../../assets/logo.png'), 
};

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