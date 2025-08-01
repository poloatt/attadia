import express from 'express';
import { authController } from '../controllers/authController.js';
import { checkAuth } from '../middleware/auth.js';
import { check } from 'express-validator';
import { validateFields } from '../middleware/validateFields.js';
import passport from 'passport';
import rateLimit from 'express-rate-limit';

// Importar configuración según el entorno
let config;
try {
  // Cargar directamente desde config.js para asegurar consistencia
  config = (await import('../config/config.js')).default;
} catch (error) {
  console.error('Error al cargar la configuración en authRoutes, usando configuración básica:', error.message);
  // Configuración básica por defecto
  const defaultFrontendUrl = process.env.NODE_ENV === 'production' 
    ? 'https://present.attadia.com'
    : 'https://staging.present.attadia.com';
  
  const defaultBackendUrl = process.env.NODE_ENV === 'production'
    ? 'https://api.admin.attadia.com'
    : 'https://api.staging.present.attadia.com';

  config = {
    env: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || defaultFrontendUrl,
    backendUrl: process.env.BACKEND_URL || defaultBackendUrl,
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl: process.env.GOOGLE_CALLBACK_URL || `${defaultBackendUrl}/api/auth/google/callback`
    }
  };
}

// Solo loggear en staging/producción
if (config.env !== 'development') {
  console.log('Configuración de autenticación cargada:', {
    env: config.env,
    frontendUrl: config.frontendUrl,
    backendUrl: config.apiUrl || config.backendUrl,
    googleCallbackUrl: config.google.callbackUrl
  });
}

const router = express.Router();

// Configurar rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // límite de 10 intentos por ventana (aumentado de 5)
  message: { error: 'Demasiados intentos de inicio de sesión. Por favor, intente más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const realIp = req.headers['x-real-ip'] || 
                  req.headers['x-forwarded-for']?.split(',')[0] || 
                  req.ip;
    return realIp;
  },
  skipSuccessfulRequests: true, // No contar requests exitosos
  skipFailedRequests: false // Contar requests fallidos
});

const generalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 100, // límite de 100 peticiones por hora
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const realIp = req.headers['x-real-ip'] || 
                  req.headers['x-forwarded-for']?.split(',')[0] || 
                  req.ip;
    return realIp;
  }
});

// Aplicar rate limiting general a todas las rutas
router.use(generalLimiter);

// Rutas públicas
router.get('/check', checkAuth, authController.check);

router.post('/register', [
  check('nombre', 'El nombre es obligatorio').not().isEmpty(),
  check('email', 'Incluye un email válido').isEmail(),
  check('password', 'La contraseña debe tener al menos 6 caracteres').isLength({ min: 6 }),
  validateFields
], authController.register);

router.post('/login', loginLimiter, [
  check('email', 'El email es obligatorio').isEmail(),
  check('password', 'La contraseña es obligatoria').not().isEmpty(),
  validateFields
], authController.login);

// Ruta para refrescar el token
router.post('/refresh-token', [
  check('refreshToken', 'El refresh token es requerido').not().isEmpty(),
  validateFields
], authController.refreshToken);

// Rutas de autenticación con Google
router.get('/google/url', (req, res) => {
  if (!config.google.clientId || !config.google.clientSecret) {
    console.error('Google OAuth no está configurado correctamente para el ambiente:', config.env);
    return res.status(500).json({ 
      error: 'Autenticación con Google no disponible',
      details: 'Configuración incompleta',
      env: config.env
    });
  }

  // Solo loggear en staging/producción
  if (config.env !== 'development') {
    console.log('Configuración de Google OAuth para ambiente:', {
      env: config.env,
      clientId: config.google.clientId ? 'configurado' : 'no configurado',
      callbackUrl: config.google.callbackUrl,
      frontendUrl: config.frontendUrl
    });
  }

  const scopes = [
    'openid',
    'profile',
    'email'
  ];
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(config.google.clientId)}&` +
    `redirect_uri=${encodeURIComponent(config.google.callbackUrl)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scopes.join(' '))}&` +
    `access_type=offline&` +
    `prompt=consent`;
  
  // Solo loggear en staging/producción
  if (config.env !== 'development') {
    console.log('URL de autenticación generada:', {
      env: config.env,
      redirectUri: config.google.callbackUrl,
      scopes
    });
  }
  
  res.json({ url: authUrl });
});

router.get('/google/callback',
  (req, res, next) => {
    console.log('Callback de Google recibido en ambiente:', {
      env: config.env,
      error: req.query.error,
      code: req.query.code ? 'presente' : 'ausente',
      query: req.query,
      headers: {
        host: req.headers.host,
        origin: req.headers.origin,
        referer: req.headers.referer,
        'user-agent': req.headers['user-agent'],
        cookie: req.headers.cookie ? 'presente' : 'ausente'
      }
    });

    if (req.query.error) {
      console.error('Error en autenticación de Google:', {
        env: config.env,
        error: req.query.error,
        error_description: req.query.error_description,
        error_uri: req.query.error_uri
      });
      return res.redirect(`${config.frontendUrl}/#/auth/callback?error=${encodeURIComponent(req.query.error)}`);
    }

    if (!req.query.code) {
      console.error('No se recibió código de autorización en ambiente:', {
        env: config.env,
        headers: req.headers
      });
      return res.redirect(`${config.frontendUrl}/#/auth/callback?error=no_auth_code`);
    }

    passport.authenticate('google', { 
      session: false,
      failureRedirect: `${config.frontendUrl}/#/auth/callback?error=auth_failed`,
      failureMessage: true
    })(req, res, next);
  },
  authController.googleCallback
);

// Rutas que requieren autenticación
router.use(checkAuth);
router.post('/logout', authController.logout);

export default router;