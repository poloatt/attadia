import express from 'express';
import { inventariosController } from '../controllers/inventariosController.js';
import { checkAuth } from '../middleware/auth.js';
import { checkRole } from '../middleware/checkRole.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(checkAuth);

// Rutas básicas que solo requieren autenticación
router.get('/', inventariosController.getAll);
router.post('/', inventariosController.create);
router.get('/:id', inventariosController.getById);
router.put('/:id', inventariosController.update);
router.delete('/:id', inventariosController.delete);

// Rutas por propiedad/habitación
router.get('/propiedad/:propiedadId', inventariosController.getAllByPropiedad);
router.get('/habitacion/:habitacionId', inventariosController.getAllByHabitacion);

// Rutas administrativas
router.get('/admin/all', [checkRole([ROLES.ADMIN])], inventariosController.getAllAdmin);
router.get('/admin/stats', [checkRole([ROLES.ADMIN])], inventariosController.getAdminStats);

export default router; 