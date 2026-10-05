// Automatically use localhost when developing locally, and AWS Lightsail in production.
const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_URL = isLocal ? "http://localhost:5001/api" : "https://brgylink-api.duckdns.org/api";

const BACKEND_BASE_URL = API_URL.replace('/api', '');


export const endpoints = {
  dashboard: {
    summary: `${API_URL}/auth/dashboard-summary`,
  },
  auth: {
    baseUrl: `${API_URL}/auth`,
    backendBaseUrl: BACKEND_BASE_URL,
    login: `${API_URL}/auth/login`,
    auditLogs: `${API_URL}/auth/audit-logs`,
  },
  users: {
    getAll:  `${API_URL}/auth/users`,
    add:     `${API_URL}/auth/add-user`,
    update:  (id) => `${API_URL}/auth/admin-update-user/${id}`,
    accountStatus: (id) => `${API_URL}/auth/users/${id}/account-status`,
    delete:  (id) => `${API_URL}/auth/delete-user/${id}`,
  },
  // 🏛️ Barangay Portal
  announcements: `${BACKEND_BASE_URL}/api/announcements`,
  officials:     `${BACKEND_BASE_URL}/api/officials`,
  documentRequests: {
    all:    `${BACKEND_BASE_URL}/api/document-requests`,
    update: (id) => `${BACKEND_BASE_URL}/api/document-requests/${id}/status`,
  },
};
