import express from 'express';
import { authController } from '../controllers/authController.js';
import { checkAuth } from '../middleware/auth.js';
import { check } from 'express-validator';
import { validateFields } from '../middleware/validateFields.js';
import passport from 'passport';
import config from '../config/config.js';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Configurar rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // límite de 5 intentos por ventana
  message: { error: 'Demasiados intentos de inicio de sesión. Por favor, intente más tarde.' }
});

const generalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 100 // límite de 100 peticiones por hora
});

// Aplicar rate limiting general a todas las rutas
router.use(generalLimiter);

// Rutas públicas
router.post('/register', [
  check('nombre', 'El nombre es obligatorio').not().isEmpty(),
  check('email', 'Incluye un email válido').isEmail(),
  check('password', 'La contraseña debe tener al menos 6 caracteres').isLength({ min: 6 }),
  validateFields
], authController.register);

router.post('/login', [
  loginLimiter,
  check('email', 'Incluye un email válido').isEmail(),
  check('password', 'La contraseña es obligatoria').exists(),
  validateFields
], authController.login);

// Ruta para refrescar el token
router.post('/refresh-token', [
  check('refreshToken', 'El refresh token es requerido').not().isEmpty(),
  validateFields
], authController.refreshToken);

// Rutas de autenticación con Google
router.get('/google/url', (req, res) => {
  console.log('Configuración de Google:', {
    clientId: config.google.clientId,
    callbackUrl: config.google.callbackUrl
  });
  
  // Devolver la URL de autenticación de Google con el prefijo /api
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${config.google.clientId}&` +
    `redirect_uri=${encodeURIComponent(config.google.callbackUrl)}&` +
    `response_type=code&` +
    `scope=email profile&` +
    `access_type=offline&` +
    `prompt=consent`;
  
  console.log('URL de autenticación generada:', authUrl);
  res.json({ url: authUrl });
});

router.get('/google/callback',
  (req, res, next) => {
    console.log('Recibiendo callback de Google - Query:', req.query);
    console.log('URL completa:', req.protocol + '://' + req.get('host') + req.originalUrl);
    if (req.query.error) {
      console.error('Error recibido de Google:', req.query.error);
      return res.redirect(`${config.frontendUrl}/auth/error?error=${req.query.error}`);
    }
    next();
  },
  passport.authenticate('google', { 
    session: false,
    failureRedirect: `${config.frontendUrl}/auth/error`,
    failWithError: true
  }),
  (err, req, res, next) => {
    if (err) {
      console.error('Error en autenticación de Google:', err);
      const errorMessage = encodeURIComponent(err.message || 'auth_failed');
      return res.redirect(`${config.frontendUrl}/auth/error?error=${errorMessage}`);
    }
    next();
  },
  (req, res) => {
    try {
      if (!req.user) {
        console.error('No se recibió información del usuario');
        return res.redirect(`${config.frontendUrl}/auth/error?error=no_user_info`);
      }

      const token = jwt.sign(
        { 
          user: { 
            id: req.user._id,
            email: req.user.email // Añadimos más información al token
          } 
        },
        config.jwtSecret,
        { expiresIn: '24h' }
      );

      // Log de éxito
      console.log('Autenticación exitosa para:', req.user.email);
      res.redirect(`${config.frontendUrl}/auth/callback?token=${token}`);
    } catch (error) {
      console.error('Error en el callback:', error);
      res.redirect(`${config.frontendUrl}/auth/error?error=server_error`);
    }
  }
);

// Rutas que requieren autenticación
router.use(checkAuth);
router.get('/check', authController.check);
router.post('/logout', authController.logout);

export default router;