import express from 'express';
import { cuentasController } from '../controllers/cuentasController.js';
import { checkAuth } from '../middleware/auth.js';
import { checkRole } from '../middleware/checkRole.js';
import { checkOwnership } from '../middleware/checkOwnership.js';
import { Cuentas } from '../models/index.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(checkAuth);

router.route('/')
  .get(cuentasController.getAll)
  .post(cuentasController.create);

router.route('/:id')
  .get([checkOwnership(Cuentas)], cuentasController.getById)
  .put([checkOwnership(Cuentas)], cuentasController.update)
  .delete([checkOwnership(Cuentas)], cuentasController.delete);

// Rutas admin
router.get('/admin/all', [checkRole([ROLES.ADMIN])], cuentasController.getAllAdmin);
router.get('/admin/stats', [checkRole([ROLES.ADMIN])], cuentasController.getAdminStats);

export default router; 