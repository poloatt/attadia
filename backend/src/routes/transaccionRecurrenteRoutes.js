const express = require('express');
const router = express.Router();
const transaccionRecurrenteController = require('../controllers/transaccionRecurrenteController');
const auth = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(auth);

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

module.exports = router; 