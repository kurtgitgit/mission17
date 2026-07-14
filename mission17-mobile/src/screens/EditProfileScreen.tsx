import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  SafeAreaView, Platform, ActivityIndicator, ScrollView 
} from 'react-native';
import { X, User, MapPin, Phone, Mail, Calendar, Info, GraduationCap, Briefcase } from 'lucide-react-native';
import { GlobalState, endpoints } from '../config/api';
import { colors, spacing, radius, typography } from '../config/theme';

const EditProfileScreen = ({ navigation }: any) => {
  const [userData, setUserData] = useState<any>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  
  const userId = GlobalState.userId;
  const RootComponent = (Platform.OS === 'web' ? View : SafeAreaView) as React.ElementType;

  useEffect(() => {
    const fetchCurrentData = async () => {
      try {
        const res = await fetch(endpoints.auth.getUser(userId));
        const data = await res.json();
        setUserData(data);
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchCurrentData();
  }, []);

  if (initialLoading) return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;

  const InfoRow = ({ icon, label, value }: { icon: any, label: string, value: string }) => (
    <View style={styles.infoRow}>
      <View style={styles.iconContainer}>
        {icon}
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || 'N/A'}</Text>
      </View>
    </View>
  );

  return (
    <RootComponent style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <X size={24} color="#64748b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personal Information</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.noticeBox}>
          <Info size={20} color={colors.primary} />
          <Text style={styles.noticeText}>
            Critical demographic details are tied to your valid ID. To update this information, please visit the Barangay Hall for reverification.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Identity</Text>
          <View style={styles.card}>
            <InfoRow icon={<User size={20} color={colors.textSecondary} />} label="Full Name" value={`${userData?.firstName || ''} ${userData?.middleName || ''} ${userData?.lastName || ''}`} />
            <View style={styles.divider} />
            <InfoRow icon={<Mail size={20} color={colors.textSecondary} />} label="Email Address" value={userData?.email} />
            <View style={styles.divider} />
            <InfoRow icon={<Phone size={20} color={colors.textSecondary} />} label="Mobile Number" value={userData?.mobileNumber} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Demographics</Text>
          <View style={styles.card}>
            <InfoRow icon={<Calendar size={20} color={colors.textSecondary} />} label="Birthdate" value={userData?.birthDate} />
            <View style={styles.divider} />
            <InfoRow icon={<User size={20} color={colors.textSecondary} />} label="Age" value={userData?.age} />
            <View style={styles.divider} />
            <InfoRow icon={<User size={20} color={colors.textSecondary} />} label="Gender" value={userData?.gender} />
            <View style={styles.divider} />
            <InfoRow icon={<User size={20} color={colors.textSecondary} />} label="Civil Status" value={userData?.civilStatus} />
            <View style={styles.divider} />
            <InfoRow icon={<MapPin size={20} color={colors.textSecondary} />} label="Place of Birth" value={userData?.placeOfBirth} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Residency & Additional</Text>
          <View style={styles.card}>
            <InfoRow icon={<MapPin size={20} color={colors.textSecondary} />} label="Complete Address" value={userData?.completeAddress} />
            <View style={styles.divider} />
            <InfoRow icon={<Info size={20} color={colors.textSecondary} />} label="Nationality" value={userData?.nationality} />
            <View style={styles.divider} />
            <InfoRow icon={<Info size={20} color={colors.textSecondary} />} label="Religion" value={userData?.religion} />
            <View style={styles.divider} />
            <InfoRow icon={<Calendar size={20} color={colors.textSecondary} />} label="Years of Residency" value={userData?.yearsOfResidency} />
            <View style={styles.divider} />
            <InfoRow icon={<Info size={20} color={colors.textSecondary} />} label="Voter Status" value={userData?.voterStatus} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Education & Employment</Text>
          <View style={styles.card}>
            <InfoRow icon={<Briefcase size={20} color={colors.textSecondary} />} label="Employment Status" value={userData?.employmentStatus} />
            <View style={styles.divider} />
            <InfoRow icon={<Briefcase size={20} color={colors.textSecondary} />} label="Occupation" value={userData?.occupation} />
            <View style={styles.divider} />
            <InfoRow icon={<GraduationCap size={20} color={colors.textSecondary} />} label="Educational Attainment" value={userData?.educationalAttainment} />
          </View>
        </View>

      </ScrollView>
    </RootComponent>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: 'white' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  iconBtn: { padding: 8, backgroundColor: colors.surfaceHover, borderRadius: 20 },
  content: { padding: spacing.md, paddingBottom: 60 },
  noticeBox: {
    flexDirection: 'row',
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: spacing.lg,
    alignItems: 'flex-start',
    gap: 12
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    color: colors.primary,
    lineHeight: 18,
    fontWeight: '500'
  },
  section: {
    marginBottom: spacing.lg
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginLeft: spacing.sm
  },
  card: {
    backgroundColor: 'white',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden'
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md
  },
  infoContent: {
    flex: 1
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: 2
  },
  infoValue: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500'
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 60
  }
});

export default EditProfileScreen;
