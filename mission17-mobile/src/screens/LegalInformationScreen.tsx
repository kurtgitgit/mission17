import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, SafeAreaView, Platform } from 'react-native';
import { ChevronLeft, ShieldCheck, Scale, Accessibility, Bot, Camera, MapPin, Bell } from 'lucide-react-native';

const prototypeNotice = 'Capstone prototype — subject to Barangay Bagong Pag-asa review and approval before official public deployment.';

const Section = ({ icon: Icon, title, children }: any) => (
  <View style={styles.section}>
    <View style={styles.sectionHeading}><Icon size={21} color="#0038A8" /><Text style={styles.sectionTitle}>{title}</Text></View>
    {children}
  </View>
);

const LegalInformationScreen = ({ navigation, route }: any) => {
  const Root = (Platform.OS === 'web' ? View : SafeAreaView) as React.ElementType;
  const openTermsFirst = route?.params?.section === 'terms';
  const privacySection = (
    <Section icon={ShieldCheck} title="Privacy Notice">
      <Text style={styles.body}>BrgyLink may process your account and profile details, valid-ID uploads, document requests, reports, mission proof, feedback, notification token, and security records to operate requested services and allow authorized review.</Text>
      <Text style={styles.filipino}>Filipino: Ginagamit ang iyong impormasyon para sa account, serbisyo, pagsusuri ng request, at seguridad. Ang opisyal na privacy contact at retention period ay kailangan pang italaga.</Text>
    </Section>
  );
  const termsSection = (
    <Section icon={Scale} title="Terms of Use">
      <Text style={styles.body}>Do not submit false reports or fraudulent proof, harass others, share accounts, or try to bypass review. An authorized administrator makes the final decision on accounts, requests, and proof.</Text>
      <Text style={styles.filipino}>Filipino: Gamitin ang app nang tapat at may paggalang. Ang awtorisadong administrator ang may huling pasya.</Text>
    </Section>
  );
  return (
    <Root style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityLabel="Go back" onPress={() => navigation.goBack()} style={styles.back}><ChevronLeft size={24} color="#0038A8" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Legal & privacy information</Text><View style={styles.spacer} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.lead}>Plain-language information for BrgyLink residents.</Text>
        <View style={styles.notice}><Text style={styles.noticeText}>{prototypeNotice}</Text></View>
        {openTermsFirst ? termsSection : privacySection}
        {openTermsFirst ? privacySection : termsSection}
        <Section icon={Bot} title="AI disclosure">
          <Text style={styles.body}>The chatbot and image verification are advisory tools only. They do not automatically approve or reject an account, mission proof, document, or report. Ask the Barangay Bagong Pag-asa Office when verified details are needed.</Text>
          <Text style={styles.filipino}>Filipino: Pantulong lamang ang AI; hindi ito ang gumagawa ng huling desisyon.</Text>
        </Section>
        <Section icon={Camera} title="Camera permission">
          <Text style={styles.body}>The app asks for camera permission only when you choose to take a photo for a valid ID, report, or proof submission. You can decline, but photo-required features will not work until permission is allowed.</Text>
        </Section>
        <Section icon={MapPin} title="Location permission">
          <Text style={styles.body}>The app may request location only for features that need it, such as a location-based report or proof. You can decline; location-dependent features may then be unavailable.</Text>
        </Section>
        <Section icon={Bell} title="Notification permission">
          <Text style={styles.body}>The app asks for notification permission so it can send account-review and service updates. You can decline or change this later in your device settings.</Text>
        </Section>
        <Section icon={Accessibility} title="Accessibility and help">
          <Text style={styles.body}>Use your device text-size and accessibility settings at any time. The website also offers larger-text and high-contrast controls. This prototype has not completed a formal accessibility audit; tell the Barangay Bagong Pag-asa Office about barriers you experience.</Text>
        </Section>
        <Text style={styles.contact}>Responsible office: Barangay Bagong Pag-asa Office. Official privacy and accessibility contact pending designation.</Text>
      </ScrollView>
    </Root>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' }, header: { paddingTop: Platform.OS === 'android' ? 42 : 18, paddingHorizontal: 18, paddingBottom: 16, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }, back: { padding: 8, backgroundColor: '#eff6ff', borderRadius: 20 }, spacer: { width: 40 }, headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800', color: '#0f172a' }, content: { padding: 18, paddingBottom: 40 }, lead: { fontSize: 15, color: '#475569', marginBottom: 12 }, notice: { backgroundColor: '#fff7ed', borderLeftWidth: 4, borderLeftColor: '#f59e0b', borderRadius: 8, padding: 13, marginBottom: 4 }, noticeText: { color: '#78350f', lineHeight: 19, fontSize: 13, fontWeight: '700' }, section: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#dbeafe', borderRadius: 14, padding: 16, marginTop: 14 }, sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 10 }, sectionTitle: { color: '#0f172a', fontSize: 16, fontWeight: '800' }, body: { color: '#334155', fontSize: 14, lineHeight: 21 }, filipino: { color: '#166534', fontSize: 13, lineHeight: 20, marginTop: 10, fontStyle: 'italic' }, contact: { color: '#475569', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 20 }
});

export default LegalInformationScreen;
