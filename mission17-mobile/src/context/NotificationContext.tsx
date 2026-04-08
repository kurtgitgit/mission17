import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import Toast from '../components/Toast';

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

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((arg1: any, arg2?: any, arg3?: string) => {
    let title: string | undefined;
    let message: any;
    let type: NotificationType;

    // Detect Polymorphic Usage
    if (typeof arg1 === 'object' && arg1 !== null && !Array.isArray(arg1) && !(arg1 instanceof Error)) {
      // Case 1: showNotification({ title, message, type })
      title = arg1.title;
      message = arg1.message;
      type = (arg1.type as NotificationType) || 'info';
    } else if (typeof arg3 === 'string' && ['success', 'error', 'info'].includes(arg3)) {
      // Case 2: showNotification(title, message, type)
      title = arg1;
      message = arg2;
      type = arg3 as NotificationType;
    } else if (typeof arg2 === 'string' && ['success', 'error', 'info'].includes(arg2)) {
      // Case 3: showNotification(message, type, title)
      message = arg1;
      type = arg2 as NotificationType;
      title = arg3;
    } else {
      // Fallback: showNotification(message, [type?], [title?])
      message = arg1;
      type = (arg2 as NotificationType) || 'info';
      title = arg3;
    }

    const id = Math.random().toString(36).substr(2, 9);
    setNotifications((prev) => [...prev, { id, title, message, type }]);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

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
    paddingTop: 50, // Avoid notch/status bar area
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
});
