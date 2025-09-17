import express from 'express';
import { subtareasController } from '../controllers/subtareasController.js';
import { checkAuth } from '../middleware/auth.js';
import { checkRole } from '../middleware/checkRole.js';
import { checkOwnership } from '../middleware/checkOwnership.js';
import { Subtareas } from '../models/index.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(checkAuth);

// Rutas administrativas
router.get('/admin/all', [checkRole([ROLES.ADMIN])], subtareasController.getAllAdmin);

// Rutas específicas
router.get('/tarea/:tareaId', subtareasController.getAllByTarea);
router.post('/', subtareasController.create);

// Rutas que requieren ser dueño del recurso
router.get('/:id', [checkOwnership(Subtareas)], subtareasController.getById);
router.put('/:id', [checkOwnership(Subtareas)], subtareasController.update);
router.delete('/:id', [checkOwnership(Subtareas)], subtareasController.delete);
router.patch('/:id/toggle', [checkOwnership(Subtareas)], subtareasController.toggleCompletada);

export default router; 