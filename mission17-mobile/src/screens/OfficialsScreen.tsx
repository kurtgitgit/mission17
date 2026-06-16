import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Platform, SafeAreaView, ActivityIndicator, StatusBar, Linking, Alert
} from 'react-native';
import { User, Phone, Mail, Shield, ArrowLeft } from 'lucide-react-native';
import { endpoints } from '../config/api';
import { useNavigation } from '@react-navigation/native';

const POSITION_ORDER = [
  'Punong Barangay',
  'Barangay Kagawad',
  'SK Chairperson',
  'Barangay Secretary',
  'Barangay Treasurer',
];

const OfficialsScreen: React.FC = () => {
  const [officials, setOfficials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();
  const RootComponent = (Platform.OS === 'web' ? View : SafeAreaView) as React.ElementType;

  useEffect(() => {
    const fetchOfficials = async () => {
      try {
        const res = await fetch(endpoints.officials);
        if (res.ok) {
          const data = await res.json();
          setOfficials(data);
        }
      } catch (err) {
        console.error('Failed to fetch officials:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOfficials();
  }, []);

  const handleCall = (number: string) => {
    Linking.openURL(`tel:${number}`).catch(() =>
      Alert.alert('Error', 'Could not open dialer.')
    );
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`).catch(() =>
      Alert.alert('Error', 'Could not open email app.')
    );
  };

  // Group officials by position category
  const kapitan = officials.filter(o => o.position === 'Punong Barangay');
  const kagawads = officials.filter(o => o.position === 'Barangay Kagawad');
  const sk = officials.filter(o => o.position === 'SK Chairperson');
  const others = officials.filter(o => !['Punong Barangay', 'Barangay Kagawad', 'SK Chairperson'].includes(o.position));

  const renderOfficial = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.avatarBox}>
        <User size={28} color="#0038A8" />
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.position}>{item.position}</Text>
        {item.committee && <Text style={styles.committee}>Committee on {item.committee}</Text>}
        {item.term && <Text style={styles.term}>Term: {item.term}</Text>}
        <View style={styles.contactRow}>
          {item.contact && (
            <TouchableOpacity style={styles.contactBtn} onPress={() => handleCall(item.contact)}>
              <Phone size={13} color="#0038A8" />
              <Text style={styles.contactText}>{item.contact}</Text>
            </TouchableOpacity>
          )}
          {item.email && (
            <TouchableOpacity style={styles.contactBtn} onPress={() => handleEmail(item.email)}>
              <Mail size={13} color="#0038A8" />
              <Text style={styles.contactText}>{item.email}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  const renderSection = (title: string, data: any[]) => {
    if (data.length === 0) return null;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {data.map((item) => (
          <React.Fragment key={item._id}>{renderOfficial({ item })}</React.Fragment>
        ))}
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
            <Shield size={20} color="white" />
            <Text style={styles.headerTitle}>Barangay Officials</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.headerSub}>Barangay Pantal — Your Local Leaders</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0038A8" style={{ marginTop: 50 }} />
      ) : officials.length === 0 ? (
        <View style={styles.emptyState}>
          <Shield size={48} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>No Officials Listed</Text>
          <Text style={styles.emptyText}>Officials information will appear here once added by the admin.</Text>
        </View>
      ) : (
        <FlatList
          data={[]}
          ListHeaderComponent={
            <View style={{ paddingBottom: 40 }}>
              {renderSection('Punong Barangay', kapitan)}
              {renderSection('Barangay Kagawads', kagawads)}
              {renderSection('Sangguniang Kabataan', sk)}
              {renderSection('Other Officials', others)}
            </View>
          }
          renderItem={() => null}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </RootComponent>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },

  header: {
    backgroundColor: '#0038A8',
    paddingTop: Platform.OS === 'android' ? 44 : 18,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: 'white' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },

  listContent: { paddingHorizontal: 16 },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#0038A8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, paddingHorizontal: 4 },

  card: {
    flexDirection: 'row', backgroundColor: 'white', borderRadius: 16,
    padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  avatarBox: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#dcfce7',
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 2 },
  position: { fontSize: 13, fontWeight: '600', color: '#0038A8', marginBottom: 2 },
  committee: { fontSize: 12, color: '#64748b', marginBottom: 2 },
  term: { fontSize: 11, color: '#94a3b8', marginBottom: 6 },
  contactRow: { gap: 6 },
  contactBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  contactText: { fontSize: 12, color: '#0038A8', fontWeight: '600' },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#475569', marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#94a3b8', textAlign: 'center', lineHeight: 22 },
});

export default OfficialsScreen;
