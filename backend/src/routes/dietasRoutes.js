import express from 'express';
import { dietasController } from '../controllers/dietasController.js';
import { checkAuth } from '../middleware/auth.js';
import { checkRole, ROLES } from '../middleware/checkRole.js';
import { checkOwnership } from '../middleware/checkOwnership.js';
import { Dietas } from '../models/index.js';

const router = express.Router();

router.use(checkAuth);

// Rutas para usuarios autenticados
router.get('/', dietasController.getAll);
router.post('/', dietasController.create);

// Rutas administrativas
router.get('/admin/all', [checkRole([ROLES.ADMIN])], dietasController.getAllAdmin);
router.get('/admin/stats', [checkRole([ROLES.ADMIN])], dietasController.getAdminStats);

// Rutas que requieren ser dueño del recurso
router.get('/:id', [checkOwnership(Dietas)], dietasController.getById);
router.put('/:id', [checkOwnership(Dietas)], dietasController.update);
router.delete('/:id', [checkOwnership(Dietas)], dietasController.delete);

export default router; 