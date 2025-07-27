import express from 'express';
import { usersController } from '../controllers/usersController.js';
import { checkRole } from '../middleware/checkRole.js';
import { ROLES } from '../config/constants.js';
import { checkAuth } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(checkAuth);

// Rutinas config - estas rutas deben ir ANTES de las rutas con parámetros (:id)
router.get('/rutinas-config', checkAuth, usersController.getDefaultRutinaConfig);
router.put('/rutinas-config', checkAuth, usersController.updateDefaultRutinaConfig);

// Rutas para preferencias de hábitos
router.get('/preferences/habits', checkAuth, usersController.getHabitPreferences);
router.put('/preferences/habits', checkAuth, usersController.updateHabitPreferences);

// Rutas para administración de usuarios (solo para administradores)
router.get('/', checkRole([ROLES.ADMIN]), usersController.getAll);
router.post('/', checkRole([ROLES.ADMIN]), usersController.create);
router.get('/:id', checkRole([ROLES.ADMIN]), usersController.getById);
router.put('/:id', checkRole([ROLES.ADMIN]), usersController.update);
router.delete('/:id', checkRole([ROLES.ADMIN]), usersController.delete);
router.patch('/:id/toggle-active', checkRole([ROLES.ADMIN]), usersController.toggleActive);

// Rutas para usuarios normales (perfil)
router.get('/profile/me', usersController.getProfile);
router.put('/profile/me', usersController.updateProfile);
router.delete('/profile/me', usersController.deleteAccount);
router.patch('/profile/preferences', usersController.updatePreferences);

// Esta ruta debe ir después de las rutas con /profile y otras subrutas 
// para evitar conflictos en el enrutamiento
// router.get('/:id', usersController.getById);

export default router; 