import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, MapPin, Upload, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker'; // Import the library

const MissionDetailScreen = ({ route, navigation }) => {
  const { mission } = route.params; 
  const [image, setImage] = useState(null); // State to store the selected photo

  // Function to open phone gallery/camera
  const pickImage = async () => {
    // 1. Request Permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need access to your photos to upload proof!');
      return;
    }

    // 2. Open Picker
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    // 3. Save the image uri if user didn't cancel
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    if (!image) {
      Alert.alert("Missing Proof", "Please upload a photo proof before submitting!");
      return;
    }
    // Here we would send data to backend
    Alert.alert("Success!", "Mission submitted for verification. Points will be awarded soon.");
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Mission Header Image */}
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imageText}>{mission.title} Image</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.badge}>{mission.category}</Text>
            <Text style={styles.points}>+{mission.points} Pts</Text>
          </View>

          <Text style={styles.title}>{mission.title}</Text>
          
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Clock size={16} color="#64748b" />
              <Text style={styles.metaText}>Due: {mission.date}</Text>
            </View>
            <View style={styles.metaItem}>
              <MapPin size={16} color="#64748b" />
              <Text style={styles.metaText}>Barangay Hall</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>
            Join us for a community cleanup event. Please bring your own gloves if possible. 
            Take a photo of the trash bags you collected to earn your points!
          </Text>

          {/* Upload Proof Section */}
          <Text style={styles.sectionTitle}>Proof of Action</Text>
          
          {image ? (
            // If image is selected, show preview
            <View style={styles.previewContainer}>
              <Image source={{ uri: image }} style={styles.previewImage} />
              <TouchableOpacity style={styles.removeBtn} onPress={() => setImage(null)}>
                <X size={20} color="white" />
              </TouchableOpacity>
              <Text style={styles.successText}>Photo ready to submit!</Text>
            </View>
          ) : (
            // If no image, show upload button
            <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
              <Upload size={32} color="#3b82f6" />
              <Text style={styles.uploadText}>Tap to Upload Photo</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[styles.submitBtn, { backgroundColor: image ? '#3b82f6' : '#94a3b8' }]} 
            onPress={handleSubmit}
            disabled={!image}
          >
            <Text style={styles.submitBtnText}>Submit Mission</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  imagePlaceholder: {
    height: 180,
    backgroundColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageText: { color: '#64748b', fontWeight: 'bold' },
  content: { padding: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  badge: { 
    backgroundColor: '#dcfce7', color: '#166534', 
    paddingHorizontal: 10, paddingVertical: 4, 
    borderRadius: 8, fontSize: 12, fontWeight: 'bold' 
  },
  points: { color: '#eab308', fontWeight: 'bold', fontSize: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginBottom: 15 },
  metaRow: { flexDirection: 'row', gap: 15, marginBottom: 20 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { color: '#64748b' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, marginTop: 10, color: '#0f172a' },
  description: { color: '#475569', lineHeight: 22, marginBottom: 20 },
  
  // Upload Styles
  uploadBox: {
    height: 150,
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  uploadText: { color: '#3b82f6', fontWeight: '600', marginTop: 10 },
  
  // Image Preview Styles
  previewContainer: { marginBottom: 30, position: 'relative' },
  previewImage: { width: '100%', height: 200, borderRadius: 12 },
  removeBtn: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)', padding: 5, borderRadius: 20
  },
  successText: { color: '#22c55e', fontWeight: 'bold', marginTop: 5, textAlign: 'center' },

  submitBtn: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});

export default MissionDetailScreen;