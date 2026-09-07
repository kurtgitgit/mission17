import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RefreshCw, WifiOff } from 'lucide-react-native';

type ScreenErrorStateProps = {
  compact?: boolean;
  message?: string;
  onRetry: () => void;
  title?: string;
};

/** A consistent, large-tap-target recovery state for screens that load remote data. */
export default function ScreenErrorState({
  compact = false,
  title = 'Unable to load this page',
  message = 'Please check your internet connection and try again.',
  onRetry,
}: ScreenErrorStateProps) {
  return (
    <View style={[styles.container, compact && styles.compactContainer]} accessibilityRole="alert">
      <View style={styles.iconWrap}>
        <WifiOff color="#B91C1C" size={30} />
      </View>
      <Text style={[styles.title, compact && styles.compactTitle]}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <TouchableOpacity
        accessibilityLabel="Retry loading this page"
        accessibilityRole="button"
        activeOpacity={0.82}
        onPress={onRetry}
        style={[styles.button, compact && styles.compactButton]}
      >
        <RefreshCw color="#FFFFFF" size={20} />
        <Text style={styles.buttonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', minHeight: 280, paddingHorizontal: 28 },
  compactContainer: { backgroundColor: '#FFF7ED', borderColor: '#FED7AA', borderRadius: 16, borderWidth: 1, marginHorizontal: 16, marginTop: 16, minHeight: 0, paddingVertical: 20 },
  iconWrap: { backgroundColor: '#FEE2E2', borderRadius: 30, marginBottom: 16, padding: 14 },
  title: { color: '#172554', fontSize: 20, fontWeight: '800', textAlign: 'center' },
  compactTitle: { fontSize: 18 },
  message: { color: '#475569', fontSize: 16, lineHeight: 23, marginTop: 10, textAlign: 'center' },
  button: { alignItems: 'center', backgroundColor: '#0038A8', borderRadius: 12, flexDirection: 'row', gap: 9, marginTop: 22, minHeight: 52, paddingHorizontal: 24 },
  compactButton: { marginTop: 18 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});
