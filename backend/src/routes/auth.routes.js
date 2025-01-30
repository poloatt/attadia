import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';
import { authController } from '../controllers/authController.js';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

const router = express.Router();
const prisma = new PrismaClient();

// Configuración de Passport Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Buscar o crear usuario
      const user = await prisma.user.upsert({
        where: { email: profile.emails[0].value },
        update: {
          name: profile.displayName,
          googleId: profile.id
        },
        create: {
          email: profile.emails[0].value,
          name: profile.displayName,
          googleId: profile.id,
          password: '' // Password vacío para usuarios de Google
        }
      });
      
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }
));

// Ruta de login (no necesita authMiddleware)
router.post('/login', authController.login);

// Ruta de registro
router.post('/register', authController.register);

// Ruta protegida de ejemplo (usa authMiddleware)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true
      }
    });
    res.json({ user });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Ruta para iniciar autenticación con Google
router.get('/google',
  (req, res, next) => {
    console.log('Iniciando autenticación Google'); // Para debugging
    next();
  },
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account',
    accessType: 'offline'
  })
);

// Callback URL para Google
router.get('/google/callback',
  (req, res, next) => {
    console.log('Callback de Google recibido'); // Para debugging
    next();
  },
  passport.authenticate('google', { 
    failureRedirect: '/login?error=google_auth_failed',
    session: false 
  }),
  authController.googleCallback
);

export default router; 