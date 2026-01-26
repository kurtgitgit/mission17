import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Platform, 
  ViewStyle, 
  SafeAreaView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { GlobalState } from '../config/api';

// --- FALLBACK DATA: The 17 SDGs (Used if database is empty) ---
const FALLBACK_SDG_DATA = [
  { id: '1', title: 'No Poverty', color: '#e5243b' },
  { id: '2', title: 'Zero Hunger', color: '#dda63a' },
  { id: '3', title: 'Good Health and Well-Being', color: '#4c9f38' },
  { id: '4', title: 'Quality Education', color: '#c5192d' },
  { id: '5', title: 'Gender Equality', color: '#ff3a21' },
  { id: '6', title: 'Clean Water and Sanitation', color: '#26bde2' },
  { id: '7', title: 'Affordable and Clean Energy', color: '#fcc30b' },
  { id: '8', title: 'Decent Work and Economic Growth', color: '#a21942' },
  { id: '9', title: 'Industry, Innovation and Infrastructure', color: '#fd6925' },
  { id: '10', title: 'Reduced Inequalities', color: '#dd1367' },
  { id: '11', title: 'Sustainable Cities and Communities', color: '#fd9d24' },
  { id: '12', title: 'Responsible Consumption and Production', color: '#bf8b2e' },
  { id: '13', title: 'Climate Action', color: '#3f7e44' },
  { id: '14', title: 'Life Below Water', color: '#0a97d9' },
  { id: '15', title: 'Life on Land', color: '#56c02b' },
  { id: '16', title: 'Peace, Justice and Strong Institutions', color: '#00689d' },
  { id: '17', title: 'Partnerships for the Goals', color: '#19486a' },
];

const MissionsScreen = ({ navigation, route }: any) => {
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const RootComponent = (Platform.OS === 'web' ? View : SafeAreaView) as React.ElementType;
  const userId = route.params?.userId || GlobalState.userId;

  // 👇 FETCH DYNAMIC MISSIONS FROM BACKEND
  useEffect(() => {
    const fetchMissions = async () => {
      try {
        const response = await fetch("http://localhost:5001/api/auth/all-missions");
        const data = await response.json();
        
        // If we have missions in the DB, use them. Otherwise, use fallback.
        if (data && data.length > 0) {
          setMissions(data);
        } else {
          setMissions(FALLBACK_SDG_DATA);
        }
      } catch (error) {
        console.error("Failed to load missions:", error);
        setMissions(FALLBACK_SDG_DATA); // Show fallback on error
      } finally {
        setLoading(false);
      }
    };

    fetchMissions();
  }, []);

  const handlePressMission = (item: any) => {
    if (!userId) {
      Alert.alert("Notice", "Please log in to save points.");
    }
    
    navigation.navigate('MissionDetail', { 
      mission: item,
      userId: userId 
    });
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => handlePressMission(item)}
    >
      <View style={[styles.cardImage, { backgroundColor: item.color || '#3b82f6' }]}>
        <Text style={styles.imgPlaceholderText}>SDG</Text>
      </View>
      
      <View style={styles.textContainer}>
        <Text style={styles.sdgNumber}>Goal {item.sdgNumber || item.id}</Text>
        <Text style={styles.sdgTitle}>{item.title}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <RootComponent style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>SDG Missions</Text>
        <Text style={styles.subTitle}>Select a mission to earn points.</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={missions}
          renderItem={renderItem}
          keyExtractor={(item) => item._id || item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </RootComponent>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9', 
    alignItems: 'center',
  } as ViewStyle,
  header: {
    marginTop: 20,
    marginBottom: 15,
    alignItems: 'center',
  } as ViewStyle,
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 5,
  } as ViewStyle,
  subTitle: {
    fontSize: 14,
    color: '#64748b',
  } as ViewStyle,
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    width: '100%',
    maxWidth: 600,
  } as ViewStyle,
  card: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 10,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3, 
    borderWidth: 1,
    borderColor: '#e2e8f0',
  } as any,
  cardImage: {
    width: 80,
    height: 60,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  } as ViewStyle,
  imgPlaceholderText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  } as ViewStyle,
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  } as ViewStyle,
  sdgNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 2,
    textTransform: 'uppercase',
  } as ViewStyle,
  sdgTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 20,
  } as ViewStyle,
});

export default MissionsScreen;