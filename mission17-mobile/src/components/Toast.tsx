import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface ToastProps {
  title?: string;
  message: any;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ title, message, type, onClose }) => {
  const slideAnim = useRef(new Animated.Value(-200)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Start removal animation before auto-dismiss
    const timer = setTimeout(() => {
      handleClose();
    }, 3700);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle size={24} color="#10b981" />;
      case 'error': return <AlertCircle size={24} color="#ef4444" />;
      default: return <Info size={24} color="#3b82f6" />;
    }
  };

  const getAutoTitle = () => {
    if (title) return title;
    switch (type) {
      case 'success': return 'Action Successful';
      case 'error': return 'System Error';
      case 'info': return 'System Update';
      default: return 'Notification';
    }
  };

  const renderMessage = () => {
    if (!message) return 'No message details.';
    if (typeof message === 'string') return message;
    
    // Handle Error objects or API response objects
    if (message instanceof Error) return message.message;
    if (message.message) return String(message.message);
    if (message.error) return String(message.error);
    if (message.detail) return String(message.detail);
    
    // Fallback for objects that JSON.stringify handles poorly (like empty errors)
    try {
      const stringified = JSON.stringify(message);
      return stringified === '{}' ? 'An unexpected error occurred.' : stringified;
    } catch (e) {
      return 'An error occurred (unserializable details).';
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      default: return '#3b82f6';
    }
  };

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
          borderLeftColor: getBorderColor(),
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          {getIcon()}
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.titleText}>{getAutoTitle()}</Text>
          <Text style={styles.messageText}>{renderMessage()}</Text>
        </View>
      </View>
      <TouchableOpacity onPress={handleClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <X size={18} color="#94a3b8" />
      </TouchableOpacity>
      <View style={[styles.progressBar, { backgroundColor: getBorderColor() }]} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toast: {
    width: width * 0.9,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderLeftWidth: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    // Elevation for Android
    elevation: 6,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    paddingRight: 8,
  },
  iconWrapper: {
    paddingTop: 2,
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  titleText: {
    color: '#1e293b',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  messageText: {
    color: '#475569',
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
  closeBtn: {
    padding: 4,
    marginLeft: 4,
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 3,
    width: '100%',
  },
});

export default Toast;
