import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getTransacciones, createTransaccion } from '../controllers/transaccionController.js';

const router = express.Router();

router.get('/', authMiddleware, getTransacciones);
router.post('/', authMiddleware, createTransaccion);

export default router; 