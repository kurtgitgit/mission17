import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TextInput,
  TouchableOpacity, ScrollView, ActivityIndicator, Platform,
  RefreshControl, StatusBar
} from 'react-native';
import { ArrowLeft, Send, CheckCircle, Clock, Check, X, Lightbulb, AlertCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { endpoints, GlobalState } from '../config/api';
import { sharedStyles } from '../config/theme';

const CATEGORIES = ['Infrastructure', 'Public Safety', 'Cleanliness', 'Community Events', 'Other Concern'];

const SuggestionScreen = () => {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<'submit' | 'history'>('submit');
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Infrastructure');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const fetchHistory = useCallback(async () => {
    if (!GlobalState.userId) return;
    setLoadingHistory(true);
    try {
      const res = await fetch(`${endpoints.auth.backendBaseUrl}/api/suggestions/my/${GlobalState.userId}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Failed to fetch feedback history:', e);
    } finally {
      setLoadingHistory(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, fetchHistory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const cleanTitle = title.trim();
    if (!cleanTitle || cleanTitle.length < 5 || !/[a-zA-Z]/.test(cleanTitle))
      newErrors.title = 'Please enter a clear topic title (at least 5 letters).';

    const cleanDesc = description.trim();
    if (!cleanDesc || cleanDesc.length < 10 || !/[a-zA-Z]/.test(cleanDesc))
      newErrors.description = 'Please describe your idea or observation in detail (at least 10 letters).';

    return newErrors;
  };

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
          userId: GlobalState.userId,
          username: GlobalState.username || 'Resident',
          title: title.trim(),
          description: description.trim(),
          category,
          isAnonymous,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTitle('');
        setDescription('');
        setErrors({});
        fetchHistory();
      } else {
        const data = await res.json();
        setSubmitError(data.message || 'Failed to submit your suggestion. Please try again.');
      }
    } catch {
      setSubmitError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    if (status === 'Resolved') return { color: '#15803d', bg: '#dcfce7', icon: CheckCircle, label: 'Resolved / Addressed' };
    if (status === 'Dismissed') return { color: '#64748b', bg: '#f1f5f9', icon: X, label: 'Reviewed & Closed' };
    if (status === 'Under Review') return { color: '#b45309', bg: '#fef3c7', icon: Clock, label: 'Under Review' };
    return { color: '#0369a1', bg: '#e0f2fe', icon: Clock, label: 'Received by Desk' };
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0038A8" />

      {/* HEADER */}
      <View style={sharedStyles.header}>
        <TouchableOpacity 
          style={sharedStyles.backBtn} 
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Back to dashboard"
        >
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={sharedStyles.headerTitle}>Citizen Private Feedback</Text>
      </View>

      {/* SEGMENTED TABS */}
      <View style={styles.segmentStrip}>
        <View style={styles.segmentContainer}>
          <TouchableOpacity 
            style={[styles.segmentBtn, activeTab === 'submit' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('submit')}
            accessibilityRole="button"
          >
            <Text style={[styles.segmentText, activeTab === 'submit' && styles.segmentTextActive]}>
              Write Message
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.segmentBtn, activeTab === 'history' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('history')}
            accessibilityRole="button"
          >
            <Text style={[styles.segmentText, activeTab === 'history' && styles.segmentTextActive]}>
              My Inbox & History {history.length > 0 ? `(${history.length})` : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'submit' ? (
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {/* CONFIDENTIALITY NOTICE */}
          <View style={{
            backgroundColor: '#EFF6FF',
            borderRadius: 12,
            padding: 12,
            marginBottom: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            borderWidth: 1,
            borderColor: '#BFDBFE'
          }}>
            <Text style={{ fontSize: 18 }}>🔒</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#1E40AF' }}>
                Direct & Confidential to Barangay Captain
              </Text>
              <Text style={{ fontSize: 11.5, color: '#3B82F6', marginTop: 1 }}>
                Your feedback is private. Only authorized Barangay Officials can read your message and respond.
              </Text>
            </View>
          </View>

          {/* SUCCESS RECEIPT */}
          {success && (
            <View style={styles.successCard}>
              <View style={styles.successBadgeCircle}>
                <CheckCircle size={36} color="#16a34a" />
              </View>
              <Text style={styles.successTitle}>Message Received! 🎉</Text>
              <Text style={styles.successBody}>
                Thank you for reaching out to Barangay Bagong Pag-asa. Your concern has been securely delivered to the Barangay Captain and Council for evaluation.
              </Text>
              <TouchableOpacity
                style={styles.successBtn}
                onPress={() => { setSuccess(false); setActiveTab('history'); }}
                accessibilityRole="button"
              >
                <Text style={styles.successBtnText}>View My Inbox & Updates →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ERROR BANNER */}
          {submitError ? (
            <View style={styles.errorBanner}>
              <AlertCircle size={18} color="#991b1b" style={{ marginRight: 8 }} />
              <Text style={styles.errorBannerText}>{submitError}</Text>
              <TouchableOpacity onPress={() => setSubmitError('')}>
                <Text style={styles.errorBannerClose}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* ── CARD 1: CATEGORY SELECTION ── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>1</Text></View>
              <Text style={styles.cardTitle}>Topic Category</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
              <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 4 }}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
                    onPress={() => setCategory(cat)}
                    accessibilityRole="button"
                    accessibilityLabel={`Category ${cat}`}
                  >
                    <Text style={[styles.categoryChipText, category === cat && styles.categoryChipTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* ── CARD 2: FEEDBACK DETAILS ── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>2</Text></View>
              <Text style={styles.cardTitle}>Message to Barangay Officials</Text>
            </View>

            {/* TITLE */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Subject / Title <Text style={styles.requiredStar}>*</Text></Text>
              <TextInput
                style={[styles.inputBox, errors.title ? styles.inputBoxError : null]}
                placeholder="e.g. Broken streetlamp at corner of Purok 2 / Clean-up drive suggestion"
                placeholderTextColor="#94a3b8"
                value={title}
                onChangeText={(t) => { setTitle(t); setErrors(e => ({ ...e, title: '' })); }}
                accessibilityLabel="Suggestion title"
              />
              {errors.title ? <Text style={styles.errorText}>{errors.title}</Text> : null}
            </View>

            {/* DESCRIPTION */}
            <View style={styles.inputGroup}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={styles.label}>Detailed Concern / Feedback <Text style={styles.requiredStar}>*</Text></Text>
                <Text style={styles.charCount}>{description.length}/500</Text>
              </View>
              <TextInput
                style={[styles.textArea, errors.description ? styles.inputBoxError : null]}
                placeholder="Describe your suggestion, complaint, or observation for the Barangay Captain..."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={5}
                maxLength={500}
                value={description}
                onChangeText={(t) => { setDescription(t); setErrors(e => ({ ...e, description: '' })); }}
                textAlignVertical="top"
                accessibilityLabel="Detailed Suggestion description"
              />
              {errors.description ? <Text style={styles.errorText}>{errors.description}</Text> : null}
            </View>

            {/* ANONYMOUS TOGGLE */}
            <TouchableOpacity 
              style={[styles.checkboxRow, isAnonymous && styles.checkboxRowActive]} 
              onPress={() => setIsAnonymous(!isAnonymous)}
              activeOpacity={0.8}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isAnonymous }}
            >
              <View style={[styles.checkbox, isAnonymous && styles.checkboxOn]}>
                {isAnonymous && <Check size={14} color="#ffffff" />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.checkboxLabel}>Submit Anonymously</Text>
                <Text style={styles.checkboxHint}>Your name will be hidden from the council records.</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, loading && { opacity: 0.65 }]}
              onPress={handleSubmit}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Submit Citizen Feedback"
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Send size={18} color="white" />
                  <Text style={styles.submitBtnText}>Send Message to Captain →</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (

        <ScrollView
          contentContainerStyle={styles.container}

          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0038A8" />
          }
        >
          {loadingHistory ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="large" color="#0038A8" />
              <Text style={styles.loadingText}>Retrieving your feedback records...</Text>
            </View>
          ) : history.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Lightbulb size={40} color="#0038A8" />
              </View>
              <Text style={styles.emptyStateTitle}>No Feedback Submitted</Text>
              <Text style={styles.emptyStateText}>You haven't submitted any community feedback yet. Tap below to share an idea!</Text>
              <TouchableOpacity style={styles.newReqBtn} onPress={() => setActiveTab('submit')}>
                <Text style={styles.newReqBtnText}>+ Write a Suggestion</Text>
              </TouchableOpacity>
            </View>
          ) : (
            history.map((item, index) => {
              const cfg = getStatusConfig(item.status);
              const StatusIcon = cfg.icon;
              return (
                <View key={item._id || index} style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <View style={styles.historyCatBadge}>
                      <Text style={styles.historyCatText}>{item.category || 'General'}</Text>
                    </View>
                    <View style={[styles.historyStatusBadge, { backgroundColor: cfg.bg }]}>
                      <StatusIcon size={12} color={cfg.color} />
                      <Text style={[styles.historyStatusText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                  </View>

                  <Text style={styles.historyTitle}>{item.title}</Text>
                  <Text style={styles.historyDesc}>{item.description}</Text>

                  {item.adminReply ? (
                    <View style={styles.adminReplyCard}>
                      <Text style={styles.adminReplyTitle}>🏛️ Barangay Response:</Text>
                      <Text style={styles.adminReplyText}>{item.adminReply}</Text>
                    </View>
                  ) : null}

                  <View style={styles.historyFooter}>
                    <Text style={styles.historyDate}>
                      📅 {new Date(item.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                    {item.isAnonymous ? (
                      <Text style={styles.anonTag}>🔒 Anonymous</Text>
                    ) : null}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f1f5f9' },

  // SEGMENT STRIP
  segmentStrip: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: '#0038A8',
    shadowColor: '#0038A8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#64748b',
  },
  segmentTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },

  container: { padding: 14, paddingBottom: 60 },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
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

  // CATEGORY CHIPS
  categoryChip: {
    backgroundColor: '#f8fafc',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  categoryChipActive: {
    backgroundColor: '#0038A8',
    borderColor: '#0038A8',
  },
  categoryChipText: { fontSize: 12.5, fontWeight: '700', color: '#475569' },
  categoryChipTextActive: { color: '#ffffff', fontWeight: '800' },

  // INPUTS
  inputGroup: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 6 },
  requiredStar: { color: '#dc2626' },
  charCount: { fontSize: 11, color: '#94a3b8', fontWeight: '700' },

  inputBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14.5,
    color: '#0f172a',
    ...Platform.select({ web: { outlineStyle: 'none' as any } })
  },
  textArea: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    padding: 12,
    height: 110,
    fontSize: 14,
    color: '#0f172a',
    ...Platform.select({ web: { outlineStyle: 'none' as any } })
  },
  inputBoxError: { borderColor: '#dc2626', backgroundColor: '#fff5f5' },
  errorText: { fontSize: 11.5, color: '#dc2626', marginTop: 4, marginLeft: 4, fontWeight: '700' },

  // CHECKBOX
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    gap: 12,
  },
  checkboxRowActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  checkboxOn: {
    backgroundColor: '#0038A8',
    borderColor: '#0038A8',
  },
  checkboxLabel: { fontSize: 13.5, fontWeight: '800', color: '#0f172a' },
  checkboxHint: { fontSize: 11.5, color: '#64748b', marginTop: 1 },

  submitBtn: {
    backgroundColor: '#0038A8',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0038A8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  submitBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 15 },

  // SUCCESS CARD
  successCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#86efac',
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  successBadgeCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  successTitle: { fontSize: 19, fontWeight: '900', color: '#15803d', marginBottom: 4 },
  successBody: { fontSize: 13, color: '#475569', textAlign: 'center', lineHeight: 19, marginBottom: 14 },
  successBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 22,
  },
  successBtnText: { color: 'white', fontWeight: '800', fontSize: 14 },

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

  // HISTORY
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0038A8',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  historyCatBadge: { backgroundColor: '#eff6ff', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1, borderColor: '#bfdbfe' },
  historyCatText: { fontSize: 11.5, fontWeight: '800', color: '#0038A8' },
  historyStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12 },
  historyStatusText: { fontSize: 11, fontWeight: '800' },
  historyTitle: { fontSize: 15.5, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  historyDesc: { fontSize: 13, color: '#475569', lineHeight: 19, marginBottom: 10 },
  adminReplyCard: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#0038A8',
  },
  adminReplyTitle: { fontSize: 12, fontWeight: '800', color: '#0038A8', marginBottom: 2 },
  adminReplyText: { fontSize: 12.5, color: '#334155', lineHeight: 17 },
  historyFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 8 },
  historyDate: { fontSize: 11.5, color: '#64748b' },
  anonTag: { fontSize: 11.5, color: '#64748b', fontWeight: '600' },

  centerLoading: { alignItems: 'center', marginTop: 60 },
  loadingText: { fontSize: 13.5, color: '#64748b', marginTop: 12, fontWeight: '600' },

  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 24 },
  emptyIconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginBottom: 14, borderWidth: 1.5, borderColor: '#bfdbfe' },
  emptyStateTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
  emptyStateText: { fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 19, marginBottom: 16 },
  newReqBtn: { backgroundColor: '#0038A8', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
  newReqBtnText: { color: 'white', fontWeight: '800', fontSize: 14 },
});

export default SuggestionScreen;
