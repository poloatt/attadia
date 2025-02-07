import express from 'express';
import { healthController } from '../controllers/healthController.js';
import { checkRole } from '../middleware/checkRole.js';
import { checkAuth } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

// Ruta pública para health check básico
router.get('/', healthController.getBasicHealth);

// Rutas protegidas para administradores
router.use(checkAuth);
router.use(checkRole([ROLES.ADMIN]));

router.get('/detailed', healthController.getDetailedHealth);
router.get('/metrics', healthController.getMetrics);
router.get('/logs', healthController.getLogs);

export default router; 