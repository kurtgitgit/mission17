import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;
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
      case 'success': return <CheckCircle size={20} color="#4ade80" />;
      case 'error': return <AlertCircle size={20} color="#f87171" />;
      default: return <Info size={20} color="#60a5fa" />;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success': return '#4ade80';
      case 'error': return '#f87171';
      default: return '#60a5fa';
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
        {getIcon()}
        <Text style={styles.text}>{message}</Text>
      </View>
      <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
        <X size={16} color="#94a3b8" />
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
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  text: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    flexShrink: 1,
  },
  closeBtn: {
    padding: 4,
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
