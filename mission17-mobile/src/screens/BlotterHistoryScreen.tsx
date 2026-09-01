import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, ActivityIndicator, RefreshControl, Platform
} from 'react-native';
import { 
  ArrowLeft, Clock, CheckCircle, ShieldAlert, AlertCircle, 
  Activity, Copy, MapPin, Calendar, MessageSquare, PlusCircle, FileText, Filter
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { endpoints, GlobalState, getAuthHeaders } from '../config/api';
import { colors, spacing, radius, shadow, sharedStyles, typography } from '../config/theme';

const STATUS_FILTERS = ['All', 'Pending', 'In Progress', 'Resolved'];

const STATUS_CONFIG: Record<string, { icon: any; bg: string; text: string; border: string }> = {
  'Pending':     { icon: Clock,        bg: '#fef3c7', text: '#b45309', border: '#fde68a' },
  'In Progress': { icon: Activity,     bg: '#eff6ff', text: '#0038A8', border: '#bfdbfe' },
  'Resolved':    { icon: CheckCircle,  bg: '#dcfce7', text: '#15803d', border: '#86efac' },
  'Dismissed':   { icon: AlertCircle,  bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
};

const BlotterHistoryScreen = () => {
  const navigation = useNavigation<any>();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`${endpoints.auth.backendBaseUrl}/api/blotter-reports/my/${GlobalState.userId}`, {
        headers: await getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setReports(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('BlotterHistory fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const copyRefNumber = (refNum: string) => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(refNum);
    }
    setCopiedId(refNum);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter reports based on active tab
  const filteredReports = reports.filter(r => {
    if (activeFilter === 'All') return true;
    return r.status === activeFilter;
  });

  const getStatusCount = (filterName: string) => {
    if (filterName === 'All') return reports.length;
    return reports.filter(r => r.status === filterName).length;
  };

  const renderItem = ({ item }: { item: any }) => {
    const cfg = STATUS_CONFIG[item.status] ?? { 
      icon: Clock, 
      bg: '#f1f5f9', 
      text: '#475569', 
      border: '#cbd5e1' 
    };
    const StatusIcon = cfg.icon;
    const isCopied = copiedId === item.referenceNumber;

    return (
      <View style={styles.card}>
        {/* CARD HEADER */}
        <View style={styles.cardTop}>
          <TouchableOpacity 
            style={styles.refNumBadge}
            onPress={() => copyRefNumber(item.referenceNumber)}
            accessibilityRole="button"
            accessibilityLabel={`Copy Reference Number ${item.referenceNumber}`}
          >
            <Text style={styles.refNum}>{item.referenceNumber}</Text>
            <Copy size={13} color="#0038A8" style={{ marginLeft: 4 }} />
            {isCopied && <Text style={styles.copiedTag}>Copied!</Text>}
          </TouchableOpacity>

          <View style={[styles.badge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
            <StatusIcon size={13} color={cfg.text} />
            <Text style={[styles.badgeText, { color: cfg.text }]}>{item.status}</Text>
          </View>
        </View>

        {/* INCIDENT TYPE & LOCATION */}
        <View style={styles.incidentRow}>
          <Text style={styles.incidentType}>{item.incidentType}</Text>
          <View style={styles.dateRow}>
            <Calendar size={12} color="#64748b" />
            <Text style={styles.dateText}>
              {new Date(item.createdAt).toDateString()}
            </Text>
          </View>
        </View>

        <View style={styles.locationRow}>
          <MapPin size={14} color="#64748b" style={{ marginTop: 2 }} />
          <Text style={styles.locationText} numberOfLines={1}>{item.location}</Text>
        </View>

        {/* STATEMENT NARRATIVE */}
        <Text style={styles.description} numberOfLines={3}>{item.description}</Text>

        {/* ⚖️ LUPON CONCILIATION SCHEDULE BANNER */}
        {(item.hearingDate || (item.hearingStage && item.hearingStage !== 'None')) ? (
          <View style={{ backgroundColor: '#F0FDF4', borderRadius: 10, padding: 12, marginTop: 10, borderWidth: 1, borderColor: '#86EFAC' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Text style={{ fontSize: 14 }}>⚖️</Text>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#166534' }}>
                Lupon Conciliation: {item.hearingStage || 'Mediation Hearing'}
              </Text>
            </View>
            {item.hearingDate && (
              <Text style={{ fontSize: 12, color: '#15803D', fontWeight: '700' }}>
                📅 Hearing Schedule: {new Date(item.hearingDate).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </Text>
            )}
            <Text style={{ fontSize: 11.5, color: '#166534', marginTop: 2 }}>
              📍 Venue: Tanggapan ng Lupong Tagapamayapa, Barangay Hall
            </Text>
            {item.respondentName ? (
              <Text style={{ fontSize: 11.5, color: '#166534', marginTop: 2 }}>
                👤 Respondent: {item.respondentName}
              </Text>
            ) : null}
          </View>
        ) : null}

        {/* ADMIN REMARKS */}
        {item.adminRemarks ? (
          <View style={styles.remarkBox}>
            <View style={styles.remarkHeader}>
              <MessageSquare size={13} color="#1e40af" />
              <Text style={styles.remarkLabel}>Barangay Desk Officer Evaluation:</Text>
            </View>
            <Text style={styles.remarkText}>{item.adminRemarks}</Text>
          </View>
        ) : null}
      </View>
    );
  };


  return (
    <SafeAreaView style={styles.root}>
      {/* HEADER */}
      <View style={sharedStyles.header}>
        <TouchableOpacity 
          style={sharedStyles.backBtn} 
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={sharedStyles.headerTitle}>My Blotter Reports</Text>
        <TouchableOpacity 
          style={styles.headerAddBtn}
          onPress={() => navigation.navigate('BlotterReport')}
          accessibilityRole="button"
          accessibilityLabel="File New Blotter Report"
        >
          <PlusCircle size={22} color="white" />
        </TouchableOpacity>
      </View>

      {/* FILTER TABS (Hierarchy & Accessibility) */}
      <View style={styles.filterStrip}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_FILTERS}
          keyExtractor={item => item}
          contentContainerStyle={{ paddingHorizontal: 14, gap: 8 }}
          renderItem={({ item }) => {
            const isActive = activeFilter === item;
            const count = getStatusCount(item);
            return (
              <TouchableOpacity
                style={[styles.filterTab, isActive && styles.filterTabActive]}
                onPress={() => setActiveFilter(item)}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${item}, ${count} reports`}
              >
                <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                  {item}
                </Text>
                <View style={[styles.filterCountBadge, isActive && styles.filterCountBadgeActive]}>
                  <Text style={[styles.filterCountText, isActive && styles.filterCountTextActive]}>
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0038A8" />
          <Text style={styles.loadingText}>Retrieving your blotter records...</Text>
        </View>
      ) : filteredReports.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIconCircle}>
            <ShieldAlert size={44} color="#0038A8" />
          </View>
          <Text style={styles.emptyTitle}>
            {activeFilter === 'All' ? 'No Blotter Reports Yet' : `No ${activeFilter} Reports`}
          </Text>
          <Text style={styles.emptyText}>
            {activeFilter === 'All' 
              ? 'You have not filed any incident reports. If you experience or witness an incident, you can file one directly.'
              : `There are currently no reports with the status "${activeFilter}".`
            }
          </Text>
          <TouchableOpacity 
            style={styles.fileReportBtn}
            onPress={() => navigation.navigate('BlotterReport')}
            accessibilityRole="button"
            accessibilityLabel="File a Blotter Report Now"
          >
            <Text style={styles.fileReportBtnText}>+ File a Blotter Report</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredReports}
          keyExtractor={item => item._id || item.referenceNumber}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0038A8" />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f1f5f9' },
  headerAddBtn: { padding: 4 },
  list: { padding: 14, paddingBottom: 24 },

  // FILTER STRIP
  filterStrip: {
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  filterTabActive: {
    backgroundColor: '#0038A8',
    borderColor: '#0038A8',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  filterTabTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  filterCountBadge: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  filterCountBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  filterCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  filterCountTextActive: {
    color: '#ffffff',
  },

  // CARD STYLES
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0038A8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  refNumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  refNum: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0038A8',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 0.5,
  },
  copiedTag: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#16a34a',
    marginLeft: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11.5,
    fontWeight: '800',
  },

  // INCIDENT ROW
  incidentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  incidentType: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  locationText: {
    fontSize: 12.5,
    color: '#475569',
    fontWeight: '600',
    flex: 1,
  },

  description: {
    fontSize: 13.5,
    color: '#334155',
    lineHeight: 20,
    marginBottom: 10,
  },

  // REMARKS
  remarkBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  remarkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  remarkLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#1e40af',
  },
  remarkText: {
    fontSize: 12.5,
    color: '#1e3a8a',
    lineHeight: 18,
    fontWeight: '500',
  },

  // EMPTY & LOADING STATES
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 12,
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 280,
    marginBottom: 20,
  },
  fileReportBtn: {
    backgroundColor: '#0038A8',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#0038A8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  fileReportBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
});

export default BlotterHistoryScreen;
