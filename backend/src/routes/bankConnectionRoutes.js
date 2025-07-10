import express from 'express';
import BankConnectionController from '../controllers/bankConnectionController.js';
import { checkAuth } from '../middleware/auth.js';

const router = express.Router();
const bankConnectionController = new BankConnectionController();

// Aplicar middleware de autenticación a todas las rutas
router.use(checkAuth);

// Rutas CRUD básicas
router.get('/', bankConnectionController.getAll.bind(bankConnectionController));
router.get('/:id', bankConnectionController.getById.bind(bankConnectionController));
router.post('/', bankConnectionController.create.bind(bankConnectionController));
router.put('/:id', bankConnectionController.update.bind(bankConnectionController));
router.delete('/:id', bankConnectionController.delete.bind(bankConnectionController));

// Rutas específicas para conexiones bancarias
router.post('/verify', bankConnectionController.verificarConexion.bind(bankConnectionController));
router.post('/:id/sync', bankConnectionController.sincronizarConexion.bind(bankConnectionController));
router.post('/sync-all', bankConnectionController.sincronizarTodas.bind(bankConnectionController));
router.get('/mercadopago/auth-url', bankConnectionController.getMercadoPagoAuthUrl.bind(bankConnectionController));
router.post('/mercadopago/callback', bankConnectionController.mercadoPagoCallback.bind(bankConnectionController));

export default router; 