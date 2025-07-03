import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determinar el ambiente
const environment = process.env.NODE_ENV || 'development';
console.log('Ambiente detectado:', environment);

// Cargar el archivo .env correspondiente
const envPath = path.resolve(__dirname, '../../.env.' + environment);
console.log('Cargando configuración desde:', envPath);
dotenv.config({ path: envPath });

// Validar variables de entorno requeridas
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
    'GOOGLE_CALLBACK_URL',
    'CORS_ORIGINS'
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.warn(`Advertencia: La variable de entorno ${envVar} no está definida en ${environment}`);
    }
  }
};

// Configuración base para todos los ambientes
const baseConfig = {
  port: parseInt(process.env.PORT || '5000', 10),
  sessionSecret: process.env.SESSION_SECRET || 'fallback_session_secret',
  jwtSecret: process.env.JWT_SECRET || 'fallback_jwt_secret',
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'fallback_refresh_token_secret',
  isDev: false
};

// Configuraciones específicas por ambiente
const configs = {
  development: {
    ...baseConfig,
    env: 'development',
    isDev: true,
    mongoUrl: process.env.MONGO_URL || 'mongodb://localhost:27017/present',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    backendUrl: process.env.BACKEND_URL || 'http://localhost:5000',
    corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:5173'],
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'
    }
  },
  staging: {
    ...baseConfig,
    env: 'staging',
    mongoUrl: process.env.MONGO_URL || process.env.MONGODB_URI || `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@mongodb-staging:27017/${process.env.MONGO_DB}?authSource=admin`,
    frontendUrl: process.env.FRONTEND_URL,
    backendUrl: process.env.BACKEND_URL,
    corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [],
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl: process.env.GOOGLE_CALLBACK_URL
    }
  },
  production: {
    ...baseConfig,
    env: 'production',
    mongoUrl: process.env.MONGO_URL || process.env.MONGODB_URI || `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@mongodb:27017/${process.env.MONGO_DB}?authSource=admin`,
    frontendUrl: process.env.FRONTEND_URL,
    backendUrl: process.env.BACKEND_URL,
    corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['https://admin.attadia.com'],
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl: process.env.GOOGLE_CALLBACK_URL
    }
  }
};

// Validar variables de entorno
validateRequiredEnvVars();

// Exportar la configuración según el ambiente
export default configs[environment] || configs.development;