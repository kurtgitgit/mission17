import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, Target, BookOpen, Megaphone, User } from 'lucide-react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// ─── SCREENS ───────────────────────────────────────────
import LoginScreen       from './src/screens/LoginScreen';
import SignupScreen      from './src/screens/SignupScreen';
import VerifySignup      from './src/screens/VerifySignup';
import HomeScreen        from './src/screens/HomeScreen';
import MissionsScreen    from './src/screens/MissionsScreen';
import MissionDetailScreen from './src/screens/MissionDetailScreen';
import EventDetailScreen from './src/screens/EventDetailScreen';
import ProfileScreen     from './src/screens/ProfileScreen';
import LearningScreen    from './src/screens/LearningScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import SettingsScreen    from './src/screens/SettingsScreen';
import SDGDetailScreen   from './src/screens/SDGDetailScreen';
import AuditLogScreen    from './src/screens/AuditLogScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ChatBotScreen        from './src/screens/ChatBotScreen';
import BlotterReportScreen  from './src/screens/BlotterReportScreen';
import BlotterHistoryScreen from './src/screens/BlotterHistoryScreen';
import SuggestionScreen     from './src/screens/SuggestionScreen';

// ─── NEW BARANGAY SCREENS ──────────────────────────────
import AnnouncementsScreen from './src/screens/AnnouncementsScreen';
import ServicesScreen      from './src/screens/ServicesScreen';
import OfficialsScreen     from './src/screens/OfficialsScreen';

// ─── UTILS ─────────────────────────────────────────────
import { getAuthData } from './src/utils/storage';
import { GlobalState } from './src/config/api';
import { NotificationProvider } from './src/context/NotificationContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

// ─── TAB BAR ────────────────────────────────────────────
function MainTabs() {
  const TabNavigator = Tab.Navigator as any;
  const { theme } = useTheme();

  return (
    <TabNavigator
      id="MainTabs"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textTertiary,
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 82 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
          paddingTop: 8,
          backgroundColor: theme.surface,
          borderTopWidth: 1,
          borderTopColor: theme.border,
          ...Platform.select({
            default: { elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 8 },
            web: { boxShadow: '0px -2px 12px rgba(0,0,0,0.06)' }
          })
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', marginTop: -2 },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }: any) => <Home size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="MissionsTab"
        component={MissionsScreen}
        options={{
          tabBarLabel: 'Civic Tasks',
          tabBarIcon: ({ color }: any) => <Target size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="AnnouncementsTab"
        component={AnnouncementsScreen}
        options={{
          tabBarLabel: 'News',
          tabBarIcon: ({ color }: any) => <Megaphone size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="LearnTab"
        component={LearningScreen}
        options={{
          tabBarLabel: 'Learn',
          tabBarIcon: ({ color }: any) => <BookOpen size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }: any) => <User size={22} color={color} />,
        }}
      />
    </TabNavigator>
  );
}

// ─── ROOT APP ───────────────────────────────────────────
export default function App() {
  const StackNavigator = Stack.Navigator as any;
  const [isLoading, setIsLoading]   = useState(true);
  const [initialRoute, setInitialRoute] = useState('Login');

  useEffect(() => {
    const checkLogin = async () => {
      const authData = await getAuthData();
      if (authData?.user?._id) {
        GlobalState.userId = authData.user._id;
        setInitialRoute('Home');
      }
      setIsLoading(false);
    };
    checkLogin();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#eff6ff', gap: 16 }}>
        <Text style={{ fontSize: 48 }}>🇵🇭</Text>
        <Text style={{ fontSize: 20, fontWeight: '900', color: '#0038A8' }}>Barangay Pantal</Text>
        <Text style={{ fontSize: 12, color: '#64748b', marginTop: -8 }}>Republic of the Philippines</Text>
        <ActivityIndicator size="large" color="#0038A8" style={{ marginTop: 8 }} />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <NotificationProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
        <NavigationContainer>
          <StackNavigator id="RootStack" initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
            {/* Auth */}
            <Stack.Screen name="Login"         component={LoginScreen} />
            <Stack.Screen name="Signup"        component={SignupScreen} />
            <Stack.Screen name="VerifySignup"  component={VerifySignup} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />

            {/* Main */}
            <Stack.Screen name="Home"          component={MainTabs} />

            {/* Detail Screens */}
            <Stack.Screen name="MissionDetail" component={MissionDetailScreen} />
            <Stack.Screen name="EventDetail"   component={EventDetailScreen} />
            <Stack.Screen name="EditProfile"   component={EditProfileScreen} />
            <Stack.Screen name="Settings"      component={SettingsScreen} />
            <Stack.Screen name="SDGDetail"     component={SDGDetailScreen} />
            <Stack.Screen name="AuditLogs"     component={AuditLogScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />

            {/* Barangay Screens (pushable from Home quick actions) */}
            <Stack.Screen name="Services"      component={ServicesScreen} />
            <Stack.Screen name="Officials"     component={OfficialsScreen} />
            <Stack.Screen name="ChatBot"       component={ChatBotScreen} />
            <Stack.Screen name="BlotterReport" component={BlotterReportScreen} />
            <Stack.Screen name="BlotterHistory" component={BlotterHistoryScreen} />
            <Stack.Screen name="Suggestion"    component={SuggestionScreen} />
          </StackNavigator>
        </NavigationContainer>
      </GestureHandlerRootView>
      </NotificationProvider>
    </ThemeProvider>
  );
}