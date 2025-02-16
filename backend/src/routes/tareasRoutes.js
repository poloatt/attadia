import express from 'express';
import { tareasController } from '../controllers/tareasController.js';
import { checkAuth } from '../middleware/auth.js';
import { checkRole } from '../middleware/checkRole.js';
import { checkOwnership } from '../middleware/checkOwnership.js';
import { Tareas } from '../models/index.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(checkAuth);

// Rutas base del controlador
router.get('/', tareasController.getAll);
router.post('/', tareasController.create);
router.get('/:id', tareasController.getById);
router.put('/:id', checkOwnership(Tareas), tareasController.update);
router.delete('/:id', checkOwnership(Tareas), tareasController.delete);

// Rutas específicas
router.get('/proyecto/:proyectoId', tareasController.getByProyecto);
router.patch('/:id/estado', checkOwnership(Tareas), tareasController.updateEstado);

// Rutas administrativas (solo admin)
router.get('/admin/all', [checkRole([ROLES.ADMIN])], tareasController.getAllAdmin);
router.get('/admin/stats', [checkRole([ROLES.ADMIN])], tareasController.getAdminStats);

// Rutas para subtareas (requieren ser dueño de la tarea)
router.route('/:id/subtareas')
  .post([checkOwnership(Tareas)], tareasController.addSubtarea)
  .patch([checkOwnership(Tareas)], tareasController.updateSubtareas);

router.delete('/:id/subtareas/:subtareaId', 
  [checkOwnership(Tareas)], 
  tareasController.removeSubtarea
);

export default router; 