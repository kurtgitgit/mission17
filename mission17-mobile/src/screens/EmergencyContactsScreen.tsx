import React from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Building2, Flame, HeartPulse, Phone, PhoneCall, Shield, ShieldAlert, UserCheck } from 'lucide-react-native';
import { EMERGENCY_CONTACTS, type EmergencyContactCategory } from '../config/emergencyContacts';

const SECTIONS: { category: EmergencyContactCategory; title: string; subtitle: string }[] = [
  { category: 'emergency-services', title: 'Emergency services', subtitle: 'Disaster response, ambulance, fire and police' },
  { category: 'barangay-contacts', title: 'Barangay contacts', subtitle: 'Local assistance and barangay concerns' },
  { category: 'government-office', title: 'Government office', subtitle: 'Government inquiries and coordination' },
];

const ICONS: Record<string, typeof Phone> = {
  mdrrmo: PhoneCall, rhu: HeartPulse, bfp: Flame, pnp: ShieldAlert,
  'barangay-hall': Building2, 'punong-barangay': UserCheck,
  'chief-tanod': Shield, 'bhw-president': HeartPulse, dilg: Building2,
};

const call = (number: string, label: string) => {
  Alert.alert(`Call ${label}?`, `Would you like to connect to ${number}?`, [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Call Now',
      onPress: () => Linking.openURL(`tel:${number.replace(/[^0-9+]/g, '')}`).catch(() =>
        Alert.alert('Unable to call', 'Cannot open the phone dialer on this device. You can copy the number and dial it manually.')),
    },
  ]);
};

export default function EmergencyContactsScreen() {
  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.screen}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <View style={styles.intro}>
          <Text style={styles.locality}>SAN JACINTO, PANGASINAN</Text>
          <Text style={styles.introText}>Find the office you need. Tap a number to call.</Text>
        </View>

        {SECTIONS.map(section => (
          <View key={section.category} style={styles.section}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
            <View style={styles.card}>
              {EMERGENCY_CONTACTS.filter(contact => contact.category === section.category).map((contact, index) => {
                const Icon = ICONS[contact.id] || Phone;
                return (
                  <View key={contact.id} style={[styles.contact, index > 0 && styles.divider]}>
                    <View style={styles.contactHeader}>
                      <View style={styles.icon}><Icon size={21} color="#0038A8" /></View>
                      <View style={styles.contactInfo}>
                        <Text style={styles.contactName}>{contact.label}</Text>
                        {contact.contactPerson && <Text style={styles.contactPerson}>{contact.contactPerson}</Text>}
                      </View>
                    </View>
                    {contact.numbers.map(number => (
                      <TouchableOpacity
                        key={number.value}
                        onPress={() => call(number.value, contact.label)}
                        style={styles.phoneButton}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={`Call ${contact.label} ${number.label} at ${number.value}`}
                        accessibilityHint="Asks for confirmation before opening your phone dialer"
                      >
                        <View style={styles.phoneInfo}>
                          <Text style={styles.phoneLabel}>{number.label}</Text>
                          <Text selectable style={styles.phoneNumber}>{number.value}</Text>
                        </View>
                        <View style={styles.callAction}>
                          <Phone size={15} color="#0038A8" />
                          <Text style={styles.callText}>Call</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20, paddingBottom: 32, gap: 28, width: '100%', maxWidth: 640, alignSelf: 'center' },
  intro: { gap: 8 },
  locality: { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: '#0038A8' },
  introText: { fontSize: 15, lineHeight: 23, color: '#475569' },
  section: { gap: 6 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  sectionSubtitle: { fontSize: 13, lineHeight: 20, color: '#64748B', marginBottom: 8 },
  card: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, overflow: 'hidden' },
  contact: { padding: 16, gap: 10 },
  divider: { borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  contactHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  icon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  contactInfo: { flex: 1, gap: 3 },
  contactName: { fontSize: 15, fontWeight: '700', lineHeight: 22, color: '#0F172A' },
  contactPerson: { fontSize: 13, lineHeight: 20, color: '#475569' },
  phoneButton: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderRadius: 10, backgroundColor: '#F8FAFC', paddingHorizontal: 12, paddingVertical: 8 },
  phoneInfo: { flex: 1, gap: 2 },
  phoneLabel: { fontSize: 11, fontWeight: '600', lineHeight: 16, color: '#64748B' },
  phoneNumber: { fontSize: 15, fontWeight: '600', lineHeight: 22, color: '#0F172A' },
  callAction: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  callText: { fontSize: 13, fontWeight: '700', color: '#0038A8' },
});
