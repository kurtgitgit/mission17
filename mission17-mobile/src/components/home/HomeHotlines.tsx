import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import { Phone, ChevronDown, ChevronUp } from 'lucide-react-native';
import { BARANGAY_CONTACTS } from '../../config/barangayInfo';

const EMERGENCY_CONTACTS = [
  { label: 'MDRRMO San Jacinto', numbers: ['0976-402-4120', '540-0851'] },
  { label: 'RHU Ambulance', numbers: ['0991-642-1048', '653-3164'] },
  { label: 'BFP San Jacinto', numbers: ['0917-189-4611'] },
  { label: 'PNP San Jacinto', numbers: ['0906-525-9725', '0998-598-5126', '653-1762'] },
];
const OFFICIAL_CONTACTS = [
  ...BARANGAY_CONTACTS.map(contact => ({ label: `${contact.label} · ${contact.contactPerson}`, numbers: [contact.displayNumber] })),
  { label: 'DILG', numbers: ['0917-140-1895'] },
];

export default function HomeHotlines() {
  const [expanded, setExpanded] = useState(false);
  const [officialsExpanded, setOfficialsExpanded] = useState(false);
  const confirmCall = (number: string, label: string) => {
    Alert.alert(`Call ${label}?`, `Open your phone dialer for ${number}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Call', onPress: async () => {
        try { await Linking.openURL(`tel:${number.replace(/[^0-9+]/g, '')}`); }
        catch (error) { console.warn('Could not open phone dialer:', error); Alert.alert('Call unavailable', 'Please dial the number using your phone.'); }
      } },
    ]);
  };
  const renderContacts = (contacts: typeof EMERGENCY_CONTACTS) => contacts.map(contact => (
    <View key={contact.label} style={styles.contact}>
      <Text style={styles.name}>{contact.label}</Text>
      <View style={styles.numbers}>{contact.numbers.map(number => (
        <TouchableOpacity key={number} accessibilityRole="button" accessibilityLabel={`Call ${contact.label} at ${number}`} onPress={() => confirmCall(number, contact.label)} style={styles.number}>
          <Text style={styles.numberText}>{number}</Text><Phone size={15} color="#0038a8" />
        </TouchableOpacity>
      ))}</View>
    </View>
  ));
  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.heading} onPress={() => setExpanded(value => !value)} accessibilityRole="button" accessibilityState={{ expanded }} accessibilityLabel="Emergency Hotlines">
        <View style={styles.icon}><Phone size={20} color="#b42336" /></View>
        <View style={styles.headingText}><Text style={styles.title}>Emergency Hotlines</Text><Text style={styles.subtitle}>Police, fire, ambulance & local contacts</Text></View>
        {expanded ? <ChevronUp size={20} color="#64748b" /> : <ChevronDown size={20} color="#64748b" />}
      </TouchableOpacity>
      {expanded && <View style={styles.content}>
        <Text style={styles.help}>Tap a number to call. BrgyLink cannot dispatch help.</Text>
        {renderContacts(EMERGENCY_CONTACTS)}
        <TouchableOpacity style={styles.officialToggle} accessibilityRole="button" accessibilityState={{ expanded: officialsExpanded }} onPress={() => setOfficialsExpanded(value => !value)}>
          <Text style={styles.numberText}>Barangay & official contacts</Text>{officialsExpanded ? <ChevronUp size={18} color="#0038a8" /> : <ChevronDown size={18} color="#0038a8" />}
        </TouchableOpacity>
        {officialsExpanded && renderContacts(OFFICIAL_CONTACTS)}
      </View>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 20, marginTop: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#eadce0', borderRadius: 18, overflow: 'hidden' },
  heading: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, minHeight: 80 },
  icon: { width: 42, height: 42, backgroundColor: '#fff1f2', borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  headingText: { flex: 1 }, title: { color: '#0f172a', fontSize: 15, fontWeight: '800' },
  subtitle: { color: '#64748b', fontSize: 12, lineHeight: 18, marginTop: 3 },
  content: { paddingHorizontal: 16, paddingBottom: 12 }, help: { fontSize: 12, color: '#64748b', lineHeight: 18, marginBottom: 8 },
  contact: { borderTopWidth: 1, borderColor: '#edf2f7', paddingVertical: 12 },
  name: { color: '#334155', fontSize: 13, fontWeight: '700', lineHeight: 20 },
  numbers: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  number: { minHeight: 44, paddingHorizontal: 10, paddingVertical: 10, borderRadius: 10, backgroundColor: '#f1f5f9', flexDirection: 'row', alignItems: 'center', gap: 10 },
  numberText: { color: '#0038a8', fontSize: 13, fontWeight: '700' },
  officialToggle: { minHeight: 48, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
});
