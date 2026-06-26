import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, AppState } from 'react-native';
import Toast from '../components/Toast';
import { GlobalState, endpoints } from '../config/api';

type NotificationType = 'success' | 'error' | 'info';

interface Notification {
  id: string;
  title?: string;
  message: any;
  type: NotificationType;
}

interface NotificationContextType {
  showNotification: (arg1: any, arg2?: any, arg3?: string) => void;
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

    const id = Math.random().toString(36).substr(2, 9);
    setNotifications((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
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
        const toastType: NotificationType =
          n.type === 'success' ? 'success' : n.type === 'error' ? 'error' : 'info';

        showNotification({ title: n.title, message: n.message, type: toastType });
      });
    } catch {
      // Silently ignore polling errors (app might be offline briefly)
    }
  }, [showNotification]);

  // Start polling when the provider mounts, stop when it unmounts
  useEffect(() => {
    // Run once immediately, then on interval
    pollNotifications();
    pollTimer.current = setInterval(pollNotifications, POLL_INTERVAL);

    // Pause polling when app goes to background, resume on foreground
    const sub = AppState.addEventListener('change', (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        // App came to foreground — poll immediately
        pollNotifications();
        if (!pollTimer.current) {
          pollTimer.current = setInterval(pollNotifications, POLL_INTERVAL);
        }
      } else if (nextState.match(/inactive|background/)) {
        // App went to background — pause polling to save battery
        if (pollTimer.current) {
          clearInterval(pollTimer.current);
          pollTimer.current = null;
        }
      }
      appState.current = nextState;
    });

    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
      sub.remove();
    };
  }, [pollNotifications]);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <View style={styles.container} pointerEvents="box-none">
        {notifications.map((n) => (
          <Toast
            key={n.id}
            title={n.title}
            message={n.message}
            type={n.type}
            onClose={() => removeNotification(n.id)}
          />
        ))}
      </View>
    </NotificationContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    paddingTop: 50,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
});
