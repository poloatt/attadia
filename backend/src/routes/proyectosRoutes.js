import express from 'express';
import { proyectosController } from '../controllers/proyectosController.js';
import { checkAuth } from '../middleware/auth.js';
import { checkRole } from '../middleware/checkRole.js';
import { checkOwnership } from '../middleware/checkOwnership.js';
import { Proyectos } from '../models/index.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(checkAuth);

router.get('/', proyectosController.getAll);
router.post('/', proyectosController.create);

// Rutas administrativas
router.get('/admin/all', [checkRole([ROLES.ADMIN])], proyectosController.getAllAdmin);
router.get('/admin/stats', [checkRole([ROLES.ADMIN])], proyectosController.getAdminStats);

// Rutas que requieren ser dueño del recurso
router.get('/:id', [checkOwnership(Proyectos)], proyectosController.getById);
router.put('/:id', [checkOwnership(Proyectos)], proyectosController.update);
router.delete('/:id', [checkOwnership(Proyectos)], proyectosController.delete);

export default router; 