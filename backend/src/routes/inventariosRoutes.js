import express from 'express';
import { inventariosController } from '../controllers/inventariosController.js';
import { checkAuth } from '../middleware/auth.js';
import { checkRole } from '../middleware/checkRole.js';
import { checkOwnership } from '../middleware/checkOwnership.js';
import { Inventarios } from '../models/index.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(checkAuth);

// Rutas para usuarios autenticados
router.route('/')
  .get(inventariosController.getAll)
  .post(inventariosController.create);

// Rutas que requieren ser dueño del recurso o admin
router.route('/:id')
  .get([checkOwnership(Inventarios)], inventariosController.getById)
  .put([checkOwnership(Inventarios)], inventariosController.update)
  .delete([checkOwnership(Inventarios)], inventariosController.delete);

// Rutas administrativas
router.get('/admin/all', [checkRole([ROLES.ADMIN])], inventariosController.getAllAdmin);
router.get('/admin/stats', [checkRole([ROLES.ADMIN])], inventariosController.getAdminStats);

export default router; 