import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Keys for our storage
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';
const FALLBACK_SESSION_KEY = 'firebase_fallback_session';
const SESSION_EXPIRY_KEY = 'auth_session_expires_at';
export const AUTH_SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

type SessionExpiryListener = (expiresAt: number | null) => void;
const sessionExpiryListeners = new Set<SessionExpiryListener>();
export const subscribeToAuthSessionExpiry = (listener: SessionExpiryListener) => {
  sessionExpiryListeners.add(listener);
  return () => sessionExpiryListeners.delete(listener);
};
const notifySessionExpiryChanged = (expiresAt: number | null) => {
  sessionExpiryListeners.forEach(listener => listener(expiresAt));
};

export type FallbackSession = {
  refreshToken: string;
  expiresAt: number;
};

// 1. SAVE DATA (Login)
export const saveAuthData = async (token: string, user: any, fallbackSession?: FallbackSession | null, sessionExpiresAt?: number) => {
  try {
    const storedExpiry = Platform.OS === 'web'
      ? Number(localStorage.getItem(SESSION_EXPIRY_KEY))
      : Number(await SecureStore.getItemAsync(SESSION_EXPIRY_KEY));
    const effectiveExpiry = Number.isFinite(sessionExpiresAt)
      ? sessionExpiresAt as number
      : (Number.isFinite(storedExpiry) && storedExpiry > 0 ? storedExpiry : Date.now() + AUTH_SESSION_DURATION_MS);
    if (Platform.OS === 'web') {
      // Web doesn't support SecureStore, use LocalStorage
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      if (fallbackSession === null) localStorage.removeItem(FALLBACK_SESSION_KEY);
      else if (fallbackSession) localStorage.setItem(FALLBACK_SESSION_KEY, JSON.stringify(fallbackSession));
      localStorage.setItem(SESSION_EXPIRY_KEY, String(effectiveExpiry));
    } else {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
      if (fallbackSession === null) await SecureStore.deleteItemAsync(FALLBACK_SESSION_KEY);
      else if (fallbackSession) await SecureStore.setItemAsync(FALLBACK_SESSION_KEY, JSON.stringify(fallbackSession));
      await SecureStore.setItemAsync(SESSION_EXPIRY_KEY, String(effectiveExpiry));
    }
    notifySessionExpiryChanged(effectiveExpiry);
  } catch (error) {
    console.error("Error saving auth data:", error);
  }
};

// 2. GET DATA (Auto-Login)
export const getAuthData = async () => {
  try {
    let token, user, fallbackSession: FallbackSession | null = null;
    let sessionExpiryValue: string | null;
    
    if (Platform.OS === 'web') {
      token = localStorage.getItem(TOKEN_KEY);
      const userStr = localStorage.getItem(USER_KEY);
      user = userStr ? JSON.parse(userStr) : null;
      const fallbackSessionStr = localStorage.getItem(FALLBACK_SESSION_KEY);
      fallbackSession = fallbackSessionStr ? JSON.parse(fallbackSessionStr) : null;
      sessionExpiryValue = localStorage.getItem(SESSION_EXPIRY_KEY);
    } else {
      token = await SecureStore.getItemAsync(TOKEN_KEY);
      const userStr = await SecureStore.getItemAsync(USER_KEY);
      user = userStr ? JSON.parse(userStr) : null;
      const fallbackSessionStr = await SecureStore.getItemAsync(FALLBACK_SESSION_KEY);
      fallbackSession = fallbackSessionStr ? JSON.parse(fallbackSessionStr) : null;
      sessionExpiryValue = await SecureStore.getItemAsync(SESSION_EXPIRY_KEY);
    }

    if (token && user) {
      const storedExpiry = Number(sessionExpiryValue);
      const sessionExpiresAt = Number.isFinite(storedExpiry) && storedExpiry > 0
        ? storedExpiry
        : Date.now() + AUTH_SESSION_DURATION_MS;
      if (sessionExpiresAt <= Date.now()) {
        await clearAuthData();
        return null;
      }
      if (!Number.isFinite(storedExpiry) || storedExpiry <= 0) {
        if (Platform.OS === 'web') localStorage.setItem(SESSION_EXPIRY_KEY, String(sessionExpiresAt));
        else await SecureStore.setItemAsync(SESSION_EXPIRY_KEY, String(sessionExpiresAt));
      }
      return { token, user, fallbackSession, sessionExpiresAt };
    }
    return null;
  } catch (error) {
    console.error("Error getting auth data:", error);
    return null;
  }
};

// 3. CLEAR DATA (Logout)
export const clearAuthData = async () => {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(FALLBACK_SESSION_KEY);
      localStorage.removeItem(SESSION_EXPIRY_KEY);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
      await SecureStore.deleteItemAsync(FALLBACK_SESSION_KEY);
      await SecureStore.deleteItemAsync(SESSION_EXPIRY_KEY);
    }
    notifySessionExpiryChanged(null);
  } catch (error) {
    console.error("Error clearing auth data:", error);
  }
};
