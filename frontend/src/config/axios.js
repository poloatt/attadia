import axios from 'axios';

const clienteAxios = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 30000,
  maxRedirects: 5
});

let isRetrying = false;
let retryCount = 0;
const MAX_RETRIES = 3;

clienteAxios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
      return Promise.reject(error);
    }

    if ((error.message === 'Network Error' || error.code === 'ERR_NETWORK') && retryCount < MAX_RETRIES) {
      isRetrying = true;
      retryCount++;
      console.log('Intentando reconectar...', retryCount);
      
      try {
        const backoffDelay = Math.min(1000 * Math.pow(2, retryCount), 10000);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        const response = await clienteAxios(error.config);
        isRetrying = false;
        return response;
      } catch (retryError) {
        isRetrying = false;
        return Promise.reject(retryError);
      }
    }

    if (retryCount >= MAX_RETRIES) {
      console.error('Máximo número de intentos alcanzado');
      retryCount = 0;
      isRetrying = false;
    }

    return Promise.reject(error);
  }
);

export default clienteAxios; 