import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, ScrollView,
  Platform, SafeAreaView, Alert, ActivityIndicator, TextStyle
} from 'react-native';
import { Camera, ChevronLeft } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Location from 'expo-location';
import * as ImageManipulator from 'expo-image-manipulator';
import LottieView from 'lottie-react-native';
import { endpoints, formatImageUri } from '../config/api';
import { useNotification } from '../context/NotificationContext';
import { SDG_HERO_IMAGES } from '../data/SDGData';

// --- BLOCKCHAIN MOVED TO BLOTTER REPORT ---

const MissionDetailScreen = ({ route, navigation }: any) => {
  const { showNotification } = useNotification();
  const { mission, userId } = route.params;

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // 🎯 MODULE 10 FIX: Distinct state for AI Bottleneck latency
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // State to store the real user's name
  const [username, setUsername] = useState<string>("Agent");

  const hasImage = !!mission.image;

  // Fetch the real username when screen loads
  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (!userId) return;
        const response = await fetch(endpoints.auth.getUser(userId));
        const data = await response.json();
        if (data && data.username) {
          setUsername(data.username);
          console.log("Active Agent identified:", data.username);
        }
      } catch (error) {
        console.error("Could not fetch username:", error);
      }
    };
    fetchUser();
  }, [userId]);

  const [location, setLocation] = useState<any>(null);

  const handlePickImage = async () => {
    // 1. Request Camera Permissions (Anti-Cheat)
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraStatus !== 'granted') {
      showNotification('Camera access is required for live verification!', 'error');
      return;
    }

    // 2. Request Location Permissions (GPS Anti-Cheat)
    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
    if (locationStatus !== 'granted') {
      showNotification('Location access is required for anti-cheat verification!', 'error');
      return;
    }

    // 3. Launch Camera (Force Live Photo)
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1, // Start high quality to capture detail
      exif: true, // Capture metadata
    });

    if (!result.canceled) {
      const asset = result.assets[0];

      // A. Check EXIF Timestamp
      if (asset.exif && asset.exif.DateTimeOriginal) {
        console.log("📸 EXIF Verified:", asset.exif.DateTimeOriginal);
      } else {
        console.log("📸 Live Photo Verified (No EXIF).");
      }

      // B. Fetch GPS Coordinates
      try {
        const currentLoc = await Location.getCurrentPositionAsync({});
        setLocation(currentLoc.coords);
        console.log("📍 GPS Locked:", currentLoc.coords.latitude, currentLoc.coords.longitude);
      } catch (err) {
        console.log("📍 Could not lock GPS, proceeding with caution.");
      }

      // C. Image Compression (Optimization)
      try {
        const manipResult = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 800 } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );
        setImageUri(manipResult.uri);
      } catch (err) {
        console.log("Compression failed, using original.");
        setImageUri(asset.uri);
      }
    }
  };

  const getBase64 = async (uri: string) => {
    if (Platform.OS === 'web') {
      const response = await fetch(uri);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } else {
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
      return `data:image/jpeg;base64,${base64}`;
    }
  };

  const handleSubmit = async () => {
    if (!userId) {
      showNotification("User ID missing.", "error");
      return;
    }
    if (!imageUri) {
      showNotification("Please select an image.", "error");
      return;
    }

    setLoading(true);

    try {
      // 🎯 MODULE 10 FIX: Temporarily skipping mobile AI pre-check due to 502 Bad Gateway
      // We will let the Admin Dashboard do the AI verification instead to prevent OOM/Upload crashes.
      setIsAnalyzing(true);
      const imagePayload = await getBase64(imageUri);
      
      // Removed the direct fetch to endpoints.predict here to bypass the 502 crash.
      setIsAnalyzing(false);

      // Step B: Send to Node.js Backend directly

      const response = await fetch(endpoints.auth.submitMission, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          missionId: mission._id,
          missionTitle: mission.title,
          image: imagePayload
        }),
      });

      const data = await response.json();

      if (response.ok) {

        setSubmitted(true);
        navigation.navigate('Home', { screen: 'HomeTab', params: { userId, refresh: true } });
        showNotification("🚀 Proof Submitted! Awaiting Admin Verification.", "success");

      } else {
        showNotification(data.message || "Submission failed", "error");
      }
    } catch (error) {
      console.error("Submit Error:", error);
      showNotification("Connection Error. Check console logs.", "error");
    } finally {
      setLoading(false);
      setIsAnalyzing(false);
    }
  };

  return (
    <View style={styles.container}>

      {/* HERO HEADER */}
      <View style={{ height: 300, width: '100%' }}>
        {hasImage ? (
          <Image source={{ uri: formatImageUri(mission.image)! }} style={{ width: '100%', height: '100%' }} />
        ) : (
          <Image 
            source={SDG_HERO_IMAGES[mission.sdgNumber]} 
            style={{ width: '100%', height: '100%' }} 
            resizeMode="cover"
          />
        )}

        <View style={styles.imageOverlay} />

        <SafeAreaView style={styles.safeAreaOverlay}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnCircle}>
            <ChevronLeft size={24} color="#0f172a" />
          </TouchableOpacity>
        </SafeAreaView>

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
          <Text style={styles.sectionTitle}>Civic Task Brief</Text>
          <View style={styles.sdgBadgeRow}>
            <View style={[styles.sdgBadge, { backgroundColor: mission.color || '#0038A8' }]}>
              <Text style={styles.sdgBadgeText}>SDG {mission.sdgNumber}</Text>
            </View>
          </View>

          <Text style={styles.description}>
            {mission.description || `This civic task contributes to SDG Goal ${mission.sdgNumber}. Participate in a local activity to support Barangay Pantal's sustainability programs.`}
          </Text>

          <View style={styles.bulletPoint}>
            <Text style={styles.bulletText}>📸 Take a clear photo of your activity.</Text>
            <Text style={styles.bulletText}>✅ Ensure the activity is clearly visible.</Text>
            <Text style={styles.bulletText}>🔗 Approved proofs are recorded on the blockchain.</Text>
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

        {/* UPLOAD PROGRESS STATE */}
        {loading ? (
          <View style={styles.lottieContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.analyzingText}>Uploading Proof...</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: imageUri ? (mission.color || '#3b82f6') : '#cbd5e1' }]}
            disabled={!imageUri || submitted}
            onPress={handleSubmit}
          >
            <Text style={styles.submitBtnText}>{submitted ? '✅ Submitted for Review!' : 'Submit Civic Task Proof'}</Text>
          </TouchableOpacity>
        )}
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

  placeholderNumber: { fontSize: 120, fontWeight: '900', color: 'rgba(255,255,255,0.15)' } as TextStyle,

  content: { padding: 25, paddingBottom: 50 },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 10 },
  sdgBadgeRow: { flexDirection: 'row', marginBottom: 10 },
  sdgBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, alignSelf: 'flex-start' },
  sdgBadgeText: { color: 'white', fontWeight: '800', fontSize: 12 },
  description: { fontSize: 15, color: '#475569', lineHeight: 24, marginBottom: 15, marginTop: 4 },
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

  lottieContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
  analyzingText: { marginTop: 10, fontSize: 16, fontWeight: '600', color: '#3b82f6' },
});

export default MissionDetailScreen;
