import dotenv from 'dotenv';

dotenv.config();

// Configuración base para todos los ambientes
const baseConfig = {
  port: parseInt(process.env.PORT || '8080', 10),
  sessionSecret: process.env.SESSION_SECRET || 'fallback_session_secret',
  isDev: false,
  // Configuración de MercadoPago
  mercadopago: {
    clientId: process.env.MERCADOPAGO_CLIENT_ID,
    clientSecret: process.env.MERCADOPAGO_CLIENT_SECRET
  }
};

// Configuraciones específicas por ambiente
const configs = {
  development: {
    ...baseConfig,
    env: 'development',
    isDev: true,
    port: parseInt(process.env.PORT || '8080', 10),
    mongoUrl: 'mongodb://localhost:27017/present',
    frontendUrl: 'http://localhost:3000',
    backendUrl: 'http://localhost:8080',
    corsOrigins: ['http://localhost:3000'],
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl: 'http://localhost:8080/api/auth/google/callback'
    }
  },
  staging: {
    ...baseConfig,
    env: 'staging',
    mongoUrl: 'mongodb://admin:MiContraseñaSegura123@mongodb:27017/present?authSource=admin',
    frontendUrl: 'https://staging.present.attadia.com',
    backendUrl: 'https://api.staging.present.attadia.com',
    corsOrigins: ['https://staging.present.attadia.com'],
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl: 'https://api.staging.present.attadia.com/api/auth/google/callback'
    }
  },
  production: {
    ...baseConfig,
    env: 'production',
    mongoUrl: 'mongodb://admin:MiContraseñaSegura123@mongodb:27017/present?authSource=admin',
    frontendUrl: 'https://admin.attadia.com',
    backendUrl: 'https://api.admin.attadia.com',
    corsOrigins: ['https://admin.attadia.com'],
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl: 'https://api.admin.attadia.com/api/auth/google/callback'
    }
  }
};

// Exportar la configuración según el ambiente
const env = process.env.NODE_ENV || 'development';
export default configs[env] || configs.development; 