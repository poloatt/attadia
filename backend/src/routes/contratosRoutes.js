import express from 'express';
import { contratosController } from '../controllers/contratosController.js';
import { checkAuth } from '../middleware/auth.js';
import { checkRole } from '../middleware/checkRole.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(checkAuth);

// Rutas básicas que solo requieren autenticación
router.get('/', contratosController.getAll);
router.get('/activos', contratosController.getActivos);
router.post('/', contratosController.create);
router.get('/:id', contratosController.getById);
router.put('/:id', contratosController.update);
router.delete('/:id', contratosController.delete);
router.get('/propiedad/:propiedadId', contratosController.getAllByPropiedad);

// Rutas administrativas
router.get('/admin/all', [checkRole([ROLES.ADMIN])], contratosController.getAllAdmin);
router.get('/admin/stats', [checkRole([ROLES.ADMIN])], contratosController.getAdminStats);
router.put('/admin/:id/status', [checkRole([ROLES.ADMIN])], contratosController.updateStatus);

export default router;