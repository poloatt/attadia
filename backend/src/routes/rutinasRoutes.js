import express from 'express';
import { rutinasController } from '../controllers/rutinasController.js';
import { checkAuth } from '../middleware/auth.js';
import { checkRole, ROLES } from '../middleware/checkRole.js';
import { checkOwnership } from '../middleware/checkOwnership.js';
import { Rutinas } from '../models/index.js';

const router = express.Router();

router.use(checkAuth);

// Rutas para usuarios autenticados
router.get('/', rutinasController.getAll);
router.post('/', rutinasController.create);
router.get('/:id', rutinasController.getById);
router.put('/:id', rutinasController.update);
router.delete('/:id', rutinasController.delete);

// Rutas administrativas
router.get('/admin/all', [checkRole([ROLES.ADMIN])], rutinasController.getAllAdmin);
router.get('/admin/stats', [checkRole([ROLES.ADMIN])], rutinasController.getAdminStats);

// Rutas que requieren ser dueño del recurso
router.get('/:id', [checkOwnership(Rutinas)], rutinasController.getById);
router.put('/:id', [checkOwnership(Rutinas)], rutinasController.update);
router.delete('/:id', [checkOwnership(Rutinas)], rutinasController.delete);

export default router; 