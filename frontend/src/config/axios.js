import axios from 'axios';

// Determinar la URL base según el ambiente
const getBaseUrl = () => {
  if (import.meta.env.MODE === 'development') {
    return import.meta.env.VITE_API_URL || 'http://localhost:5000';
  }
  return import.meta.env.VITE_API_URL || 'https://api.present.attadia.com';
};

const clienteAxios = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
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
      throw new Error('Error de conexión con el servidor. Por favor, verifica tu conexión a internet.');
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
          .catch(err => Promise.reject(err));
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
        processQueue(refreshError, null);
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default clienteAxios;