import dotenv from 'dotenv';

dotenv.config({ path: '.env.staging' });

const config = {
  env: 'staging',
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUrl: process.env.MONGODB_URI || 'mongodb://mongodb-staging:27017/present-staging',
  jwtSecret: process.env.JWT_SECRET || 'staging-secret-key',
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'staging-refresh-secret',
  apiUrl: process.env.BACKEND_URL || 'http://localhost:5001',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:8080',
  corsOrigins: ['http://localhost:8080'],
  sessionSecret: process.env.SESSION_SECRET || 'staging-session-secret',
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5001/api/auth/google/callback'
  },
  isDev: true
};

export default config; 