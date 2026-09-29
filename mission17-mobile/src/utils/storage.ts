import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Keys for our storage
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';
const FALLBACK_SESSION_KEY = 'firebase_fallback_session';

export type FallbackSession = {
  refreshToken: string;
  expiresAt: number;
};

// 1. SAVE DATA (Login)
export const saveAuthData = async (token: string, user: any, fallbackSession?: FallbackSession | null) => {
  try {
    if (Platform.OS === 'web') {
      // Web doesn't support SecureStore, use LocalStorage
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      if (fallbackSession === null) localStorage.removeItem(FALLBACK_SESSION_KEY);
      else if (fallbackSession) localStorage.setItem(FALLBACK_SESSION_KEY, JSON.stringify(fallbackSession));
    } else {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
      if (fallbackSession === null) await SecureStore.deleteItemAsync(FALLBACK_SESSION_KEY);
      else if (fallbackSession) await SecureStore.setItemAsync(FALLBACK_SESSION_KEY, JSON.stringify(fallbackSession));
    }
  } catch (error) {
    console.error("Error saving auth data:", error);
  }
};

// 2. GET DATA (Auto-Login)
export const getAuthData = async () => {
  try {
    let token, user, fallbackSession: FallbackSession | null = null;
    
    if (Platform.OS === 'web') {
      token = localStorage.getItem(TOKEN_KEY);
      const userStr = localStorage.getItem(USER_KEY);
      user = userStr ? JSON.parse(userStr) : null;
      const fallbackSessionStr = localStorage.getItem(FALLBACK_SESSION_KEY);
      fallbackSession = fallbackSessionStr ? JSON.parse(fallbackSessionStr) : null;
    } else {
      token = await SecureStore.getItemAsync(TOKEN_KEY);
      const userStr = await SecureStore.getItemAsync(USER_KEY);
      user = userStr ? JSON.parse(userStr) : null;
      const fallbackSessionStr = await SecureStore.getItemAsync(FALLBACK_SESSION_KEY);
      fallbackSession = fallbackSessionStr ? JSON.parse(fallbackSessionStr) : null;
    }

    if (token && user) {
      return { token, user, fallbackSession };
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
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
      await SecureStore.deleteItemAsync(FALLBACK_SESSION_KEY);
    }
  } catch (error) {
    console.error("Error clearing auth data:", error);
  }
};
