import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  Platform, 
  ViewStyle, 
  SafeAreaView,
  Alert,
  ImageStyle,
  ActivityIndicator
} from 'react-native';
import { Camera, ArrowLeft, CheckCircle } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
// 👇 1. IMPORT API CONFIG
import { endpoints } from '../config/api'; 

const MissionDetailScreen = ({ route, navigation }: any) => {
  // 👇 2. EXTRACT userId FROM PARAMS
  const { mission, userId } = route.params; 
  
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const RootComponent = (Platform.OS === 'web' ? View : SafeAreaView) as React.ElementType;

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      const msg = 'Sorry, we need camera roll permissions to make this work!';
      Platform.OS === 'web' ? alert(msg) : Alert.alert('Permission needed', msg);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  // 👇 3. REAL SUBMIT FUNCTION (WITH VISIBLE ALERTS)
  const handleSubmit = async () => {
    // A. Safety Check: Is the User ID there?
    if (!userId) {
      const msg = "User ID missing. Please log in again.";
      Platform.OS === 'web' ? alert(msg) : Alert.alert("Error", msg);
      return;
    }
    
    setLoading(true);

    try {
      console.log(`🚀 Submitting Mission: User[${userId}] -> Mission[${mission.title}]`);

      // B. Send to Backend
      const response = await fetch(endpoints.auth.submitMission, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          missionId: mission.id,
          missionTitle: mission.title
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // ✅ SUCCESS: Show Points!
        setSubmitted(true);
        const msg = `Mission Verified! You earned 100 Points.\nNew Total: ${data.newPoints}`;
        
        // Show the alert (Web vs Mobile)
        Platform.OS === 'web' ? alert(msg) : Alert.alert("🎉 Mission Complete!", msg);

        // Go back to Home and Refresh
        setTimeout(() => {
          navigation.navigate('Home', { 
             screen: 'HomeTab', 
             params: { userId: userId, refresh: true } 
          });
        }, 1500);

      } else {
        // ❌ SERVER ERROR: Show the specific error message
        const errorMsg = data.message || "Submission failed";
        console.error("Server Error:", errorMsg);
        Platform.OS === 'web' ? alert(`Error: ${errorMsg}`) : Alert.alert("Error", errorMsg);
      }

    } catch (error) {
      // ❌ NETWORK ERROR: Show connection failure
      console.error("Submission Error:", error);
      const msg = "Could not connect to server. Check your backend terminal!";
      Platform.OS === 'web' ? alert(msg) : Alert.alert("Connection Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <RootComponent style={styles.container}>
      
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: mission.color }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerSdgId}>SDG {mission.id}</Text>
          <Text style={styles.headerTitle}>{mission.title}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* DESCRIPTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mission Brief</Text>
          <Text style={styles.description}>
            This mission contributes to Goal {mission.id}. Your task is to participate in a local activity
            that supports this goal and document it.
          </Text>
          <View style={styles.bulletPoint}>
            <Text style={styles.bulletText}>• Take a clear photo of your activity.</Text>
            <Text style={styles.bulletText}>• Ensure you are visible in the photo.</Text>
            <Text style={styles.bulletText}>• Write a short caption explaining what you did.</Text>
          </View>
        </View>

        {/* UPLOAD AREA */}
        <Text style={styles.sectionTitle}>Proof of Work</Text>
        
        {!imageUri ? (
          <TouchableOpacity style={styles.uploadBox} onPress={handlePickImage}>
            <View style={styles.uploadIconCircle}>
              <Camera size={32} color="#64748b" />
            </View>
            <Text style={styles.uploadTitle}>Tap to take a photo</Text>
            <Text style={styles.uploadSubtitle}>or upload from gallery</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.previewContainer}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
            <TouchableOpacity onPress={() => setImageUri(null)}>
              <Text style={styles.reselectText}>Retake Photo</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* SUBMIT BUTTON */}
        <TouchableOpacity 
          style={[
            styles.submitBtn, 
            { backgroundColor: imageUri ? mission.color : '#cbd5e1' } 
          ]}
          disabled={!imageUri || submitted || loading}
          onPress={handleSubmit}
        >
          {loading ? (
             <ActivityIndicator color="white" />
          ) : submitted ? (
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
               <CheckCircle size={20} color="white" />
               <Text style={styles.submitBtnText}>Submitted!</Text>
            </View>
          ) : (
            <Text style={styles.submitBtnText}>Submit Mission</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </RootComponent>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  } as ViewStyle,

  // HEADER
  header: {
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  } as ViewStyle,
  backButton: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
  } as ViewStyle,
  headerContent: { paddingLeft: 10 } as ViewStyle,
  headerSdgId: {
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '800', fontSize: 14, marginBottom: 5,
  } as ViewStyle,
  headerTitle: {
    color: 'white', fontWeight: '900', fontSize: 24, maxWidth: '90%',
  } as ViewStyle,

  // CONTENT
  content: {
    padding: 20, maxWidth: 600, alignSelf: 'center', width: '100%',
  } as ViewStyle,
  section: { marginBottom: 30 } as ViewStyle,
  sectionTitle: {
    fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 10,
  } as ViewStyle,
  description: {
    fontSize: 15, color: '#475569', lineHeight: 24, marginBottom: 15,
  } as ViewStyle,
  bulletPoint: {
    backgroundColor: 'white', padding: 15, borderRadius: 12,
  },
  bulletText: {
    fontSize: 14, color: '#64748b', marginBottom: 8,
  } as ViewStyle,

  // UPLOAD
  uploadBox: {
    borderWidth: 2, borderColor: '#cbd5e1', borderStyle: 'dashed', borderRadius: 20,
    height: 200, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9', marginBottom: 30,
  } as ViewStyle,
  uploadIconCircle: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: '#e2e8f0',
    justifyContent: 'center', alignItems: 'center', marginBottom: 15,
  } as ViewStyle,
  uploadTitle: { fontSize: 16, fontWeight: '600', color: '#475569' } as ViewStyle,
  uploadSubtitle: { fontSize: 14, color: '#94a3b8', marginTop: 5 } as ViewStyle,

  // PREVIEW
  previewContainer: { alignItems: 'center', marginBottom: 30 } as ViewStyle,
  previewImage: {
    width: '100%', height: 200, borderRadius: 20, marginBottom: 10,
    backgroundColor: '#cbd5e1'
  } as ImageStyle,
  reselectText: { color: '#ef4444', fontWeight: '600' } as ViewStyle,

  // SUBMIT
  submitBtn: {
    width: '100%', height: 55, borderRadius: 27.5, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5,
  } as ViewStyle,
  submitBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold' } as ViewStyle,
});

export default MissionDetailScreen;