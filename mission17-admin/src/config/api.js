// mission17-admin/src/config/api.js
const API_URL = "https://mission17-backend.onrender.com/api"; 

export const endpoints = {
  dashboard: {
    summary: `${API_URL}/auth/dashboard-summary`,
  },
  auth: {
    baseUrl: `${API_URL}/auth`,
    login: `${API_URL}/auth/login`,
    auditLogs: `${API_URL}/auth/audit-logs`,
  },
  submissions: {
    pending:     `${API_URL}/auth/pending-submissions`,
    approved:    `${API_URL}/auth/submissions?status=Approved`,
    rejected:    `${API_URL}/auth/submissions?status=Rejected`,
    stats:       `${API_URL}/auth/analytics-stats`,
    approve:     `${API_URL}/auth/approve-mission`,
    reject:      `${API_URL}/auth/reject-mission`,
    analyzeProof:`${API_URL}/auth/analyze-proof`,
  },
  missions: {
    getAll:  `${API_URL}/auth/all-missions`,
    add:     `${API_URL}/auth/add-mission`,
    update:  (id) => `${API_URL}/auth/update-mission/${id}`,
    delete:  (id) => `${API_URL}/auth/delete-mission/${id}`,
  },
  users: {
    getAll:       `${API_URL}/auth/users`,
    add:          `${API_URL}/auth/add-user`,
    update:       (id) => `${API_URL}/auth/admin-update-user/${id}`,
    delete:       (id) => `${API_URL}/auth/delete-user/${id}`,
    leaderboard:  `${API_URL}/auth/leaderboard`,
  },
  events: {
    getAll: `${API_URL}/auth/events`,
    create: `${API_URL}/auth/events`,
    update: (id) => `${API_URL}/auth/events/${id}`,
    delete: (id) => `${API_URL}/auth/events/${id}`,
  },
};
