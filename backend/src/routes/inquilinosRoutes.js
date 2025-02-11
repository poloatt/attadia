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

// Rutas administrativas
router.get('/admin/all', [checkRole([ROLES.ADMIN])], inquilinosController.getAllAdmin);
router.get('/admin/stats', [checkRole([ROLES.ADMIN])], inquilinosController.getAdminStats);
router.put('/admin/:id/status', [checkRole([ROLES.ADMIN])], inquilinosController.updateStatus);

export default router; 