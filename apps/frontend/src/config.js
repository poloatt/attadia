const API_URL = import.meta.env.VITE_API_URL || 'https://api.admin.attadia.com';
const HEALTH_URL = `${API_URL}/health`;
const BASE_URL = import.meta.env.VITE_BASE_URL || '';

export const GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI || 'https://api.admin.attadia.com/api/auth/google/callback';

// Configuración de endpoints
export const ENDPOINTS = {
  login: `${API_URL}/auth/login`,
  register: `${API_URL}/auth/register`,
  logout: `${API_URL}/auth/logout`,
  profile: `${API_URL}/auth/profile`,
  google: `${API_URL}/auth/google`,
  refreshToken: `${API_URL}/auth/refresh-token`
};

export { API_URL, BASE_URL, HEALTH_URL }; 