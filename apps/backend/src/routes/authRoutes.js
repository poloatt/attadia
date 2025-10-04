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
    ? 'https://foco.attadia.com'
    : 'https://staging.present.attadia.com';
  
  const defaultBackendUrl = process.env.NODE_ENV === 'production'
    ? 'https://api.attadia.com'
    : 'https://api.staging.present.attadia.com';

  config = {
    env: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
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

// Configurar rate limiting optimizado para mejor UX
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20, // Aumentado para reducir false positives con Google OAuth
  message: { error: 'Demasiados intentos de inicio de sesión. Por favor, intente más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const realIp = req.headers['x-real-ip'] || 
                  req.headers['x-forwarded-for']?.split(',')[0] || 
                  req.ip;
    return realIp;
  },
  skipSuccessfulRequests: true,
  skipFailedRequests: false,
  skip: (req) => {
    // Skip rate limiting para rutas de Google OAuth callback
    return req.path.includes('/google/callback') || req.path.includes('/google/url');
  }
});

const generalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 200, // Aumentado para mejor UX
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const realIp = req.headers['x-real-ip'] || 
                  req.headers['x-forwarded-for']?.split(',')[0] || 
                  req.ip;
    return realIp;
  },
  skip: (req) => {
    // Skip para rutas críticas de autenticación
    return req.path.includes('/check') || req.path.includes('/google/');
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

// Cache para URL de Google (evitar regenerar constantemente)
let cachedGoogleUrl = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

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

  // Obtener origen del frontend para redirección correcta
  const origin = req.query.origin;
  
  if (!origin) {
    console.error('No se proporcionó origen en la petición Google Auth:', {
      query: req.query,
      headers: req.headers
    });
    return res.status(400).json({ 
      error: 'Origen requerido',
      details: 'Se debe proporcionar el parámetro origin'
    });
  }

  // Validar que el origen esté permitido usando la configuración dinámica
  let allowedOrigins = [];
  
  if (config.corsOrigins && Array.isArray(config.corsOrigins)) {
    allowedOrigins = config.corsOrigins;
  } else if (config.frontendUrls) {
    // Construir orígenes desde la configuración de múltiples apps
    allowedOrigins = Object.values(config.frontendUrls);
  } else {
    // Fallback a orígenes por defecto
    allowedOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'];
  }
  
  if (!allowedOrigins.includes(origin)) {
    console.error('Origen no permitido:', {
      origin,
      allowedOrigins,
      corsOrigins: config.corsOrigins,
      frontendUrls: config.frontendUrls
    });
    return res.status(400).json({ 
      error: 'Origen no autorizado',
      details: `El origen ${origin} no está permitido`,
      allowedOrigins
    });
  }

  // Guardar el origen en la sesión para usar en el callback
  if (!req.session) {
    req.session = {};
  }
  req.session.googleCallbackOrigin = origin;

  console.log(`🚀 Google Auth iniciado desde: ${origin}`);

  // Usar URL cacheada si está disponible y no ha expirado
  const now = Date.now();
  if (cachedGoogleUrl && (now - cacheTimestamp) < CACHE_DURATION) {
    return res.json({ url: cachedGoogleUrl });
  }

  // Determinar la URL de callback correcta según el origen
  const requestOrigin = req.headers.origin;
  let callbackUrl = config.google.callbackUrl;
  
  // Si hay múltiples URLs separadas por comas, seleccionar la correcta
  if (callbackUrl.includes(',')) {
    const callbackUrls = callbackUrl.split(',').map(url => url.trim());
    
    // Mapear orígenes a URLs de callback
    const originToCallback = {
      'https://foco.attadia.com': 'https://api.attadia.com/api/auth/google/callback',
      'https://atta.attadia.com': 'https://api.attadia.com/api/auth/google/callback',
      'https://pulso.attadia.com': 'https://api.attadia.com/api/auth/google/callback'
    };
    
    callbackUrl = originToCallback[requestOrigin] || callbackUrls[0];
  }

  // Solo loggear en staging/producción
  if (config.env !== 'development') {
    console.log('Generando nueva URL de Google OAuth para ambiente:', {
      env: config.env,
      clientId: config.google.clientId ? 'configurado' : 'no configurado',
      callbackUrl: callbackUrl,
      frontendUrl: config.frontendUrl,
      origin: requestOrigin
    });
  }

  const scopes = [
    'openid',
    'profile',
    'email'
  ];
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(config.google.clientId)}&` +
    `redirect_uri=${encodeURIComponent(callbackUrl)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scopes.join(' '))}&` +
    `access_type=offline&` +
    `prompt=consent`;
  
  // Cachear la URL generada
  cachedGoogleUrl = authUrl;
  cacheTimestamp = now;
  
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
      const callbackOrigin = req.session?.googleCallbackOrigin || config.frontendUrl;
      return res.redirect(`${callbackOrigin}/auth/callback?error=${encodeURIComponent(req.query.error)}`);
    }

    if (!req.query.code) {
      console.error('No se recibió código de autorización en ambiente:', {
        env: config.env,
        headers: req.headers
      });
      const callbackOrigin = req.session?.googleCallbackOrigin || config.frontendUrl;
      return res.redirect(`${callbackOrigin}/auth/callback?error=no_auth_code`);
    }

    passport.authenticate('google', { 
      session: false,
      failureMessage: true
    })(req, res, (err) => {
      if (err) {
        console.error('Error en passport authenticate:', err);
        const callbackOrigin = req.session?.googleCallbackOrigin || config.frontendUrl;
        return res.redirect(`${callbackOrigin}/auth/callback?error=auth_failed`);
      }
      next();
    });
  },
  authController.googleCallback
);

// Rutas que requieren autenticación
router.use(checkAuth);
router.post('/logout', authController.logout);

export default router;