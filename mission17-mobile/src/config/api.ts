// 👇 REPLACE YOUR IP HERE IF NEEDED
// If using a real phone, replace 'localhost' with your computer's IP (e.g., 192.168.1.5)
const API_URL = "http://localhost:5001/api"; 

// 👇 1. NEW GLOBAL MEMORY
export const GlobalState = {
  userId: null as string | null
};

export const endpoints = {
  auth: {
    login: `${API_URL}/auth/login`,
    signup: `${API_URL}/auth/signup`,
    getUser: (id: string) => `${API_URL}/auth/user/${id}`,
    submitMission: `${API_URL}/auth/submit-mission`, 
    
    // ✅ ADDED THIS LINE TO FIX THE ERROR:
    getUserSubmissions: (id: string) => `${API_URL}/auth/user-submissions/${id}`,
  },
  // Updated to match your backend route (/auth/all-missions)
  missions: `${API_URL}/auth/all-missions`,
};