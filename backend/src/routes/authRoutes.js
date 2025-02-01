import express from 'express';
import { authController } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Rutas públicas
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleCallback);

// Rutas protegidas
router.use(authMiddleware);
router.get('/me', authController.me);
router.post('/logout', authController.logout);

export default router; 