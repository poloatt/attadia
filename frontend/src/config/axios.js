import axios from 'axios';

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
  maxRedirects: 5
});

instance.interceptors.response.use(
  response => response,
  error => {
    // No loguear errores 401 ya que son esperados cuando no hay sesión
    if (error.response?.status !== 401) {
      console.error('Error en la petición:', {
        status: error.response?.status,
        message: error.message,
        url: error.config?.url
      });
    }
    // Si es un error de autenticación y estamos en una ruta protegida
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default instance; 