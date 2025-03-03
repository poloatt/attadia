import express from 'express';
import { authController } from '../controllers/authController.js';
import { checkAuth } from '../middleware/auth.js';
import { check } from 'express-validator';
import { validateFields } from '../middleware/validateFields.js';
import passport from 'passport';
import rateLimit from 'express-rate-limit';

// Importar configuración según el entorno
const config = process.env.NODE_ENV === 'production' 
  ? (await import('../config/config.js')).default
  : (await import('../config/config.dev.js')).default;

const router = express.Router();

// Configurar rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // límite de 5 intentos por ventana
  message: { error: 'Demasiados intentos de inicio de sesión. Por favor, intente más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const realIp = req.headers['x-real-ip'] || 
                  req.headers['x-forwarded-for']?.split(',')[0] || 
                  req.ip;
    return realIp;
  }
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
    console.error('Google OAuth no está configurado correctamente');
    return res.status(500).json({ 
      error: 'Autenticación con Google no disponible',
      details: 'Configuración incompleta'
    });
  }

  console.log('Configuración de Google OAuth:', {
    clientId: config.google.clientId ? 'configurado' : 'no configurado',
    callbackUrl: config.google.callbackUrl,
    environment: config.env,
    frontendUrl: config.frontendUrl
  });

  const scopes = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email'
  ];
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(config.google.clientId)}&` +
    `redirect_uri=${encodeURIComponent(config.google.callbackUrl)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scopes.join(' '))}&` +
    `access_type=offline&` +
    `prompt=consent`;
  
  console.log('URL de autenticación generada:', {
    clientId: config.google.clientId ? 'configurado' : 'no configurado',
    redirectUri: config.google.callbackUrl,
    scopes,
    fullUrl: authUrl
  });
  
  res.json({ url: authUrl });
});

router.get('/google/callback',
  (req, res, next) => {
    console.log('Callback de Google recibido:', {
      error: req.query.error,
      code: req.query.code ? 'presente' : 'ausente',
      state: req.query.state,
      query: req.query,
      headers: req.headers,
      url: req.url,
      baseUrl: req.baseUrl,
      originalUrl: req.originalUrl
    });

    if (req.query.error) {
      console.error('Error en autenticación de Google:', req.query.error);
      return res.redirect(`${config.frontendUrl}/auth/error?message=${encodeURIComponent(req.query.error)}`);
    }

    passport.authenticate('google', { 
      session: false,
      failureRedirect: `${config.frontendUrl}/auth/error?message=auth_failed`
    }, (err, user, info) => {
      if (err) {
        console.error('Error en autenticación de Google:', err);
        return res.redirect(`${config.frontendUrl}/auth/error?message=server_error`);
      }

      if (!user) {
        console.error('No se recibió usuario de Google:', info);
        return res.redirect(`${config.frontendUrl}/auth/error?message=auth_failed`);
      }

      req.user = user;
      next();
    })(req, res, next);
  },
  authController.googleCallback
);

// Rutas que requieren autenticación
router.use(checkAuth);
router.post('/logout', authController.logout);

export default router;