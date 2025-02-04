import express from 'express';
import { propiedadesController } from '../controllers/propiedadesController.js';
import { checkAuth, checkRole } from '../middleware/auth.js';
import { checkOwnership } from '../middleware/checkOwnership.js';
import { Propiedades } from '../models/index.js';

const router = express.Router();

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
router.get('/admin/all', checkRole(['ADMIN']), propiedadesController.getAllAdmin);
router.put('/:id/status', checkRole(['ADMIN']), propiedadesController.updateStatus);

export default router; 