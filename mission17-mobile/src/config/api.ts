// src/config/api.ts
import { Platform } from 'react-native';

// 🏠 LOCALHOST / LAN IP
// IMPORTANT: Change this to your laptop's current IPv4 address (from `ipconfig`)
// Home: 192.168.1.x | Hotspot: 192.168.43.x (Android) or 172.20.10.x (iPhone)
const LAN_IP = "192.168.1.101";

// 🛠️ APK DEPLOYMENT CONFIG:
const RENDER_BACKEND_URL = "https://mission17-backend.onrender.com";

// Temporarily force Mobile to use the live cloud backend for Expo testing
const API_URL = `${RENDER_BACKEND_URL}/api`;
// const API_URL = `http://${LAN_IP}:5001/api`;

const AI_URL = "https://kurtgitgit-mission17-ai.hf.space/predict";

const BACKEND_BASE_URL = API_URL.replace('/api', '');

if (__DEV__) {
  console.log(`🏛️ Brgy. Pantal Portal (DEV) API: ${API_URL}`);
}

// 🖼️ IMAGE HELPER
export const formatImageUri = (uri: string) => {
  if (!uri) return null;

  // 1. Handle failing loremflickr links (swap for unsplash)
  if (uri.includes('loremflickr.com')) {
    return `https://images.unsplash.com/photo-1501854140801-50d01698950b?q=80&w=800&auto=format&fit=crop`;
  }

  // 2. Handle local uploads
  if (uri.startsWith('/uploads/')) {
    return `${BACKEND_BASE_URL}${uri}`;
  }

  return uri;
};

// 1. GLOBAL MEMORY
export const GlobalState = {
  userId: null as string | null,
  username: null as string | null,
  token: null as string | null,
  auth: null as { token: string } | null,
};

export const endpoints = {
  auth: {
    // ✅ NEW: Added 'baseUrl' to fix the "Property does not exist" error
    baseUrl: `${API_URL}/auth`,
    backendBaseUrl: BACKEND_BASE_URL,

    login: `${API_URL}/auth/login`,
    signup: `${API_URL}/auth/signup`,
    getUser: (id: string) => `${API_URL}/auth/user/${id}`,
    submitMission: `${API_URL}/auth/submit-mission`,
    getUserSubmissions: (id: string) => `${API_URL}/auth/user-submissions/${id}`,
    changePassword: `${API_URL}/auth/change-password`,
    forgotPassword: `${API_URL}/auth/forgot-password`,
    resetPassword: `${API_URL}/auth/reset-password`,
    verifyOTP: `${API_URL}/auth/verify-otp`,
    verifySignup: `${API_URL}/auth/verify-signup`,
    getNotifications: (id: string) => `${API_URL}/auth/notifications/${id}`,
    markNotificationRead: (id: string) => `${API_URL}/auth/notifications/${id}/read`,
  },
  // Updated to match your backend route (/auth/all-missions)
  missions: `${API_URL}/auth/all-missions`,
  events: `${API_URL}/auth/events`,
  predict: AI_URL,
  // 🏛️ Barangay Portal Endpoints
  announcements: `${BACKEND_BASE_URL}/api/announcements`,
  officials: `${BACKEND_BASE_URL}/api/officials`,
  documentRequests: {
    submit: `${BACKEND_BASE_URL}/api/document-requests`,
    my: (userId: string) => `${BACKEND_BASE_URL}/api/document-requests/my/${userId}`,
  },
};

export default API_URL;