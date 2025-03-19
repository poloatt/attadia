import express from 'express';
import { rutinasController } from '../controllers/rutinasController.js';
import { checkAuth } from '../middleware/auth.js';
import { checkRole } from '../middleware/checkRole.js';
import { checkOwnership } from '../middleware/checkOwnership.js';
import { Rutinas } from '../models/index.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(checkAuth);

// Ruta para verificar si existe una rutina para una fecha específica
router.get('/verify', rutinasController.verifyDate);

// Rutas CRUD estándar
router.post('/', rutinasController.create);
router.get('/', rutinasController.getAll);
router.get('/:id', rutinasController.getById);
router.put('/:id', checkOwnership(Rutinas), rutinasController.update);
router.delete('/:id', checkOwnership(Rutinas), rutinasController.delete);

// Rutas administrativas
router.get('/admin/all', [checkRole([ROLES.ADMIN])], rutinasController.getAllAdmin);
router.get('/admin/stats', [checkRole([ROLES.ADMIN])], rutinasController.getAdminStats);

export default router; 