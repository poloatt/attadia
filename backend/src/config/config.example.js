import dotenv from 'dotenv';

dotenv.config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUrl: process.env.MONGODB_URI || 'mongodb://mongodb:27017/present',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-development-only',
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret-development-only',
  apiUrl: process.env.API_URL || process.env.BACKEND_URL || 'https://api.present.attadia.com',
  frontendUrl: process.env.FRONTEND_URL || 'https://present.attadia.com',
  corsOrigins: ['https://present.attadia.com', 'http://localhost:5173'],
  sessionSecret: process.env.SESSION_SECRET || 'session-secret-development-only',
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'https://api.present.attadia.com/api/auth/google/callback'
  },
  isDev: process.env.NODE_ENV !== 'production'
};

// Validación de configuración crítica en producción
if (config.env === 'production') {
  const requiredEnvVars = [
    'JWT_SECRET',
    'REFRESH_TOKEN_SECRET',
    'SESSION_SECRET',
    'MONGODB_URI',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET'
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`La variable de entorno ${envVar} es requerida en producción`);
    }
  }
}

export default config; 