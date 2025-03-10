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
    'MONGODB_URI',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'FRONTEND_URL',
    'BACKEND_URL',
    'GOOGLE_CALLBACK_URL'
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`La variable de entorno ${envVar} es requerida en ${environment}`);
    }
  }
};

// Configuración base
const baseConfig = {
  env: environment,
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUrl: process.env.MONGODB_URI || `mongodb://mongodb-${environment}:27017/present`,
  jwtSecret: process.env.JWT_SECRET,
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
  apiUrl: process.env.BACKEND_URL,
  frontendUrl: process.env.FRONTEND_URL,
  corsOrigins: [
    process.env.FRONTEND_URL,
    process.env.BACKEND_URL
  ].filter(Boolean),
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
  const devConfig = await import('./config.dev.js');
  config = devConfig.default;
} else {
  validateRequiredEnvVars();
  config = baseConfig;

  console.log(`Configuración de MongoDB en ${environment}:`, {
    url: config.mongoUrl,
    environment: config.env
  });

  console.log(`Configuración de URLs en ${environment}:`, {
    frontend: config.frontendUrl,
    backend: config.apiUrl,
    corsOrigins: config.corsOrigins
  });
}

export default config;