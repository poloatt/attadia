import express from 'express';
import { objetivosController } from '../controllers/objetivosController.js';
import { checkAuth } from '../middleware/auth.js';
import { checkRole } from '../middleware/checkRole.js';
import { checkOwnership } from '../middleware/checkOwnership.js';
import { Objetivos } from '../models/index.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(checkAuth);

router.get('/admin/all', [checkRole([ROLES.ADMIN])], objetivosController.getAllAdmin);
router.get('/admin/stats', [checkRole([ROLES.ADMIN])], objetivosController.getAdminStats);

router.route('/')
  .get(objetivosController.getAll)
  .post(objetivosController.create);

router.route('/:id')
  .get([checkOwnership(Objetivos)], objetivosController.getById)
  .put([checkOwnership(Objetivos)], objetivosController.update)
  .delete([checkOwnership(Objetivos)], objetivosController.delete);

router.route('/:id/tareas')
  .get([checkOwnership(Objetivos)], objetivosController.getTareasByObjetivo)
  .post([checkOwnership(Objetivos)], objetivosController.addTareaToObjetivo);

export default router;
