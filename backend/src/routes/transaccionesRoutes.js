import express from 'express';
import { checkAuth } from '../middleware/auth.js';
import { transaccionesController } from '../controllers/transaccionesController.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(checkAuth);

// Rutas base del controlador
router.get('/', transaccionesController.getAll);
router.get('/select-options', transaccionesController.getSelectOptions);
router.get('/:id', transaccionesController.getById);
router.post('/', transaccionesController.create);
router.put('/:id', transaccionesController.update);
router.delete('/:id', transaccionesController.delete);
router.patch('/:id/toggle-active', transaccionesController.toggleActive);

// Rutas específicas
router.get('/cuenta/:cuentaId', transaccionesController.getByCuenta);
router.get('/balance/:cuentaId', transaccionesController.getBalance);
router.get('/resumen', transaccionesController.getResumen);
router.patch('/:id/estado', transaccionesController.updateEstado);

export default router; 