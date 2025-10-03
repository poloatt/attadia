// Configuración centralizada según el ambiente
export const config = {
  development: {
    authPrefix: '/api/auth',
    apiPrefix: '/api',
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000',
    frontendUrls: {
      atta: import.meta.env.VITE_ATTA_URL || 'http://localhost:5174',
      foco: import.meta.env.VITE_FOCO_URL || 'http://localhost:5173',
      pulso: import.meta.env.VITE_PULSO_URL || 'http://localhost:5175'
    }
  },
  production: {
    authPrefix: '/api/auth',
    apiPrefix: '/api',
    baseUrl: import.meta.env.VITE_API_URL || 'https://api.attadia.com',
    frontendUrls: {
      atta: import.meta.env.VITE_ATTA_URL || 'https://atta.attadia.com',
      foco: import.meta.env.VITE_FOCO_URL || 'https://foco.attadia.com',
      pulso: import.meta.env.VITE_PULSO_URL || 'https://pulso.attadia.com'
    }
  }
};

// Determinar el ambiente actual
const env = import.meta.env.MODE || 'development';
const isProduction = typeof window !== 'undefined' && 
  (window.location.hostname === 'atta.attadia.com' || 
   window.location.hostname === 'foco.attadia.com' || 
   window.location.hostname === 'pulso.attadia.com');

export const currentConfig = isProduction 
  ? config.production 
  : config[env] || config.development;

// Función para depurar la configuración
export const logEnvironment = () => {
  // Comentado para reducir logs en consola
  // console.log('Ambiente detectado:', {
  //   env,
  //   baseUrl: currentConfig.baseUrl,
  //   mode: import.meta.env.MODE,
  //   viteApiUrl: import.meta.env.VITE_API_URL,
  //   isProduction
  // });
  // console.log('Configuración completa:', currentConfig);
};

// Función para obtener la URL de la app actual
export const getCurrentAppUrl = () => {
  if (typeof window === 'undefined') return null;
  
  const hostname = window.location.hostname;
  const port = window.location.port;
  
  // Desarrollo
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    switch (port) {
      case '5173': return currentConfig.frontendUrls.foco;
      case '5174': return currentConfig.frontendUrls.atta;
      case '5175': return currentConfig.frontendUrls.pulso;
      default: return currentConfig.frontendUrls.foco;
    }
  }
  
  // Producción
  if (hostname === 'foco.attadia.com') return currentConfig.frontendUrls.foco;
  if (hostname === 'atta.attadia.com') return currentConfig.frontendUrls.atta;
  if (hostname === 'pulso.attadia.com') return currentConfig.frontendUrls.pulso;
  
  return currentConfig.frontendUrls.foco; // fallback
};

// Exportar configuración actual
export default currentConfig; 