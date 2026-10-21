import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Platform, AppState } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Bot, Home, Landmark, Megaphone, ShieldCheck, User } from 'lucide-react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ToastMessage, { BaseToast, ErrorToast } from 'react-native-toast-message';
import * as Notifications from 'expo-notifications';
import { signOut } from 'firebase/auth';
import { auth } from './src/config/firebase';
// ─── SCREENS ───────────────────────────────────────────
import LoginScreen       from './src/screens/LoginScreen';
import SignupScreen      from './src/screens/SignupScreen';
import VerifySignup      from './src/screens/VerifySignup';
import SignupSuccessScreen from './src/screens/SignupSuccessScreen';
import PendingApprovalScreen from './src/screens/PendingApprovalScreen';
import RegistrationReviewScreen from './src/screens/RegistrationReviewScreen';
import HomeScreen        from './src/screens/HomeScreen';
import ProfileScreen     from './src/screens/ProfileScreen';
import LearningScreen    from './src/screens/LearningScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import SettingsScreen    from './src/screens/SettingsScreen';
import AuditLogScreen    from './src/screens/AuditLogScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ChatBotScreen        from './src/screens/ChatBotScreen';
import BlotterReportScreen  from './src/screens/BlotterReportScreen';
import BlotterHistoryScreen from './src/screens/BlotterHistoryScreen';
import SuggestionScreen     from './src/screens/SuggestionScreen';
import LegalInformationScreen from './src/screens/LegalInformationScreen';
import CaptainControlScreen from './src/screens/CaptainControlScreen';
import CaptainAnnouncementsScreen from './src/screens/CaptainAnnouncementsScreen';
import CaptainFeedbackScreen from './src/screens/CaptainFeedbackScreen';

// ─── NEW BARANGAY SCREENS ──────────────────────────────
import AnnouncementsScreen from './src/screens/AnnouncementsScreen';
import ServicesScreen      from './src/screens/ServicesScreen';
import OfficialsScreen     from './src/screens/OfficialsScreen';
import EmergencyContactsScreen from './src/screens/EmergencyContactsScreen';

// ─── UTILS ─────────────────────────────────────────────
import { clearAuthData, getAuthData, saveAuthData, subscribeToAuthSessionExpiry } from './src/utils/storage';
import { endpoints, getAuthHeadersIfAvailable, GlobalState } from './src/config/api';
import { fetchWithTimeout } from './src/utils/network';
import { NotificationProvider } from './src/context/NotificationContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { ChatProvider } from './src/context/ChatContext';
import { getMainTabOrder } from './src/navigation/mainTabs';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();
const navigationRef = createNavigationContainerRef<any>();

const MAIN_TAB_SCREENS = {
  HomeTab: { component: HomeScreen, label: 'Home', icon: Home },
  AnnouncementsTab: { component: AnnouncementsScreen, label: 'News', icon: Megaphone },
  AssistantTab: { component: ChatBotScreen, label: 'Assistant', icon: Bot },
  CaptainControlTab: { component: CaptainControlScreen, label: 'Control', icon: ShieldCheck },
  LearnTab: { component: LearningScreen, label: 'About', icon: Landmark },
  ProfileTab: { component: ProfileScreen, label: 'Profile', icon: User },
};

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
          height: Platform.OS === 'ios' ? 82 : 70,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 6,
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
      {getMainTabOrder(GlobalState.role).map((name) => {
        const screen = MAIN_TAB_SCREENS[name];
        const Icon = screen.icon;
        const isAssistant = name === 'AssistantTab';

        return (
          <Tab.Screen
            key={name}
            name={name}
            component={screen.component}
            options={{
              tabBarLabel: screen.label,
              tabBarAccessibilityLabel: isAssistant ? 'Open Barangay Assistant' : screen.label,
              tabBarIcon: ({ color }: any) => isAssistant ? (
                <View style={{
                  width: 54,
                  height: 54,
                  borderRadius: 27,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#D4AF37',
                  borderWidth: 3,
                  borderColor: theme.surface,
                  transform: [{ translateY: -11 }],
                  shadowColor: '#001847',
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.2,
                  shadowRadius: 5,
                  elevation: 6,
                }}>
                  <Bot size={25} color="#001847" />
                </View>
              ) : <Icon size={22} color={color} />,
              tabBarIconStyle: isAssistant ? { marginTop: 2 } : undefined,
              tabBarLabelStyle: { fontSize: 11, fontWeight: '700', marginTop: isAssistant ? -1 : -2 },
            }}
          />
        );
      })}
    </TabNavigator>
  );
}
const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      text1NumberOfLines={3}
      text2NumberOfLines={3}
      text1Style={{ fontSize: 14, fontWeight: 'bold' }}
      text2Style={{ fontSize: 12 }}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      text1NumberOfLines={3}
      text2NumberOfLines={3}
      text1Style={{ fontSize: 14, fontWeight: 'bold' }}
      text2Style={{ fontSize: 12 }}
    />
  ),
  info: (props: any) => (
    <BaseToast
      {...props}
      text1NumberOfLines={3}
      text2NumberOfLines={3}
      style={{ borderLeftColor: '#3b82f6' }}
      text1Style={{ fontSize: 14, fontWeight: 'bold' }}
      text2Style={{ fontSize: 12 }}
    />
  )
};

// ─── ROOT APP ───────────────────────────────────────────
export default function App() {
  const StackNavigator = Stack.Navigator as any;
  const [isLoading, setIsLoading]   = useState(true);
  const [initialRoute, setInitialRoute] = useState('Login');
  const [navigationReady, setNavigationReady] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let expiring = false;
    const expireSession = async () => {
      if (expiring) return;
      expiring = true;
      if (timer) clearTimeout(timer);
      await clearAuthData();
      try { await signOut(auth); } catch {}
      GlobalState.userId = null;
      GlobalState.username = null;
      GlobalState.role = null;
      GlobalState.token = null;
      GlobalState.auth = null;
      GlobalState.fallbackSession = null;
      if (navigationRef.isReady()) navigationRef.resetRoot({ index: 0, routes: [{ name: 'Login' }] });
      expiring = false;
    };
    const scheduleExpiry = (expiresAt: number | null) => {
      if (timer) clearTimeout(timer);
      if (!expiresAt) return;
      const remaining = expiresAt - Date.now();
      if (remaining <= 0) void expireSession();
      else timer = setTimeout(() => void expireSession(), remaining);
    };
    const refreshExpiry = async () => {
      const saved = await getAuthData();
      if (!saved && GlobalState.userId) {
        await expireSession();
        return;
      }
      scheduleExpiry(saved?.sessionExpiresAt ?? null);
    };
    const unsubscribe = subscribeToAuthSessionExpiry(scheduleExpiry);
    void refreshExpiry();
    const appStateSubscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        void refreshExpiry();
      }
    });
    return () => {
      if (timer) clearTimeout(timer);
      unsubscribe();
      appStateSubscription.remove();
    };
  }, []);

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const authData = await getAuthData();
        if (!authData && auth.currentUser) {
          try { await signOut(auth); } catch {}
        }
        if (authData?.user?.accountStatus === 'pending' || authData?.user?.accountStatus === 'rejected') {
          await clearAuthData();
        } else if (authData?.token && authData.user?._id) {
          let restoredUser = authData.user;
          try {
            const headers = await getAuthHeadersIfAvailable();
            if (headers) {
              const response = await fetchWithTimeout(endpoints.auth.getUser(authData.user._id), { headers }, 7_000);
              if (response.ok) {
                restoredUser = { ...authData.user, ...(await response.json()) };
                const latestAuthData = await getAuthData();
                await saveAuthData(
                  latestAuthData?.token || authData.token,
                  restoredUser,
                  latestAuthData?.fallbackSession ?? authData.fallbackSession
                );
              }
            }
          } catch {
            // Restore the cached session when the profile refresh is temporarily unavailable.
          }

          GlobalState.userId = restoredUser._id;
          GlobalState.username = restoredUser.username || null;
          GlobalState.role = restoredUser.role || null;
          const latestAuthData = await getAuthData();
          const restoredToken = latestAuthData?.token || authData.token;
          GlobalState.token = restoredToken;
          GlobalState.auth = { token: restoredToken };
          GlobalState.fallbackSession = latestAuthData?.fallbackSession || authData.fallbackSession || null;
          setInitialRoute('Home');
        }
      } catch (error) {
        console.error('Failed to restore the saved login session:', error);
      } finally {
        setIsLoading(false);
      }
    };
    void checkLogin();
  }, []);

  useEffect(() => {
    // Expo notification responses are native-only. Skipping this listener on
    // web keeps the browser preview usable for demos and screen recording.
    if (!navigationReady || Platform.OS === 'web') return;

    const navigateFromNotification = (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data || {};
      const targetScreen = typeof data.screen === 'string' ? data.screen : null;

      if (!targetScreen || !navigationRef.isReady()) return;

      const { screen: _screen, ...params } = data;
      if (targetScreen === 'Announcements') {
        navigationRef.navigate('Home', { screen: 'AnnouncementsTab', params });
        return;
      }

      navigationRef.navigate(targetScreen === 'Suggestions' ? 'Suggestion' : targetScreen, params);
    };

    const lastResponse = Notifications.getLastNotificationResponse();
    if (lastResponse) navigateFromNotification(lastResponse);

    const subscription = Notifications.addNotificationResponseReceivedListener(navigateFromNotification);
    return () => subscription.remove();
  }, [navigationReady]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#eff6ff', gap: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: '900', color: '#0038A8' }}>Barangay Bagong Pag-asa</Text>
        <Text style={{ fontSize: 12, color: '#64748b', marginTop: -8 }}>Republic of the Philippines</Text>
        <ActivityIndicator size="large" color="#0038A8" style={{ marginTop: 8 }} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <NotificationProvider>
          <ChatProvider>
            <NavigationContainer ref={navigationRef} onReady={() => setNavigationReady(true)}>
            <StackNavigator id="RootStack" initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
              {/* Auth */}
              <Stack.Screen name="Login"         component={LoginScreen} />
              <Stack.Screen name="Signup"        component={SignupScreen} />
              <Stack.Screen name="VerifySignup"  component={VerifySignup} />
              <Stack.Screen name="SignupSuccess" component={SignupSuccessScreen} />
              <Stack.Screen name="PendingApproval" component={PendingApprovalScreen} />
              <Stack.Screen name="RegistrationReview" component={RegistrationReviewScreen} />
              <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
              <Stack.Screen name="LegalInformation" component={LegalInformationScreen} />

              {/* Main */}
              <Stack.Screen name="Home"          component={MainTabs} />

              {/* Detail Screens */}
              <Stack.Screen name="EditProfile"   component={EditProfileScreen} />
              <Stack.Screen name="Settings"      component={SettingsScreen} />
              <Stack.Screen name="AuditLogs"     component={AuditLogScreen} />
              <Stack.Screen name="Notifications" component={NotificationsScreen} />

              {/* Barangay Screens (pushable from Home quick actions) */}
              <Stack.Screen name="Services"      component={ServicesScreen} />
              <Stack.Screen name="Officials"     component={OfficialsScreen} />
              <Stack.Screen name="EmergencyContacts" component={EmergencyContactsScreen} options={{
                headerShown: true,
                title: 'Emergency Contacts',
                headerTintColor: '#0038A8',
                headerTitleStyle: { fontWeight: '700' },
                headerStyle: { backgroundColor: '#FFFFFF' },
                headerShadowVisible: false,
              }} />
              <Stack.Screen name="ChatBot"       component={ChatBotScreen} />
              <Stack.Screen name="Chatbot"       component={ChatBotScreen} />
              <Stack.Screen name="BlotterReport" component={BlotterReportScreen} />
              <Stack.Screen name="BlotterHistory" component={BlotterHistoryScreen} />
              <Stack.Screen name="Suggestion"    component={SuggestionScreen} />
              <Stack.Screen name="CaptainControl" component={CaptainControlScreen} />
              <Stack.Screen name="CaptainAnnouncements" component={CaptainAnnouncementsScreen} />
              <Stack.Screen name="CaptainFeedback" component={CaptainFeedbackScreen} />
            </StackNavigator>
            </NavigationContainer>
          </ChatProvider>
        </NotificationProvider>
        <ToastMessage config={toastConfig} />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
