import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, ActivityIndicator
} from 'react-native';
import { ArrowLeft, Clock, CheckCircle, ShieldAlert, AlertCircle, Activity } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { endpoints, GlobalState } from '../config/api';
import { colors, spacing, radius, shadow, sharedStyles, typography } from '../config/theme';

// ─── STATUS HELPERS ───────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { icon: React.ReactNode; bg: string; text: string; border: string }> = {
  'Pending':     { icon: <Clock size={14} color={colors.statusPending.text} />,     ...colors.statusPending },
  'In Progress': { icon: <Activity size={14} color={colors.statusProgress.text} />, ...colors.statusProgress },
  'Resolved':    { icon: <CheckCircle size={14} color={colors.statusResolved.text} />, ...colors.statusResolved },
  'Dismissed':   { icon: <AlertCircle size={14} color={colors.statusDismissed.text} />, ...colors.statusDismissed },
};

const BlotterHistoryScreen = () => {
  const navigation = useNavigation<any>();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${endpoints.auth.backendBaseUrl}/api/blotter-reports/my/${GlobalState.userId}`);
      if (res.ok) setReports(await res.json());
    } catch (e) {
      console.error('BlotterHistory fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const cfg = STATUS_CONFIG[item.status] ?? { icon: <Clock size={14} color={colors.textMuted} />, bg: colors.borderLight, text: colors.textMuted, border: colors.border };
    return (
      <View style={styles.card}>
        {/* TOP ROW */}
        <View style={styles.cardTop}>
          <View>
            <Text style={styles.refNum}>{item.referenceNumber}</Text>
            <Text style={typography.caption}>{new Date(item.createdAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
            {cfg.icon}
            <Text style={[styles.badgeText, { color: cfg.text }]}>{item.status}</Text>
          </View>
        </View>

        {/* INCIDENT */}
        <Text style={styles.incidentType}>{item.incidentType}</Text>
        <Text style={styles.location}>📍 {item.location}</Text>
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>

        {/* ADMIN REMARK */}
        {item.adminRemarks && (
          <View style={styles.remarkBox}>
            <Text style={styles.remarkLabel}>💬 Admin Remarks</Text>
            <Text style={styles.remarkText}>{item.adminRemarks}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={sharedStyles.header}>
        <TouchableOpacity style={sharedStyles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={sharedStyles.headerTitle}>My Blotter Reports</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your reports...</Text>
        </View>
      ) : reports.length === 0 ? (
        <View style={styles.center}>
          <ShieldAlert size={56} color={colors.border} />
          <Text style={styles.emptyTitle}>No Reports Yet</Text>
          <Text style={styles.emptyText}>You haven't filed any blotter reports. If you experience an incident, you can file one from the Services page.</Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md },

  center:      { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  loadingText: { ...typography.body, marginTop: spacing.sm },
  emptyTitle:  { ...typography.h2, marginTop: spacing.md, color: colors.textPrimary },
  emptyText:   { ...typography.body, textAlign: 'center', marginTop: spacing.sm, maxWidth: 280 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    ...shadow.sm,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },

  refNum:      { fontSize: 12, fontWeight: '800', color: colors.primary, letterSpacing: 1 },
  badge:       { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.full, borderWidth: 1 },
  badgeText:   { fontSize: 11, fontWeight: '700' },

  incidentType:{ fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  location:    { fontSize: 12, color: colors.textMuted, marginTop: 2, marginBottom: spacing.sm },
  description: { ...typography.body, fontSize: 13 },

  remarkBox:   { backgroundColor: colors.primaryLight, borderRadius: radius.sm, padding: spacing.sm, marginTop: spacing.sm },
  remarkLabel: { fontSize: 11, fontWeight: '700', color: colors.primary, marginBottom: 4 },
  remarkText:  { fontSize: 13, color: colors.primary, fontStyle: 'italic' },
});

export default BlotterHistoryScreen;
