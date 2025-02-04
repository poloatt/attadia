import express from 'express';
import { tareasController } from '../controllers/tareasController.js';
import { checkAuth } from '../middleware/auth.js';
import { checkRole, ROLES } from '../middleware/checkRole.js';
import { checkOwnership } from '../middleware/checkOwnership.js';
import { Tareas } from '../models/index.js';

const router = express.Router();

router.use(checkAuth);

router.get('/', tareasController.getAll);
router.post('/', tareasController.create);

// Rutas administrativas
router.get('/admin/all', [checkRole([ROLES.ADMIN])], tareasController.getAllAdmin);
router.get('/admin/stats', [checkRole([ROLES.ADMIN])], tareasController.getAdminStats);

// Rutas específicas
router.get('/proyecto/:proyectoId', tareasController.getAllByProyecto);

// Rutas que requieren ser dueño del recurso
router.get('/:id', [checkOwnership(Tareas)], tareasController.getById);
router.put('/:id', [checkOwnership(Tareas)], tareasController.update);
router.delete('/:id', [checkOwnership(Tareas)], tareasController.delete);

export default router; 