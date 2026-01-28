import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image, 
  Platform, ViewStyle, SafeAreaView, Alert, ActivityIndicator, TextStyle 
} from 'react-native';
import { GlobalState } from '../config/api';
import { LinearGradient } from 'expo-linear-gradient'; 

const MissionsScreen = ({ navigation, route }: any) => {
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const RootComponent = (Platform.OS === 'web' ? View : SafeAreaView) as React.ElementType;
  const userId = route.params?.userId || GlobalState.userId;

  useEffect(() => {
    const fetchMissions = async () => {
      try {
        // NOTE: Use your computer's IP instead of localhost if testing on physical Android device
        const response = await fetch("http://localhost:5001/api/auth/all-missions");
        const data = await response.json();
        setMissions(data);
      } catch (error) {
        console.error("Failed to load missions:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMissions();
  }, []);

  const handlePressMission = (item: any) => {
    if (!userId) Alert.alert("Notice", "Please log in to save points.");
    navigation.navigate('MissionDetail', { mission: item, userId: userId });
  };

  const renderCard = ({ item }: { item: any }) => {
    const hasImage = !!item.image;

    return (
      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.9} 
        onPress={() => handlePressMission(item)}
      >
        {/* RENDER LOGIC: Custom Image OR Color Block */}
        {hasImage ? (
          <Image source={{ uri: item.image }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImage, { backgroundColor: item.color || '#3b82f6', justifyContent: 'center', alignItems: 'center' }]}>
             <Text style={styles.placeholderNumber}>
               {item.sdgNumber}
             </Text>
          </View>
        )}
        
        {/* Gradient Overlay */}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.cardOverlay}>
          <View style={styles.cardHeader}>
             <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
               <Text style={styles.badgeText}>SDG {item.sdgNumber}</Text>
             </View>
             <View style={styles.pointsBadge}>
               <Text style={styles.pointsText}>{item.points} PTS</Text>
             </View>
          </View>
          
          <View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDesc} numberOfLines={2}>
              {item.description || 'Tap to view mission details and start contributing.'}
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <RootComponent style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Active Missions</Text>
        <Text style={styles.subTitle}>Select a challenge to earn points.</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={missions}
          renderItem={renderCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </RootComponent>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' } as ViewStyle,
  header: { padding: 20, backgroundColor: 'white', paddingBottom: 15 } as ViewStyle,
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#0f172a' } as ViewStyle,
  subTitle: { fontSize: 14, color: '#64748b', marginTop: 4 } as ViewStyle,
  listContent: { padding: 20, paddingBottom: 40 } as ViewStyle,
  
  card: { height: 240, marginBottom: 20, borderRadius: 20, overflow: 'hidden', backgroundColor: 'white', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5 } as ViewStyle,
  cardImage: { width: '100%', height: '100%' } as any, 
  cardOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '100%', justifyContent: 'space-between', padding: 20 } as ViewStyle,
  
  placeholderNumber: { fontSize: 100, fontWeight: '900', color: 'rgba(255,255,255,0.15)' } as TextStyle,

  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' } as ViewStyle,
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 } as ViewStyle,
  badgeText: { color: 'white', fontWeight: '800', fontSize: 12 } as ViewStyle,
  pointsBadge: { backgroundColor: 'white', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 } as ViewStyle,
  pointsText: { color: '#0f172a', fontWeight: '800', fontSize: 12 } as ViewStyle,

  cardTitle: { color: 'white', fontSize: 24, fontWeight: '800', marginBottom: 6 } as ViewStyle,
  cardDesc: { color: '#e2e8f0', fontSize: 14, lineHeight: 20 } as ViewStyle,
});

export default MissionsScreen;