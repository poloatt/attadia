import dotenv from 'dotenv';

const environment = process.env.ENVIRONMENT || process.env.NODE_ENV || 'development';

// Cargar el archivo .env correspondiente
dotenv.config({ path: `.env.${environment}` });

// Función para validar variables de entorno requeridas
const validateRequiredEnvVars = () => {
  const requiredEnvVars = [
    'JWT_SECRET',
    'REFRESH_TOKEN_SECRET',
    'SESSION_SECRET',
    'MONGO_URL',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'FRONTEND_URL',
    'BACKEND_URL',
    'GOOGLE_CALLBACK_URL'
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.warn(`Advertencia: La variable de entorno ${envVar} no está definida en ${environment}`);
    }
  }
};

// Configuración base
const baseConfig = {
  env: environment,
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUrl: process.env.MONGO_URL || process.env.MONGODB_URI || `mongodb://mongodb-${environment}:27017/present`,
  jwtSecret: process.env.JWT_SECRET,
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
  apiUrl: process.env.BACKEND_URL,
  frontendUrl: process.env.FRONTEND_URL,
  corsOrigins: process.env.CORS_ORIGINS ? 
    Array.from(new Set(process.env.CORS_ORIGINS.split(',').map(origin => origin.trim()))) : 
    Array.from(new Set([process.env.FRONTEND_URL, process.env.BACKEND_URL].filter(Boolean))),
  sessionSecret: process.env.SESSION_SECRET,
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL
  },
  isDev: environment === 'development'
};

// Cargar configuración según el ambiente
let config;

if (environment === 'development') {
  try {
    const devConfig = await import('./config.dev.js');
    config = devConfig.default;
  } catch (error) {
    console.warn('No se pudo cargar la configuración de desarrollo, usando configuración base:', error.message);
    config = baseConfig;
  }
} else if (environment === 'staging') {
  try {
    const stagingConfig = await import('./config.staging.js');
    config = stagingConfig.default;
  } catch (error) {
    console.warn('No se pudo cargar la configuración de staging, usando configuración base:', error.message);
    config = baseConfig;
  }
} else {
  validateRequiredEnvVars();
  config = baseConfig;
}

console.log(`Configuración de MongoDB en ${environment}:`, {
  url: config.mongoUrl,
  environment: config.env
});

console.log(`Configuración de URLs en ${environment}:`, {
  frontend: config.frontendUrl,
  backend: config.apiUrl,
  corsOrigins: config.corsOrigins
});

export default config;