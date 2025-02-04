import express from 'express';
import { inquilinosController } from '../controllers/inquilinosController.js';
import { checkAuth } from '../middleware/auth.js';
import { checkRole, ROLES } from '../middleware/checkRole.js';
import { checkOwnership } from '../middleware/checkOwnership.js';
import { Inquilinos } from '../models/index.js';

const router = express.Router();

router.use(checkAuth);

// Rutas para usuarios autenticados
router.get('/', inquilinosController.getAll);
router.post('/', inquilinosController.create);

// Rutas que requieren ser dueño del recurso o admin
router.get('/:id', [checkOwnership(Inquilinos)], inquilinosController.getById);
router.put('/:id', [checkOwnership(Inquilinos)], inquilinosController.update);
router.delete('/:id', [checkOwnership(Inquilinos)], inquilinosController.delete);

// Rutas administrativas
router.get('/admin/all', [checkRole([ROLES.ADMIN])], inquilinosController.getAllAdmin);
router.get('/admin/stats', [checkRole([ROLES.ADMIN])], inquilinosController.getAdminStats);
router.put('/admin/:id/status', [checkRole([ROLES.ADMIN])], inquilinosController.updateStatus);

export default router; 