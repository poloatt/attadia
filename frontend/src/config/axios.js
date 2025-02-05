import axios from 'axios';

const clienteAxios = axios.create({
  baseURL: 'http://localhost:5000/api',
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
    
    const response = await clienteAxios.post('/auth/refresh-token', {
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

let isRetrying = false;
let retryCount = 0;
const MAX_RETRIES = 3;

// Interceptor para agregar el token a las peticiones
clienteAxios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Log para depuración
    console.log('Request:', {
      method: config.method,
      url: config.url,
      baseURL: config.baseURL,
      fullUrl: config.baseURL + config.url
    });
    return config;
  },
  error => {
    console.error('Error en la petición:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
clienteAxios.interceptors.response.use(
  response => {
    console.log('Respuesta exitosa:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  async error => {
    console.error('Error en la respuesta:', {
      url: error.config?.url,
      message: error.message,
      response: error.response?.data
    });

    if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      console.error('Error de red detectado');
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