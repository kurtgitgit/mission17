import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TextInput,
  TouchableOpacity, ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { ArrowLeft, Send, MessageSquare, CheckCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { endpoints, GlobalState } from '../config/api';
import { colors, spacing, radius, shadow, sharedStyles, typography } from '../config/theme';

const CATEGORIES = ['Infrastructure', 'Events', 'Safety', 'Cleanliness', 'Other'];

const SuggestionScreen = () => {
  const navigation = useNavigation<any>();
  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory]     = useState('Other');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [submitted, setSubmitted]   = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Incomplete Form', 'Please fill in both the title and description.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${endpoints.auth.backendBaseUrl}/api/suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId:      GlobalState.userId,
          username:    GlobalState.username,
          title, description, category, isAnonymous,
        }),
      });

      if (!res.ok) throw new Error('Failed to submit');
      setSubmitted(true);
    } catch {
      Alert.alert('Error', 'Failed to submit your suggestion. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── SUCCESS STATE ──
  if (submitted) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={sharedStyles.header}>
          <TouchableOpacity style={sharedStyles.backBtn} onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          <Text style={sharedStyles.headerTitle}>Community Feedback</Text>
        </View>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <CheckCircle size={48} color={colors.primary} />
          </View>
          <Text style={styles.successTitle}>Thank You! 🎉</Text>
          <Text style={styles.successText}>
            Your suggestion has been submitted to the Barangay. Your voice helps make Barangay Pantal a better place for everyone!
          </Text>
          <TouchableOpacity style={[sharedStyles.primaryBtn, styles.successBtn]} onPress={() => navigation.goBack()}>
            <Text style={sharedStyles.primaryBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── FORM STATE ──
  return (
    <SafeAreaView style={styles.root}>
      <View style={sharedStyles.header}>
        <TouchableOpacity style={sharedStyles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={sharedStyles.headerTitle}>Submit Suggestion</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

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
          style={sharedStyles.input}
          placeholder="E.g. Fix the streetlight on Main St."
          placeholderTextColor={colors.textMuted}
          value={title}
          onChangeText={setTitle}
        />

        {/* DESCRIPTION */}
        <Text style={[styles.label, { marginTop: spacing.md }]}>Description</Text>
        <TextInput
          style={[sharedStyles.input, styles.textArea]}
          placeholder="Describe your suggestion or feedback in detail..."
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={6}
          value={description}
          onChangeText={setDescription}
          textAlignVertical="top"
        />

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

  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg, padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  checkbox:    { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  checkboxOn:  { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  checkDot:    { width: 12, height: 12, backgroundColor: colors.primary, borderRadius: 3 },
  checkboxLabel:{ fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  checkboxHint: { fontSize: 12, color: colors.textMuted, marginTop: 2 },

  footer: { padding: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },

  // Success state
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  successIcon:  { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg },
  successTitle: { ...typography.h1, marginBottom: spacing.sm },
  successText:  { ...typography.body, textAlign: 'center', marginBottom: spacing.xl, maxWidth: 300 },
  successBtn:   { width: '100%', marginTop: spacing.sm },
});

export default SuggestionScreen;
