import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  Platform, 
  Switch,
  Alert,
  ViewStyle,
  TextStyle,
  SafeAreaView
} from 'react-native';
import { 
  User, 
  Settings, 
  Bell, 
  LogOut, 
  ChevronRight, 
  Shield, 
  HelpCircle,
  Edit3
} from 'lucide-react-native';

const ProfileScreen = ({ navigation }: any) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Helper Component for Menu Items
  const MenuItem = ({ icon: Icon, label, onPress, isDestructive = false, hasToggle = false, toggleValue, onToggle }: any) => (
    <TouchableOpacity 
      style={styles.menuItem} 
      onPress={hasToggle ? undefined : onPress}
      disabled={hasToggle}
    >
      <View style={styles.menuLeft}>
        <View style={[styles.menuIconCircle, isDestructive && styles.destructiveIconCircle]}>
          <Icon size={20} color={isDestructive ? '#ef4444' : '#64748b'} />
        </View>
        <Text style={[styles.menuLabel, isDestructive && styles.destructiveLabel]}>{label}</Text>
      </View>
      
      {hasToggle ? (
        <Switch 
          value={toggleValue} 
          onValueChange={onToggle} 
          trackColor={{ false: '#e2e8f0', true: '#3b82f6' }}
          thumbColor={'white'}
        />
      ) : (
        <ChevronRight size={20} color="#cbd5e1" />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.mainBackground}>
      {/* On Web, this 'appContainer' limits width to 500px and centers it.
         On Mobile, it just fills the screen.
      */}
      <View style={styles.appContainer}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* 1. BLUE HEADER BACKGROUND */}
          <View style={styles.headerBackground}>
            <Text style={styles.headerTitle}>My Profile</Text>
          </View>

          {/* 2. FLOATING PROFILE CARD (Uses Negative Margin to overlap) */}
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <User size={40} color="white" />
              </View>
              <TouchableOpacity style={styles.editBadge}>
                <Edit3 size={12} color="white" />
              </TouchableOpacity>
            </View>
            <Text style={styles.userName}>Kurt Perez</Text>
            <Text style={styles.userRole}>SDG Advocate</Text>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>650</Text>
                <Text style={styles.statLabel}>Points</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>#7</Text>
                <Text style={styles.statLabel}>Rank</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>5</Text>
                <Text style={styles.statLabel}>Missions</Text>
              </View>
            </View>
          </View>

          {/* 3. SETTINGS MENU */}
          <View style={styles.menuContainer}>
            
            {/* App Settings Group */}
            <Text style={styles.sectionHeader}>App Settings</Text>
            <View style={styles.menuGroup}>
              <MenuItem 
                icon={Bell} 
                label="Notifications" 
                hasToggle 
                toggleValue={notificationsEnabled} 
                onToggle={setNotificationsEnabled} 
              />
              <View style={styles.separator} />
              <MenuItem 
                icon={Settings} 
                label="Account Settings" 
                onPress={() => Alert.alert("Coming Soon")} 
              />
            </View>

            {/* Support Group */}
            <Text style={styles.sectionHeader}>Support</Text>
            <View style={styles.menuGroup}>
              <MenuItem 
                icon={HelpCircle} 
                label="Help & FAQ" 
                onPress={() => {}} 
              />
              <View style={styles.separator} />
              <MenuItem 
                icon={Shield} 
                label="Privacy Policy" 
                onPress={() => {}} 
              />
            </View>

            {/* Logout Group */}
            <View style={[styles.menuGroup, { marginTop: 25 }]}>
              <MenuItem 
                icon={LogOut} 
                label="Log Out" 
                isDestructive 
                onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Login' }] })} 
              />
            </View>

            <Text style={styles.versionText}>Mission17 App v1.0.0</Text>
            <View style={{ height: 50 }} /> 
          </View>

        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // --- LAYOUT CONTAINERS ---
  mainBackground: {
    flex: 1,
    backgroundColor: '#f1f5f9', // Light gray background for the whole browser window
    alignItems: 'center',       // Center the app horizontally on Web
  } as ViewStyle,
  
  appContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 500,              // <--- KEY FIX: Limits width on Desktop
    backgroundColor: '#f8fafc', // App background color
    overflow: 'hidden',         // Clips content neatly
    // Shadow for desktop "card" look
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: Platform.OS === 'web' ? 0.1 : 0,
    shadowRadius: 20,
  } as ViewStyle,

  scrollContent: {
    paddingBottom: 40,
  } as ViewStyle,

  // --- HEADER SECTION ---
  headerBackground: {
    backgroundColor: '#0f6bba',
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 80, // Space for the card to overlap
    alignItems: 'center',
  } as ViewStyle,
  
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  } as TextStyle,

  // --- PROFILE CARD ---
  profileCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: -50,    // <--- NEGATIVE MARGIN: Pulls card UP over the blue header
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    // Shadows
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  } as ViewStyle,

  avatarContainer: { marginBottom: 10 } as ViewStyle,
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#3b82f6',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 4, borderColor: '#f0f9ff',
  } as ViewStyle,
  editBadge: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: '#0f172a', width: 24, height: 24, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'white',
  } as ViewStyle,
  
  userName: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 4 } as TextStyle,
  userRole: { fontSize: 14, color: '#64748b', marginBottom: 20 } as TextStyle,

  // Stats
  statsRow: {
    flexDirection: 'row', width: '100%', justifyContent: 'space-around', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 15,
  } as ViewStyle,
  statItem: { alignItems: 'center' } as ViewStyle,
  statValue: { fontSize: 18, fontWeight: '800', color: '#0f172a' } as TextStyle,
  statLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '600' } as TextStyle,
  statDivider: { width: 1, height: 30, backgroundColor: '#e2e8f0' } as ViewStyle,

  // --- MENU ---
  menuContainer: {
    paddingTop: 30,
    paddingHorizontal: 20,
  } as ViewStyle,
  
  sectionHeader: {
    fontSize: 12, fontWeight: '700', color: '#94a3b8', 
    marginBottom: 10, marginLeft: 10, textTransform: 'uppercase', letterSpacing: 0.5
  } as TextStyle,
  
  menuGroup: {
    backgroundColor: 'white', borderRadius: 16, overflow: 'hidden',
    marginBottom: 25,
    shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 5, elevation: 1,
  } as ViewStyle,
  
  menuItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 16, paddingHorizontal: 20,
    backgroundColor: 'white', // Ensures press state looks good
  } as ViewStyle,
  
  menuLeft: { flexDirection: 'row', alignItems: 'center' } as ViewStyle,
  menuIconCircle: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: '#f1f5f9',
    justifyContent: 'center', alignItems: 'center', marginRight: 15,
  } as ViewStyle,
  destructiveIconCircle: { backgroundColor: '#fef2f2' } as ViewStyle,
  
  menuLabel: { fontSize: 15, color: '#1e293b', fontWeight: '500' } as TextStyle,
  destructiveLabel: { color: '#ef4444', fontWeight: '600' } as TextStyle,
  
  separator: {
    height: 1, backgroundColor: '#f1f5f9', marginLeft: 65,
  } as ViewStyle,

  versionText: {
    textAlign: 'center', color: '#cbd5e1', fontSize: 12, marginBottom: 20
  } as TextStyle,
});

export default ProfileScreen;