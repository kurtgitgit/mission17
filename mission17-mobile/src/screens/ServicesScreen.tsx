import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Platform, SafeAreaView, StatusBar, Alert, ActivityIndicator, Modal,
  RefreshControl
} from 'react-native';
import { FileText, ChevronDown, CheckCircle, Clock, AlertCircle, XCircle, PackageCheck, ArrowLeft } from 'lucide-react-native';
import { GlobalState, endpoints } from '../config/api';
import { useNavigation } from '@react-navigation/native';

const DOCUMENT_TYPES = [
  'Barangay Clearance',
  'Certificate of Indigency',
  'Certificate of Residency',
  'Business Clearance',
  'Certificate of Good Moral Character',
  'Barangay ID',
];

const STATUS_CONFIG: Record<string, { color: string; icon: any; bg: string }> = {
  'Pending':             { color: '#b45309', icon: Clock,        bg: '#fef3c7' },
  'Processing':          { color: '#0891b2', icon: AlertCircle,  bg: '#e0f2fe' },
  'Ready for Pickup':    { color: '#7c3aed', icon: PackageCheck, bg: '#ede9fe' },
  'Completed':           { color: '#16a34a', icon: CheckCircle,  bg: '#dcfce7' },
  'Rejected':            { color: '#dc2626', icon: XCircle,      bg: '#fee2e2' },
};

const ServicesScreen: React.FC = () => {
  const [tab, setTab] = useState<'request' | 'status'>('request');
  const [docType, setDocType] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [contact, setContact] = useState('');
  const [purpose, setPurpose] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successRef, setSuccessRef] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState('');

  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const userId = GlobalState.userId;
  const navigation = useNavigation<any>();
  const RootComponent = (Platform.OS === 'web' ? View : SafeAreaView) as React.ElementType;

  const fetchMyRequests = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(endpoints.documentRequests.my(userId));
      if (res.ok) {
        const data = await res.json();
        setMyRequests(data);
      }
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    } finally {
      setLoadingStatus(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    if (tab === 'status') {
      setLoadingStatus(true);
      fetchMyRequests();
    }
  }, [tab]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!docType) newErrors.docType = 'Please select a document type.';
    if (!fullName.trim() || fullName.trim().length < 3 || !/[a-zA-Z]/.test(fullName))
      newErrors.fullName = 'Please enter a valid full name (letters required).';
    if (!address.trim() || address.trim().length < 5 || !/[a-zA-Z]/.test(address))
      newErrors.address = 'Please enter a complete and valid address.';
    const cleanContact = contact.trim().replace(/\s/g, '');
    if (!/^09\d{9}$/.test(cleanContact) || /^(.)\1+$/.test(cleanContact))
      newErrors.contact = 'Enter a valid PH mobile number (e.g. 09123456789).';
    const cleanPurpose = purpose.trim();
    if (!cleanPurpose || cleanPurpose.length < 5 || !/[a-zA-Z]/.test(cleanPurpose) || /^(.)\1+$/.test(cleanPurpose))
      newErrors.purpose = 'Please state a clear purpose (letters required).';
    return newErrors;
  };

  const handleSubmit = async () => {
    const newErrors = validate();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    if (!userId) return Alert.alert('Error', 'You must be logged in to request documents.');

    setSubmitting(true);
    try {
      const res = await fetch(endpoints.documentRequests.submit, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          username: GlobalState.username || 'Resident',
          fullName: fullName.trim(),
          address: address.trim(),
          contactNumber: contact.trim(),
          documentType: docType,
          purpose: purpose.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessRef(data.referenceNumber);
        setDocType(''); setFullName(''); setAddress(''); setContact(''); setPurpose(''); setErrors({});
      } else {
        setSubmitError(data.message || 'Failed to submit request. Please try again.');
      }
    } catch (err) {
      setSubmitError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStatusCard = (item: any) => {
    const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG['Pending'];
    const StatusIcon = cfg.icon;
    const date = new Date(item.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });

    return (
      <View key={item._id} style={styles.statusCard}>
        <View style={styles.statusCardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.statusDocType}>{item.documentType}</Text>
            <Text style={styles.statusRef}>Ref: {item.referenceNumber}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <StatusIcon size={13} color={cfg.color} />
            <Text style={[styles.statusBadgeText, { color: cfg.color }]}>{item.status}</Text>
          </View>
        </View>
        <View style={styles.statusMeta}>
          <Text style={styles.statusMetaText}>Purpose: {item.purpose}</Text>
          <Text style={styles.statusMetaText}>Submitted: {date}</Text>
          {item.rejectionReason && (
            <Text style={[styles.statusMetaText, { color: '#dc2626' }]}>Reason: {item.rejectionReason}</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <RootComponent style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0038A8" />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ArrowLeft size={20} color="white" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <FileText size={20} color="white" />
            <Text style={styles.headerTitle}>Barangay Services</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.headerSub}>Request Official Barangay Documents</Text>

        {/* Tab switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'request' && styles.tabBtnActive]}
            onPress={() => setTab('request')}
          >
            <Text style={[styles.tabText, tab === 'request' && styles.tabTextActive]}>New Request</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'status' && styles.tabBtnActive]}
            onPress={() => setTab('status')}
          >
            <Text style={[styles.tabText, tab === 'status' && styles.tabTextActive]}>My Requests</Text>
          </TouchableOpacity>
        </View>
      </View>

      {tab === 'request' ? (
        <ScrollView contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>
          <View style={styles.formCard}>
            <Text style={styles.formCardTitle}>Document Request Form</Text>
            <Text style={styles.formCardSub}>Fill out the form below. Processing time is 1–3 working days.</Text>

            {/* ── SUCCESS CARD ── */}
            {successRef && (
              <View style={styles.successCard}>
                <Text style={styles.successIcon}>✅</Text>
                <Text style={styles.successTitle}>Request Submitted!</Text>
                <Text style={styles.successBody}>Your request for <Text style={{fontWeight:'800'}}>{'"}"'}</Text> has been received.</Text>
                <Text style={styles.successRef}>Reference No: <Text style={{fontWeight:'800', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'}}>{successRef}</Text></Text>
                <Text style={styles.successBody}>We will notify you once it is ready for pickup.</Text>
                <TouchableOpacity style={styles.successBtn} onPress={() => { setSuccessRef(null); setTab('status'); }}>
                  <Text style={styles.successBtnText}>View My Requests →</Text>
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

            {/* Document Type Picker */}
            <Text style={styles.label}>Document Type *</Text>
            <TouchableOpacity style={styles.picker} onPress={() => setShowPicker(true)}>
              <Text style={[styles.pickerText, !docType && styles.pickerPlaceholder]}>
                {docType || 'Select document type...'}
              </Text>
              <ChevronDown size={18} color="#64748b" />
            </TouchableOpacity>

            <Text style={styles.label}>Full Name *</Text>
            <TextInput style={[styles.input, errors.fullName ? styles.inputError : null]} placeholder="Juan dela Cruz" value={fullName} onChangeText={(t) => { setFullName(t); setErrors(e => ({...e, fullName: ''})); }} />
            {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}

            <Text style={styles.label}>Complete Address *</Text>
            <TextInput style={[styles.input, errors.address ? styles.inputError : null]} placeholder="Blk 1, Lot 2, Barangay Pantal, Dagupan City" value={address} onChangeText={(t) => { setAddress(t); setErrors(e => ({...e, address: ''})); }} multiline numberOfLines={2} />
            {errors.address ? <Text style={styles.errorText}>{errors.address}</Text> : null}

            <Text style={styles.label}>Contact Number *</Text>
            <TextInput style={[styles.input, errors.contact ? styles.inputError : null]} placeholder="09XX XXX XXXX" value={contact} onChangeText={(t) => { setContact(t); setErrors(e => ({...e, contact: ''})); }} keyboardType="phone-pad" maxLength={11} />
            {errors.contact ? <Text style={styles.errorText}>{errors.contact}</Text> : null}

            <Text style={styles.label}>Purpose *</Text>
            <TextInput style={[styles.input, { height: 90, textAlignVertical: 'top' }, errors.purpose ? styles.inputError : null]} placeholder="State the purpose of the document (e.g., Employment, Bank Loan, Travel...)" value={purpose} onChangeText={(t) => { setPurpose(t); setErrors(e => ({...e, purpose: ''})); }} multiline />
            {errors.purpose ? <Text style={styles.errorText}>{errors.purpose}</Text> : null}

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>📋 Requirements: Valid government-issued ID upon pickup.</Text>
              <Text style={styles.infoText}>🏛️ Pickup: Barangay Hall of Pantal, Dagupan City</Text>
              <Text style={styles.infoText}>📞 Inquiries: Contact the Barangay Secretary</Text>
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
              {submitting ? <ActivityIndicator color="white" /> : <Text style={styles.submitBtnText}>Submit Request</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.statusContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchMyRequests(); }} tintColor="#0038A8" />}
        >
          {loadingStatus ? (
            <ActivityIndicator size="large" color="#0038A8" style={{ marginTop: 40 }} />
          ) : myRequests.length === 0 ? (
            <View style={styles.emptyState}>
              <FileText size={48} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Requests Yet</Text>
              <Text style={styles.emptyText}>Your document requests and their status will appear here.</Text>
            </View>
          ) : (
            myRequests.map(renderStatusCard)
          )}
        </ScrollView>
      )}

      {/* Document Type Picker Modal */}
      <Modal visible={showPicker} transparent animationType="slide">
        <TouchableOpacity style={styles.modalBackdrop} onPress={() => setShowPicker(false)} activeOpacity={1}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Document Type</Text>
            {DOCUMENT_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.modalOption, docType === type && styles.modalOptionActive]}
                onPress={() => { setDocType(type); setShowPicker(false); }}
              >
                <Text style={[styles.modalOptionText, docType === type && styles.modalOptionTextActive]}>{type}</Text>
                {docType === type && <CheckCircle size={16} color="#0038A8" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </RootComponent>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },

  header: {
    backgroundColor: '#0038A8',
    paddingTop: Platform.OS === 'android' ? 44 : 18,
    paddingHorizontal: 20,
    paddingBottom: 0,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: 'white' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 16 },

  tabContainer: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: 3 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  tabBtnActive: { backgroundColor: 'white' },
  tabText: { color: 'rgba(255,255,255,0.7)', fontWeight: '600', fontSize: 14 },
  tabTextActive: { color: '#0038A8' },

  formContent: { padding: 16, paddingBottom: 60 },
  formCard: { backgroundColor: 'white', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  formCardTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  formCardSub: { fontSize: 13, color: '#64748b', marginBottom: 20, lineHeight: 20 },

  label: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#0f172a',
    backgroundColor: '#f8fafc', marginBottom: 4,
  },
  inputError: { borderColor: '#dc2626', backgroundColor: '#fff5f5' },
  errorText: { fontSize: 11, color: '#dc2626', marginBottom: 12, marginLeft: 4, fontWeight: '600' },

  // SUCCESS CARD
  successCard: {
    backgroundColor: '#f0fdf4', borderWidth: 1.5, borderColor: '#16a34a',
    borderRadius: 14, padding: 20, marginBottom: 20, alignItems: 'center',
  },
  successIcon: { fontSize: 40, marginBottom: 8 },
  successTitle: { fontSize: 18, fontWeight: '900', color: '#15803d', marginBottom: 6 },
  successBody: { fontSize: 13, color: '#166534', textAlign: 'center', lineHeight: 20, marginBottom: 4 },
  successRef: { fontSize: 13, color: '#166534', textAlign: 'center', marginBottom: 10 },
  successBtn: {
    marginTop: 10, backgroundColor: '#16a34a', borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 24,
  },
  successBtnText: { color: 'white', fontWeight: '800', fontSize: 14 },

  // ERROR BANNER
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fee2e2', borderWidth: 1, borderColor: '#dc2626',
    borderRadius: 10, padding: 12, marginBottom: 16,
  },
  errorBannerText: { flex: 1, fontSize: 13, color: '#991b1b', fontWeight: '600' },
  errorBannerClose: { fontSize: 16, color: '#dc2626', marginLeft: 8, fontWeight: '800' },
  picker: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13, backgroundColor: '#f8fafc', marginBottom: 16,
  },
  pickerText: { fontSize: 14, color: '#0f172a' },
  pickerPlaceholder: { color: '#9ca3af' },

  infoBox: { backgroundColor: '#f0fdf4', borderRadius: 12, padding: 14, marginBottom: 20, gap: 6 },
  infoText: { fontSize: 12, color: '#15803d', lineHeight: 18 },

  submitBtn: {
    backgroundColor: '#0038A8', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#0038A8', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  submitBtnText: { color: 'white', fontWeight: '800', fontSize: 16 },

  statusContent: { padding: 16, paddingBottom: 60 },
  statusCard: {
    backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  statusCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  statusDocType: { fontSize: 15, fontWeight: '800', color: '#0f172a', marginBottom: 2 },
  statusRef: { fontSize: 12, color: '#64748b', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusBadgeText: { fontSize: 12, fontWeight: '700' },
  statusMeta: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10, gap: 3 },
  statusMetaText: { fontSize: 12, color: '#64748b' },

  emptyState: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#475569', marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#94a3b8', textAlign: 'center', lineHeight: 22 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 16 },
  modalOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalOptionActive: { backgroundColor: '#f0fdf4', borderRadius: 8, paddingHorizontal: 10 },
  modalOptionText: { fontSize: 15, color: '#374151' },
  modalOptionTextActive: { color: '#0038A8', fontWeight: '700' },
});

export default ServicesScreen;
