import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, SafeAreaView, ActivityIndicator, StatusBar, Linking, Alert,
  RefreshControl
} from 'react-native';
import { User, Phone, Mail, Shield, ArrowLeft, Building2, ExternalLink } from 'lucide-react-native';
import { endpoints } from '../config/api';
import { useNavigation } from '@react-navigation/native';
import { sharedStyles } from '../config/theme';

const OfficialsScreen: React.FC = () => {
  const [officials, setOfficials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<any>();
  const RootComponent = (Platform.OS === 'web' ? View : SafeAreaView) as React.ElementType;

  const fetchOfficials = useCallback(async () => {
    try {
      const res = await fetch(endpoints.officials);
      if (res.ok) {
        const data = await res.json();
        setOfficials(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch officials:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOfficials();
  }, [fetchOfficials]);

  const handleCall = (number: string) => {
    Linking.openURL(`tel:${number}`).catch(() =>
      Alert.alert('Unable to Call', `Could not open dialer for ${number}.`)
    );
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`).catch(() =>
      Alert.alert('Unable to Email', `Could not open email client for ${email}.`)
    );
  };

  // Group officials by position category
  const kapitan = officials.filter(o => o.position === 'Punong Barangay');
  const kagawads = officials.filter(o => o.position === 'Barangay Kagawad');
  const sk = officials.filter(o => o.position === 'SK Chairperson');
  const others = officials.filter(o => !['Punong Barangay', 'Barangay Kagawad', 'SK Chairperson'].includes(o.position));

  const renderOfficial = (item: any) => (
    <View key={item._id || item.name} style={styles.card}>
      <View style={styles.avatarBox}>
        <User size={26} color="#0038A8" />
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <View style={styles.positionBadge}>
          <Text style={styles.positionText}>{item.position}</Text>
        </View>
        {item.committee ? <Text style={styles.committee}>Chairperson, Committee on {item.committee}</Text> : null}
        {item.term ? <Text style={styles.term}>Term: {item.term}</Text> : null}

        <View style={styles.contactRow}>
          {item.contact ? (
            <TouchableOpacity 
              style={styles.contactBtn} 
              onPress={() => handleCall(item.contact)}
              accessibilityRole="button"
              accessibilityLabel={`Call ${item.name} at ${item.contact}`}
            >
              <Phone size={13} color="#0038A8" />
              <Text style={styles.contactText}>{item.contact}</Text>
            </TouchableOpacity>
          ) : null}
          {item.email ? (
            <TouchableOpacity 
              style={styles.contactBtn} 
              onPress={() => handleEmail(item.email)}
              accessibilityRole="button"
              accessibilityLabel={`Email ${item.name} at ${item.email}`}
            >
              <Mail size={13} color="#0038A8" />
              <Text style={styles.contactText}>{item.email}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );

  const renderSection = (title: string, subtitle: string, data: any[]) => {
    if (data.length === 0) return null;
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionSub}>{subtitle}</Text>
        </View>
        {data.map(renderOfficial)}
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
        <Text style={sharedStyles.headerTitle}>Barangay Officials</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOfficials(); }} tintColor="#0038A8" />
        }
      >
        {/* BANNER */}
        <View style={styles.bannerCard}>
          <Building2 size={24} color="#0038A8" style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Barangay Bagong Pag-asa Council</Text>
            <Text style={styles.bannerText}>
              San Jacinto, Pangasinan • Office Hours: Mon–Fri, 8:00 AM – 5:00 PM
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color="#0038A8" />
            <Text style={styles.loadingText}>Retrieving council directory...</Text>
          </View>
        ) : officials.length === 0 ? (
          <View style={styles.emptyState}>
            <Shield size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No Officials Listed</Text>
            <Text style={styles.emptyText}>Officials directory will appear once registered in the portal.</Text>
          </View>
        ) : (
          <View style={{ paddingBottom: 40 }}>
            {renderSection('Punong Barangay', 'Head of Barangay Government', kapitan)}
            {renderSection('Sangguniang Barangay Members', 'Barangay Kagawad & Legislators', kagawads)}
            {renderSection('Sangguniang Kabataan', 'Youth Governance & Development', sk)}
            {renderSection('Appointed Officials', 'Secretariat & Treasury', others)}
          </View>
        )}
      </ScrollView>
    </RootComponent>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  listContent: { padding: 14, paddingBottom: 60 },

  bannerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bannerTitle: { fontSize: 14.5, fontWeight: '800', color: '#0f172a' },
  bannerText: { fontSize: 12, color: '#64748b', marginTop: 2, lineHeight: 17 },

  section: { marginTop: 14 },
  sectionHeader: { marginBottom: 8, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '900', color: '#0038A8', textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionSub: { fontSize: 12, color: '#64748b', fontWeight: '500', marginTop: 1 },

  card: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  avatarBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
  },
  info: { flex: 1 },
  name: { fontSize: 15.5, fontWeight: '800', color: '#0f172a' },
  positionBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#eff6ff',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginTop: 3,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  positionText: { fontSize: 11.5, fontWeight: '800', color: '#0038A8' },
  committee: { fontSize: 12, color: '#334155', fontWeight: '600', marginBottom: 2 },
  term: { fontSize: 11, color: '#64748b', marginBottom: 8 },

  contactRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  contactText: { fontSize: 12, color: '#0038A8', fontWeight: '700' },

  centerLoading: { alignItems: 'center', marginTop: 50 },
  loadingText: { fontSize: 13.5, color: '#64748b', marginTop: 12, fontWeight: '600' },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 30 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginTop: 14, marginBottom: 6 },
  emptyText: { fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 20 },
});

export default OfficialsScreen;

