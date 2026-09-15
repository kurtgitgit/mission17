import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Modal, RefreshControl, SafeAreaView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { ArrowLeft, Check, ShieldCheck, UserPlus, X } from 'lucide-react-native';
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
};
type BlotterDecision = { report: Blotter; status: 'In Progress' | 'Resolved' | 'Dismissed'; label: string };

const CaptainControlScreen = () => {
  const navigation = useNavigation<any>();
  const [users, setUsers] = useState<User[]>([]);
  const [blotters, setBlotters] = useState<Blotter[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [blotterDecision, setBlotterDecision] = useState<BlotterDecision | null>(null);
  const [decisionRemarks, setDecisionRemarks] = useState('');
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
      const [usersResponse, blottersResponse] = await Promise.all([
        fetchWithTimeout(`${endpoints.captain.users}?page=1&limit=100`, { headers }),
        fetchWithTimeout(endpoints.captain.blotterReports, { headers }),
      ]);
      if (!usersResponse.ok || !blottersResponse.ok) throw new Error('Captain controls could not be loaded.');
      const usersPayload = await usersResponse.json();
      const blotterPayload = await blottersResponse.json();
      setUsers(usersPayload.data || []);
      setBlotters(Array.isArray(blotterPayload) ? blotterPayload : []);
    } catch (cause) {
      setError(getFriendlyNetworkMessage(cause, 'Could not load the Captain Control Center. Pull down to retry.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const confirmAccountDecision = (user: User, accountStatus: 'approved' | 'rejected') => {
    Alert.alert(
      accountStatus === 'approved' ? 'Approve resident account?' : 'Reject resident account?',
      `${user.username} will be ${accountStatus}. This action is recorded in the audit trail.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: accountStatus === 'approved' ? 'Approve' : 'Reject',
          style: accountStatus === 'approved' ? 'default' : 'destructive',
          onPress: async () => {
            setProcessingId(user._id);
            try {
              const headers = await getAuthHeaders();
              const response = await fetchWithTimeout(endpoints.captain.updateAccountStatus(user._id), {
                method: 'PATCH', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ accountStatus }),
              });
              if (!response.ok) throw new Error((await response.json()).message);
              await load();
            } catch (cause: any) { Alert.alert('Decision not saved', cause?.message || 'Please try again.'); }
            finally { setProcessingId(null); }
          },
        },
      ],
    );
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
    if (!form.username.trim() || !form.email.trim() || form.password.length < 12) {
      Alert.alert('Incomplete details', 'Enter a name, email, and a temporary password with at least 12 characters.');
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

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Back"><ArrowLeft color="#fff" size={24} /></TouchableOpacity>
        <View style={{ flex: 1 }}><Text style={styles.headerTitle}>Captain Control Center</Text><Text style={styles.headerSub}>Final approvals and staff oversight</Text></View>
        <ShieldCheck color="#fff" size={26} />
      </View>
      {loading ? <View style={styles.center}><ActivityIndicator size="large" color="#0038A8" /></View> : error ? <View style={styles.center}><Text style={styles.error}>{error}</Text><TouchableOpacity onPress={() => { setLoading(true); void load(); }} style={styles.retry}><Text style={styles.retryText}>Retry</Text></TouchableOpacity></View> : (
        <FlatList
          data={pendingBlotters}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor="#0038A8" />}
          ListHeaderComponent={<>
            <View style={styles.summary}>
              <Text style={styles.summaryTitle}>Barangay Captain only</Text>
              <Text style={styles.summaryText}>
                {pendingUsers.length} resident review{pendingUsers.length === 1 ? '' : 's'} · {pendingBlotters.length} active blotter{pendingBlotters.length === 1 ? '' : 's'} · {activeStaffAdmins} active staff admin{activeStaffAdmins === 1 ? '' : 's'}
              </Text>
              <Text style={styles.summaryText}>All decisions are checked by the server and submitted to the audit trail.</Text>
            </View>
            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Staff administration</Text><TouchableOpacity onPress={() => setShowCreateModal(true)} style={styles.addButton}><UserPlus size={16} color="#fff" /><Text style={styles.addText}>Create staff admin</Text></TouchableOpacity></View>
            {pendingUsers.length === 0 ? <Text style={styles.empty}>No resident accounts waiting for review.</Text> : pendingUsers.map((user) => <View key={user._id} style={styles.card}><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{user.username}</Text><Text style={styles.cardSub}>{user.email}</Text>{!user.isVerified ? <Text style={styles.unverified}>Waiting for email verification</Text> : null}</View><TouchableOpacity disabled={!user.isVerified || processingId === user._id} onPress={() => confirmAccountDecision(user, 'approved')} style={[styles.iconApprove, (!user.isVerified || processingId === user._id) && styles.disabled]} accessibilityRole="button" accessibilityLabel={`Approve account for ${user.username}`}><Check size={18} color="#fff" /></TouchableOpacity><TouchableOpacity disabled={processingId === user._id} onPress={() => confirmAccountDecision(user, 'rejected')} style={[styles.iconReject, processingId === user._id && styles.disabled]} accessibilityRole="button" accessibilityLabel={`Reject account for ${user.username}`}><X size={18} color="#fff" /></TouchableOpacity></View>)}
            <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 10 }]}>Blotter decisions</Text>
            {pendingBlotters.length === 0 ? <Text style={styles.empty}>No pending blotter decisions.</Text> : null}
          </>}
          renderItem={({ item }) => (
            <View style={styles.caseCard}>
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
  safe: { flex: 1, backgroundColor: '#f8fafc' }, header: { backgroundColor: '#0038A8', padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }, headerTitle: { color: '#fff', fontSize: 18, fontWeight: '900' }, headerSub: { color: '#bfdbfe', fontSize: 12, marginTop: 2 }, content: { padding: 16, paddingBottom: 40 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }, error: { color: '#b91c1c', textAlign: 'center' }, retry: { marginTop: 14, padding: 10, backgroundColor: '#0038A8', borderRadius: 8 }, retryText: { color: '#fff', fontWeight: '800' }, summary: { backgroundColor: '#dbeafe', borderRadius: 14, padding: 15, marginBottom: 20 }, summaryTitle: { color: '#0038A8', fontWeight: '900', marginBottom: 4 }, summaryText: { color: '#334155', fontSize: 12, lineHeight: 17, marginTop: 2 }, sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }, sectionTitle: { fontSize: 16, fontWeight: '900', color: '#0f172a' }, addButton: { flexDirection: 'row', gap: 6, alignItems: 'center', backgroundColor: '#0038A8', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 }, addText: { color: '#fff', fontSize: 12, fontWeight: '800' }, card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#e2e8f0' }, caseCard: { backgroundColor: '#fff', borderRadius: 14, padding: 15, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' }, caseHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 12 }, cardTitle: { fontWeight: '900', color: '#1e293b' }, cardSub: { color: '#64748b', fontSize: 12, marginTop: 3 }, unverified: { color: '#b45309', fontSize: 11, fontWeight: '700', marginTop: 4 }, status: { color: '#b45309', backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, fontSize: 11, fontWeight: '800' }, detailLabel: { color: '#475569', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', marginBottom: 4 }, detailText: { color: '#1e293b', fontSize: 13, lineHeight: 18, marginBottom: 8 }, metaText: { color: '#64748b', fontSize: 12, lineHeight: 17 }, caseActions: { flexDirection: 'row', gap: 8, marginTop: 14 }, empty: { color: '#64748b', fontSize: 13, marginBottom: 10 }, iconApprove: { backgroundColor: '#16a34a', padding: 9, borderRadius: 8 }, iconReject: { backgroundColor: '#dc2626', padding: 9, borderRadius: 8 }, resolve: { flex: 1, alignItems: 'center', backgroundColor: '#16a34a', padding: 10, borderRadius: 8 }, dismiss: { flex: 1, alignItems: 'center', backgroundColor: '#dc2626', padding: 10, borderRadius: 8 }, disabled: { opacity: 0.55 }, actionText: { color: '#fff', fontWeight: '800', fontSize: 12 }, modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,.5)' }, modal: { backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 22 }, modalTitle: { fontSize: 19, fontWeight: '900', color: '#0f172a' }, modalSub: { color: '#64748b', fontSize: 12, lineHeight: 17, marginVertical: 7 }, input: { color: '#0f172a', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#94a3b8', borderRadius: 9, padding: 12, marginTop: 9, fontSize: 15 }, remarksInput: { minHeight: 96, textAlignVertical: 'top' }, modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 16 }, cancel: { padding: 12 }, cancelText: { color: '#334155', fontWeight: '800', fontSize: 13 }, create: { backgroundColor: '#0038A8', padding: 12, borderRadius: 8 }, rejectDecision: { backgroundColor: '#dc2626', padding: 12, borderRadius: 8 },
});

export default CaptainControlScreen;
