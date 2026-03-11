// src/config/api.ts
import { Platform } from 'react-native';

// ✅ PRODUCTION: Using the live backend URL
const API_URL = "https://mission17-backend.onrender.com/api";

if (Platform.OS !== 'web') {
  console.log(`🚀 Mobile API URL: ${API_URL}`);
}

// 1. GLOBAL MEMORY
export const GlobalState = {
  userId: null as string | null
};

export const endpoints = {
  auth: {
    // ✅ NEW: Added 'baseUrl' to fix the "Property does not exist" error
    baseUrl: `${API_URL}/auth`, 

    login: `${API_URL}/auth/login`,
    signup: `${API_URL}/auth/signup`,
    getUser: (id: string) => `${API_URL}/auth/user/${id}`,
    submitMission: `${API_URL}/auth/submit-mission`, 
    getUserSubmissions: (id: string) => `${API_URL}/auth/user-submissions/${id}`,
    changePassword: `${API_URL}/auth/change-password`,
    leaderboard: `${API_URL}/auth/leaderboard`,
    getNotifications: (id: string) => `${API_URL}/auth/notifications/${id}`,
    markNotificationRead: (id: string) => `${API_URL}/auth/notifications/${id}/read`,
  },
  // Updated to match your backend route (/auth/all-missions)
  missions: `${API_URL}/auth/all-missions`,
  events: `${API_URL}/auth/events`,
};

export default API_URL;