import dotenv from 'dotenv';

// Cargar el archivo .env correspondiente
const isStaging = process.env.ENVIRONMENT === 'staging';
dotenv.config({ path: isStaging ? '.env.staging' : '.env.production' });

const config = {
  env: process.env.ENVIRONMENT || 'production',
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUrl: process.env.MONGODB_URI,
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
  isDev: false,
  isStaging
};

// Validación de configuración crítica
const requiredEnvVars = [
  'JWT_SECRET',
  'REFRESH_TOKEN_SECRET',
  'SESSION_SECRET',
  'MONGODB_URI',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'FRONTEND_URL',
  'BACKEND_URL'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`La variable de entorno ${envVar} es requerida en ${config.env}`);
  }
}

console.log(`Configuración de MongoDB en ${config.env}:`, {
  url: config.mongoUrl,
  environment: config.env,
  isStaging: config.isStaging
});

console.log(`Configuración de URLs en ${config.env}:`, {
  frontend: config.frontendUrl,
  backend: config.apiUrl,
  corsOrigins: config.corsOrigins
});

export default config; 