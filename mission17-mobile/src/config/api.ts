// src/config/api.ts

// 👇 REPLACE 'localhost' WITH YOUR PC'S IP IF USING A REAL PHONE
// Example: const API_URL = "http://192.168.1.5:5001/api";
const API_URL = "http://10.13.157.98:5001/api"; 

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