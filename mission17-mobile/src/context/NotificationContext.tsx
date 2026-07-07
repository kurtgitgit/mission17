import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, AppState, Platform } from 'react-native';
import ToastMessage from 'react-native-toast-message';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { GlobalState, endpoints } from '../config/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

type NotificationType = 'success' | 'error' | 'info';

interface Notification {
  id: string;
  title?: string;
  message: any;
  type: NotificationType;
}

interface NotificationContextType {
  showNotification: (arg1: any, arg2?: any, arg3?: string) => void;
  registerPushToken: (userId: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

// How often to check for new notifications (in ms)
const POLL_INTERVAL = 15000; // 15 seconds

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Track the IDs we've already toasted so we don't repeat them
  const seenIds = useRef<Set<string>>(new Set());
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const appState = useRef(AppState.currentState);

  // ─── Toast trigger ────────────────────────────────────────────────────────
  const showNotification = useCallback((arg1: any, arg2?: any, arg3?: string) => {
    let title: string | undefined;
    let message: any;
    let type: NotificationType;

    if (typeof arg1 === 'object' && arg1 !== null && !Array.isArray(arg1) && !(arg1 instanceof Error)) {
      title = arg1.title;
      message = arg1.message;
      type = (arg1.type as NotificationType) || 'info';
    } else if (typeof arg3 === 'string' && ['success', 'error', 'info'].includes(arg3)) {
      title = arg1;
      message = arg2;
      type = arg3 as NotificationType;
    } else if (typeof arg2 === 'string' && ['success', 'error', 'info'].includes(arg2)) {
      message = arg1;
      type = arg2 as NotificationType;
      title = arg3;
    } else {
      message = arg1;
      type = (arg2 as NotificationType) || 'info';
      title = arg3;
    }

    const finalMessage = typeof message === 'string' ? message : JSON.stringify(message);

    // Map to react-native-toast-message
    if (type === 'success') {
      ToastMessage.show({ type: 'success', text1: title || 'Success', text2: finalMessage });
    } else if (type === 'error') {
      ToastMessage.show({ type: 'error', text1: title || 'Error', text2: finalMessage });
    } else {
      ToastMessage.show({ type: 'info', text1: title || 'Info', text2: finalMessage });
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    // ToastMessage handles its own removal automatically
  }, []);

  // ─── Background polling ───────────────────────────────────────────────────
  const pollNotifications = useCallback(async () => {
    const userId = GlobalState.userId;
    const auth = (GlobalState as any).auth;
    const token = auth?.token;

    if (!userId || !token) return;

    try {
      const res = await fetch(endpoints.auth.getNotifications(userId), {
        headers: { 'auth-token': token },
      });
      if (!res.ok) return;

      const data = await res.json();
      const notifs: any[] = Array.isArray(data) ? data : [];

      // Only toast notifications we haven't seen yet AND that are unread
      const newUnread = notifs.filter(
        (n) => !n.read && !seenIds.current.has(n._id)
      );

      newUnread.forEach((n) => {
        seenIds.current.add(n._id);

        // Map backend type to toast type
        let tType: NotificationType = 'info';
        if (n.type === 'Mission_Approved') tType = 'success';
        if (n.type === 'Mission_Rejected') tType = 'error';

        showNotification(n.title, n.message, tType);
      });
    } catch (e) {
      // Silently fail polling
    }
  }, [showNotification]);

  // Start/Stop polling based on AppState
  useEffect(() => {
    const startPolling = () => {
      if (!pollTimer.current) {
        pollTimer.current = setInterval(pollNotifications, POLL_INTERVAL);
        pollNotifications(); // do one immediately
      }
    };

    const stopPolling = () => {
      if (pollTimer.current) {
        clearInterval(pollTimer.current);
        pollTimer.current = null;
      }
    };

    const handleAppStateChange = (nextAppState: any) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        startPolling();
      } else if (nextAppState.match(/inactive|background/)) {
        stopPolling();
      }
      appState.current = nextAppState;
    };

    // Initial check
    if (appState.current === 'active') {
      startPolling();
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      stopPolling();
      subscription.remove();
    };
  }, [pollNotifications]);

  // ─── Push Notifications Registration ─────────────────────────────────────────
  const registerPushToken = useCallback(async (userId: string) => {
    if (Platform.OS === 'web') return;
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }
      
      const projectId = "d87a4192-3a7c-4734-9388-7ff53f533cc2"; // From app.json or dynamically fetched
      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      console.log("Expo Push Token:", token);

      // Save token to backend
      await fetch(`${endpoints.auth.baseUrl}/save-push-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, expoPushToken: token }),
      });
    } catch (e) {
      console.log("Error registering push token:", e);
    }
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification, registerPushToken }}>
      {children}
      {/* react-native-toast-message component is rendered at the root level in App.tsx */}
    </NotificationContext.Provider>
  );
};
