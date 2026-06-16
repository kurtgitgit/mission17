import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, ScrollView, Platform, SafeAreaView, StatusBar, Linking
} from 'react-native';
import { BookOpen, MapPin, Phone, Clock, ChevronRight, Leaf, Globe } from 'lucide-react-native';
import { SDG_IMAGES, SDG_DATA } from '../data/SDGData';
import { useNavigation } from '@react-navigation/native';

const BARANGAY_PROGRAMS = [
  { sdgs: [13, 15], icon: '🌿', title: 'Tree Planting', desc: 'Coastal & public space reforestation drives.' },
  { sdgs: [12],     icon: '♻️', title: 'Waste Segregation', desc: 'Proper biodegradable, recyclable & residual waste sorting.' },
  { sdgs: [3],      icon: '🏥', title: 'Health & Wellness', desc: 'Free medical missions & vaccination in partnership with CHO.' },
  { sdgs: [6],      icon: '💧', title: 'Clean Water Access', desc: 'Safe drinking water advocacy for all households.' },
  { sdgs: [16],     icon: '🛡️', title: 'Peace & Order', desc: '24/7 Barangay Tanod & CCTV security monitoring.' },
  { sdgs: [4],      icon: '📚', title: 'Scholarships', desc: 'Educational assistance for qualified student residents.' },
];

const LearningScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sdg' | 'about'>('sdg');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const navigation = useNavigation<any>();

  const RootComponent = (Platform.OS === 'web' ? View : SafeAreaView) as React.ElementType;

  const renderSDGCard = ({ item }: { item: typeof SDG_DATA[0] }) => {
    const isExpanded = expandedId === item.id;
    return (
      <TouchableOpacity
        style={[styles.sdgCard, isExpanded && styles.sdgCardExpanded]}
        onPress={() => setExpandedId(isExpanded ? null : item.id)}
        activeOpacity={0.85}
      >
        <View style={styles.sdgCardRow}>
          <Image source={SDG_IMAGES[item.id]} style={styles.sdgIcon} />
          <View style={styles.sdgMeta}>
            <Text style={styles.sdgNum}>SDG {item.id}</Text>
            <Text style={styles.sdgTitle}>{item.title}</Text>
          </View>
          <View style={[styles.sdgArrow, isExpanded && styles.sdgArrowRotated]}>
            <ChevronRight size={18} color="#64748b" />
          </View>
        </View>

        {isExpanded && (
          <View style={styles.sdgExpanded}>
            <View style={[styles.sdgColorBar, { backgroundColor: item.color }]} />
            <Text style={styles.sdgDesc}>{item.description}</Text>
            <View style={[styles.sdgWhy, { backgroundColor: item.color + '12' }]}>
              <Text style={[styles.sdgWhyLabel, { color: item.color }]}>💡 Why it matters</Text>
              <Text style={styles.sdgWhyText}>{item.whyItMatters}</Text>
            </View>
            <Text style={styles.sdgHelpLabel}>🌿 How you can help:</Text>
            {item.help.map((h, i) => (
              <View key={i} style={styles.sdgHelpRow}>
                <View style={[styles.sdgHelpDot, { backgroundColor: item.color }]} />
                <Text style={styles.sdgHelpText}>{h}</Text>
              </View>
            ))}
            <TouchableOpacity
              style={[styles.joinBtn, { backgroundColor: item.color }]}
              onPress={() => navigation.navigate('MissionsTab')}
            >
              <Leaf size={14} color="white" />
              <Text style={styles.joinBtnText}>Join related Civic Tasks</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <RootComponent style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0038A8" />

      {/* ─── HEADER ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <BookOpen size={22} color="white" />
          <Text style={styles.headerTitle}>Learning Hub</Text>
        </View>
        <Text style={styles.headerSub}>SDGs & Barangay Pantal</Text>

        {/* TAB BAR */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'sdg' && styles.tabActive]}
            onPress={() => setActiveTab('sdg')}
          >
            <Globe size={14} color={activeTab === 'sdg' ? '#0038A8' : 'rgba(255,255,255,0.7)'} />
            <Text style={[styles.tabText, activeTab === 'sdg' && styles.tabTextActive]}>SDG Hub</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'about' && styles.tabActive]}
            onPress={() => setActiveTab('about')}
          >
            <MapPin size={14} color={activeTab === 'about' ? '#0038A8' : 'rgba(255,255,255,0.7)'} />
            <Text style={[styles.tabText, activeTab === 'about' && styles.tabTextActive]}>About Brgy</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── SDG TAB ─── */}
      {activeTab === 'sdg' && (
        <FlatList
          data={SDG_DATA}
          renderItem={renderSDGCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.sdgIntro}>
              <Text style={styles.sdgIntroTitle}>17 Sustainable Development Goals</Text>
              <Text style={styles.sdgIntroText}>
                Learn about the UN's 2030 agenda for people and the planet. Tap any goal to explore it and find out how Barangay Pantal is taking action.
              </Text>
            </View>
          }
        />
      )}

      {/* ─── ABOUT BRGY TAB ─── */}
      {activeTab === 'about' && (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {/* Brgy Overview */}
          <View style={styles.aboutCard}>
            <Text style={styles.aboutEmoji}>🏛️</Text>
            <Text style={styles.aboutName}>Barangay Pantal</Text>
            <Text style={styles.aboutCity}>Dagupan City, Pangasinan</Text>
            <Text style={styles.aboutBody}>
              Barangay Pantal is a vibrant urban barangay known for its rich fishing heritage, active community programs, and commitment to sustainable development aligned with the UN Sustainable Development Goals.
            </Text>
          </View>

          {/* Info Grid */}
          <View style={styles.infoGrid}>
            {[
              { icon: '📍', label: 'Location', value: 'Dagupan City, Pangasinan' },
              { icon: '📞', label: 'Hotline', value: '075-529-9999' },
              { icon: '🏘️', label: 'Type', value: 'Urban Barangay' },
              { icon: '🐟', label: 'Heritage', value: 'Fisherfolk Community' },
            ].map(item => (
              <View key={item.label} style={styles.infoBox}>
                <Text style={styles.infoBoxIcon}>{item.icon}</Text>
                <Text style={styles.infoBoxLabel}>{item.label}</Text>
                <Text style={styles.infoBoxValue}>{item.value}</Text>
              </View>
            ))}
          </View>

          {/* Office Hours */}
          <View style={styles.officeCard}>
            <View style={styles.officeHeader}>
              <Clock size={16} color="#b45309" />
              <Text style={styles.officeTitle}>Office Hours</Text>
            </View>
            {[
              { day: 'Monday – Friday', time: '8:00 AM – 5:00 PM' },
              { day: 'Saturday', time: '8:00 AM – 12:00 PM' },
              { day: 'Sunday / Holidays', time: 'Closed', closed: true },
            ].map(item => (
              <View key={item.day} style={styles.officeRow}>
                <Text style={styles.officeDay}>{item.day}</Text>
                <Text style={[styles.officeTime, item.closed && { color: '#dc2626' }]}>{item.time}</Text>
              </View>
            ))}
          </View>

          {/* Programs linked to SDGs */}
          <Text style={styles.sectionTitle}>🌱 Active SDG Programs</Text>
          {BARANGAY_PROGRAMS.map((prog) => (
            <View key={prog.title} style={styles.programCard}>
              <Text style={styles.programIcon}>{prog.icon}</Text>
              <View style={styles.programInfo}>
                <View style={styles.programTitleRow}>
                  <Text style={styles.programTitle}>{prog.title}</Text>
                  <View style={styles.sdgTags}>
                    {prog.sdgs.map(s => (
                      <View key={s} style={styles.sdgTag}>
                        <Text style={styles.sdgTagText}>SDG {s}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <Text style={styles.programDesc}>{prog.desc}</Text>
              </View>
            </View>
          ))}
          <View style={{ height: 60 }} />
        </ScrollView>
      )}
    </RootComponent>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },

  header: {
    backgroundColor: '#0038A8',
    paddingTop: Platform.OS === 'android' ? 45 : 20,
    paddingHorizontal: 20,
    paddingBottom: 0,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 2 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: 'white' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 16 },

  tabBar: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 4 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 9 },
  tabActive: { backgroundColor: 'white' },
  tabText: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.75)' },
  tabTextActive: { color: '#0038A8' },

  listContent: { padding: 16, paddingBottom: 60 },

  // SDG HUB
  sdgIntro: { backgroundColor: 'white', borderRadius: 16, padding: 18, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#0038A8' },
  sdgIntroTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
  sdgIntroText: { fontSize: 13, color: '#475569', lineHeight: 20 },

  sdgCard: {
    backgroundColor: 'white', borderRadius: 14, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    overflow: 'hidden',
  },
  sdgCardExpanded: { shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  sdgCardRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  sdgIcon: { width: 48, height: 48, borderRadius: 10, marginRight: 14 },
  sdgMeta: { flex: 1 },
  sdgNum: { fontSize: 11, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
  sdgTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginTop: 2 },
  sdgArrow: { transform: [{ rotate: '0deg' }] },
  sdgArrowRotated: { transform: [{ rotate: '90deg' }] },

  sdgExpanded: { paddingHorizontal: 16, paddingBottom: 18 },
  sdgColorBar: { height: 3, borderRadius: 3, marginBottom: 14 },
  sdgDesc: { fontSize: 13, color: '#475569', lineHeight: 21, marginBottom: 14 },
  sdgWhy: { borderRadius: 12, padding: 14, marginBottom: 14 },
  sdgWhyLabel: { fontSize: 13, fontWeight: '800', marginBottom: 6 },
  sdgWhyText: { fontSize: 13, color: '#374151', lineHeight: 20 },
  sdgHelpLabel: { fontSize: 13, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  sdgHelpRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 6 },
  sdgHelpDot: { width: 7, height: 7, borderRadius: 4, marginTop: 6, flexShrink: 0 },
  sdgHelpText: { fontSize: 13, color: '#475569', flex: 1, lineHeight: 20 },
  joinBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, paddingVertical: 12, borderRadius: 12 },
  joinBtnText: { color: 'white', fontWeight: '700', fontSize: 14 },

  // ABOUT BRGY TAB
  aboutCard: {
    backgroundColor: '#0038A8', borderRadius: 18, padding: 24,
    alignItems: 'center', marginBottom: 16,
  },
  aboutEmoji: { fontSize: 44, marginBottom: 10 },
  aboutName: { fontSize: 22, fontWeight: '900', color: 'white', marginBottom: 2 },
  aboutCity: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 14 },
  aboutBody: { fontSize: 14, color: 'rgba(255,255,255,0.9)', textAlign: 'center', lineHeight: 22 },

  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  infoBox: { width: '47.5%', backgroundColor: 'white', borderRadius: 14, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  infoBoxIcon: { fontSize: 24, marginBottom: 8 },
  infoBoxLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  infoBoxValue: { fontSize: 12, fontWeight: '600', color: '#0f172a', textAlign: 'center' },

  officeCard: { backgroundColor: '#fefce8', borderRadius: 14, padding: 16, borderWidth: 1.5, borderColor: '#fef08a', marginBottom: 20 },
  officeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  officeTitle: { fontSize: 15, fontWeight: '800', color: '#854d0e' },
  officeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#fef08a20' },
  officeDay: { fontSize: 13, color: '#374151', fontWeight: '600' },
  officeTime: { fontSize: 13, color: '#0038A8', fontWeight: '700' },

  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a', marginBottom: 12 },
  programCard: {
    backgroundColor: 'white', borderRadius: 14, padding: 16, marginBottom: 10,
    flexDirection: 'row', alignItems: 'flex-start',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  programIcon: { fontSize: 28, marginRight: 14, marginTop: 2 },
  programInfo: { flex: 1 },
  programTitleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  programTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  sdgTags: { flexDirection: 'row', gap: 4 },
  sdgTag: { backgroundColor: '#dcfce7', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  sdgTagText: { fontSize: 10, fontWeight: '800', color: '#16a34a' },
  programDesc: { fontSize: 12, color: '#64748b', lineHeight: 18 },
});

export default LearningScreen;
