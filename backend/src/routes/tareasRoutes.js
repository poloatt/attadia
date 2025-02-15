import express from 'express';
import { tareasController } from '../controllers/tareasController.js';
import { checkAuth } from '../middleware/auth.js';
import { checkRole } from '../middleware/checkRole.js';
import { checkOwnership } from '../middleware/checkOwnership.js';
import { Tareas } from '../models/index.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

// Middleware de autenticación para todas las rutas
router.use(checkAuth);

// Rutas administrativas (solo admin)
router.get('/admin/all', [checkRole([ROLES.ADMIN])], tareasController.getAllAdmin);
router.get('/admin/stats', [checkRole([ROLES.ADMIN])], tareasController.getAdminStats);

// Rutas específicas por proyecto
router.get('/proyecto/:proyectoId', tareasController.getAllByProyecto);

// Rutas base CRUD con validación de propiedad
router.route('/')
  .get(tareasController.getAll)
  .post(tareasController.create);

// Rutas que requieren ser dueño del recurso
router.route('/:id')
  .get([checkOwnership(Tareas)], tareasController.getById)
  .put([checkOwnership(Tareas)], tareasController.update)
  .delete([checkOwnership(Tareas)], tareasController.delete);

// Rutas para subtareas (requieren ser dueño de la tarea)
router.route('/:id/subtareas')
  .post([checkOwnership(Tareas)], tareasController.addSubtarea)
  .patch([checkOwnership(Tareas)], tareasController.updateSubtareas);

router.delete('/:id/subtareas/:subtareaId', 
  [checkOwnership(Tareas)], 
  tareasController.removeSubtarea
);

export default router; 