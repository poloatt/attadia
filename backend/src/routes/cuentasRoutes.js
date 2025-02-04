import express from 'express';
import { cuentasController } from '../controllers/cuentasController.js';
import { checkAuth, checkRole } from '../middleware/auth.js';
import { checkOwnership } from '../middleware/checkOwnership.js';
import { Cuentas } from '../models/index.js';

const router = express.Router();

router.use(checkAuth);

router.route('/')
  .get(cuentasController.getAll)
  .post(cuentasController.create);

router.route('/:id')
  .get([checkOwnership(Cuentas)], cuentasController.getById)
  .put([checkOwnership(Cuentas)], cuentasController.update)
  .delete([checkOwnership(Cuentas)], cuentasController.delete);

// Rutas admin
router.get('/admin/all', checkRole(['ADMIN']), cuentasController.getAllAdmin);
router.get('/admin/stats', checkRole(['ADMIN']), cuentasController.getAdminStats);

export default router; 