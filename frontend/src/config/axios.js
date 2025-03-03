import axios from 'axios';

// Determinar la URL base según el ambiente
const getBaseUrl = () => {
  const mode = import.meta.env.MODE;
  const apiUrl = import.meta.env.VITE_API_URL;
  
  if (mode === 'development') {
    return apiUrl || 'http://localhost:5000/api';
  }
  
  // En producción, asegurarse de que la URL tenga el prefijo /api
  const prodUrl = apiUrl || 'https://api.present.attadia.com';
  return prodUrl.endsWith('/api') ? prodUrl : `${prodUrl}/api`;
};

const clienteAxios = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  timeout: 30000,
  maxRedirects: 5
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const refreshAuthToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await clienteAxios.post('/api/auth/refresh-token', {
      refreshToken
    });
    
    const { token: newToken } = response.data;
    localStorage.setItem('token', newToken);
    return newToken;
  } catch (error) {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    throw error;
  }
};

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

    // Agregar logging detallado en producción
    if (import.meta.env.MODE === 'production') {
      console.error('Error en la petición:', {
        status: error.response?.status,
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      });
    }

    const originalRequest = error.config;

    // Si el token expiró, intentar refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return clienteAxios(originalRequest);
          })
          .catch(err => {
            console.error('Error en refresh token:', err);
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshAuthToken();
        clienteAxios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        
        processQueue(null, newToken);
        return clienteAxios(originalRequest);
      } catch (refreshError) {
        console.error('Error al refrescar token:', refreshError);
        processQueue(refreshError, null);
        
        // Solo redirigir si es un error de autenticación real
        if (refreshError.response?.status === 401) {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default clienteAxios;