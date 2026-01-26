// 👇 REPLACE YOUR IP HERE IF NEEDED
const API_URL = "http://localhost:5001/api"; 

// 👇 1. NEW GLOBAL MEMORY
export const GlobalState = {
  userId: null
};

export const endpoints = {
  auth: {
    login: `${API_URL}/auth/login`,
    signup: `${API_URL}/auth/signup`,
    getUser: (id: string) => `${API_URL}/auth/user/${id}`,
    submitMission: `${API_URL}/auth/submit-mission`, 
  },
  missions: `${API_URL}/missions`,
};