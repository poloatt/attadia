const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const endpoints = {
  auth: {
    login: `${API_URL}/auth/login`,
    register: `${API_URL}/auth/register`,
    logout: `${API_URL}/auth/logout`,
    profile: `${API_URL}/auth/profile`,
  },
  proyectos: `${API_URL}/proyectos`,
  tareas: `${API_URL}/tareas`,
  propiedades: `${API_URL}/propiedades`,
  // ... otros endpoints
}; 