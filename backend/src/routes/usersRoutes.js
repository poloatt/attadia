import express from 'express';
import { usersController } from '../controllers/usersController.js';
import { checkAuth } from '../middleware/auth.js';
import { checkRole } from '../middleware/checkRole.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(checkAuth);

// Rutas públicas para usuarios autenticados
router.get('/profile', usersController.getProfile);
router.put('/profile', usersController.updateProfile);
router.put('/password', usersController.changePassword);
router.put('/preferences', usersController.updatePreferences);

// Rutas solo para administradores
router.get('/all', [checkRole([ROLES.ADMIN])], usersController.getAllUsers);
router.put('/:id/role', [checkRole([ROLES.ADMIN])], usersController.updateUserRole);
router.put('/:id/status', [checkRole([ROLES.ADMIN])], usersController.updateUserStatus);

export default router; 