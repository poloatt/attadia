// Configuración centralizada según el ambiente
export const config = {
  development: {
    authPrefix: '/api/auth',
    apiPrefix: '/api',
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000',
    frontendUrl: import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173'
  },
  staging: {
    authPrefix: '/api/auth',
    apiPrefix: '/api',
    baseUrl: import.meta.env.VITE_API_URL || 'https://api.staging.present.attadia.com',
    frontendUrl: import.meta.env.VITE_FRONTEND_URL || 'https://staging.present.attadia.com'
  },
  production: {
    authPrefix: '/api/auth',
    apiPrefix: '/api',
    baseUrl: import.meta.env.VITE_API_URL || 'https://api.admin.attadia.com',
    frontendUrl: import.meta.env.VITE_FRONTEND_URL || 'https://admin.attadia.com'
  }
};

// Determinar el ambiente actual
const env = import.meta.env.MODE || 'development';
const isStaging = typeof window !== 'undefined' && window.location.hostname.includes('staging');
const isAdminProduction = typeof window !== 'undefined' && window.location.hostname === 'admin.attadia.com';

export const currentConfig = isAdminProduction 
  ? config.production 
  : isStaging 
    ? config.staging 
    : config[env] || config.development;

// Función para depurar la configuración
export const logEnvironment = () => {
  // Comentado para reducir logs en consola
  // console.log('Ambiente detectado:', {
  //   env,
  //   baseUrl: currentConfig.baseUrl,
  //   mode: import.meta.env.MODE,
  //   viteApiUrl: import.meta.env.VITE_API_URL,
  //   isStaging
  // });
  // console.log('Configuración completa:', currentConfig);
};

// Exportar configuración actual
export default currentConfig; 