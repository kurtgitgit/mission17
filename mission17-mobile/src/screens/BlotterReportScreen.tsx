import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TextInput,
  TouchableOpacity, ScrollView, ActivityIndicator, Platform,
  Alert
} from 'react-native';
import { 
  ArrowLeft, Camera, ShieldCheck, CheckCircle, 
  Copy, Bookmark, Info, AlertCircle, RefreshCw, X, MapPin, Phone, User, FileText, Home, History
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { endpoints, GlobalState } from '../config/api';
import { colors, spacing, radius, shadow, sharedStyles, typography } from '../config/theme';

const INCIDENT_TYPES = ['Disturbance', 'Theft', 'Vandalism', 'Accident', 'Other'];

const DRAFT_STORAGE_KEY = 'brgy_blotter_draft_v1';

const BlotterReportScreen = () => {
  const navigation = useNavigation<any>();
  const [loading, setLoading]             = useState(false);
  const [fullName, setFullName]           = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [incidentType, setIncidentType]   = useState('Disturbance');
  const [customIncidentType, setCustomIncidentType] = useState('');
  const [description, setDescription]     = useState('');
  const [location, setLocation]           = useState('');
  const [evidenceUri, setEvidenceUri]     = useState('');
  const [evidenceBase64, setEvidenceBase64] = useState('');

  // Draft state
  const [hasDraft, setHasDraft]           = useState(false);
  const [draftSavedTime, setDraftSavedTime] = useState<string | null>(null);

  // Inline validation & feedback state
  const [errors, setErrors]               = useState<Record<string, string>>({});
  const [successRef, setSuccessRef]       = useState<string | null>(null);
  const [submitError, setSubmitError]     = useState('');
  const [copiedToast, setCopiedToast]     = useState(false);

  // Load draft on mount (Inclusivity: recovery for interrupted users)
  useEffect(() => {
    checkSavedDraft();
  }, []);

  const checkSavedDraft = async () => {
    try {
      const saved = await AsyncStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.fullName || parsed.description || parsed.location || parsed.customIncidentType) {
          setHasDraft(true);
          setDraftSavedTime(parsed.savedAt ? new Date(parsed.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null);
        }
      }
    } catch (e) {
      console.log('Error checking draft:', e);
    }
  };

  const restoreDraft = async () => {
    try {
      const saved = await AsyncStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.fullName) setFullName(parsed.fullName);
        if (parsed.contactNumber) setContactNumber(parsed.contactNumber);
        if (parsed.incidentType) setIncidentType(parsed.incidentType);
        if (parsed.customIncidentType) setCustomIncidentType(parsed.customIncidentType);
        if (parsed.description) setDescription(parsed.description);
        if (parsed.location) setLocation(parsed.location);
        setHasDraft(false);
      }
    } catch (e) {
      console.log('Error restoring draft:', e);
    }
  };

  const saveDraft = async () => {
    try {
      const draftData = {
        fullName,
        contactNumber,
        incidentType,
        customIncidentType,
        description,
        location,
        savedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
      Alert.alert('Draft Saved', 'Your report progress has been saved on this device.');
      setDraftSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (e) {
      Alert.alert('Error', 'Could not save draft.');
    }
  };

  const clearDraft = async () => {
    try {
      await AsyncStorage.removeItem(DRAFT_STORAGE_KEY);
      setHasDraft(false);
    } catch (e) {}
  };

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

  const removeImage = () => {
    setEvidenceUri('');
    setEvidenceBase64('');
  };

  // ─── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const newErrors: Record<string, string> = {};

    const cleanFullName = fullName.trim();
    if (!cleanFullName || cleanFullName.length < 3 || !/[a-zA-Z]/.test(cleanFullName))
      newErrors.fullName = 'Please enter your complete legal name.';

    const cleanContact = contactNumber.trim().replace(/\s/g, '');
    if (!/^09\d{9}$/.test(cleanContact) || /^(.)\1+$/.test(cleanContact))
      newErrors.contactNumber = 'Enter a valid 11-digit mobile number (e.g. 0917 123 4567).';

    if (incidentType === 'Other') {
      const cleanCustom = customIncidentType.trim();
      if (!cleanCustom || cleanCustom.length < 3 || !/[a-zA-Z]/.test(cleanCustom)) {
        newErrors.customIncidentType = 'Please specify the nature of the incident.';
      }
    }

    const cleanLocation = location.trim();
    if (!cleanLocation || cleanLocation.length < 5 || !/[a-zA-Z]/.test(cleanLocation) || /^(.)\1+$/.test(cleanLocation))
      newErrors.location = 'Please specify the exact street, purok, or landmark in Bagong Pag-asa.';

    const cleanDesc = description.trim();
    if (!cleanDesc || cleanDesc.length < 10 || !/[a-zA-Z]/.test(cleanDesc) || /^(.)\1+$/.test(cleanDesc))
      newErrors.description = 'Please describe what happened in detail (at least 10 characters).';

    return newErrors;
  };

  // ─── Submit ────────────────────────────────────────────────────────────────
  const submitReport = async () => {
    const newErrors = validate();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const finalDescription = (incidentType === 'Other' && customIncidentType.trim())
      ? `[Specified Concern: ${customIncidentType.trim()}]\n\n${description.trim()}`
      : description.trim();

    setSubmitError('');
    setLoading(true);
    try {
      const res = await fetch(`${endpoints.auth.backendBaseUrl}/api/blotter-reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId:          GlobalState.userId,
          username:        GlobalState.username || 'Resident',
          fullName:        fullName.trim(),
          contactNumber:   contactNumber.trim(),
          incidentType:    incidentType,
          description:     finalDescription,
          location:        location.trim(),
          dateOfIncident:  new Date().toISOString(),
          evidenceUrl:     evidenceBase64 || null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        const ref = data.referenceNumber || data.blotter?.referenceNumber || 'BLOTTER-' + Date.now().toString().slice(-6);
        setSuccessRef(ref);
        setFullName('');
        setContactNumber('');
        setCustomIncidentType('');
        setDescription('');
        setLocation('');
        setEvidenceUri('');
        setEvidenceBase64('');
        setErrors({});
        await clearDraft();
      } else {
        setSubmitError(data.message || 'Failed to submit the report. Please try again.');
      }
    } catch {
      setSubmitError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyReferenceToClipboard = () => {
    if (!successRef) return;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(successRef);
    }
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  // ─── SCREEN 3: DEDICATED FEEDBACK / SUCCESS VIEW ────────────────────────────
  if (successRef) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={sharedStyles.header}>
          <Text style={sharedStyles.headerTitle}>Submission Confirmation</Text>
        </View>
        <ScrollView contentContainerStyle={styles.successContainer} showsVerticalScrollIndicator={false}>
          
          <View style={styles.successBadgeCircle}>
            <CheckCircle size={56} color="#16a34a" />
          </View>

          <Text style={styles.successHeroTitle}>Blotter Report Filed</Text>
          <Text style={styles.successHeroSubtitle}>
            Your incident report has been securely registered with Barangay Bagong Pag-asa.
          </Text>

          {/* REFERENCE NUMBER CARD */}
          <View style={styles.refCard}>
            <Text style={styles.refLabel}>OFFICIAL REFERENCE NUMBER</Text>
            <Text style={styles.refValue}>{successRef}</Text>
            <TouchableOpacity 
              style={styles.copyBtn} 
              onPress={copyReferenceToClipboard}
              accessibilityRole="button"
              accessibilityLabel="Copy Reference Number"
            >
              <Copy size={16} color="#0038A8" />
              <Text style={styles.copyBtnText}>{copiedToast ? 'Copied to Clipboard! ✓' : 'Copy Reference ID'}</Text>
            </TouchableOpacity>
          </View>

          {/* NEXT STEPS TIMELINE */}
          <View style={styles.timelineCard}>
            <Text style={styles.timelineTitle}>What happens next?</Text>
            
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, styles.timelineDotDone]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineHeading}>1. Report Queued</Text>
                <Text style={styles.timelineDesc}>Logged into the official barangay blotter register.</Text>
              </View>
            </View>

            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, styles.timelineDotActive]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineHeading}>2. Desk Officer Review</Text>
                <Text style={styles.timelineDesc}>An assigned barangay officer will verify the details within 24 hours.</Text>
              </View>
            </View>

            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineHeading}>3. Status & Hearing Schedule</Text>
                <Text style={styles.timelineDesc}>You will receive notifications if a hearing or mediation is scheduled.</Text>
              </View>
            </View>
          </View>

          {/* ACTION BUTTONS */}
          <TouchableOpacity
            style={styles.primaryActionBtn}
            onPress={() => { setSuccessRef(null); navigation.navigate('BlotterHistory'); }}
            accessibilityRole="button"
            accessibilityLabel="Track in Blotter History"
          >
            <Text style={styles.primaryActionBtnText}>Track in Blotter History →</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.homeActionBtn}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Return to Home Screen"
          >
            <Home size={18} color="#0038A8" style={{ marginRight: 8 }} />
            <Text style={styles.homeActionBtnText}>Return to Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryActionBtn}
            onPress={() => setSuccessRef(null)}
            accessibilityRole="button"
            accessibilityLabel="File Another Report"
          >
            <Text style={styles.secondaryActionBtnText}>File Another Report</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── SCREEN 2: MAIN TASK FORM (CHUNKED & ACCESSIBLE) ─────────────────────────
  return (
    <SafeAreaView style={styles.root}>
      {/* HEADER */}
      <View style={sharedStyles.header}>
        <TouchableOpacity 
          style={sharedStyles.backBtn} 
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Back to previous screen"
        >
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={sharedStyles.headerTitle}>File a Blotter Report</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <TouchableOpacity 
            style={styles.headerDraftBtn}
            onPress={() => navigation.navigate('BlotterHistory')}
            accessibilityRole="button"
            accessibilityLabel="Track Blotter History"
          >
            <History size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerDraftBtn}
            onPress={saveDraft}
            accessibilityRole="button"
            accessibilityLabel="Save Draft"
          >
            <Bookmark size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* ── TRACK HISTORY DIRECT SHORTCUT ── */}
        <TouchableOpacity 
          style={styles.historyShortcutBanner}
          onPress={() => navigation.navigate('BlotterHistory')}
          accessibilityRole="button"
          accessibilityLabel="Track my past blotter reports"
        >
          <History size={16} color="#0038A8" />
          <Text style={styles.historyShortcutText}>
            Looking for your past filed reports? <Text style={styles.historyShortcutLink}>Track My Reports →</Text>
          </Text>
        </TouchableOpacity>

        {/* RESTORE DRAFT BANNER (Inclusivity: recovery for user) */}
        {hasDraft && (
          <View style={styles.draftBanner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.draftBannerTitle}>Saved Draft Available</Text>
              <Text style={styles.draftBannerSubtitle}>
                {draftSavedTime ? `Saved at ${draftSavedTime}. ` : ''}Restore your previous entries?
              </Text>
            </View>
            <TouchableOpacity style={styles.restoreBtn} onPress={restoreDraft}>
              <Text style={styles.restoreBtnText}>Restore</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setHasDraft(false)} style={{ padding: 4, marginLeft: 6 }}>
              <X size={18} color="#64748b" />
            </TouchableOpacity>
          </View>
        )}

        {/* ── ERROR BANNER ── */}
        {submitError ? (
          <View style={styles.errorBanner}>
            <AlertCircle size={20} color="#991b1b" style={{ marginRight: 8 }} />
            <Text style={styles.errorBannerText}>{submitError}</Text>
            <TouchableOpacity onPress={() => setSubmitError('')}>
              <Text style={styles.errorBannerClose}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* OFFICIAL NOTICE BANNER (Reassuring language) */}
        <View style={styles.noticeBanner}>
          <ShieldCheck size={22} color="#0038A8" style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.noticeBannerTitle}>Official Community Report</Text>
            <Text style={styles.noticeBannerText}>
              Please provide truthful and accurate information to assist our Barangay Officers in prompt investigation.
            </Text>
          </View>
        </View>

        {/* ──────────────────────────────────────────────────────────────────
            CARD 1: COMPLAINANT INFORMATION
        ─────────────────────────────────────────────────────────────────── */}
        <View style={styles.formCard}>
          <View style={styles.cardHeader}>
            <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>1</Text></View>
            <Text style={styles.cardTitle}>Complainant Information</Text>
          </View>

          {/* FULL NAME */}
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>
              Full Legal Name <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View style={[styles.inputBox, errors.fullName ? styles.inputBoxError : null]}>
              <User size={18} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.textInputField}
                placeholder="e.g. Juan C. dela Cruz"
                placeholderTextColor={colors.textMuted}
                value={fullName}
                onChangeText={(t) => { setFullName(t); setErrors(e => ({ ...e, fullName: '' })); }}
                accessibilityLabel="Full Legal Name"
              />
            </View>
            {errors.fullName ? (
              <View style={styles.errorRow}>
                <AlertCircle size={13} color="#dc2626" />
                <Text style={styles.errorText}>{errors.fullName}</Text>
              </View>
            ) : null}
          </View>

          {/* CONTACT NUMBER */}
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>
              Contact / Mobile Number <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View style={[styles.inputBox, errors.contactNumber ? styles.inputBoxError : null]}>
              <Phone size={18} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.textInputField}
                placeholder="0917 123 4567"
                placeholderTextColor={colors.textMuted}
                value={contactNumber}
                onChangeText={(t) => { setContactNumber(t); setErrors(e => ({ ...e, contactNumber: '' })); }}
                keyboardType="phone-pad"
                maxLength={11}
                accessibilityLabel="Contact Number"
              />
            </View>
            {errors.contactNumber ? (
              <View style={styles.errorRow}>
                <AlertCircle size={13} color="#dc2626" />
                <Text style={styles.errorText}>{errors.contactNumber}</Text>
              </View>
            ) : (
              <Text style={styles.helperText}>Used by the desk officer to send hearing notifications.</Text>
            )}
          </View>
        </View>

        {/* ──────────────────────────────────────────────────────────────────
            CARD 2: INCIDENT CLASSIFICATION & LOCATION
        ─────────────────────────────────────────────────────────────────── */}
        <View style={styles.formCard}>
          <View style={styles.cardHeader}>
            <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>2</Text></View>
            <Text style={styles.cardTitle}>Incident Classification</Text>
          </View>

          {/* INCIDENT TYPE SELECTOR */}
          <Text style={styles.fieldLabel}>
            Incident Category <Text style={styles.requiredStar}>*</Text>
          </Text>
          <View style={styles.chipGrid}>
            {INCIDENT_TYPES.map(type => {
              const isSelected = incidentType === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeChip, isSelected && styles.typeChipActive]}
                  onPress={() => setIncidentType(type)}
                  accessibilityRole="button"
                  accessibilityLabel={`Select incident type: ${type}`}
                >
                  <Text style={[styles.chipLabel, isSelected && styles.chipLabelActive]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* DYNAMIC SPECIFY FIELD WHEN 'OTHER' IS SELECTED */}
          {incidentType === 'Other' && (
            <View style={[styles.inputGroup, { marginTop: 12 }]}>
              <Text style={styles.fieldLabel}>
                Specify Incident Type <Text style={styles.requiredStar}>*</Text>
              </Text>
              <View style={[styles.inputBox, errors.customIncidentType ? styles.inputBoxError : null]}>
                <FileText size={18} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInputField}
                  placeholder="e.g. Noise Complaint, Property Boundary Dispute"
                  placeholderTextColor={colors.textMuted}
                  value={customIncidentType}
                  onChangeText={(t) => { setCustomIncidentType(t); setErrors(e => ({ ...e, customIncidentType: '' })); }}
                  accessibilityLabel="Specify Custom Incident Type"
                />
              </View>
              {errors.customIncidentType ? (
                <View style={styles.errorRow}>
                  <AlertCircle size={13} color="#dc2626" />
                  <Text style={styles.errorText}>{errors.customIncidentType}</Text>
                </View>
              ) : null}
            </View>
          )}

          {/* LOCATION */}
          <View style={[styles.inputGroup, { marginTop: 14 }]}>
            <Text style={styles.fieldLabel}>
              Location of Incident <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View style={[styles.inputBox, errors.location ? styles.inputBoxError : null]}>
              <MapPin size={18} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.textInputField}
                placeholder="e.g. Purok 3, Near Bagong Pag-asa Chapel"
                placeholderTextColor={colors.textMuted}
                value={location}
                onChangeText={(t) => { setLocation(t); setErrors(e => ({ ...e, location: '' })); }}
                accessibilityLabel="Location of Incident"
              />
            </View>
            {errors.location ? (
              <View style={styles.errorRow}>
                <AlertCircle size={13} color="#dc2626" />
                <Text style={styles.errorText}>{errors.location}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* ──────────────────────────────────────────────────────────────────
            CARD 3: INCIDENT DETAILS & EVIDENCE
        ─────────────────────────────────────────────────────────────────── */}
        <View style={styles.formCard}>
          <View style={styles.cardHeader}>
            <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>3</Text></View>
            <Text style={styles.cardTitle}>Statement & Evidence</Text>
          </View>

          {/* DESCRIPTION WITH LIVE CHAR COUNT */}
          <View style={styles.inputGroup}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.fieldLabel}>
                Detailed Narrative <Text style={styles.requiredStar}>*</Text>
              </Text>
              <Text style={[styles.charCounter, description.length > 500 && { color: '#dc2626' }]}>
                {description.length} / 500 chars
              </Text>
            </View>
            <TextInput
              style={[styles.textAreaField, errors.description ? styles.inputBoxError : null]}
              placeholder="State what happened, who was involved, time, and circumstances..."
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={(t) => { setDescription(t); setErrors(e => ({ ...e, description: '' })); }}
              multiline
              maxLength={500}
              textAlignVertical="top"
              accessibilityLabel="Detailed Narrative of the incident"
            />
            {errors.description ? (
              <View style={styles.errorRow}>
                <AlertCircle size={13} color="#dc2626" />
                <Text style={styles.errorText}>{errors.description}</Text>
              </View>
            ) : null}
          </View>

          {/* PHOTO EVIDENCE */}
          <View style={[styles.inputGroup, { marginTop: 12 }]}>
            <Text style={styles.fieldLabel}>Photo Evidence (Optional)</Text>
            {evidenceUri ? (
              <View style={styles.photoPreviewContainer}>
                <Image source={{ uri: evidenceUri }} style={styles.photoPreview} resizeMode="cover" />
                <View style={styles.photoActions}>
                  <TouchableOpacity style={styles.photoActionBtn} onPress={pickImage}>
                    <RefreshCw size={14} color="#1e40af" />
                    <Text style={styles.photoActionText}>Change Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.photoActionBtn, { borderColor: '#fca5a5' }]} onPress={removeImage}>
                    <X size={14} color="#dc2626" />
                    <Text style={[styles.photoActionText, { color: '#dc2626' }]}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.uploadBox} 
                onPress={pickImage}
                accessibilityRole="button"
                accessibilityLabel="Tap to attach photo evidence"
              >
                <View style={styles.uploadIconCircle}>
                  <Camera size={24} color="#0038A8" />
                </View>
                <Text style={styles.uploadTitle}>Attach Photo Evidence</Text>
                <Text style={styles.uploadSubtitle}>Photos of damage, incident area, or supporting files</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

      </ScrollView>

      {/* FOOTER CTA WITH DRAFT SAVE & SUBMIT */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.draftFooterBtn}
          onPress={saveDraft}
          accessibilityRole="button"
          accessibilityLabel="Save Draft for later"
        >
          <Bookmark size={18} color="#0038A8" />
          <Text style={styles.draftFooterBtnText}>Save Draft</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitFooterBtn, loading && styles.btnDisabled]}
          onPress={submitReport}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Submit Incident Report"
        >
          {loading
            ? <ActivityIndicator color="white" />
            : <Text style={styles.submitFooterBtnText}>Submit Report →</Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f1f5f9' },
  container: { padding: 14, paddingBottom: 30 },
  headerDraftBtn: { padding: 6 },

  // Notice Banner
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
  },
  noticeBannerTitle: { fontSize: 14, fontWeight: '800', color: '#1e3a8a', marginBottom: 2 },
  noticeBannerText: { fontSize: 12.5, color: '#1e40af', lineHeight: 18, fontWeight: '500' },

  // Draft Banner
  draftBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  draftBannerTitle: { fontSize: 13, fontWeight: '800', color: '#92400e' },
  draftBannerSubtitle: { fontSize: 11.5, color: '#b45309', fontWeight: '500' },
  restoreBtn: {
    backgroundColor: '#d97706',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  restoreBtnText: { color: 'white', fontWeight: '800', fontSize: 12 },

  // Form Cards (Hierarchy & Chunking)
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#0038A8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBadgeText: { color: 'white', fontWeight: '800', fontSize: 13 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },

  // Inputs
  inputGroup: { marginBottom: 12 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 6 },
  requiredStar: { color: '#dc2626' },
  helperText: { fontSize: 11, color: '#64748b', marginTop: 4, marginLeft: 2 },
  charCounter: { fontSize: 11, color: '#64748b', fontWeight: '600' },

  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    height: 50,
  },
  inputBoxError: {
    borderColor: '#dc2626',
    backgroundColor: '#fff5f5',
  },
  inputIcon: { marginRight: 10 },
  textInputField: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '500',
    ...Platform.select({ web: { outlineStyle: 'none' as any } })
  },
  textAreaField: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    padding: 12,
    height: 120,
    fontSize: 14.5,
    color: '#0f172a',
    fontWeight: '500',
    ...Platform.select({ web: { outlineStyle: 'none' as any } })
  },

  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, marginLeft: 2 },
  errorText: { fontSize: 11.5, color: '#dc2626', fontWeight: '700' },

  // Incident Type Grid
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
  },
  typeChipActive: {
    backgroundColor: '#0038A8',
    borderColor: '#0038A8',
  },
  chipLabel: { fontSize: 13, fontWeight: '700', color: '#475569' },
  chipLabelActive: { color: '#ffffff', fontWeight: '800' },

  // Upload Box
  uploadBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  uploadTitle: { fontSize: 14, fontWeight: '800', color: '#0038A8', marginBottom: 2 },
  uploadSubtitle: { fontSize: 11.5, color: '#64748b', textAlign: 'center' },

  photoPreviewContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  photoPreview: { width: '100%', height: 180 },
  photoActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  photoActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#ffffff',
  },
  photoActionText: { fontSize: 12, fontWeight: '700', color: '#1e40af' },

  // Error Banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    borderWidth: 1.5,
    borderColor: '#dc2626',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  errorBannerText: { flex: 1, fontSize: 13, color: '#991b1b', fontWeight: '700' },
  errorBannerClose: { fontSize: 16, color: '#dc2626', marginLeft: 8, fontWeight: '800' },

  // Footer Actions
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 4,
  },
  draftFooterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
  },
  draftFooterBtnText: { color: '#0038A8', fontWeight: '800', fontSize: 14 },
  submitFooterBtn: {
    flex: 1,
    backgroundColor: '#0038A8',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0038A8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitFooterBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 15, letterSpacing: 0.3 },
  btnDisabled: { opacity: 0.65 },

  // ─── SUCCESS SCREEN STYLES (Screen 3) ────────────────────────────────────────
  successContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    flexGrow: 1,
    justifyContent: 'center',
  },
  successBadgeCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#86efac',
  },
  successHeroTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#15803d',
    marginBottom: 8,
    textAlign: 'center',
  },
  successHeroSubtitle: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  refCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  refLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  refValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0038A8',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 12,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  copyBtnText: {
    color: '#0038A8',
    fontWeight: '800',
    fontSize: 12.5,
  },
  timelineCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 24,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 14,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#cbd5e1',
    marginTop: 4,
    marginRight: 12,
  },
  timelineDotDone: {
    backgroundColor: '#16a34a',
  },
  timelineDotActive: {
    backgroundColor: '#0038A8',
  },
  timelineContent: {
    flex: 1,
  },
  timelineHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 2,
  },
  timelineDesc: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
  },
  primaryActionBtn: {
    width: '100%',
    backgroundColor: '#0038A8',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#0038A8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryActionBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15,
  },
  homeActionBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    marginBottom: 10,
  },
  homeActionBtnText: {
    color: '#0038A8',
    fontWeight: '800',
    fontSize: 14,
  },
  secondaryActionBtn: {
    width: '100%',
    backgroundColor: '#ffffff',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
  },
  secondaryActionBtnText: {
    color: '#475569',
    fontWeight: '800',
    fontSize: 14,
  },
  historyShortcutBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#eff6ff',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginBottom: 14,
  },
  historyShortcutText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
    flex: 1,
  },
  historyShortcutLink: {
    color: '#0038A8',
    fontWeight: '800',
  },
});

export default BlotterReportScreen;

