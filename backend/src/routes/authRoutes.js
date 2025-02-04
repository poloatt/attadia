import express from 'express';
import { authController } from '../controllers/authController.js';
import { checkAuth } from '../middleware/auth.js';
import { check } from 'express-validator';
import { validateFields } from '../middleware/validateFields.js';

const router = express.Router();

// Rutas públicas
router.post('/register', [
  check('nombre', 'El nombre es obligatorio').not().isEmpty(),
  check('email', 'Incluye un email válido').isEmail(),
  check('password', 'La contraseña debe tener al menos 6 caracteres').isLength({ min: 6 }),
  validateFields
], authController.register);

router.post('/login', [
  check('email', 'Incluye un email válido').isEmail(),
  check('password', 'La contraseña es obligatoria').exists(),
  validateFields
], authController.login);

// Rutas que requieren autenticación
router.use(checkAuth);
router.post('/logout', authController.logout);

export default router;