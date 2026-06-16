// src/services/api.service.js
// Centralized API service — all admin pages should use this instead of raw fetch + manual token retrieval.

import axios from 'axios';
import { endpoints } from '../config/api';

// ─── TOKEN HELPER ─────────────────────────────────────────────────────────────
const getToken = () => localStorage.getItem('token');

// ─── AXIOS INSTANCE ──────────────────────────────────────────────────────────
const http = axios.create({ baseURL: endpoints.auth.backendBaseUrl });

// Attach token to every outgoing request automatically
http.interceptors.request.use(config => {
  const token = getToken();
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

// ─── BLOTTER REPORTS ─────────────────────────────────────────────────────────
export const blotterApi = {
  getAll:       ()           => http.get('/api/blotter-reports'),
  updateStatus: (id, payload) => http.patch(`/api/blotter-reports/${id}/status`, payload),
};

// ─── SUGGESTIONS ─────────────────────────────────────────────────────────────
export const suggestionsApi = {
  getAll:       ()           => http.get('/api/suggestions'),
  updateStatus: (id, payload) => http.patch(`/api/suggestions/${id}/status`, payload),
};

// ─── DOCUMENT REQUESTS ───────────────────────────────────────────────────────
export const documentApi = {
  getAll:       (status)     => {
    const url = status && status !== 'All' ? `/api/document-requests?status=${encodeURIComponent(status)}` : '/api/document-requests';
    return http.get(url, { headers: { 'auth-token': getToken() } });
  },
  updateStatus: (id, payload) => http.patch(`/api/document-requests/${id}/status`, { ...payload }, { headers: { 'auth-token': getToken() } }),
};

// ─── ANNOUNCEMENTS ───────────────────────────────────────────────────────────
export const announcementsApi = {
  getAll:   ()        => http.get('/api/announcements'),
  create:   (data)    => http.post('/api/announcements', data),
  update:   (id, data)=> http.put(`/api/announcements/${id}`, data),
  remove:   (id)      => http.delete(`/api/announcements/${id}`),
};

// ─── OFFICIALS ───────────────────────────────────────────────────────────────
export const officialsApi = {
  getAll:  ()         => http.get('/api/officials'),
  create:  (data)     => http.post('/api/officials', data),
  update:  (id, data) => http.put(`/api/officials/${id}`, data),
  remove:  (id)       => http.delete(`/api/officials/${id}`),
};
