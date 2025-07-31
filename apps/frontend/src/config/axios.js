import axios from 'axios';

// Determinar la URL base según el ambiente
const getBaseUrl = () => {
  const mode = import.meta.env.MODE;
  const apiUrl = import.meta.env.VITE_API_URL;
  const hostname = window.location.hostname;
  const environment = import.meta.env.VITE_ENVIRONMENT || mode;
  
  // Entorno de staging
  if (hostname.includes('staging') || environment === 'staging') {
    return 'https://api.staging.present.attadia.com';
  }
  
  // Entorno de producción
  if (hostname === 'admin.attadia.com' || environment === 'production') {
    return 'https://api.admin.attadia.com';
  }
  
  // Entorno de desarrollo
  return apiUrl || 'http://localhost:5000';
};

const baseURL = getBaseUrl();

// Crear instancia de axios con configuración base
const clienteAxios = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar el token a las peticiones
clienteAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
clienteAxios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Manejo de errores de red
    if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      throw new Error('Error de conexión con el servidor. Verifica tu conexión a internet.');
    }

    // Refresh token automático para peticiones que no son de auth
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (!originalRequest.url.includes('/auth/')) {
        try {
          originalRequest._retry = true;
          
          const refreshToken = localStorage.getItem('refreshToken');
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          const response = await clienteAxios.post('/api/auth/refresh', {
            refreshToken
          });
          
          const { token: newToken } = response.data;
          localStorage.setItem('token', newToken);
          clienteAxios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          
          return clienteAxios(originalRequest);
        } catch (refreshError) {
          // Limpiar tokens y redirigir solo si no estamos en login
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          delete clienteAxios.defaults.headers.common['Authorization'];
          
          if (!window.location.pathname.includes('/login') && 
              !window.location.pathname.includes('/auth')) {
            window.location.href = '/login';
          }
        }
      }
    }

    return Promise.reject(error);
  }
);

export default clienteAxios;