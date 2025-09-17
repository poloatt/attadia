import express from 'express';
import { inquilinosController } from '../controllers/inquilinosController.js';
import { checkAuth } from '../middleware/auth.js';
import { checkRole } from '../middleware/checkRole.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(checkAuth);

// Rutas básicas que solo requieren autenticación
router.get('/', inquilinosController.getAll);
router.get('/activos', inquilinosController.getActivos);
router.post('/', inquilinosController.create);
router.get('/:id', inquilinosController.getById);
router.put('/:id', inquilinosController.update);
router.delete('/:id', inquilinosController.delete);

// Rutas de check-in y estado
router.post('/:id/check-in/:propiedadId', inquilinosController.checkIn);
router.get('/:id/full-info', inquilinosController.getFullInfo);
router.get('/estado/:estado', inquilinosController.getByEstado);

// Rutas por propiedad
router.get('/propiedad/:propiedadId', inquilinosController.getAllByPropiedad);
router.get('/propiedad/:propiedadId/activos', inquilinosController.getActivosByPropiedad);
router.get('/propiedad/:propiedadId/pendientes', inquilinosController.getPendientesByPropiedad);

// Rutas administrativas
router.get('/admin/stats', [checkRole([ROLES.ADMIN])], inquilinosController.getAdminStats);

export default router; 