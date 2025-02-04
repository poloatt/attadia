const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const HEALTH_URL = `${API_URL}/health`;
const BASE_URL = import.meta.env.VITE_BASE_URL || '';

export { API_URL, BASE_URL, HEALTH_URL }; 