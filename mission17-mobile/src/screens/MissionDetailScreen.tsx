import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, ScrollView,
  Platform, SafeAreaView, ActivityIndicator, StatusBar, Dimensions
} from 'react-native';
import { Camera, ArrowLeft, CheckCircle, ShieldCheck, AlertCircle, RefreshCw, UploadCloud, Award } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Location from 'expo-location';
import * as ImageManipulator from 'expo-image-manipulator';
import { LinearGradient } from 'expo-linear-gradient';
import { endpoints, formatImageUri } from '../config/api';
import { useNotification } from '../context/NotificationContext';
import { SDG_HERO_IMAGES } from '../data/SDGData';
import { sharedStyles } from '../config/theme';

const { width: SCREEN_W } = Dimensions.get('window');

const MissionDetailScreen = ({ route, navigation }: any) => {
  const { showNotification } = useNotification();
  const { mission, userId } = route.params;

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState<string>("Resident");
  const [location, setLocation] = useState<any>(null);

  const hasImage = !!mission.image;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (!userId) return;
        const response = await fetch(endpoints.auth.getUser(userId));
        const data = await response.json();
        if (data && data.username) {
          setUsername(data.username);
        }
      } catch (error) {
        console.error("Could not fetch username:", error);
      }
    };
    fetchUser();
  }, [userId]);

  const handlePickImage = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraStatus !== 'granted') {
      showNotification({
        title: "Camera Permission Required",
        message: "Camera access is needed to capture live proof of your civic task.",
        type: "error"
      });
      return;
    }

    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
    if (locationStatus !== 'granted') {
      showNotification({
        title: "Location Access Needed",
        message: "Location access verifies that your activity took place in the barangay.",
        type: "info"
      });
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });

    if (!result.canceled) {
      const asset = result.assets[0];

      try {
        const currentLoc = await Location.getCurrentPositionAsync({});
        setLocation(currentLoc.coords);
      } catch {
        // Continue if GPS unavailable
      }

      try {
        const manipResult = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 800 } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );
        setImageUri(manipResult.uri);
      } catch {
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
      showNotification({ message: "Please log in to submit proof.", type: "error" });
      return;
    }
    if (!imageUri) {
      showNotification({ message: "Please take a photo of your activity first.", type: "info" });
      return;
    }

    setLoading(true);

    try {
      const imagePayload = await getBase64(imageUri);

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
        showNotification({
          title: "Proof Submitted",
          message: "Your submission is now awaiting Barangay evaluation.",
          type: "success"
        });
        navigation.navigate('Home', { screen: 'HomeTab', params: { userId, refresh: true } });
      } else {
        showNotification({
          title: "Submission Failed",
          message: data.message || "Failed to submit proof. Please try again.",
          type: "error"
        });
      }
    } catch (error) {
      console.error("Submit Error:", error);
      showNotification({
        title: "Network Error",
        message: "Could not connect to server. Please check your internet connection.",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* HERO HEADER */}
      <View style={styles.heroContainer}>
        {hasImage ? (
          <Image source={{ uri: formatImageUri(mission.image)! }} style={styles.heroImage} resizeMode="cover" />
        ) : (
          <Image 
            source={SDG_HERO_IMAGES[mission.sdgNumber] || SDG_HERO_IMAGES[17]} 
            style={styles.heroImage} 
            resizeMode="cover"
          />
        )}

        <LinearGradient 
          colors={['rgba(15, 23, 42, 0.5)', 'transparent', 'rgba(15, 23, 42, 0.95)']} 
          style={styles.heroGradient} 
        />

        <SafeAreaView style={styles.headerNavRow}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backBtnCircle}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <ArrowLeft size={20} color="#0F172A" />
          </TouchableOpacity>
        </SafeAreaView>

        <View style={styles.heroContent}>
          <View style={styles.heroBadgeRow}>
            <View style={styles.sdgTag}>
              <Text style={styles.sdgTagText}>SDG {mission.sdgNumber || '17'}</Text>
            </View>
            {mission.points ? (
              <View style={styles.pointsTag}>
                <Award size={12} color="#B45309" />
                <Text style={styles.pointsTagText}>+{mission.points} Points</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.heroTitle}>{mission.title}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ── CARD 1: TASK BRIEF & OBJECTIVES ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>Civic Task Overview</Text>
          </View>

          <Text style={styles.description}>
            {mission.description || `Participate in this official community program contributing to United Nations Sustainable Development Goal ${mission.sdgNumber}.`}
          </Text>

          {/* VERIFICATION GUIDELINES */}
          <View style={styles.guidelinesBox}>
            <Text style={styles.guidelinesTitle}>Submission Guidelines</Text>
            
            <View style={styles.guideRow}>
              <CheckCircle size={15} color="#047857" style={{ marginTop: 2 }} />
              <Text style={styles.guideText}>Take a clear, live photograph showing your active participation.</Text>
            </View>

            <View style={styles.guideRow}>
              <CheckCircle size={15} color="#047857" style={{ marginTop: 2 }} />
              <Text style={styles.guideText}>Ensure the community activity or location is clearly identifiable.</Text>
            </View>

            <View style={styles.guideRow}>
              <ShieldCheck size={15} color="#0038A8" style={{ marginTop: 2 }} />
              <Text style={styles.guideText}>Approved submissions are officially credited to your citizen record.</Text>
            </View>
          </View>
        </View>

        {/* ── CARD 2: PROOF OF PARTICIPATION ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>Proof of Participation</Text>
          </View>

          {!imageUri ? (
            <TouchableOpacity 
              style={styles.uploadArea} 
              onPress={handlePickImage}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Take live photo for civic task"
            >
              <View style={styles.uploadIconCircle}>
                <Camera size={26} color="#0038A8" />
              </View>
              <Text style={styles.uploadMainText}>Capture Live Photo</Text>
              <Text style={styles.uploadSubText}>Tap to open camera and verify your activity</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.previewContainer}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
              <TouchableOpacity 
                style={styles.retakeBtn} 
                onPress={handlePickImage}
                accessibilityRole="button"
              >
                <RefreshCw size={14} color="#0F172A" />
                <Text style={styles.retakeBtnText}>Retake Photo</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* SUBMIT BUTTON */}
          <TouchableOpacity
            style={[styles.submitBtn, (!imageUri || loading || submitted) && styles.submitBtnDisabled]}
            disabled={!imageUri || loading || submitted}
            onPress={handleSubmit}
            accessibilityRole="button"
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <UploadCloud size={18} color="#FFFFFF" />
                <Text style={styles.submitBtnText}>
                  {submitted ? 'Submitted for Verification' : 'Submit Task Proof →'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  // HERO
  heroContainer: { height: 260, width: '100%', position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroGradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  headerNavRow: { position: 'absolute', top: Platform.OS === 'android' ? 36 : 10, left: 16, zIndex: 10 },
  backBtnCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  heroContent: { position: 'absolute', bottom: 18, left: 16, right: 16 },
  heroBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  sdgTag: {
    backgroundColor: '#0038A8',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  sdgTagText: { color: '#FFFFFF', fontWeight: '800', fontSize: 11, letterSpacing: 0.5 },
  pointsTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pointsTagText: { color: '#B45309', fontWeight: '800', fontSize: 11 },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  content: { padding: 14, paddingBottom: 50 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sectionTitle: { fontSize: 15.5, fontWeight: '800', color: '#0F172A' },
  description: { fontSize: 13.5, color: '#475569', lineHeight: 21, marginBottom: 14 },

  // GUIDELINES
  guidelinesBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  guidelinesTitle: { fontSize: 12, fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  guideRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  guideText: { flex: 1, fontSize: 12.5, color: '#475569', lineHeight: 18, fontWeight: '500' },

  // UPLOAD AREA
  uploadArea: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    marginBottom: 14,
  },
  uploadIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  uploadMainText: { fontSize: 14.5, fontWeight: '800', color: '#0F172A' },
  uploadSubText: { fontSize: 12, color: '#64748B', marginTop: 2, textAlign: 'center' },

  previewContainer: { marginBottom: 14 },
  previewImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 8, backgroundColor: '#F1F5F9' },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  retakeBtnText: { fontSize: 12.5, fontWeight: '700', color: '#0F172A' },

  // CTA
  submitBtn: {
    backgroundColor: '#0038A8',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0038A8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  submitBtnDisabled: { backgroundColor: '#CBD5E1', shadowOpacity: 0, elevation: 0 },
  submitBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});

export default MissionDetailScreen;
