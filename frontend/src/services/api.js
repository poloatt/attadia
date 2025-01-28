import { API_URL } from '../config';

export const api = {
  // Auth endpoints
  login: async (credentials) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return response.json();
  },

  // Propiedades endpoints
  getPropiedades: async () => {
    const response = await fetch(`${API_URL}/propiedades`);
    return response.json();
  },

  createPropiedad: async (data) => {
    const response = await fetch(`${API_URL}/propiedades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  // ... otros métodos API
};
