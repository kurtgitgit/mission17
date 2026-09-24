import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Modal, RefreshControl, SafeAreaView,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { AlertTriangle, ArrowLeft, BarChart3, BellRing, Check, FileText, Megaphone, MessageSquare, ShieldCheck, Siren, UserPlus, UsersRound, X } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { endpoints, getAuthHeaders, GlobalState } from '../config/api';
import { fetchWithTimeout, getFriendlyNetworkMessage } from '../utils/network';

type User = { _id: string; username: string; email: string; role: string; accountStatus: string; isVerified?: boolean };
type Blotter = {
  _id: string;
  referenceNumber: string;
  incidentType: string;
  status: string;
  fullName?: string;
  description?: string;
  location?: string;
  dateOfIncident?: string;
  adminRemarks?: string;
  evidenceUrl?: string;
  contactNumber?: string;
  respondentName?: string;
  hearingDate?: string;
  hearingStage?: string;
  luponOfficerInCharge?: string;
};
type BlotterDecision = { report: Blotter; status: 'In Progress' | 'Resolved' | 'Dismissed'; label: string };
type AccountDecision = { user: User; status: 'approved' | 'rejected' };
type Feedback = { _id: string; title: string; category?: string; sentiment?: string; status?: string };
type DocumentRequest = { _id: string; status?: string };
type Announcement = { _id: string; isUrgent?: boolean; category?: string };

const CaptainControlScreen = () => {
  const navigation = useNavigation<any>();
  const isControlTab = navigation.getState()?.type === 'tab';
  const [users, setUsers] = useState<User[]>([]);
  const [blotters, setBlotters] = useState<Blotter[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [documents, setDocuments] = useState<DocumentRequest[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [blotterDecision, setBlotterDecision] = useState<BlotterDecision | null>(null);
  const [selectedBlotter, setSelectedBlotter] = useState<Blotter | null>(null);
  const [accountDecision, setAccountDecision] = useState<AccountDecision | null>(null);
  const [decisionRemarks, setDecisionRemarks] = useState('');
  const [accountRejectionReason, setAccountRejectionReason] = useState('');
  const [form, setForm] = useState({ username: '', email: '', password: '' });

  const load = useCallback(async () => {
    if (GlobalState.role !== 'super_admin') {
      setError('This control center is reserved for the Barangay Captain.');
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const headers = await getAuthHeaders();
      const readOptionalCollection = async (request: Promise<Response>) => {
        try {
          const response = await request;
          return response.ok ? await response.json() : [];
        } catch {
          return [];
        }
      };
      const [usersResponse, blottersResponse, feedbackPayload, documentsPayload, announcementsPayload] = await Promise.all([
        fetchWithTimeout(`${endpoints.captain.users}?page=1&limit=100`, { headers }),
        fetchWithTimeout(endpoints.captain.blotterReports, { headers }),
        readOptionalCollection(fetchWithTimeout(`${endpoints.auth.backendBaseUrl}/api/suggestions`, { headers })),
        readOptionalCollection(fetchWithTimeout(endpoints.documentRequests.submit, { headers })),
        readOptionalCollection(fetchWithTimeout(endpoints.announcements)),
      ]);
      if (!usersResponse.ok || !blottersResponse.ok) throw new Error('Captain controls could not be loaded.');
      const [usersPayload, blotterPayload] = await Promise.all([usersResponse.json(), blottersResponse.json()]);
      setUsers(usersPayload.data || []);
      setBlotters(Array.isArray(blotterPayload) ? blotterPayload : []);
      setFeedback(Array.isArray(feedbackPayload) ? feedbackPayload : []);
      setDocuments(Array.isArray(documentsPayload) ? documentsPayload : []);
      setAnnouncements(Array.isArray(announcementsPayload) ? announcementsPayload : []);
    } catch (cause) {
      setError(getFriendlyNetworkMessage(cause, 'Could not load the Captain Control Center. Pull down to retry.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const confirmAccountDecision = (user: User, accountStatus: 'approved' | 'rejected') => {
    if (accountStatus === 'rejected') {
      setAccountRejectionReason('');
      setAccountDecision({ user, status: accountStatus });
      return;
    }
    Alert.alert(
      'Approve resident account?',
      `${user.username} will be ${accountStatus}. This action is recorded in the audit trail.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: () => void saveAccountDecision({ user, status: accountStatus }),
        },
      ],
    );
  };

  const saveAccountDecision = async (decision: AccountDecision, rejectionReason = '') => {
    if (decision.status === 'rejected' && rejectionReason.trim().length < 5) {
      Alert.alert('Reason required', 'Explain what the resident must correct before rejecting the registration.');
      return;
    }
    setProcessingId(decision.user._id);
    try {
      const headers = await getAuthHeaders();
      const response = await fetchWithTimeout(endpoints.captain.updateAccountStatus(decision.user._id), {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountStatus: decision.status, rejectionReason: rejectionReason.trim() }),
      });
      if (!response.ok) throw new Error((await response.json()).message);
      setAccountDecision(null);
      setAccountRejectionReason('');
      await load();
    } catch (cause: any) {
      Alert.alert('Decision not saved', cause?.message || 'Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const confirmBlotterDecision = (report: Blotter, status: 'In Progress' | 'Resolved' | 'Dismissed') => {
    const actionLabel = status === 'In Progress' ? 'Approve' : status === 'Resolved' ? 'Resolve' : 'Reject';
    setDecisionRemarks(report.adminRemarks || '');
    setBlotterDecision({ report, status, label: actionLabel });
  };

  const saveBlotterDecision = async () => {
    if (!blotterDecision) return;
    if (blotterDecision.status === 'Dismissed' && !decisionRemarks.trim()) {
      Alert.alert('Reason required', 'Add a short reason before rejecting a blotter report.');
      return;
    }
    const { report, status } = blotterDecision;
    setProcessingId(report._id);
    try {
      const headers = await getAuthHeaders();
      const response = await fetchWithTimeout(endpoints.captain.updateBlotterStatus(report._id), {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminRemarks: decisionRemarks.trim() }),
      });
      if (!response.ok) throw new Error((await response.json()).message);
      setBlotterDecision(null);
      setDecisionRemarks('');
      await load();
    } catch (cause: any) {
      Alert.alert('Decision not saved', cause?.message || 'Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const createStaffAdmin = async () => {
    const strongTemporaryPassword = form.password.length >= 12
      && /[A-Z]/.test(form.password)
      && /[a-z]/.test(form.password)
      && /\d/.test(form.password)
      && /[^A-Za-z0-9]/.test(form.password);
    if (!form.username.trim() || !form.email.trim() || !strongTemporaryPassword) {
      Alert.alert('Incomplete details', 'Enter a name, email, and a 12+ character temporary password with uppercase, lowercase, a number, and a special character.');
      return;
    }
    setCreating(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetchWithTimeout(endpoints.captain.addUser, {
        method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role: 'admin' }),
      });
      if (!response.ok) throw new Error((await response.json()).message);
      setCreating(false); setShowCreateModal(false); setForm({ username: '', email: '', password: '' });
      Alert.alert('Staff admin created', 'Give the temporary password to the authorized staff member privately.');
      void load();
    } catch (cause: any) {
      setCreating(false); Alert.alert('Account not created', cause?.message || 'Please try again.');
    }
  };

  const pendingUsers = users.filter((user) => user.accountStatus === 'pending');
  const pendingBlotters = blotters.filter((report) => ['Pending', 'In Progress'].includes(report.status));
  const activeStaffAdmins = users.filter((user) => user.role === 'admin' && user.accountStatus === 'approved').length;
  const pendingDocuments = documents.filter((request) => !['Completed', 'Rejected'].includes(request.status || '')).length;
  const openFeedback = feedback.filter((item) => !['Resolved', 'Dismissed'].includes(item.status || '')).length;
  const activeAlerts = announcements.filter((item) => item.isUrgent || item.category === 'urgent').length;
  const negativeFeedback = feedback.filter((item) => item.sentiment?.toLowerCase() === 'negative').length;
  const leadingCategory = feedback.reduce<Record<string, number>>((counts, item) => {
    const category = item.category || 'General';
    counts[category] = (counts[category] || 0) + 1;
    return counts;
  }, {});
  const topCategory = Object.entries(leadingCategory).sort(([, left], [, right]) => right - left)[0]?.[0] || 'No feedback yet';
  const formatDateTime = (value?: string) => {
    if (!value || Number.isNaN(new Date(value).getTime())) return 'Not scheduled';
    return new Date(value).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        {isControlTab ? <View style={{ width: 24 }} /> : <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Back"><ArrowLeft color="#fff" size={24} /></TouchableOpacity>}
        <View style={{ flex: 1 }}><Text style={styles.headerTitle}>Captain Control Center</Text><Text style={styles.headerSub}>Final approvals and staff oversight</Text></View>
        <ShieldCheck color="#fff" size={26} />
      </View>
      {loading ? <View style={styles.center}><ActivityIndicator size="large" color="#0038A8" /></View> : error ? <View style={styles.center}><Text style={styles.error}>{error}</Text><TouchableOpacity onPress={() => { setLoading(true); void load(); }} style={styles.retry}><Text style={styles.retryText}>Retry</Text></TouchableOpacity></View> : (
        <FlatList
          data={pendingBlotters}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor="#0038A8" />}
          ListHeaderComponent={<>
            <View style={styles.hero}>
              <Text style={styles.eyebrow}>CAPTAIN COMMAND CENTER</Text>
              <Text style={styles.heroTitle}>Decisions that need you today</Text>
              <Text style={styles.summaryText}>
                {pendingUsers.length} resident review{pendingUsers.length === 1 ? '' : 's'} · {pendingBlotters.length} active blotter{pendingBlotters.length === 1 ? '' : 's'} · {activeStaffAdmins} active staff admin{activeStaffAdmins === 1 ? '' : 's'}
              </Text>
              <Text style={styles.heroText}>Final approvals and emergency actions are protected and recorded in the audit trail.</Text>
            </View>
            <View style={styles.snapshotGrid}>
              <View style={styles.snapshotCard}><FileText size={18} color="#0369a1" /><Text style={styles.snapshotValue}>{pendingDocuments}</Text><Text style={styles.snapshotLabel}>Documents</Text></View>
              <View style={styles.snapshotCard}><AlertTriangle size={18} color="#b45309" /><Text style={styles.snapshotValue}>{pendingBlotters.length}</Text><Text style={styles.snapshotLabel}>Blotters</Text></View>
              <View style={styles.snapshotCard}><MessageSquare size={18} color="#7c3aed" /><Text style={styles.snapshotValue}>{openFeedback}</Text><Text style={styles.snapshotLabel}>Feedback</Text></View>
              <View style={styles.snapshotCard}><BellRing size={18} color="#dc2626" /><Text style={styles.snapshotValue}>{activeAlerts}</Text><Text style={styles.snapshotLabel}>Alerts</Text></View>
            </View>
            <Text style={styles.sectionTitle}>Urgent actions</Text>
            <View style={styles.quickActions}>
              <TouchableOpacity onPress={() => navigation.navigate('CaptainAnnouncements', { emergency: false })} style={styles.quickAction} accessibilityRole="button" accessibilityLabel="Create new announcement"><Megaphone size={20} color="#0038A8" /><Text style={styles.quickTitle}>New announcement</Text><Text style={styles.quickText}>Post an official update</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('CaptainFeedback')} style={styles.quickAction} accessibilityRole="button" accessibilityLabel="Review critical resident feedback"><MessageSquare size={20} color="#7c3aed" /><Text style={styles.quickTitle}>Review feedback</Text><Text style={styles.quickText}>{openFeedback} item{openFeedback === 1 ? '' : 's'} need review</Text></TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('CaptainAnnouncements', { emergency: true })} style={styles.emergencyAction} accessibilityRole="button" accessibilityLabel="Open emergency broadcast form"><Siren size={21} color="#fff" /><View style={{ flex: 1 }}><Text style={styles.emergencyTitle}>Emergency broadcast</Text><Text style={styles.emergencyText}>Open the protected alert form. Posting still requires confirmation.</Text></View></TouchableOpacity>
            <Text style={styles.sectionTitle}>Attention needed</Text>
            <View style={styles.attentionCard}>
              <View style={styles.attentionRow}><UsersRound size={18} color="#0038A8" /><Text style={styles.attentionText}>{pendingUsers.length} resident account{pendingUsers.length === 1 ? '' : 's'} awaiting approval</Text></View>
              <View style={styles.attentionRow}><FileText size={18} color="#0369a1" /><Text style={styles.attentionText}>{pendingDocuments} document request{pendingDocuments === 1 ? '' : 's'} in progress</Text></View>
              <View style={styles.attentionRow}><AlertTriangle size={18} color="#b45309" /><Text style={styles.attentionText}>{pendingBlotters.length} active blotter case{pendingBlotters.length === 1 ? '' : 's'}</Text></View>
            </View>
            <View style={styles.pulseCard}>
              <View style={styles.pulseHeading}><View><Text style={styles.sectionTitle}>Community pulse</Text><Text style={styles.pulseSub}>Resident feedback summary</Text></View><BarChart3 size={22} color="#0038A8" /></View>
              <View style={styles.pulseStats}><View><Text style={styles.pulseValue}>{feedback.length}</Text><Text style={styles.pulseLabel}>Total feedback</Text></View><View><Text style={[styles.pulseValue, negativeFeedback > 0 && { color: '#dc2626' }]}>{negativeFeedback}</Text><Text style={styles.pulseLabel}>Concerns</Text></View><View style={{ flex: 1 }}><Text style={styles.pulseCategory} numberOfLines={1}>{topCategory}</Text><Text style={styles.pulseLabel}>Most reported</Text></View></View>
            </View>
            <View style={styles.managementHeading}><Text style={styles.sectionTitle}>Final approvals</Text><Text style={styles.managementSub}>Account and case decisions</Text></View>
            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Staff administration</Text><TouchableOpacity onPress={() => setShowCreateModal(true)} style={styles.addButton}><UserPlus size={16} color="#fff" /><Text style={styles.addText}>Create staff admin</Text></TouchableOpacity></View>
            {pendingUsers.length === 0 ? <Text style={styles.empty}>No resident accounts waiting for review.</Text> : pendingUsers.map((user) => <View key={user._id} style={styles.card}><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{user.username}</Text><Text style={styles.cardSub}>{user.email}</Text>{!user.isVerified ? <Text style={styles.unverified}>Waiting for email verification</Text> : null}</View><TouchableOpacity disabled={!user.isVerified || processingId === user._id} onPress={() => confirmAccountDecision(user, 'approved')} style={[styles.iconApprove, (!user.isVerified || processingId === user._id) && styles.disabled]} accessibilityRole="button" accessibilityLabel={`Approve account for ${user.username}`}><Check size={18} color="#fff" /></TouchableOpacity><TouchableOpacity disabled={processingId === user._id} onPress={() => confirmAccountDecision(user, 'rejected')} style={[styles.iconReject, processingId === user._id && styles.disabled]} accessibilityRole="button" accessibilityLabel={`Reject account for ${user.username}`}><X size={18} color="#fff" /></TouchableOpacity></View>)}
            <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 10 }]}>Blotter decisions</Text>
            {pendingBlotters.length === 0 ? <Text style={styles.empty}>No pending blotter decisions.</Text> : null}
          </>}
          renderItem={({ item }) => (
            <View style={styles.caseCard}>
              <TouchableOpacity
                onPress={() => setSelectedBlotter(item)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={`View details for blotter ${item.referenceNumber}`}
              >
              <View style={styles.caseHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.referenceNumber}</Text>
                  <Text style={styles.cardSub}>{item.incidentType} · {item.fullName || 'Resident report'}</Text>
                </View>
                <Text style={styles.status}>{item.status}</Text>
              </View>
              <Text style={styles.detailLabel}>Incident details</Text>
              <Text style={styles.detailText}>{item.description || 'No description provided.'}</Text>
              <Text style={styles.metaText}>Location: {item.location || 'Not provided'}</Text>
              <Text style={styles.metaText}>Incident date: {item.dateOfIncident ? new Date(item.dateOfIncident).toLocaleDateString('en-PH') : 'Not provided'}</Text>
              <Text style={styles.metaText}>Evidence: {item.evidenceUrl ? 'Attached — review in the admin portal' : 'None attached'}</Text>
              {item.adminRemarks ? <Text style={styles.metaText}>Staff remarks: {item.adminRemarks}</Text> : null}
              <Text style={styles.viewDetails}>View full case details →</Text>
              </TouchableOpacity>
              <View style={styles.caseActions}>
                {item.status === 'Pending' ? (
                  <TouchableOpacity
                    disabled={processingId === item._id}
                    onPress={() => confirmBlotterDecision(item, 'In Progress')}
                    style={[styles.resolve, processingId === item._id && styles.disabled]}
                    accessibilityRole="button"
                    accessibilityLabel={`Approve blotter ${item.referenceNumber}`}
                  >
                    <Text style={styles.actionText}>{processingId === item._id ? 'Saving...' : 'Approve for action'}</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    disabled={processingId === item._id}
                    onPress={() => confirmBlotterDecision(item, 'Resolved')}
                    style={[styles.resolve, processingId === item._id && styles.disabled]}
                    accessibilityRole="button"
                    accessibilityLabel={`Resolve blotter ${item.referenceNumber}`}
                  >
                    <Text style={styles.actionText}>{processingId === item._id ? 'Saving...' : 'Resolve case'}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  disabled={processingId === item._id}
                  onPress={() => confirmBlotterDecision(item, 'Dismissed')}
                  style={[styles.dismiss, processingId === item._id && styles.disabled]}
                  accessibilityRole="button"
                  accessibilityLabel={`Reject blotter ${item.referenceNumber}`}
                >
                  <Text style={styles.actionText}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          contentContainerStyle={styles.content}
        />
      )}
      <Modal visible={showCreateModal} transparent animationType="slide" onRequestClose={() => setShowCreateModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Create staff admin</Text>
            <Text style={styles.modalSub}>This creates an operational staff account, not another Super Admin account.</Text>
            <TextInput value={form.username} onChangeText={(username) => setForm((current) => ({ ...current, username }))} placeholder="Staff full name" placeholderTextColor="#64748b" selectionColor="#0038A8" autoCorrect={false} style={styles.input} />
            <TextInput value={form.email} onChangeText={(email) => setForm((current) => ({ ...current, email }))} placeholder="Staff email" placeholderTextColor="#64748b" selectionColor="#0038A8" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" style={styles.input} />
            <TextInput value={form.password} onChangeText={(password) => setForm((current) => ({ ...current, password }))} placeholder="Temporary password (12+ characters)" placeholderTextColor="#64748b" selectionColor="#0038A8" autoCapitalize="none" autoCorrect={false} secureTextEntry style={styles.input} />
            <View style={styles.modalActions}>
              <TouchableOpacity disabled={creating} onPress={() => setShowCreateModal(false)} style={styles.cancel}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity disabled={creating} onPress={() => void createStaffAdmin()} style={[styles.create, creating && styles.disabled]}><Text style={styles.actionText}>{creating ? 'Creating...' : 'Create admin'}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={Boolean(accountDecision)} transparent animationType="slide" onRequestClose={() => setAccountDecision(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Return registration for correction</Text>
            <Text style={styles.modalSub}>Tell {accountDecision?.user.username} what to correct. They can update the details and resubmit for review.</Text>
            <TextInput
              value={accountRejectionReason}
              onChangeText={setAccountRejectionReason}
              placeholder="Reason for correction (required)"
              placeholderTextColor="#64748b"
              selectionColor="#0038A8"
              multiline
              maxLength={500}
              style={[styles.input, styles.remarksInput]}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity disabled={Boolean(processingId)} onPress={() => setAccountDecision(null)} style={styles.cancel}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity disabled={Boolean(processingId)} onPress={() => accountDecision && void saveAccountDecision(accountDecision, accountRejectionReason)} style={[styles.rejectDecision, processingId && styles.disabled]}><Text style={styles.actionText}>{processingId ? 'Saving...' : 'Return for correction'}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={Boolean(selectedBlotter)} transparent animationType="slide" onRequestClose={() => setSelectedBlotter(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, styles.caseDetailsModal]}>
            <View style={styles.caseDetailsHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Blotter case details</Text>
                <Text style={styles.modalSub}>{selectedBlotter?.referenceNumber}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedBlotter(null)} accessibilityRole="button" accessibilityLabel="Close case details" style={styles.closeDetails}>
                <X size={20} color="#334155" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.caseDetailsContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.caseDetailLabel}>Case status</Text>
              <Text style={styles.caseDetailValue}>{selectedBlotter?.status || 'Pending'}</Text>
              <Text style={styles.caseDetailLabel}>Complainant</Text>
              <Text style={styles.caseDetailValue}>{selectedBlotter?.fullName || 'Resident report'}</Text>
              <Text style={styles.caseDetailLabel}>Contact number</Text>
              <Text style={styles.caseDetailValue}>{selectedBlotter?.contactNumber || 'Not provided'}</Text>
              <Text style={styles.caseDetailLabel}>Incident</Text>
              <Text style={styles.caseDetailValue}>{selectedBlotter?.incidentType || 'Not provided'}</Text>
              <Text style={styles.caseDetailLabel}>When it happened</Text>
              <Text style={styles.caseDetailValue}>{formatDateTime(selectedBlotter?.dateOfIncident)}</Text>
              <Text style={styles.caseDetailLabel}>Exact location</Text>
              <Text style={styles.caseDetailValue}>{selectedBlotter?.location || 'Not provided'}</Text>
              <Text style={styles.caseDetailLabel}>Resident narrative</Text>
              <Text style={styles.caseDetailValue}>{selectedBlotter?.description || 'No description provided.'}</Text>
              <Text style={styles.caseDetailLabel}>Respondent</Text>
              <Text style={styles.caseDetailValue}>{selectedBlotter?.respondentName || 'Not yet identified'}</Text>
              <Text style={styles.caseDetailLabel}>Lupon hearing stage</Text>
              <Text style={styles.caseDetailValue}>{selectedBlotter?.hearingStage && selectedBlotter.hearingStage !== 'None' ? selectedBlotter.hearingStage : 'Not scheduled'}</Text>
              <Text style={styles.caseDetailLabel}>Hearing date and time</Text>
              <Text style={styles.caseDetailValue}>{formatDateTime(selectedBlotter?.hearingDate)}</Text>
              <Text style={styles.caseDetailLabel}>Presiding official</Text>
              <Text style={styles.caseDetailValue}>{selectedBlotter?.luponOfficerInCharge || 'Not assigned'}</Text>
              <Text style={styles.caseDetailLabel}>Staff remarks</Text>
              <Text style={styles.caseDetailValue}>{selectedBlotter?.adminRemarks || 'No staff remarks yet.'}</Text>
              <Text style={styles.caseDetailLabel}>Evidence</Text>
              <Text style={styles.caseDetailValue}>{selectedBlotter?.evidenceUrl ? 'Attached — view securely in the web Admin Portal.' : 'No evidence attached.'}</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
      <Modal visible={Boolean(blotterDecision)} transparent animationType="slide" onRequestClose={() => setBlotterDecision(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{blotterDecision?.label} blotter report</Text>
            <Text style={styles.modalSub}>
              {blotterDecision?.report.referenceNumber} will be marked {blotterDecision?.status}. The decision and remarks will be recorded.
            </Text>
            <TextInput
              value={decisionRemarks}
              onChangeText={setDecisionRemarks}
              placeholder={blotterDecision?.status === 'Dismissed' ? 'Reason for rejection (required)' : 'Captain remarks (optional)'}
              placeholderTextColor="#64748b"
              selectionColor="#0038A8"
              multiline
              maxLength={500}
              style={[styles.input, styles.remarksInput]}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity disabled={Boolean(processingId)} onPress={() => setBlotterDecision(null)} style={styles.cancel}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity disabled={Boolean(processingId)} onPress={() => void saveBlotterDecision()} style={[blotterDecision?.status === 'Dismissed' ? styles.rejectDecision : styles.create, processingId && styles.disabled]}>
                <Text style={styles.actionText}>{processingId ? 'Saving...' : blotterDecision?.label}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' }, header: { backgroundColor: '#0038A8', padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }, headerTitle: { color: '#fff', fontSize: 18, fontWeight: '900' }, headerSub: { color: '#bfdbfe', fontSize: 12, marginTop: 2 }, content: { padding: 16, paddingBottom: 40 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }, error: { color: '#b91c1c', textAlign: 'center' }, retry: { marginTop: 14, padding: 10, backgroundColor: '#0038A8', borderRadius: 8 }, retryText: { color: '#fff', fontWeight: '800' }, hero: { backgroundColor: '#0038A8', borderRadius: 18, padding: 18, marginBottom: 14 }, eyebrow: { color: '#bfdbfe', fontSize: 10, fontWeight: '900', letterSpacing: 1 }, heroTitle: { color: '#fff', fontSize: 21, fontWeight: '900', marginTop: 5 }, heroText: { color: '#dbeafe', fontSize: 12, lineHeight: 17, marginTop: 7 }, summaryText: { color: '#dbeafe', fontSize: 12, lineHeight: 17, marginTop: 5 }, snapshotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }, snapshotCard: { width: '48%', flexGrow: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12 }, snapshotValue: { color: '#0f172a', fontSize: 22, fontWeight: '900', marginTop: 6 }, snapshotLabel: { color: '#64748b', fontSize: 11, fontWeight: '700', marginTop: 1 }, sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }, sectionTitle: { fontSize: 16, fontWeight: '900', color: '#0f172a', marginBottom: 10 }, quickActions: { flexDirection: 'row', gap: 10, marginBottom: 10 }, quickAction: { flex: 1, minHeight: 120, backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#dbeafe' }, quickTitle: { color: '#0f172a', fontWeight: '900', fontSize: 13, marginTop: 9 }, quickText: { color: '#64748b', fontSize: 11, lineHeight: 15, marginTop: 4 }, emergencyAction: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: '#dc2626', borderRadius: 14, padding: 14, marginBottom: 20 }, emergencyTitle: { color: '#fff', fontWeight: '900', fontSize: 14 }, emergencyText: { color: '#fee2e2', fontSize: 11, lineHeight: 15, marginTop: 3 }, attentionCard: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 14, marginBottom: 20 }, attentionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }, attentionText: { color: '#334155', fontSize: 12, fontWeight: '700', flex: 1 }, pulseCard: { backgroundColor: '#eff6ff', borderRadius: 14, padding: 15, marginBottom: 22 }, pulseHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }, pulseSub: { color: '#64748b', fontSize: 11, marginTop: -7, marginBottom: 12 }, pulseStats: { flexDirection: 'row', gap: 16 }, pulseValue: { color: '#0038A8', fontSize: 19, fontWeight: '900' }, pulseCategory: { color: '#0038A8', fontSize: 13, fontWeight: '900' }, pulseLabel: { color: '#64748b', fontSize: 10, fontWeight: '700', marginTop: 2 }, managementHeading: { borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 18, marginBottom: 8 }, managementSub: { color: '#64748b', fontSize: 12, marginTop: -7 }, addButton: { flexDirection: 'row', gap: 6, alignItems: 'center', backgroundColor: '#0038A8', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 }, addText: { color: '#fff', fontSize: 12, fontWeight: '800' }, card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#e2e8f0' }, caseCard: { backgroundColor: '#fff', borderRadius: 14, padding: 15, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' }, caseHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 12 }, cardTitle: { fontWeight: '900', color: '#1e293b' }, cardSub: { color: '#64748b', fontSize: 12, marginTop: 3 }, unverified: { color: '#b45309', fontSize: 11, fontWeight: '700', marginTop: 4 }, status: { color: '#b45309', backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, fontSize: 11, fontWeight: '800' }, detailLabel: { color: '#475569', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', marginBottom: 4 }, detailText: { color: '#1e293b', fontSize: 13, lineHeight: 18, marginBottom: 8 }, metaText: { color: '#64748b', fontSize: 12, lineHeight: 17 }, viewDetails: { color: '#0038A8', fontSize: 12, fontWeight: '800', marginTop: 10 }, caseActions: { flexDirection: 'row', gap: 8, marginTop: 14 }, empty: { color: '#64748b', fontSize: 13, marginBottom: 10 }, iconApprove: { backgroundColor: '#16a34a', padding: 9, borderRadius: 8 }, iconReject: { backgroundColor: '#dc2626', padding: 9, borderRadius: 8 }, resolve: { flex: 1, alignItems: 'center', backgroundColor: '#16a34a', padding: 10, borderRadius: 8 }, dismiss: { flex: 1, alignItems: 'center', backgroundColor: '#dc2626', padding: 10, borderRadius: 8 }, disabled: { opacity: 0.55 }, actionText: { color: '#fff', fontWeight: '800', fontSize: 12 }, modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,.5)' }, modal: { backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 22 }, caseDetailsModal: { maxHeight: '88%' }, caseDetailsHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 6 }, closeDetails: { padding: 6, marginRight: -6, marginTop: -4 }, caseDetailsContent: { paddingBottom: 18 }, caseDetailLabel: { color: '#64748b', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', marginTop: 14, marginBottom: 3 }, caseDetailValue: { color: '#1e293b', fontSize: 14, lineHeight: 20 }, modalTitle: { fontSize: 19, fontWeight: '900', color: '#0f172a' }, modalSub: { color: '#64748b', fontSize: 12, lineHeight: 17, marginVertical: 7 }, input: { color: '#0f172a', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#94a3b8', borderRadius: 9, padding: 12, marginTop: 9, fontSize: 15 }, remarksInput: { minHeight: 96, textAlignVertical: 'top' }, modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 16 }, cancel: { padding: 12 }, cancelText: { color: '#334155', fontWeight: '800', fontSize: 13 }, create: { backgroundColor: '#0038A8', padding: 12, borderRadius: 8 }, rejectDecision: { backgroundColor: '#dc2626', padding: 12, borderRadius: 8 },
});

export default CaptainControlScreen;
