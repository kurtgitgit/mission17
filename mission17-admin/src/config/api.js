// mission17-admin/src/config/api.js
const API_URL = "http://localhost:5001/api"; 

export const endpoints = {
  auth: {
    baseUrl: `${API_URL}/auth`,
    login: `${API_URL}/auth/login`,
    // 🔍 This connects your Admin Settings to the Audit Logs
    auditLogs: `${API_URL}/auth/audit-logs`,
  },
  missions: {
    getAll: `${API_URL}/auth/all-missions`,
    approve: `${API_URL}/auth/approve-mission`,
    reject: `${API_URL}/auth/reject-mission`,
  }
};