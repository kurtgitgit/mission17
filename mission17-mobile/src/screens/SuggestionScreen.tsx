import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TextInput,
  TouchableOpacity, ScrollView, ActivityIndicator, Platform
} from 'react-native';
import { ArrowLeft, Send, CheckCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { endpoints, GlobalState } from '../config/api';
import { colors, spacing, radius, sharedStyles, typography } from '../config/theme';

const CATEGORIES = ['Infrastructure', 'Events', 'Safety', 'Cleanliness', 'Other'];

const SuggestionScreen = () => {
  const navigation = useNavigation<any>();
  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory]       = useState('Other');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading]         = useState(false);

  // Inline feedback state
  const [errors, setErrors]           = useState<Record<string, string>>({});
  const [success, setSuccess]         = useState(false);
  const [submitError, setSubmitError] = useState('');

  // ─── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    const newErrors: Record<string, string> = {};

    const cleanTitle = title.trim();
    if (!cleanTitle || cleanTitle.length < 5 || !/[a-zA-Z]/.test(cleanTitle) || /^(.)\1+$/.test(cleanTitle))
      newErrors.title = 'Please enter a clear and descriptive title (at least 5 characters).';

    const cleanDesc = description.trim();
    if (!cleanDesc || cleanDesc.length < 10 || !/[a-zA-Z]/.test(cleanDesc) || /^(.)\1+$/.test(cleanDesc))
      newErrors.description = 'Please describe your feedback in detail (at least 10 characters).';

    return newErrors;
  };

  // ─── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const newErrors = validate();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitError('');
    setLoading(true);
    try {
      const res = await fetch(`${endpoints.auth.backendBaseUrl}/api/suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId:      GlobalState.userId,
          username:    GlobalState.username,
          title: title.trim(),
          description: description.trim(),
          category,
          isAnonymous,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTitle(''); setDescription(''); setErrors({});
      } else {
        const data = await res.json();
        setSubmitError(data.message || 'Failed to submit your feedback. Please try again.');
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
        <Text style={sharedStyles.headerTitle}>eFeedback</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* ── SUCCESS CARD ── */}
        {success && (
          <View style={styles.successCard}>
            <CheckCircle size={40} color="#16a34a" style={{ marginBottom: 8 }} />
            <Text style={styles.successTitle}>Feedback Submitted! 🎉</Text>
            <Text style={styles.successBody}>
              Your suggestion has been sent to the Barangay. Your voice helps make Barangay Pantal better for everyone!
            </Text>
            <TouchableOpacity
              style={styles.successBtn}
              onPress={() => { setSuccess(false); navigation.goBack(); }}
            >
              <Text style={styles.successBtnText}>Back to Home</Text>
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

        {/* CATEGORY CHIPS */}
        <Text style={styles.label}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[sharedStyles.chip, category === cat && sharedStyles.chipActive, { marginRight: spacing.sm }]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[sharedStyles.chipText, category === cat && sharedStyles.chipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* TITLE */}
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={[sharedStyles.input, errors.title ? styles.inputError : null]}
          placeholder="E.g. Fix the streetlight on Main St."
          placeholderTextColor={colors.textMuted}
          value={title}
          onChangeText={(t) => { setTitle(t); setErrors(e => ({ ...e, title: '' })); }}
        />
        {errors.title ? <Text style={styles.errorText}>{errors.title}</Text> : null}

        {/* DESCRIPTION */}
        <Text style={[styles.label, { marginTop: spacing.md }]}>Description</Text>
        <TextInput
          style={[sharedStyles.input, styles.textArea, errors.description ? styles.inputError : null]}
          placeholder="Describe your suggestion or feedback in detail..."
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={6}
          value={description}
          onChangeText={(t) => { setDescription(t); setErrors(e => ({ ...e, description: '' })); }}
          textAlignVertical="top"
        />
        {errors.description ? <Text style={styles.errorText}>{errors.description}</Text> : null}

        {/* ANONYMOUS TOGGLE */}
        <TouchableOpacity style={styles.checkboxRow} onPress={() => setIsAnonymous(!isAnonymous)}>
          <View style={[styles.checkbox, isAnonymous && styles.checkboxOn]}>
            {isAnonymous && <View style={styles.checkDot} />}
          </View>
          <View>
            <Text style={styles.checkboxLabel}>Submit Anonymously</Text>
            <Text style={styles.checkboxHint}>The admin will not see your name or account.</Text>
          </View>
        </TouchableOpacity>

      </ScrollView>

      {/* FOOTER */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[sharedStyles.primaryBtn, loading && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="white" />
            : <>
                <Send size={18} color="white" />
                <Text style={sharedStyles.primaryBtnText}>Submit Feedback</Text>
              </>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root:      { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.md, paddingBottom: spacing.xl },
  label:     { ...typography.label, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  textArea:  { height: 130, paddingTop: spacing.md },

  // Inline validation
  inputError: { borderColor: '#dc2626', backgroundColor: '#fff5f5' },
  errorText:  { fontSize: 11, color: '#dc2626', marginBottom: 10, marginLeft: 4, fontWeight: '600' },

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
  successTitle:   { fontSize: 18, fontWeight: '900', color: '#15803d', marginBottom: 6, textAlign: 'center' },
  successBody:    { fontSize: 13, color: '#166534', textAlign: 'center', lineHeight: 20, marginBottom: 10 },
  successBtn: {
    marginTop: 10, backgroundColor: '#16a34a', borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 24,
  },
  successBtnText: { color: 'white', fontWeight: '800', fontSize: 14 },

  // Anonymous toggle
  checkboxRow:   { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg, padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  checkbox:      { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  checkboxOn:    { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  checkDot:      { width: 12, height: 12, backgroundColor: colors.primary, borderRadius: 3 },
  checkboxLabel: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  checkboxHint:  { fontSize: 12, color: colors.textMuted, marginTop: 2 },

  footer: { padding: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
});

export default SuggestionScreen;
