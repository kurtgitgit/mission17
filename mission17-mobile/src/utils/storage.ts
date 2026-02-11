import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Keys for our storage
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

// 1. SAVE DATA (Login)
export const saveAuthData = async (token: string, user: any) => {
  try {
    if (Platform.OS === 'web') {
      // Web doesn't support SecureStore, use LocalStorage
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    }
  } catch (error) {
    console.error("Error saving auth data:", error);
  }
};

// 2. GET DATA (Auto-Login)
export const getAuthData = async () => {
  try {
    let token, user;
    
    if (Platform.OS === 'web') {
      token = localStorage.getItem(TOKEN_KEY);
      const userStr = localStorage.getItem(USER_KEY);
      user = userStr ? JSON.parse(userStr) : null;
    } else {
      token = await SecureStore.getItemAsync(TOKEN_KEY);
      const userStr = await SecureStore.getItemAsync(USER_KEY);
      user = userStr ? JSON.parse(userStr) : null;
    }

    if (token && user) {
      return { token, user };
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
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
    }
  } catch (error) {
    console.error("Error clearing auth data:", error);
  }
};