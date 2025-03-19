import axios from 'axios';

// Determinar la URL base según el ambiente
const getBaseUrl = () => {
  const mode = import.meta.env.MODE;
  const apiUrl = import.meta.env.VITE_API_URL;
  const hostname = window.location.hostname;
  
  console.log('Modo de Axios:', mode);
  console.log('Hostname:', hostname);
  
  // Entorno de producción
  if (hostname === 'present.attadia.com') {
    console.log('Detectado entorno de producción');
    return 'https://api.present.attadia.com/api';
  }
  
  // Entorno de staging
  if (hostname.includes('staging')) {
    console.log('Detectado entorno de staging');
    return 'https://api.staging.present.attadia.com/api';
  }
  
  // Entorno de desarrollo
  if (mode === 'development') {
    console.log('Detectado entorno de desarrollo');
    return apiUrl || 'http://localhost:5000/api';
  }
  
  // Fallback a producción
  return apiUrl || 'https://api.present.attadia.com/api';
};

const baseURL = getBaseUrl();
console.log('URL base de Axios:', baseURL);

const clienteAxios = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  timeout: 30000,
  maxRedirects: 5
});

// Interceptor para agregar el token a las peticiones
clienteAxios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Interceptor para manejar respuestas y errores
clienteAxios.interceptors.response.use(
  response => response,
  async error => {
    if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      console.error('Error de conexión:', error);
      throw new Error('Error de conexión con el servidor. Por favor, verifica tu conexión a internet.');
    }

    // Log detallado en desarrollo
    if (import.meta.env.MODE === 'development') {
      console.error('Error en la petición:', {
        status: error.response?.status,
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        data: error.config?.data
      });
    }

    const originalRequest = error.config;

    // Si el token expiró, intentar refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        originalRequest._retry = true;
        
        const response = await clienteAxios.post('/api/auth/refresh-token', {
          refreshToken
        });
        
        const { token: newToken } = response.data;
        localStorage.setItem('token', newToken);
        clienteAxios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        
        return clienteAxios(originalRequest);
      } catch (refreshError) {
        console.error('Error al refrescar token:', refreshError);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        
        // Solo redirigir si es un error de autenticación real
        if (refreshError.response?.status === 401) {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default clienteAxios;