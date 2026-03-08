// src/config/api.ts
import { Platform } from 'react-native';

// 1. CONFIGURATION
// ⚠️ IMPORTANT: Update this IP address whenever your computer's network IP changes.
// On Windows, run 'ipconfig' in a terminal to find your IPv4 Address.
const LAN_IP = "10.13.157.98"; 

// 👇 Automatically switch between localhost (for Web) and your IP (for Mobile)
const API_URL = Platform.OS === 'web' 
  ? "http://localhost:5001/api" 
  : `http://${LAN_IP}:5001/api`; 

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
  },
  // Updated to match your backend route (/auth/all-missions)
  missions: `${API_URL}/auth/all-missions`,
  events: `${API_URL}/auth/events`,
};

export default API_URL;