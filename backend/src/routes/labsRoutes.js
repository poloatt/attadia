import express from 'express';
import { labsController } from '../controllers/labsController.js';
import { checkAuth } from '../middleware/auth.js';
import { checkRole, ROLES } from '../middleware/checkRole.js';
import { checkOwnership } from '../middleware/checkOwnership.js';
import { Labs } from '../models/index.js';

const router = express.Router();

router.use(checkAuth);

router.get('/', labsController.getAll);
router.post('/', labsController.create);

// Rutas administrativas
router.get('/admin/all', [checkRole([ROLES.ADMIN])], labsController.getAllAdmin);
router.get('/admin/stats', [checkRole([ROLES.ADMIN])], labsController.getAdminStats);

// Rutas que requieren ser dueño del recurso
router.get('/:id', [checkOwnership(Labs)], labsController.getById);
router.put('/:id', [checkOwnership(Labs)], labsController.update);
router.delete('/:id', [checkOwnership(Labs)], labsController.delete);

export default router; 