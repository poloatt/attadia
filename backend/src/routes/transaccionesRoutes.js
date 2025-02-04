import express from 'express';
import { transaccionesController } from '../controllers/transaccionesController.js';
import { checkAuth, checkRole } from '../middleware/auth.js';
import { checkOwnership } from '../middleware/checkOwnership.js';
import { Transacciones } from '../models/index.js';

const router = express.Router();

router.use(checkAuth);

// Rutas para usuarios autenticados
router.route('/')
  .get(transaccionesController.getAll)
  .post(transaccionesController.create);

router.get('/stats', transaccionesController.getStats);

// Rutas que requieren ser dueño del recurso o admin
router.route('/:id')
  .get([checkOwnership(Transacciones)], transaccionesController.getById)
  .put([checkOwnership(Transacciones)], transaccionesController.update)
  .delete([checkOwnership(Transacciones)], transaccionesController.delete);

// Rutas administrativas
router.get('/admin/all', checkRole(['ADMIN']), transaccionesController.getAllAdmin);
router.get('/admin/stats', checkRole(['ADMIN']), transaccionesController.getAdminStats);

export default router; 