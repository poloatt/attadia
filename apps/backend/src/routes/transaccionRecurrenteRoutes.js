import express from 'express';
import { checkAuth } from '../middleware/auth.js';
import { transaccionRecurrenteController } from '../controllers/transaccionRecurrenteController.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(checkAuth);

// Rutas base del controlador
router.get('/', transaccionRecurrenteController.getAll);
router.get('/select-options', transaccionRecurrenteController.getSelectOptions);
router.get('/:id', transaccionRecurrenteController.getById);
router.post('/', transaccionRecurrenteController.create);
router.put('/:id', transaccionRecurrenteController.update);
router.delete('/:id', transaccionRecurrenteController.delete);
router.patch('/:id/toggle-active', transaccionRecurrenteController.toggleActive);

// Rutas específicas
router.post('/generar', transaccionRecurrenteController.generarTransacciones);

export default router; 