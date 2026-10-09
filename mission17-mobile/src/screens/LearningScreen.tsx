import React from 'react';
import { Linking, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Building2, Clock3, FileText, Info, Landmark, Mail, MapPin, Megaphone, Phone, ShieldCheck, Users } from 'lucide-react-native';
import { BARANGAY_INFO } from '../config/barangayInfo';
import { useTheme } from '../context/ThemeContext';

type DetailCardProps = { icon: React.ReactNode; label: string; value: string; };

const DetailCard: React.FC<DetailCardProps> = ({ icon, label, value }) => (
  <View style={styles.detailCard}>
    <View style={styles.detailIcon}>{icon}</View>
    <View style={styles.detailText}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  </View>
);

const LearningScreen: React.FC = () => {
  const { theme, isDarkMode } = useTheme();
  const RootComponent = (Platform.OS === 'web' ? View : SafeAreaView) as React.ElementType;
  const openDialer = () => Linking.openURL(`tel:${BARANGAY_INFO.mobileNumber}`);
  const openEmail = () => Linking.openURL(`mailto:${BARANGAY_INFO.email}`);

  return (
    <RootComponent style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <View style={styles.headerRow}>
          <Landmark size={24} color="#fff" />
          <Text style={styles.headerTitle}>About Barangay</Text>
        </View>
        <Text style={styles.headerSubtitle}>{BARANGAY_INFO.name}</Text>
        <Text style={styles.headerLocation}>{BARANGAY_INFO.municipality}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.heroIcon, { backgroundColor: `${theme.primary}14` }]}>
            <Building2 size={30} color={theme.primary} />
          </View>
          <Text style={[styles.heroTitle, { color: theme.text }]}>{BARANGAY_INFO.name}</Text>
          <Text style={[styles.heroLocation, { color: theme.textSecondary }]}>{BARANGAY_INFO.municipality}</Text>
          <Text style={[styles.heroBody, { color: theme.textSecondary }]}>
            BrgyLink is the digital service portal for residents of Barangay Bagong Pag-asa. Use it to access barangay services, receive official announcements, and find verified community information.
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Community profile</Text>
        <View style={styles.detailGrid}>
          <DetailCard icon={<MapPin size={20} color={theme.primary} />} label="Location" value={BARANGAY_INFO.address} />
          <DetailCard icon={<Users size={20} color={theme.primary} />} label="2024 population" value="1,358 residents (2024 POPCEN)" />
          <DetailCard icon={<Building2 size={20} color={theme.primary} />} label="PSA classification" value="Rural barangay" />
          <DetailCard icon={<Info size={20} color={theme.primary} />} label="PSGC code" value="0105534013" />
          <DetailCard icon={<Clock3 size={20} color={theme.primary} />} label="Office hours" value={`${BARANGAY_INFO.officeDays}, ${BARANGAY_INFO.officeHours}`} />
          <DetailCard icon={<ShieldCheck size={20} color={theme.primary} />} label="Resident services" value="Documents, blotter reports, feedback, and announcements" />
        </View>

        <View style={[styles.historyCard, { backgroundColor: isDarkMode ? 'rgba(30, 64, 175, 0.16)' : '#eff6ff', borderColor: isDarkMode ? 'rgba(96, 165, 250, 0.24)' : '#bfdbfe' }]}>
          <View style={styles.historyHeading}>
            <Info size={20} color={theme.primary} />
            <Text style={[styles.historyTitle, { color: theme.text }]}>History & heritage</Text>
          </View>
          <Text style={[styles.historyBody, { color: theme.textSecondary }]}>
            Earlier Philippine census records identify the community as Bagong Pag-asa (Poblacion East). The 2010 Census recorded 1,253 residents; the Philippine Statistics Authority's 2024 POPCEN listing records 1,358 residents and classifies the barangay as rural.
          </Text>
          <Text style={[styles.historySource, { color: theme.textTertiary }]}>Source: Philippine Statistics Authority, San Jacinto barangay listing and census records.</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>What residents can do with BrgyLink</Text>
        <View style={[styles.servicesCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <DetailCard icon={<FileText size={20} color={theme.primary} />} label="Request documents" value="Submit clearance, certificate, and resident ID requests." />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <DetailCard icon={<ShieldCheck size={20} color={theme.primary} />} label="Report and track incidents" value="File blotter reports and follow their official status." />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <DetailCard icon={<Megaphone size={20} color={theme.primary} />} label="Stay informed" value="Read official announcements and service updates." />
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Contact the Barangay Office</Text>
        <View style={[styles.contactCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <TouchableOpacity style={styles.contactRow} onPress={openDialer} accessibilityRole="button" accessibilityLabel="Call Barangay Hall">
            <View style={[styles.contactIcon, { backgroundColor: `${theme.primary}14` }]}><Phone size={19} color={theme.primary} /></View>
            <View style={styles.contactContent}>
              <Text style={[styles.contactLabel, { color: theme.text }]}>Barangay Hall</Text>
              <Text style={[styles.contactValue, { color: theme.primary }]}>{BARANGAY_INFO.mobileDisplay}</Text>
            </View>
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <TouchableOpacity style={styles.contactRow} onPress={openEmail} accessibilityRole="button" accessibilityLabel="Email Barangay Hall">
            <View style={[styles.contactIcon, { backgroundColor: `${theme.primary}14` }]}><Mail size={19} color={theme.primary} /></View>
            <View style={styles.contactContent}>
              <Text style={[styles.contactLabel, { color: theme.text }]}>Email</Text>
              <Text style={[styles.contactValue, { color: theme.primary }]}>{BARANGAY_INFO.email}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={[styles.note, { color: theme.textTertiary }]}>For changing schedules, contacts, and official notices, always check BrgyLink Announcements or contact the Barangay Office.</Text>
      </ScrollView>
    </RootComponent>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: Platform.OS === 'android' ? 46 : 20, paddingHorizontal: 20, paddingBottom: 22 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '900' },
  headerSubtitle: { color: 'rgba(255,255,255,0.88)', fontSize: 15, fontWeight: '700', marginTop: 14 },
  headerLocation: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 },
  content: { padding: 16, paddingBottom: 148 },
  heroCard: { borderWidth: 1, borderRadius: 20, padding: 22, alignItems: 'center', marginBottom: 24, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  heroIcon: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  heroTitle: { fontSize: 21, fontWeight: '900', textAlign: 'center' },
  heroLocation: { fontSize: 14, marginTop: 4, fontWeight: '600' },
  heroBody: { fontSize: 14, lineHeight: 22, textAlign: 'center', marginTop: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '900', marginBottom: 11 },
  detailGrid: { gap: 10, marginBottom: 20 },
  detailCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, paddingVertical: 2 },
  detailIcon: { width: 28, alignItems: 'center', paddingTop: 1 },
  detailText: { flex: 1 },
  detailLabel: { color: '#64748b', fontSize: 11, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 3 },
  detailValue: { color: '#0f172a', fontSize: 14, fontWeight: '600', lineHeight: 20 },
  historyCard: { borderWidth: 1, borderRadius: 16, padding: 17, marginBottom: 24 },
  historyHeading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  historyTitle: { fontSize: 16, fontWeight: '900' },
  historyBody: { fontSize: 13, lineHeight: 21 },
  historySource: { fontSize: 11, lineHeight: 16, marginTop: 10, fontWeight: '600' },
  servicesCard: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 24 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 14 },
  contactCard: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 16 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  contactIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  contactContent: { flex: 1 },
  contactLabel: { fontSize: 14, fontWeight: '800', marginBottom: 3 },
  contactValue: { fontSize: 14, fontWeight: '700' },
  note: { fontSize: 12, lineHeight: 18, textAlign: 'center', paddingHorizontal: 14 },
});

export default LearningScreen;
