import express from 'express';
import { checkAuth } from '../middleware/auth.js';
import { transaccionesController } from '../controllers/transaccionesController.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(checkAuth);

// Rutas base del controlador
router.get('/', transaccionesController.getAll);
router.post('/', transaccionesController.create);
router.get('/:id', transaccionesController.getById);
router.put('/:id', transaccionesController.update);
router.delete('/:id', transaccionesController.delete);

// Rutas adicionales
router.get('/stats', transaccionesController.getStats);
router.get('/balance/:cuentaId', transaccionesController.getBalance);
router.get('/by-cuenta/:cuentaId', transaccionesController.getByCuenta);
router.patch('/:id/estado', transaccionesController.updateEstado);
router.get('/resumen', transaccionesController.getResumen);

export default router; 