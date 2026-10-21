const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://brgylink-api.duckdns.org/api').replace(/\/+$/, '');
export const OFFICIALS_URL = `${API_BASE_URL}/officials?status=active`;
