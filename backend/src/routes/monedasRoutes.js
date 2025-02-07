import express from 'express';
import { monedasController } from '../controllers/monedasController.js';
import { checkAuth } from '../middleware/auth.js';
import { checkRole } from '../middleware/checkRole.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

// Rutas que requieren autenticación
router.use(checkAuth);

// Rutas específicas (deben ir antes que las rutas con parámetros)
router.get('/active', monedasController.getActive);
router.get('/by-code/:codigo', monedasController.getByCode);
router.get('/select-options', monedasController.getSelectOptions);

// Rutas base del controlador
router.get('/', monedasController.getAll);
router.post('/', [checkRole([ROLES.ADMIN])], monedasController.create);

// Rutas con parámetros (deben ir al final)
router.get('/:id', monedasController.getById);
router.put('/:id', [checkRole([ROLES.ADMIN])], monedasController.update);
router.delete('/:id', [checkRole([ROLES.ADMIN])], monedasController.delete);
router.patch('/:id/toggle-active', monedasController.toggleActive);

export default router; 