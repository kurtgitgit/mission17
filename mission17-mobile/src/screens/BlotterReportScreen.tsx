import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TextInput,
  TouchableOpacity, ScrollView, ActivityIndicator, Platform
} from 'react-native';
import { ArrowLeft, Camera, ShieldAlert, CheckCircle } from 'lucide-react-native';
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

  // Inline validation & feedback state
  const [errors, setErrors]           = useState<Record<string, string>>({});
  const [successRef, setSuccessRef]   = useState<string | null>(null);
  const [submitError, setSubmitError] = useState('');

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

  // ─── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const newErrors: Record<string, string> = {};

    const cleanLocation = location.trim();
    if (!cleanLocation || cleanLocation.length < 5 || !/[a-zA-Z]/.test(cleanLocation) || /^(.)\1+$/.test(cleanLocation))
      newErrors.location = 'Please enter a valid and specific location.';

    const cleanDesc = description.trim();
    if (!cleanDesc || cleanDesc.length < 10 || !/[a-zA-Z]/.test(cleanDesc) || /^(.)\1+$/.test(cleanDesc))
      newErrors.description = 'Please provide a detailed description (at least 10 characters, with real words).';

    return newErrors;
  };

  // ─── Submit ────────────────────────────────────────────────────────────────
  const submitReport = async () => {
    const newErrors = validate();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitError('');
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

      const data = await res.json();
      if (res.ok) {
        setSuccessRef(data.referenceNumber || data.blotter?.referenceNumber || 'N/A');
        setDescription('');
        setLocation('');
        setEvidenceUri('');
        setEvidenceBase64('');
        setErrors({});
      } else {
        setSubmitError(data.message || 'Failed to submit the report. Please try again.');
      }
    } catch {
      setSubmitError('Network error. Please check your connection and try again.');
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

        {/* ── SUCCESS CARD ── */}
        {successRef && (
          <View style={styles.successCard}>
            <CheckCircle size={40} color="#16a34a" style={{ marginBottom: 8 }} />
            <Text style={styles.successTitle}>Report Filed Successfully!</Text>
            <Text style={styles.successBody}>Your blotter report has been received by the barangay.</Text>
            <Text style={styles.successRef}>
              Reference No: <Text style={styles.successRefNum}>{successRef}</Text>
            </Text>
            <Text style={styles.successBody}>You will be notified of any updates on your report.</Text>
            <TouchableOpacity
              style={styles.successBtn}
              onPress={() => { setSuccessRef(null); navigation.navigate('BlotterHistory'); }}
            >
              <Text style={styles.successBtnText}>View My Reports →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── ERROR BANNER ── */}
        {submitError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>⚠️ {submitError}</Text>
            <TouchableOpacity onPress={() => setSubmitError('')}>
              <Text style={styles.errorBannerClose}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : null}

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
          style={[sharedStyles.input, errors.location ? styles.inputError : null]}
          placeholder="E.g. Pantal Bridge, Zone 4"
          placeholderTextColor={colors.textMuted}
          value={location}
          onChangeText={(t) => { setLocation(t); setErrors(e => ({ ...e, location: '' })); }}
        />
        {errors.location ? <Text style={styles.errorText}>{errors.location}</Text> : null}

        {/* DESCRIPTION */}
        <Text style={[styles.label, { marginTop: spacing.md }]}>Incident Description</Text>
        <TextInput
          style={[sharedStyles.input, styles.textArea, errors.description ? styles.inputError : null]}
          placeholder="Provide a detailed account of what happened..."
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={(t) => { setDescription(t); setErrors(e => ({ ...e, description: '' })); }}
          multiline
          textAlignVertical="top"
        />
        {errors.description ? <Text style={styles.errorText}>{errors.description}</Text> : null}

        {/* PHOTO UPLOAD */}
        <Text style={[styles.label, { marginTop: spacing.md }]}>Evidence / Photo (Optional)</Text>
        <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
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

  // Inline validation
  inputError:   { borderColor: '#dc2626', backgroundColor: '#fff5f5' },
  errorText:    { fontSize: 11, color: '#dc2626', marginBottom: 10, marginLeft: 4, fontWeight: '600' },

  // Error banner
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fee2e2', borderWidth: 1, borderColor: '#dc2626',
    borderRadius: 10, padding: 12, marginBottom: 16,
  },
  errorBannerText:  { flex: 1, fontSize: 13, color: '#991b1b', fontWeight: '600' },
  errorBannerClose: { fontSize: 16, color: '#dc2626', marginLeft: 8, fontWeight: '800' },

  // Success card
  successCard: {
    backgroundColor: '#f0fdf4', borderWidth: 1.5, borderColor: '#16a34a',
    borderRadius: 14, padding: 20, marginBottom: 20, alignItems: 'center',
  },
  successTitle:   { fontSize: 18, fontWeight: '900', color: '#15803d', marginBottom: 6 },
  successBody:    { fontSize: 13, color: '#166534', textAlign: 'center', lineHeight: 20, marginBottom: 4 },
  successRef:     { fontSize: 13, color: '#166534', textAlign: 'center', marginBottom: 10 },
  successRefNum:  { fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  successBtn: {
    marginTop: 10, backgroundColor: '#16a34a', borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 24,
  },
  successBtnText: { color: 'white', fontWeight: '800', fontSize: 14 },
});

export default BlotterReportScreen;
