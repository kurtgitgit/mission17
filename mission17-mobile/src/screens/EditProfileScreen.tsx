import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  SafeAreaView, Platform, ActivityIndicator, ScrollView, TextInput, Alert 
} from 'react-native';
import { X, User, MapPin, Phone, Mail, Calendar, Info, GraduationCap, Briefcase, Check } from 'lucide-react-native';
import { GlobalState, endpoints, getAuthHeaders } from '../config/api';
import { colors, spacing, radius, typography } from '../config/theme';
import ScreenErrorState from '../components/ScreenErrorState';
import CustomDropdown from '../components/CustomDropdown';
import { fetchWithTimeout, getFriendlyNetworkMessage } from '../utils/network';
import DateTimePicker from '@react-native-community/datetimepicker';

const EditProfileScreen = ({ navigation }: any) => {
  const [userData, setUserData] = useState<any>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [nationalitySelection, setNationalitySelection] = useState('');
  const [showBirthDatePicker, setShowBirthDatePicker] = useState(false);
  
  const userId = GlobalState.userId;
  const RootComponent = (Platform.OS === 'web' ? View : SafeAreaView) as React.ElementType;

  const fetchCurrentData = useCallback(async () => {
      try {
        setInitialLoading(true);
        setLoadError(null);
        const res = await fetchWithTimeout(endpoints.auth.getUser(userId), { headers: await getAuthHeaders() });
        if (!res.ok) throw new Error(`Profile request failed (${res.status})`);
        const data = await res.json();
        setUserData(data);
        setNationalitySelection(!data?.nationality ? '' : data.nationality === 'Filipino' ? 'Filipino' : 'Other');
      } catch (error) {
        console.error("Error loading profile:", error);
        setLoadError(getFriendlyNetworkMessage(error, 'Your profile details are unavailable right now. Please try again.'));
      } finally {
        setInitialLoading(false);
      }
    }, [userId]);

  useEffect(() => {
    fetchCurrentData();
  }, [fetchCurrentData]);

  const handleSave = async () => {
    if (saving) return;
    const firstName = userData?.firstName?.trim() || '';
    const lastName = userData?.lastName?.trim() || '';
    if (!firstName || !lastName) {
      Alert.alert('Name required', 'First name and last name are required.');
      return;
    }
    const birthDate = userData?.birthDate?.trim() || '';
    const parsedBirthDate = new Date(birthDate);
    const today = new Date();
    if (!birthDate || Number.isNaN(parsedBirthDate.getTime()) || parsedBirthDate > today) {
      Alert.alert('Invalid birthdate', 'Please enter a valid birthdate that is not in the future.');
      return;
    }
    let calculatedAge = today.getFullYear() - parsedBirthDate.getFullYear();
    const monthDifference = today.getMonth() - parsedBirthDate.getMonth();
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < parsedBirthDate.getDate())) calculatedAge -= 1;
    if (calculatedAge < 0 || calculatedAge > 120) {
      Alert.alert('Invalid birthdate', 'Please enter a realistic birthdate.');
      return;
    }
    if (!userData?.gender || !userData?.civilStatus || !userData?.voterStatus) {
      Alert.alert('Required information', 'Gender, civil status, and voter status are required.');
      return;
    }
    const mobileNumber = userData?.mobileNumber?.replace(/\D/g, '') || '';
    if (!/^09\d{9}$/.test(mobileNumber)) {
      Alert.alert('Invalid mobile number', 'Enter an 11-digit Philippine mobile number beginning with 09.');
      return;
    }
    const completeAddress = userData?.completeAddress?.trim() || '';
    if (completeAddress.length < 5) {
      Alert.alert('Address required', 'Please enter your complete address.');
      return;
    }
    const normalizedNationality = userData?.nationality?.trim() || '';
    if (!normalizedNationality) {
      Alert.alert('Nationality required', nationalitySelection === 'Other' ? 'Please specify your nationality.' : 'Please select your nationality.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetchWithTimeout(`${endpoints.auth.backendBaseUrl}/api/auth/update-profile/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify({
          ...userData,
          firstName,
          lastName,
          birthDate,
          age: String(calculatedAge),
          mobileNumber,
          completeAddress,
          nationality: normalizedNationality
        })
      });
      if (res.ok) {
        Alert.alert("Success", "Profile updated successfully!");
        navigation.goBack();
      } else {
        const errorData = await res.json().catch(() => null);
        Alert.alert("Error", errorData?.message || "Failed to update profile.");
      }
    } catch (e) {
      Alert.alert("Error", getFriendlyNetworkMessage(e, 'Could not save your profile. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  if (initialLoading) return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;
  if (loadError || !userData) return <ScreenErrorState title="Profile details are unavailable" message={loadError || 'Please try again.'} onRetry={fetchCurrentData} />;

  const EditableRow = ({ icon, label, value, onChangeText, keyboardType = 'default', placeholder = '', editable = true, maxLength }: any) => (
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
          editable={editable}
          maxLength={maxLength}
          accessibilityState={{ disabled: !editable }}
        />
        {!editable && <Text style={styles.fieldHint}>Verified email changes require a secure account process.</Text>}
      </View>
    </View>
  );

  const DropdownRow = ({ icon, label, value, options, onSelect }: any) => (
    <View style={styles.infoRow}>
      <View style={styles.iconContainer}>
        {icon}
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <CustomDropdown label={`Select ${label}`} value={value || ''} options={options} onSelect={onSelect} />
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
            <DropdownRow icon={<User size={20} color={colors.textSecondary} />} label="Suffix" value={userData?.suffix || 'None'} options={["None", "Jr.", "Sr.", "II", "III", "IV"]} onSelect={(suffix: string) => setUserData({...userData, suffix: suffix === 'None' ? '' : suffix})} />
            <View style={styles.divider} />
            <EditableRow icon={<Mail size={20} color={colors.textSecondary} />} label="Email Address" value={userData?.email} onChangeText={() => undefined} keyboardType="email-address" editable={false} />
            <View style={styles.divider} />
            <EditableRow icon={<Phone size={20} color={colors.textSecondary} />} label="Mobile Number" value={userData?.mobileNumber} onChangeText={(t: string) => setUserData({...userData, mobileNumber: t.replace(/\D/g, '').slice(0, 11)})} keyboardType="phone-pad" maxLength={11} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Demographics</Text>
          <View style={styles.card}>
            {Platform.OS === 'web' ? (
              <EditableRow icon={<Calendar size={20} color={colors.textSecondary} />} label="Birthdate" value={userData?.birthDate} onChangeText={(t: string) => setUserData({...userData, birthDate: t})} placeholder="MM/DD/YYYY" maxLength={40} />
            ) : (
              <View style={styles.infoRow}>
                <View style={styles.iconContainer}><Calendar size={20} color={colors.textSecondary} /></View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Birthdate</Text>
                  <TouchableOpacity style={styles.dateInput} onPress={() => setShowBirthDatePicker(true)}>
                    <Text style={userData?.birthDate ? styles.dateText : styles.datePlaceholder}>{userData?.birthDate || 'Select birthdate'}</Text>
                  </TouchableOpacity>
                  {showBirthDatePicker && (
                    <DateTimePicker
                      value={!Number.isNaN(new Date(userData?.birthDate).getTime()) ? new Date(userData.birthDate) : new Date()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      maximumDate={new Date()}
                      onChange={(_, selectedDate) => {
                        if (Platform.OS === 'android') setShowBirthDatePicker(false);
                        if (selectedDate) {
                          const now = new Date();
                          let age = now.getFullYear() - selectedDate.getFullYear();
                          const months = now.getMonth() - selectedDate.getMonth();
                          if (months < 0 || (months === 0 && now.getDate() < selectedDate.getDate())) age -= 1;
                          setUserData({...userData, birthDate: selectedDate.toDateString(), age: String(age)});
                        }
                      }}
                    />
                  )}
                  {Platform.OS === 'ios' && showBirthDatePicker && (
                    <TouchableOpacity style={styles.dateConfirmButton} onPress={() => setShowBirthDatePicker(false)}>
                      <Text style={styles.dateConfirmText}>Confirm Date</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
            <View style={styles.divider} />
            <EditableRow icon={<User size={20} color={colors.textSecondary} />} label="Age" value={userData?.age?.toString()} onChangeText={(t: string) => setUserData({...userData, age: t.replace(/\D/g, '').slice(0, 3)})} keyboardType="numeric" maxLength={3} />
            <View style={styles.divider} />
            <DropdownRow icon={<User size={20} color={colors.textSecondary} />} label="Gender" value={userData?.gender} options={["Male", "Female", "Other", "Prefer not to say"]} onSelect={(gender: string) => setUserData({...userData, gender})} />
            <View style={styles.divider} />
            <DropdownRow icon={<User size={20} color={colors.textSecondary} />} label="Civil Status" value={userData?.civilStatus} options={["Single", "Married", "Widowed", "Separated"]} onSelect={(civilStatus: string) => setUserData({...userData, civilStatus})} />
            <View style={styles.divider} />
            <EditableRow icon={<MapPin size={20} color={colors.textSecondary} />} label="Place of Birth" value={userData?.placeOfBirth} onChangeText={(t: string) => setUserData({...userData, placeOfBirth: t})} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Residency & Additional</Text>
          <View style={styles.card}>
            <EditableRow icon={<MapPin size={20} color={colors.textSecondary} />} label="Complete Address" value={userData?.completeAddress} onChangeText={(t: string) => setUserData({...userData, completeAddress: t})} />
            <View style={styles.divider} />
            <DropdownRow icon={<Info size={20} color={colors.textSecondary} />} label="Nationality" value={nationalitySelection} options={["Filipino", "Other"]} onSelect={(choice: string) => {
              setNationalitySelection(choice);
              setUserData({...userData, nationality: choice === 'Filipino' ? 'Filipino' : (nationalitySelection === 'Other' ? userData.nationality : '')});
            }} />
            {nationalitySelection === 'Other' && <>
              <View style={styles.divider} />
              <EditableRow icon={<Info size={20} color={colors.textSecondary} />} label="Please specify nationality" value={userData?.nationality} onChangeText={(nationality: string) => setUserData({...userData, nationality})} />
            </>}
            <View style={styles.divider} />
            <DropdownRow icon={<Info size={20} color={colors.textSecondary} />} label="Voter Status" value={userData?.voterStatus} options={["Registered", "Not Registered"]} onSelect={(voterStatus: string) => setUserData({...userData, voterStatus})} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Education & Employment</Text>
          <View style={styles.card}>
            <DropdownRow icon={<Briefcase size={20} color={colors.textSecondary} />} label="Employment Status" value={userData?.employmentStatus} options={["Employed", "Self-Employed", "Unemployed", "Student", "Retired"]} onSelect={(employmentStatus: string) => setUserData({...userData, employmentStatus})} />
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
  dateInput: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 6
  },
  dateText: { fontSize: 15, color: colors.textPrimary, fontWeight: '500' },
  datePlaceholder: { fontSize: 15, color: colors.textMuted },
  dateConfirmButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.sm
  },
  dateConfirmText: { color: 'white', fontWeight: '700' },
  fieldHint: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 60
  }
});

export default EditProfileScreen;
