import express from 'express';
import { habitacionesController } from '../controllers/habitacionesController.js';
import { checkAuth } from '../middleware/auth.js';
import { checkRole, ROLES } from '../middleware/checkRole.js';
import { checkOwnership } from '../middleware/checkOwnership.js';
import { Habitaciones } from '../models/index.js';

const router = express.Router();

router.use(checkAuth);

// Rutas para usuarios autenticados
router.get('/propiedad/:propiedadId', habitacionesController.getAllByPropiedad);
router.post('/', habitacionesController.create);

// Rutas que requieren ser dueño del recurso o admin
router.get('/:id', [checkOwnership(Habitaciones)], habitacionesController.getById);
router.put('/:id', [checkOwnership(Habitaciones)], habitacionesController.update);
router.delete('/:id', [checkOwnership(Habitaciones)], habitacionesController.delete);

// Rutas administrativas
router.get('/admin/all', [checkRole([ROLES.ADMIN])], habitacionesController.getAllAdmin);
router.put('/admin/:id/status', [checkRole([ROLES.ADMIN])], habitacionesController.updateStatus);

export default router; 