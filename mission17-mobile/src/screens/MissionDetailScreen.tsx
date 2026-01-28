import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, 
  Platform, ViewStyle, SafeAreaView, Alert, ImageStyle, ActivityIndicator, TextStyle 
} from 'react-native';
import { Camera, ArrowLeft, CheckCircle, ChevronLeft } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { endpoints } from '../config/api'; 

const MissionDetailScreen = ({ route, navigation }: any) => {
  const { mission, userId } = route.params; 
  
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Logic: Check if we have a custom image
  const hasImage = !!mission.image;

  const RootComponent = (Platform.OS === 'web' ? View : SafeAreaView) as React.ElementType;

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Need camera roll permissions!');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [4, 3], quality: 1,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const handleSubmit = async () => {
    if (!userId) { Alert.alert("Error", "User ID missing."); return; }
    setLoading(true);
    try {
      const response = await fetch(endpoints.auth.submitMission, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, missionId: mission._id, missionTitle: mission.title }),
      });
      const data = await response.json();
      if (response.ok) {
        setSubmitted(true);
        Alert.alert("🎉 Mission Complete!", `Verified! +${mission.points} Points`);
        setTimeout(() => navigation.navigate('Home', { screen: 'HomeTab', params: { userId, refresh: true } }), 1500);
      } else {
        Alert.alert("Error", data.message || "Submission failed");
      }
    } catch (error) {
      Alert.alert("Connection Error", "Check server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      
      {/* HERO HEADER */}
      <View style={{height: 300, width: '100%'}}>
        
        {/* RENDER: Custom Image OR Color Block with Watermark */}
        {hasImage ? (
          <Image source={{ uri: mission.image }} style={{width: '100%', height: '100%'}} />
        ) : (
          <View style={{
             width: '100%', 
             height: '100%', 
             backgroundColor: mission.color || '#3b82f6', 
             justifyContent: 'center', 
             alignItems: 'center'
          }}>
             <Text style={styles.placeholderNumber}>
               {mission.sdgNumber}
             </Text>
          </View>
        )}

        {/* Dark Overlay for Text Readability */}
        <View style={styles.imageOverlay} />
        
        {/* Absolute Back Button */}
        <SafeAreaView style={styles.safeAreaOverlay}>
           <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnCircle}>
             <ChevronLeft size={24} color="#0f172a" />
           </TouchableOpacity>
        </SafeAreaView>

        {/* Title and Badge */}
        <View style={styles.heroTextContainer}>
          <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
             <Text style={styles.badgeText}>SDG {mission.sdgNumber}</Text>
          </View>
          <Text style={styles.heroTitle}>{mission.title}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* BRIEF */}
        <View style={styles.section}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15}}>
             <Text style={styles.sectionTitle}>Mission Brief</Text>
             <Text style={styles.pointsHighlight}>{mission.points} Points</Text>
          </View>
          <Text style={styles.description}>
            This mission contributes to Goal {mission.sdgNumber}. Participate in a local activity to support this goal.
          </Text>
          <View style={styles.bulletPoint}>
            <Text style={styles.bulletText}>• Take a clear photo of your activity.</Text>
            <Text style={styles.bulletText}>• Ensure you are visible.</Text>
            <Text style={styles.bulletText}>• Write a short caption.</Text>
          </View>
        </View>

        {/* UPLOAD */}
        <Text style={styles.sectionTitle}>Proof of Work</Text>
        {!imageUri ? (
          <TouchableOpacity style={styles.uploadBox} onPress={handlePickImage}>
            <View style={styles.uploadIconCircle}><Camera size={32} color="#64748b" /></View>
            <Text style={styles.uploadTitle}>Tap to upload photo</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.previewContainer}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
            <TouchableOpacity onPress={() => setImageUri(null)}><Text style={styles.reselectText}>Retake</Text></TouchableOpacity>
          </View>
        )}

        <TouchableOpacity 
          style={[styles.submitBtn, { backgroundColor: imageUri ? (mission.color || '#3b82f6') : '#cbd5e1' }]}
          disabled={!imageUri || submitted || loading}
          onPress={handleSubmit}
        >
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.submitBtnText}>{submitted ? "Submitted!" : "Submit Mission"}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  imageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  safeAreaOverlay: { position: 'absolute', top: 0, left: 0, right: 0 },
  backBtnCircle: { marginLeft: 20, marginTop: 10, width: 40, height: 40, backgroundColor: 'white', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  heroTextContainer: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  heroTitle: { color: 'white', fontSize: 28, fontWeight: '800', marginTop: 8 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  badgeText: { color: 'white', fontWeight: '800', fontSize: 12 },

  // New Watermark Style
  placeholderNumber: { fontSize: 120, fontWeight: '900', color: 'rgba(255,255,255,0.15)' } as TextStyle,

  content: { padding: 25, paddingBottom: 50 },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  pointsHighlight: { fontSize: 16, fontWeight: '800', color: '#16a34a' },
  description: { fontSize: 15, color: '#475569', lineHeight: 24, marginBottom: 15, marginTop: 10 },
  bulletPoint: { backgroundColor: '#f8fafc', padding: 15, borderRadius: 12 },
  bulletText: { fontSize: 14, color: '#64748b', marginBottom: 5 },

  uploadBox: { borderWidth: 2, borderColor: '#e2e8f0', borderStyle: 'dashed', borderRadius: 20, height: 180, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', marginBottom: 30 },
  uploadIconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  uploadTitle: { color: '#64748b', fontWeight: '600' },
  
  previewContainer: { alignItems: 'center', marginBottom: 30 },
  previewImage: { width: '100%', height: 200, borderRadius: 16, marginBottom: 10 },
  reselectText: { color: '#ef4444', fontWeight: '600' },

  submitBtn: { width: '100%', height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
  submitBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});

export default MissionDetailScreen;