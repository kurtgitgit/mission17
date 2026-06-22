import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TextInput,
  TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform
} from 'react-native';
import { ArrowLeft, Camera, ShieldAlert } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { endpoints, GlobalState } from '../config/api';
import { colors, spacing, radius, shadow, sharedStyles, typography } from '../config/theme';

const INCIDENT_TYPES = ['Theft', 'Vandalism', 'Disturbance', 'Accident', 'Other'];

const BlotterReportScreen = () => {
  const navigation = useNavigation<any>();
  const [loading, setLoading]           = useState(false);
  const [incidentType, setIncidentType] = useState('Disturbance');
  const [description, setDescription]   = useState('');
  const [location, setLocation]         = useState('');
  const [evidenceUri, setEvidenceUri]   = useState('');
  const [evidenceBase64, setEvidenceBase64] = useState('');

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setEvidenceUri(result.assets[0].uri);
      setEvidenceBase64(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const submitReport = async () => {
    if (!description.trim() || !location.trim()) {
      Alert.alert('Incomplete Form', 'Please fill in the incident description and location.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${endpoints.auth.backendBaseUrl}/api/blotter-reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId:          GlobalState.userId,
          username:        GlobalState.username || 'Resident',
          incidentType,
          description,
          location,
          dateOfIncident:  new Date().toISOString(),
          evidenceUrl:     evidenceBase64 || null,
        }),
      });

      if (!res.ok) throw new Error('Failed to submit');

      const data = await res.json();
      Alert.alert(
        '✅ Report Filed',
        `Your Blotter Report has been successfully filed.\n\nReference: ${data.referenceNumber}`,
        [{ text: 'Done', onPress: () => navigation.navigate('Home') }]
      );
    } catch {
      Alert.alert('Error', 'Failed to submit the report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* HEADER */}
      <View style={sharedStyles.header}>
        <TouchableOpacity style={sharedStyles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={sharedStyles.headerTitle}>File a Blotter Report</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* WARNING BANNER */}
        <View style={styles.warningBanner}>
          <ShieldAlert size={20} color={colors.statusDismissed.text} />
          <Text style={styles.warningText}>
            Falsifying a barangay report is a violation of law. Please provide accurate and truthful information.
          </Text>
        </View>

        {/* INCIDENT TYPE */}
        <Text style={styles.label}>Incident Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
          {INCIDENT_TYPES.map(type => (
            <TouchableOpacity
              key={type}
              style={[sharedStyles.chip, incidentType === type && sharedStyles.chipActive, { marginRight: spacing.sm }]}
              onPress={() => setIncidentType(type)}
            >
              <Text style={[sharedStyles.chipText, incidentType === type && sharedStyles.chipTextActive]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* LOCATION */}
        <Text style={styles.label}>Location of Incident</Text>
        <TextInput
          style={sharedStyles.input}
          placeholder="E.g. Pantal Bridge, Zone 4"
          placeholderTextColor={colors.textMuted}
          value={location}
          onChangeText={setLocation}
        />

        {/* DESCRIPTION */}
        <Text style={[styles.label, { marginTop: spacing.md }]}>Incident Description</Text>
        <TextInput
          style={[sharedStyles.input, styles.textArea]}
          placeholder="Provide a detailed account of what happened..."
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
          textAlignVertical="top"
        />

        {/* PHOTO UPLOAD */}
        <Text style={[styles.label, { marginTop: spacing.md }]}>Evidence / Photo (Optional)</Text>
        <TouchableOpacity
          style={styles.uploadBox}
          onPress={pickImage}
        >
          {evidenceUri ? (
            <Image source={{ uri: evidenceUri }} style={{ width: '100%', height: '100%', borderRadius: radius.md }} />
          ) : (
            <>
              <Camera size={28} color={colors.textMuted} />
              <Text style={styles.uploadText}>Tap to capture or upload photo</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* FOOTER CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[sharedStyles.primaryBtn, loading && styles.btnDisabled]}
          onPress={submitReport}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="white" />
            : <Text style={sharedStyles.primaryBtnText}>Submit Report</Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: colors.background },
  container:    { padding: spacing.md, paddingBottom: spacing.xl },
  label:        { ...typography.label, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  textArea:     { height: 130, paddingTop: spacing.md },
  warningBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.dangerLight, borderRadius: radius.md, padding: spacing.md,
    marginBottom: spacing.lg, borderLeftWidth: 4, borderLeftColor: colors.danger,
  },
  warningText:  { flex: 1, fontSize: 13, color: colors.danger, lineHeight: 20, fontWeight: '500' },
  uploadBox: {
    backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border,
    borderStyle: 'dashed', borderRadius: radius.md, height: 110,
    alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginBottom: spacing.lg,
  },
  uploadText:   { color: colors.textMuted, fontSize: 13, fontWeight: '500' },
  footer:       { padding: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  btnDisabled:  { opacity: 0.6 },
});

export default BlotterReportScreen;
