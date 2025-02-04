import express from 'express';
import { objetivosController } from '../controllers/objetivosController.js';
import { checkAuth } from '../middleware/auth.js';
import { checkRole, ROLES } from '../middleware/checkRole.js';
import { checkOwnership } from '../middleware/checkOwnership.js';
import { Objetivos } from '../models/index.js';

const router = express.Router();

router.use(checkAuth);

// Rutas para usuarios autenticados
router.get('/', objetivosController.getAll);
router.post('/', objetivosController.create);

// Rutas administrativas
router.get('/admin/all', [checkRole([ROLES.ADMIN])], objetivosController.getAllAdmin);
router.get('/admin/stats', [checkRole([ROLES.ADMIN])], objetivosController.getAdminStats);

// Rutas de estadísticas
router.get('/stats', objetivosController.getStats);

// Rutas que requieren ser dueño del recurso
router.get('/:id', [checkOwnership(Objetivos)], objetivosController.getById);
router.put('/:id', [checkOwnership(Objetivos)], objetivosController.update);
router.delete('/:id', [checkOwnership(Objetivos)], objetivosController.delete);

export default router; 