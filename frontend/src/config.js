const API_URL = import.meta.env.VITE_API_URL || 'https://api.present.attadia.com';
const HEALTH_URL = `${API_URL}/health`;
const BASE_URL = import.meta.env.VITE_BASE_URL || '';

export const GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI || 'https://api.present.attadia.com/api/auth/google/callback';

// Configuración de endpoints
export const endpoints = {
  auth: {
    login: `${API_URL}/auth/login`,
    register: `${API_URL}/auth/register`,
    logout: `${API_URL}/auth/logout`,
    profile: `${API_URL}/auth/profile`,
    google: `${API_URL}/auth/google`,
    refreshToken: `${API_URL}/auth/refresh-token`
  },
  health: HEALTH_URL
};

export { API_URL, BASE_URL, HEALTH_URL }; 