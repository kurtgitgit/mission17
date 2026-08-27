import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Platform, SafeAreaView, StatusBar, Alert, ActivityIndicator, Modal,
  RefreshControl
} from 'react-native';
import { 
  FileText, ChevronDown, CheckCircle, Clock, AlertCircle, XCircle, 
  PackageCheck, ArrowLeft, User, MapPin, Phone, Info, Copy, Sparkles, Building, Bookmark
} from 'lucide-react-native';
import { GlobalState, endpoints } from '../config/api';
import { useNavigation } from '@react-navigation/native';
import { sharedStyles } from '../config/theme';

const DOCUMENT_TYPES = [
  { id: 'Barangay Clearance', label: 'Barangay Clearance', fee: '₱50.00', time: '1–2 Days', desc: 'For employment, business, or general legal verification' },
  { id: 'Certificate of Indigency', label: 'Certificate of Indigency', fee: 'FREE', time: '1 Day', desc: 'For medical, financial, or scholarship assistance' },
  { id: 'Certificate of Residency', label: 'Certificate of Residency', fee: '₱30.00', time: '1 Day', desc: 'Proof of bona fide residence in Bagong Pag-asa' },
  { id: 'Business Clearance', label: 'Business Clearance', fee: '₱150.00', time: '2–3 Days', desc: 'Permit clearance for micro & local businesses' },
  { id: 'Certificate of Good Moral Character', label: 'Good Moral Character', fee: '₱50.00', time: '1–2 Days', desc: 'For school admission, job applications, or court' },
  { id: 'Barangay ID', label: 'Barangay Resident ID', fee: '₱100.00', time: 'Same Day', desc: 'Official photo ID card issued by Barangay' },
];

const STATUS_CONFIG: Record<string, { color: string; icon: any; bg: string; border: string }> = {
  'Pending':          { color: '#b45309', icon: Clock,        bg: '#fef3c7', border: '#fde68a' },
  'Processing':       { color: '#0369a1', icon: AlertCircle,  bg: '#e0f2fe', border: '#bae6fd' },
  'Ready for Pickup': { color: '#7c3aed', icon: PackageCheck, bg: '#ede9fe', border: '#ddd6fe' },
  'Completed':        { color: '#15803d', icon: CheckCircle,  bg: '#dcfce7', border: '#86efac' },
  'Rejected':         { color: '#991b1b', icon: XCircle,      bg: '#fee2e2', border: '#fca5a5' },
};

const ServicesScreen: React.FC = () => {
  const [tab, setTab] = useState<'request' | 'status'>('request');
  const [docType, setDocType] = useState('Barangay Clearance');
  const [showPicker, setShowPicker] = useState(false);
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [contact, setContact] = useState('');
  const [purpose, setPurpose] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successRef, setSuccessRef] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
        setMyRequests(Array.isArray(data) ? data : []);
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
  }, [tab, fetchMyRequests]);

  const copyRefNumber = (refNum: string) => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(refNum);
    }
    setCopiedId(refNum);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!docType) newErrors.docType = 'Please choose a document type.';
    if (!fullName.trim() || fullName.trim().length < 3 || !/[a-zA-Z]/.test(fullName))
      newErrors.fullName = 'Please enter your complete legal name.';
    if (!address.trim() || address.trim().length < 5 || !/[a-zA-Z]/.test(address))
      newErrors.address = 'Please specify your Purok / Street in Bagong Pag-asa.';
    const cleanContact = contact.trim().replace(/\s/g, '');
    if (!/^09\d{9}$/.test(cleanContact) || /^(.)\1+$/.test(cleanContact))
      newErrors.contact = 'Enter a valid 11-digit mobile number (e.g. 0917 123 4567).';
    const cleanPurpose = purpose.trim();
    if (!cleanPurpose || cleanPurpose.length < 5 || !/[a-zA-Z]/.test(cleanPurpose))
      newErrors.purpose = 'Please state why you need this document (at least 5 letters).';
    return newErrors;
  };

  const handleSubmit = async () => {
    const newErrors = validate();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    if (!userId) return Alert.alert('Error', 'You must be logged in to request documents.');

    setSubmitting(true);
    setSubmitError('');
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
        setSuccessRef(data.referenceNumber || 'DOC-' + Date.now().toString().slice(-6));
        setFullName(''); setAddress(''); setContact(''); setPurpose(''); setErrors({});
      } else {
        setSubmitError(data.message || 'Failed to submit request. Please try again.');
      }
    } catch (err) {
      setSubmitError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedDocObj = DOCUMENT_TYPES.find(d => d.id === docType) || DOCUMENT_TYPES[0];

  const renderStatusCard = (item: any) => {
    const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG['Pending'];
    const StatusIcon = cfg.icon;
    const date = new Date(item.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
    const isCopied = copiedId === item.referenceNumber;

    return (
      <View key={item._id} style={styles.statusCard}>
        <View style={styles.statusCardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.statusDocType}>{item.documentType}</Text>
            <TouchableOpacity 
              style={styles.refRow} 
              onPress={() => copyRefNumber(item.referenceNumber)}
              accessibilityRole="button"
              accessibilityLabel={`Copy Reference Number ${item.referenceNumber}`}
            >
              <Text style={styles.statusRef}>{item.referenceNumber}</Text>
              <Copy size={12} color="#0038A8" style={{ marginLeft: 4 }} />
              {isCopied && <Text style={styles.copiedTag}>Copied!</Text>}
            </TouchableOpacity>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
            <StatusIcon size={13} color={cfg.color} />
            <Text style={[styles.statusBadgeText, { color: cfg.color }]}>{item.status}</Text>
          </View>
        </View>
        <View style={styles.statusMeta}>
          <Text style={styles.statusMetaText}>📌 Purpose: {item.purpose}</Text>
          <Text style={styles.statusMetaText}>📅 Submitted: {date}</Text>
          {item.rejectionReason && (
            <Text style={[styles.statusMetaText, { color: '#dc2626', fontWeight: '700' }]}>
              ⚠️ Reason: {item.rejectionReason}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <RootComponent style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0038A8" />

      {/* HEADER */}
      <View style={sharedStyles.header}>
        <TouchableOpacity 
          style={sharedStyles.backBtn} 
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back to dashboard"
        >
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={sharedStyles.headerTitle}>Barangay Clearances & E-Docs</Text>
      </View>

      {/* SEGMENTED TAB SWITCHER */}
      <View style={styles.segmentStrip}>
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[styles.segmentBtn, tab === 'request' && styles.segmentBtnActive]}
            onPress={() => setTab('request')}
            accessibilityRole="button"
            accessibilityLabel="New Document Request Tab"
          >
            <Text style={[styles.segmentText, tab === 'request' && styles.segmentTextActive]}>
              New Request
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, tab === 'status' && styles.segmentBtnActive]}
            onPress={() => setTab('status')}
            accessibilityRole="button"
            accessibilityLabel={`My Requests Tab, ${myRequests.length} requests`}
          >
            <Text style={[styles.segmentText, tab === 'status' && styles.segmentTextActive]}>
              My Requests {myRequests.length > 0 ? `(${myRequests.length})` : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {tab === 'request' ? (
        <ScrollView contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>
          
          {/* SUCCESS CONFIRMATION BANNER */}
          {successRef && (
            <View style={styles.successCard}>
              <View style={styles.successBadgeCircle}>
                <CheckCircle size={36} color="#16a34a" />
              </View>
              <Text style={styles.successTitle}>Request Submitted!</Text>
              <Text style={styles.successBody}>
                Your clearance request has been queued for Desk Officer evaluation.
              </Text>
              <View style={styles.successRefBox}>
                <Text style={styles.successRefLabel}>OFFICIAL REFERENCE NUMBER</Text>
                <Text style={styles.successRefNum}>{successRef}</Text>
              </View>
              <TouchableOpacity 
                style={styles.successBtn} 
                onPress={() => { setSuccessRef(null); setTab('status'); }}
                accessibilityRole="button"
              >
                <Text style={styles.successBtnText}>Track Request Status →</Text>
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

          {/* ── CARD 1: DOCUMENT TYPE SELECTION ── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>1</Text></View>
              <Text style={styles.cardTitle}>Document Selection</Text>
            </View>

            <Text style={styles.label}>Select Document to Request <Text style={styles.requiredStar}>*</Text></Text>
            <TouchableOpacity 
              style={styles.picker} 
              onPress={() => setShowPicker(true)}
              accessibilityRole="button"
              accessibilityLabel="Choose document type"
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.pickerTitle}>{selectedDocObj.label}</Text>
                <Text style={styles.pickerDesc}>{selectedDocObj.desc}</Text>
              </View>
              <ChevronDown size={20} color="#0038A8" />
            </TouchableOpacity>

            <View style={styles.badgeRow}>
              <View style={styles.feeBadge}>
                <Text style={styles.feeBadgeLabel}>FEE: </Text>
                <Text style={styles.feeBadgeValue}>{selectedDocObj.fee}</Text>
              </View>
              <View style={styles.timeBadge}>
                <Clock size={12} color="#0038A8" />
                <Text style={styles.timeBadgeText}>Est: {selectedDocObj.time}</Text>
              </View>
            </View>
          </View>

          {/* ── CARD 2: APPLICANT DETAILS ── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>2</Text></View>
              <Text style={styles.cardTitle}>Applicant Details</Text>
            </View>

            {/* FULL NAME */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Legal Name <Text style={styles.requiredStar}>*</Text></Text>
              <View style={[styles.inputBox, errors.fullName ? styles.inputBoxError : null]}>
                <User size={18} color="#64748b" style={styles.inputIcon} />
                <TextInput 
                  style={styles.textInputField} 
                  placeholder="e.g. Juan C. dela Cruz" 
                  placeholderTextColor="#94a3b8"
                  value={fullName} 
                  onChangeText={(t) => { setFullName(t); setErrors(e => ({...e, fullName: ''})); }} 
                  accessibilityLabel="Full Legal Name"
                />
              </View>
              {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}
            </View>

            {/* ADDRESS */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Complete Resident Address <Text style={styles.requiredStar}>*</Text></Text>
              <View style={[styles.inputBox, errors.address ? styles.inputBoxError : null]}>
                <MapPin size={18} color="#64748b" style={styles.inputIcon} />
                <TextInput 
                  style={styles.textInputField} 
                  placeholder="e.g. Purok 2, Bagong Pag-asa, San Jacinto" 
                  placeholderTextColor="#94a3b8"
                  value={address} 
                  onChangeText={(t) => { setAddress(t); setErrors(e => ({...e, address: ''})); }} 
                  accessibilityLabel="Complete Resident Address"
                />
              </View>
              {errors.address ? <Text style={styles.errorText}>{errors.address}</Text> : null}
            </View>

            {/* CONTACT */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contact Number <Text style={styles.requiredStar}>*</Text></Text>
              <View style={[styles.inputBox, errors.contact ? styles.inputBoxError : null]}>
                <Phone size={18} color="#64748b" style={styles.inputIcon} />
                <TextInput 
                  style={styles.textInputField} 
                  placeholder="0917 123 4567" 
                  placeholderTextColor="#94a3b8"
                  value={contact} 
                  onChangeText={(t) => { setContact(t); setErrors(e => ({...e, contact: ''})); }} 
                  keyboardType="phone-pad" 
                  maxLength={11} 
                  accessibilityLabel="Contact Number"
                />
              </View>
              {errors.contact ? <Text style={styles.errorText}>{errors.contact}</Text> : (
                <Text style={styles.helperText}>Used for SMS pickup notifications.</Text>
              )}
            </View>
          </View>

          {/* ── CARD 3: PURPOSE & OFFICIAL NOTICE ── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>3</Text></View>
              <Text style={styles.cardTitle}>Purpose & Guidelines</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Purpose of Request <Text style={styles.requiredStar}>*</Text></Text>
              <TextInput 
                style={[styles.textAreaField, errors.purpose ? styles.inputBoxError : null]} 
                placeholder="State specific purpose (e.g. Local Employment, Bank Requirement, School Transfer...)" 
                placeholderTextColor="#94a3b8"
                value={purpose} 
                onChangeText={(t) => { setPurpose(t); setErrors(e => ({...e, purpose: ''})); }} 
                multiline 
                textAlignVertical="top"
                accessibilityLabel="Purpose of Request"
              />
              {errors.purpose ? <Text style={styles.errorText}>{errors.purpose}</Text> : null}
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>🏛️ Pickup Location: Barangay Hall, San Jacinto, Pangasinan</Text>
              <Text style={styles.infoText}>📋 Requirements: Bring 1 Valid ID and exact fee upon release.</Text>
              <Text style={styles.infoText}>💡 Indigent residents can present an indigent proof for fee exemption.</Text>
            </View>

            <TouchableOpacity 
              style={[styles.submitBtn, submitting && { opacity: 0.65 }]} 
              onPress={handleSubmit} 
              disabled={submitting}
              accessibilityRole="button"
              accessibilityLabel="Submit Document Request"
            >
              {submitting 
                ? <ActivityIndicator color="white" /> 
                : <Text style={styles.submitBtnText}>Submit Document Request →</Text>
              }
            </TouchableOpacity>
          </View>

        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.statusContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchMyRequests(); }} tintColor="#0038A8" />
          }
        >
          {loadingStatus ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="large" color="#0038A8" />
              <Text style={styles.loadingText}>Fetching your document requests...</Text>
            </View>
          ) : myRequests.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <FileText size={40} color="#0038A8" />
              </View>
              <Text style={styles.emptyTitle}>No Requests Found</Text>
              <Text style={styles.emptyText}>You have not filed any clearance or certificate requests yet.</Text>
              <TouchableOpacity style={styles.newReqBtn} onPress={() => setTab('request')}>
                <Text style={styles.newReqBtnText}>+ Request a Document</Text>
              </TouchableOpacity>
            </View>
          ) : (
            myRequests.map(renderStatusCard)
          )}
        </ScrollView>
      )}

      {/* DOCUMENT TYPE PICKER MODAL */}
      <Modal visible={showPicker} transparent animationType="slide">
        <TouchableOpacity style={styles.modalBackdrop} onPress={() => setShowPicker(false)} activeOpacity={1}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Document Type</Text>
            {DOCUMENT_TYPES.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.modalOption, docType === item.id && styles.modalOptionActive]}
                onPress={() => { setDocType(item.id); setShowPicker(false); }}
                accessibilityRole="button"
                accessibilityLabel={`Select ${item.label}`}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalOptionText, docType === item.id && styles.modalOptionTextActive]}>
                    {item.label}
                  </Text>
                  <Text style={styles.modalOptionSub}>{item.desc}</Text>
                </View>
                <View style={styles.modalOptionBadge}>
                  <Text style={styles.modalOptionFee}>{item.fee}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </RootComponent>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },

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
    color: '#64748b',
    fontWeight: '700',
    fontSize: 13.5,
  },
  segmentTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },

  formContent: { padding: 14, paddingBottom: 60 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
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

  // INPUTS
  inputGroup: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 6 },
  requiredStar: { color: '#dc2626' },
  helperText: { fontSize: 11, color: '#64748b', marginTop: 4, marginLeft: 2 },

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
  inputBoxError: { borderColor: '#dc2626', backgroundColor: '#fff5f5' },
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
    height: 100,
    fontSize: 14.5,
    color: '#0f172a',
    fontWeight: '500',
    ...Platform.select({ web: { outlineStyle: 'none' as any } })
  },
  errorText: { fontSize: 11.5, color: '#dc2626', marginTop: 4, marginLeft: 4, fontWeight: '700' },

  // PICKER
  picker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#eff6ff',
    marginBottom: 10,
  },
  pickerTitle: { fontSize: 15, fontWeight: '800', color: '#0038A8' },
  pickerDesc: { fontSize: 12, color: '#475569', marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  feeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  feeBadgeLabel: { fontSize: 11, fontWeight: '700', color: '#64748b' },
  feeBadgeValue: { fontSize: 11, fontWeight: '900', color: '#0038A8' },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  timeBadgeText: { fontSize: 11, fontWeight: '700', color: '#475569' },

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
    shadowRadius: 6,
    elevation: 2,
  },
  successBadgeCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  successTitle: { fontSize: 20, fontWeight: '900', color: '#15803d', marginBottom: 4 },
  successBody: { fontSize: 13, color: '#475569', textAlign: 'center', lineHeight: 19, marginBottom: 12 },
  successRefBox: {
    backgroundColor: '#eff6ff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginBottom: 14,
  },
  successRefLabel: { fontSize: 10.5, fontWeight: '800', color: '#64748b', letterSpacing: 0.6 },
  successRefNum: { fontSize: 16, fontWeight: '900', color: '#0038A8', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginTop: 2 },
  successBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  successBtnText: { color: 'white', fontWeight: '800', fontSize: 14 },

  // ERROR BANNER
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

  infoBox: { backgroundColor: '#f0fdf4', borderRadius: 12, padding: 14, marginBottom: 16, gap: 6, borderWidth: 1, borderColor: '#bbf7d0' },
  infoText: { fontSize: 12, color: '#166534', lineHeight: 18, fontWeight: '500' },

  submitBtn: {
    backgroundColor: '#0038A8',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#0038A8',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  submitBtnText: { color: 'white', fontWeight: '800', fontSize: 15 },

  // STATUS TAB STYLES
  statusContent: { padding: 14, paddingBottom: 60 },
  statusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0038A8',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statusCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  statusDocType: { fontSize: 15, fontWeight: '800', color: '#0f172a', marginBottom: 3 },
  refRow: { flexDirection: 'row', alignItems: 'center' },
  statusRef: { fontSize: 12, color: '#0038A8', fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  copiedTag: { fontSize: 10.5, fontWeight: '800', color: '#16a34a', marginLeft: 6 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  statusBadgeText: { fontSize: 11.5, fontWeight: '800' },
  statusMeta: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10, gap: 4 },
  statusMetaText: { fontSize: 12.5, color: '#475569', fontWeight: '500' },

  centerLoading: { alignItems: 'center', marginTop: 60 },
  loadingText: { fontSize: 13.5, color: '#64748b', marginTop: 12, fontWeight: '600' },

  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 24 },
  emptyIconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginBottom: 14, borderWidth: 1.5, borderColor: '#bfdbfe' },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
  emptyText: { fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 20, marginBottom: 18 },
  newReqBtn: { backgroundColor: '#0038A8', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
  newReqBtnText: { color: 'white', fontWeight: '800', fontSize: 14 },

  // MODAL
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 14 },
  modalOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalOptionActive: { backgroundColor: '#eff6ff', borderRadius: 10 },
  modalOptionText: { fontSize: 14.5, color: '#0f172a', fontWeight: '700' },
  modalOptionTextActive: { color: '#0038A8', fontWeight: '800' },
  modalOptionSub: { fontSize: 11.5, color: '#64748b', marginTop: 2 },
  modalOptionBadge: { backgroundColor: '#f1f5f9', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
  modalOptionFee: { fontSize: 11.5, fontWeight: '800', color: '#0038A8' },
});

export default ServicesScreen;

