import express from 'express';
import { proyectosController } from '../controllers/proyectosController.js';
import { checkAuth } from '../middleware/auth.js';
import { checkRole } from '../middleware/checkRole.js';
import { checkOwnership } from '../middleware/checkOwnership.js';
import { Proyectos } from '../models/index.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

// Middleware de autenticación para todas las rutas
router.use(checkAuth);

// Rutas administrativas (solo admin)
router.get('/admin/all', [checkRole([ROLES.ADMIN])], proyectosController.getAllAdmin);
router.get('/admin/stats', [checkRole([ROLES.ADMIN])], proyectosController.getAdminStats);

// Rutas base CRUD con validación de propiedad
router.route('/')
  .get(proyectosController.getAll)
  .post(proyectosController.create);

router.route('/:id')
  .get([checkOwnership(Proyectos)], proyectosController.getById)
  .put([checkOwnership(Proyectos)], proyectosController.update)
  .delete([checkOwnership(Proyectos)], proyectosController.delete);

// Rutas para tareas dentro de proyectos (requieren ser dueño del proyecto)
router.route('/:id/tareas')
  .get([checkOwnership(Proyectos)], proyectosController.getTareasByProyecto)
  .post([checkOwnership(Proyectos)], proyectosController.addTareaToProyecto);

export default router; 