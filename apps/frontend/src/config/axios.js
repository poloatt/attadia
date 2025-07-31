import axios from 'axios';

// Determinar la URL base según el ambiente
const getBaseUrl = () => {
  const mode = import.meta.env.MODE;
  const apiUrl = import.meta.env.VITE_API_URL;
  const hostname = window.location.hostname;
  const environment = import.meta.env.VITE_ENVIRONMENT || mode;
  
  // console.log('Configuración de Axios:', {
  //   mode,
  //   environment,
  //   hostname,
  //   apiUrl
  // });
  
  // Entorno de staging (prioridad más alta)
  if (hostname.includes('staging') || environment === 'staging') {
    // console.log('Detectado entorno de staging');
    return 'https://api.staging.present.attadia.com';
  }
  
  // Entorno de producción
  if (hostname === 'admin.attadia.com' || environment === 'production') {
    // console.log('Detectado entorno de producción');
    return 'https://api.admin.attadia.com';
  }
  
  // Entorno de desarrollo (fallback)
  // console.log('Detectado entorno de desarrollo');
  return apiUrl || 'http://localhost:5000';
};

const baseURL = getBaseUrl();
// console.log('URL base de Axios:', baseURL);

// Detectar si es móvil
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

const clienteAxios = axios.create({
  baseURL,
  timeout: isMobile ? 30000 : 10000, // 30 segundos para móvil, 10 para desktop
  headers: {
    'Content-Type': 'application/json',
    ...(isMobile && { 'X-Device-Type': 'mobile' })
  }
});

// Interceptor para agregar el token a las peticiones
let pendingRequests = {};

clienteAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Evitar solicitudes duplicadas en intervalos cortos
    const requestId = `${config.method}:${config.url}`;
    
    // Excluir rutas específicas que necesitan ser llamadas con frecuencia
    const frecuentEndpoints = [
      '/api/auth/check',
      '/api/health',
      '/api/rutinas',
      '/api/propiedades',
      '/api/cuentas',
      '/api/inquilinos',
      '/api/contratos',
      '/api/tareas',
      '/api/proyectos',
      '/api/transacciones',
      '/api/monedas',
      '/api/users',
      '/api/users/rutinas-config',
      '/api/mediciones',
      '/api/dietas',
      '/api/datacorporal',
      '/api/lab'
    ];
    
    const isFrecuentEndpoint = frecuentEndpoints.some(endpoint => config.url.includes(endpoint));
    
    // Para los endpoints frecuentes, no aplicar restricciones
    if (config.method === 'get' && config.url.includes('/api/monedas')) {
      // Permitir siempre las solicitudes a /api/monedas sin cancelarlas
      return config;
    }
    
    // Si es una solicitud GET de API (no afectar a POST, PUT, DELETE) y no es un endpoint frecuente
    if (config.method === 'get' && config.url.includes('/api/') && !isFrecuentEndpoint) {
      // Si la misma solicitud está pendiente, cancelarla
      if (pendingRequests[requestId]) {
        const now = Date.now();
        const lastTime = pendingRequests[requestId];
        
        // Si hay una solicitud reciente (menos de 1000ms), cancelar (aumentado de 600ms)
        if (now - lastTime < 1000) {
          // console.log(`Solicitud cancelada (demasiado frecuente): ${requestId}`);
          return Promise.reject({ 
            cancelado: true, 
            message: 'Solicitud cancelada por repetirse demasiado rápido'
          });
        }
      }
      
      // Registrar esta solicitud
      pendingRequests[requestId] = Date.now();
      
      // Limpiar el registro después de 2 segundos
      setTimeout(() => {
        delete pendingRequests[requestId];
      }, 2000);
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
    // Si el error es de cancelación por demasiadas solicitudes, manejarlo de forma silenciosa
    if (error.cancelado) {
      // console.log('Solicitud cancelada por control de frecuencia:', error.message);
      
      // Asegurarse de que el error mantiene la propiedad cancelado para que
      // los componentes puedan detectarla y manejarla adecuadamente
      const cancelError = new Error(error.message || 'Solicitud cancelada por repetirse demasiado rápido');
      cancelError.cancelado = true;
      cancelError.name = 'CanceledError';
      cancelError.code = 'ERR_CANCELED';
      
      return Promise.reject(cancelError);
    }
    
    // Manejo específico para errores de red en móvil
    if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      console.log('📱 Error de red detectado:', error.message);
      
      if (isMobile) {
        // En móvil, intentar reintentar automáticamente una vez
        if (!error.config._retry) {
          error.config._retry = true;
          console.log('🔄 Reintentando petición en móvil...');
          
          return new Promise(resolve => {
            setTimeout(() => {
              resolve(clienteAxios.request(error.config));
            }, 2000); // Esperar 2 segundos antes de reintentar
          });
        }
      }
      
      throw new Error('Error de conexión con el servidor. Por favor, verifica tu conexión a internet.');
    }

    // Log detallado en desarrollo
    if (import.meta.env.MODE === 'development') {
      // console.error('Error en la petición:', {
      //   status: error.response?.status,
      //   url: error.config?.url,
      //   method: error.config?.method,
      //   headers: error.config?.headers,
      //   data: error.config?.data
      // });
    }

    const originalRequest = error.config;

    // 🔧 HABILITADO: Refresh token automático para peticiones que no son de auth
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Solo refrescar si no es una petición de auth
      if (!originalRequest.url.includes('/auth/')) {
        try {
          console.log('🔄 Intentando refresh token automático...');
          originalRequest._retry = true;
          
          const refreshToken = localStorage.getItem('refreshToken');
          if (!refreshToken) {
            console.log('❌ No hay refresh token disponible');
            throw new Error('No refresh token available');
          }

          const response = await clienteAxios.post('/api/auth/refresh', {
            refreshToken
          }, { timeout: isMobile ? 30000 : 10000 });
          
          const { token: newToken } = response.data;
          localStorage.setItem('token', newToken);
          clienteAxios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          
          console.log('✅ Token refrescado exitosamente');
          return clienteAxios(originalRequest);
        } catch (refreshError) {
          console.log('❌ Error al refrescar token:', refreshError.message);
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          delete clienteAxios.defaults.headers.common['Authorization'];
          
          // Redirigir a login solo si no estamos ya ahí
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

// Asegurarse de que clienteAxios esté disponible globalmente
window.clienteAxios = clienteAxios;

export default clienteAxios;