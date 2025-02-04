import express from 'express';
import { contratosController } from '../controllers/contratosController.js';
import { checkAuth } from '../middleware/auth.js';
import { checkRole, ROLES } from '../middleware/checkRole.js';
import { checkOwnership } from '../middleware/checkOwnership.js';
import { Contratos } from '../models/index.js';

const router = express.Router();

router.use(checkAuth);

// Rutas para usuarios autenticados
router.get('/', contratosController.getAll);
router.post('/', contratosController.create);

// Rutas que requieren ser dueño del recurso o admin
router.get('/:id', [checkOwnership(Contratos)], contratosController.getById);
router.put('/:id', [checkOwnership(Contratos)], contratosController.update);
router.delete('/:id', [checkOwnership(Contratos)], contratosController.delete);

// Rutas administrativas
router.get('/admin/all', [checkRole([ROLES.ADMIN])], contratosController.getAllAdmin);
router.put('/admin/:id/status', [checkRole([ROLES.ADMIN])], contratosController.updateStatus);
router.get('/admin/stats', [checkRole([ROLES.ADMIN])], contratosController.getAdminStats);

export default router; 