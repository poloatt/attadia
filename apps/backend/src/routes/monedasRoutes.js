import express from 'express';
import { monedasController } from '../controllers/monedasController.js';
import { checkAuth } from '../middleware/auth.js';

const router = express.Router();

// Rutas que requieren autenticación
router.use(checkAuth);

// Rutas específicas (deben ir antes que las rutas con parámetros)
router.get('/active', monedasController.getActive);
router.get('/by-code/:codigo', monedasController.getByCode);
router.get('/select-options', monedasController.getSelectOptions);
router.get('/colores', monedasController.getColores);

// Rutas base del controlador
router.get('/', monedasController.getAll);
router.post('/', monedasController.create);

// Rutas con parámetros (deben ir al final)
router.get('/:id', monedasController.getById);
router.get('/:id/balance', monedasController.getBalance);
router.put('/:id', monedasController.update);
router.delete('/:id', monedasController.delete);
router.patch('/:id/toggle-active', monedasController.toggleActive);

export default router; 