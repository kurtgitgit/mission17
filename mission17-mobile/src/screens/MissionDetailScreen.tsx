import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, ScrollView,
  Platform, SafeAreaView, Alert, ActivityIndicator, TextStyle
} from 'react-native';
import { Camera, ChevronLeft } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { endpoints, formatImageUri } from '../config/api';
import { useNotification } from '../context/NotificationContext';

// --- IMPORT BLOCKCHAIN SERVICE ---
import { saveMissionToBlockchain } from '../../MissionBlockchain';

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

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showNotification('Need camera roll permissions!', 'error');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
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
      // 🎯 MODULE 10 FIX: 1. Send to Python AI First
      setIsAnalyzing(true);
      // Step A: Convert Image to Base64 (Do this BEFORE AI upload)
      const imagePayload = await getBase64(imageUri);

      const formData = new FormData();
      if (Platform.OS === 'web') {
        // Safe conversion of base64 to Blob for web
        const base64Data = (imagePayload as string).split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/jpeg' });
        formData.append('file', blob, 'photo.jpg');
      } else {
        formData.append('file', {
          uri: imageUri,
          type: 'image/jpeg',
          name: 'photo.jpg',
        } as any);
      }

      // 🤖 AI SERVER URL: Dynamic switching!
      const DEV_AI_IP = "192.168.1.101"; // Change to your IP for real phone dev
      const AI_URL = __DEV__
        ? `http://${Platform.OS === 'android' ? '10.0.2.2' : 'localhost'}:5000/predict`
        : "https://mission17-ai.onrender.com/predict";

      const aiResponse = await fetch(AI_URL, {
        method: 'POST',
        body: formData
      });

      let aiResult;
      try {
        aiResult = await aiResponse.json();
        console.log("AI Server Response parsed:", aiResult);
      } catch (e) {
        console.error("Failed to parse AI response:", e);
        setIsAnalyzing(false);
        // 🎯 MODULE 11: Fallback if CORS blocks the 400 Bad Request error payload
        if (!aiResponse.ok && aiResponse.status === 400) {
          showNotification('Anti-Cheat / AI Error: Duplicate image detected or invalid submission request!', 'error');
          setLoading(false);
          return;
        }
        showNotification('Failed to connect to AI server.', 'error');
        setLoading(false);
        return;
      }
      setIsAnalyzing(false); // Turn off AI spinner

      // 🎯 MODULE 11: Display specific Anti-Cheat notification
      // Look for the specific error property returned by the backend on duplicate.
      if (aiResult?.status === 'REJECTED' || (aiResult?.error && aiResult.error.includes("Duplicate"))) {
        const errorMsg = aiResult.error || "Duplicate image detected. You cannot farm points!";
        showNotification(`🚨 Anti-Cheat Alert: ${errorMsg}`, "error");
        setLoading(false);
        return;
      }

      if (!aiResponse.ok && aiResult?.error) {
        showNotification(`AI Error: ${aiResult.error}`, "error");
        setLoading(false);
        return;
      }

      // If AI rejects it, stop the submission process!
      if (aiResult?.verdict !== 'VERIFIED') {
        const msg = aiResult?.message || 'The AI could not confidently identify a seedling. Please retake the photo.';
        showNotification(`AI Verification Failed: ${msg}`, "error");
        setLoading(false);
        return;
      }

      // (imagePayload is already generated above)

      // Step B: Send to Node.js Backend
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

        // --- START BLOCKCHAIN SAVE ---
        try {
          console.log("Backend success. Now saving to Blockchain...");

          const txHash = await saveMissionToBlockchain(
            `Agent ${username}`,
            mission.title
          );

          console.log("Blockchain Success! Hash:", txHash);
          setSubmitted(true);

          const msg = `1. Verified by AI!\n2. Saved to DB.\n3. Verified on Blockchain!\n\nHash:\n${txHash}`;

          navigation.navigate('Home', { screen: 'HomeTab', params: { userId, refresh: true } });
          showNotification("🚀 Triple Success! Verified by AI, DB, & Blockchain.", "success");

        } catch (blockchainError: any) {
          console.error("Blockchain Failed:", blockchainError);
          const errorMsg = "Photo saved, but Blockchain verification failed: " + blockchainError.message;

          showNotification(errorMsg, "info");
          setSubmitted(true);
          setTimeout(() => navigation.navigate('Home', { screen: 'HomeTab', params: { userId, refresh: true } }), 2000);
        }
        // --------------------------------

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
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
            <Text style={styles.sectionTitle}>Mission Brief</Text>
            <Text style={styles.pointsHighlight}>{mission.points} Points</Text>
          </View>

          <Text style={styles.description}>
            {mission.description || `This mission contributes to Goal ${mission.sdgNumber}. Participate in a local activity to support this goal.`}
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

        {/* 🎯 MODULE 10 FIX: Dynamic AI Loading Button */}
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: imageUri ? (mission.color || '#3b82f6') : '#cbd5e1' }]}
          disabled={!imageUri || submitted || loading || isAnalyzing}
          onPress={handleSubmit}
        >
          {isAnalyzing ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.submitBtnText}>Analyzing AI...</Text>
            </View>
          ) : loading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.submitBtnText}>Saving to Blockchain...</Text>
            </View>
          ) : (
            <Text style={styles.submitBtnText}>{submitted ? "Verified & Submitted!" : "Verify Seedling"}</Text>
          )}
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