import express from 'express';
import { habitacionesController } from '../controllers/habitacionesController.js';
import { checkAuth } from '../middleware/auth.js';
import { checkRole } from '../middleware/checkRole.js';
import { Habitaciones } from '../models/index.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(checkAuth);

// Rutas para usuarios autenticados
router.get('/', habitacionesController.getAll);
router.get('/propiedad/:propiedadId', habitacionesController.getAllByPropiedad);
router.post('/', habitacionesController.create);

// Rutas básicas que solo requieren autenticación
router.get('/:id', habitacionesController.getById);
router.put('/:id', habitacionesController.update);
router.delete('/:id', habitacionesController.delete);

// Rutas administrativas
router.get('/admin/all', [checkRole([ROLES.ADMIN])], habitacionesController.getAllAdmin);
router.put('/admin/:id/status', [checkRole([ROLES.ADMIN])], habitacionesController.updateStatus);

export default router; 