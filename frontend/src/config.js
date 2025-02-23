const API_URL = import.meta.env.VITE_API_URL || 'https://api.present.attadia.com/api';
const HEALTH_URL = `${API_URL}/health`;
const BASE_URL = import.meta.env.VITE_BASE_URL || '';

export const GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI || 'https://api.present.attadia.com/api/auth/google/callback';

export { API_URL, BASE_URL, HEALTH_URL }; 