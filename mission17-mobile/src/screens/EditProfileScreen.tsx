import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  SafeAreaView, Platform, ActivityIndicator, ScrollView, TextInput, Alert 
} from 'react-native';
import { X, User, MapPin, Phone, Mail, Calendar, Info, GraduationCap, Briefcase, Check } from 'lucide-react-native';
import { GlobalState, endpoints } from '../config/api';
import { colors, spacing, radius, typography } from '../config/theme';

const EditProfileScreen = ({ navigation }: any) => {
  const [userData, setUserData] = useState<any>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
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

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${endpoints.auth.backendBaseUrl}/api/auth/update-profile/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      if (res.ok) {
        Alert.alert("Success", "Profile updated successfully!");
        navigation.goBack();
      } else {
        Alert.alert("Error", "Failed to update profile.");
      }
    } catch (e) {
      Alert.alert("Error", "Network error while saving.");
    } finally {
      setSaving(false);
    }
  };

  if (initialLoading) return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;

  const EditableRow = ({ icon, label, value, onChangeText, keyboardType = 'default', placeholder = '' }: any) => (
    <View style={styles.infoRow}>
      <View style={styles.iconContainer}>
        {icon}
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <TextInput 
          style={styles.infoValueInput} 
          value={value || ''} 
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholder={placeholder || `Enter ${label}`}
          placeholderTextColor={colors.textMuted}
        />
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
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtn}>
          {saving ? <ActivityIndicator size="small" color="white" /> : (
            <>
              <Check size={16} color="white" style={{ marginRight: 4 }} />
              <Text style={styles.saveBtnText}>Save</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.noticeBox}>
          <Info size={20} color={colors.primary} />
          <Text style={styles.noticeText}>
            You can now update your personal demographic and identity details directly from your phone. Ensure all information matches your valid IDs.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Identity</Text>
          <View style={styles.card}>
            <EditableRow icon={<User size={20} color={colors.textSecondary} />} label="First Name" value={userData?.firstName} onChangeText={(t: string) => setUserData({...userData, firstName: t})} />
            <View style={styles.divider} />
            <EditableRow icon={<User size={20} color={colors.textSecondary} />} label="Middle Name" value={userData?.middleName} onChangeText={(t: string) => setUserData({...userData, middleName: t})} />
            <View style={styles.divider} />
            <EditableRow icon={<User size={20} color={colors.textSecondary} />} label="Last Name" value={userData?.lastName} onChangeText={(t: string) => setUserData({...userData, lastName: t})} />
            <View style={styles.divider} />
            <EditableRow icon={<Mail size={20} color={colors.textSecondary} />} label="Email Address" value={userData?.email} onChangeText={(t: string) => setUserData({...userData, email: t})} keyboardType="email-address" />
            <View style={styles.divider} />
            <EditableRow icon={<Phone size={20} color={colors.textSecondary} />} label="Mobile Number" value={userData?.mobileNumber} onChangeText={(t: string) => setUserData({...userData, mobileNumber: t})} keyboardType="phone-pad" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Demographics</Text>
          <View style={styles.card}>
            <EditableRow icon={<Calendar size={20} color={colors.textSecondary} />} label="Birthdate" value={userData?.birthDate} onChangeText={(t: string) => setUserData({...userData, birthDate: t})} placeholder="YYYY-MM-DD" />
            <View style={styles.divider} />
            <EditableRow icon={<User size={20} color={colors.textSecondary} />} label="Age" value={userData?.age?.toString()} onChangeText={(t: string) => setUserData({...userData, age: parseInt(t) || 0})} keyboardType="numeric" />
            <View style={styles.divider} />
            <EditableRow icon={<User size={20} color={colors.textSecondary} />} label="Gender" value={userData?.gender} onChangeText={(t: string) => setUserData({...userData, gender: t})} />
            <View style={styles.divider} />
            <EditableRow icon={<User size={20} color={colors.textSecondary} />} label="Civil Status" value={userData?.civilStatus} onChangeText={(t: string) => setUserData({...userData, civilStatus: t})} />
            <View style={styles.divider} />
            <EditableRow icon={<MapPin size={20} color={colors.textSecondary} />} label="Place of Birth" value={userData?.placeOfBirth} onChangeText={(t: string) => setUserData({...userData, placeOfBirth: t})} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Residency & Additional</Text>
          <View style={styles.card}>
            <EditableRow icon={<MapPin size={20} color={colors.textSecondary} />} label="Complete Address" value={userData?.completeAddress} onChangeText={(t: string) => setUserData({...userData, completeAddress: t})} />
            <View style={styles.divider} />
            <EditableRow icon={<Info size={20} color={colors.textSecondary} />} label="Nationality" value={userData?.nationality} onChangeText={(t: string) => setUserData({...userData, nationality: t})} />
            <View style={styles.divider} />
            <EditableRow icon={<Info size={20} color={colors.textSecondary} />} label="Religion" value={userData?.religion} onChangeText={(t: string) => setUserData({...userData, religion: t})} />
            <View style={styles.divider} />
            <EditableRow icon={<Calendar size={20} color={colors.textSecondary} />} label="Years of Residency" value={userData?.yearsOfResidency?.toString()} onChangeText={(t: string) => setUserData({...userData, yearsOfResidency: parseInt(t) || 0})} keyboardType="numeric" />
            <View style={styles.divider} />
            <EditableRow icon={<Info size={20} color={colors.textSecondary} />} label="Voter Status" value={userData?.voterStatus} onChangeText={(t: string) => setUserData({...userData, voterStatus: t})} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Education & Employment</Text>
          <View style={styles.card}>
            <EditableRow icon={<Briefcase size={20} color={colors.textSecondary} />} label="Employment Status" value={userData?.employmentStatus} onChangeText={(t: string) => setUserData({...userData, employmentStatus: t})} />
            <View style={styles.divider} />
            <EditableRow icon={<Briefcase size={20} color={colors.textSecondary} />} label="Occupation" value={userData?.occupation} onChangeText={(t: string) => setUserData({...userData, occupation: t})} />
            <View style={styles.divider} />
            <EditableRow icon={<GraduationCap size={20} color={colors.textSecondary} />} label="Educational Attainment" value={userData?.educationalAttainment} onChangeText={(t: string) => setUserData({...userData, educationalAttainment: t})} />
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
  iconBtn: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 20 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  content: { padding: spacing.md, paddingBottom: 60 },
  noticeBox: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginBottom: spacing.lg,
    alignItems: 'flex-start',
    gap: 12
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    color: '#1e3a8a',
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
  infoValueInput: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500',
    padding: 0,
    margin: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 4,
    marginTop: 2
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 60
  }
});

export default EditProfileScreen;
