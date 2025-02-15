import express from 'express';
import { authController } from '../controllers/authController.js';
import { checkAuth } from '../middleware/auth.js';
import { check } from 'express-validator';
import { validateFields } from '../middleware/validateFields.js';
import passport from 'passport';
import config from '../config/config.js';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { passportConfig } from '../config/passport.js';

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
router.get('/check', (req, res, next) => {
  passportConfig.authenticate('jwt', { session: false }, (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Error en la autenticación' });
    }
    if (!user) {
      return res.status(200).json({ authenticated: false });
    }
    req.user = user;
    next();
  })(req, res, next);
}, authController.check);

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
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email'
  ].join(' ');
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${config.google.clientId}&` +
    `redirect_uri=${encodeURIComponent(config.google.callbackUrl)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scopes)}&` +
    `access_type=offline&` +
    `prompt=consent`;
  
  res.json({ url: authUrl });
});

router.get('/google/callback',
  (req, res, next) => {
    if (req.query.error) {
      return res.redirect(`${config.frontendUrl}/login?error=${req.query.error}`);
    }
    next();
  },
  passport.authenticate('google', { 
    session: false,
    failureRedirect: `${config.frontendUrl}/login`,
    failWithError: true
  }),
  (req, res) => {
    try {
      if (!req.user) {
        return res.redirect(`${config.frontendUrl}/login?error=no_user_info`);
      }

      const token = jwt.sign(
        { 
          user: { 
            id: req.user._id,
            email: req.user.email,
            nombre: req.user.nombre
          } 
        },
        config.jwtSecret,
        { expiresIn: '24h' }
      );
      
      const redirectUrl = `${config.frontendUrl}/auth/callback?token=${token}`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Error en el callback:', error);
      res.redirect(`${config.frontendUrl}/login?error=server_error`);
    }
  }
);

// Rutas que requieren autenticación
router.use(checkAuth);
router.post('/logout', authController.logout);

export default router;