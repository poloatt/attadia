import express from 'express';
import { propiedadesController } from '../controllers/propiedadesController.js';
import { checkAuth } from '../middleware/auth.js';
import { checkRole } from '../middleware/checkRole.js';
import { checkOwnership } from '../middleware/checkOwnership.js';
import { Propiedades } from '../models/index.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(checkAuth);

router.route('/')
  .get(propiedadesController.getAll)
  .post(propiedadesController.create);

router.get('/stats', propiedadesController.getStats);

router.route('/:id')
  .get([checkOwnership(Propiedades)], propiedadesController.getById)
  .put([checkOwnership(Propiedades)], propiedadesController.update)
  .delete([checkOwnership(Propiedades)], propiedadesController.delete);

// Rutas admin
router.get('/admin/all', [checkRole([ROLES.ADMIN])], propiedadesController.getAllAdmin);
router.put('/:id/status', [checkRole([ROLES.ADMIN])], propiedadesController.updateStatus);

export default router; 