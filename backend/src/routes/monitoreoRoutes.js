import express from 'express';
import { monitoreoController } from '../controllers/monitoreoController.js';
import { checkAuth } from '../middleware/auth.js';
import { checkRole } from '../middleware/checkRole.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

// Todas las rutas requieren autenticación y rol de admin
router.use(checkAuth);
router.use(checkRole([ROLES.ADMIN]));

router.get('/stats', monitoreoController.getStats);
router.get('/logs', monitoreoController.getLogs);
router.get('/users/active', monitoreoController.getActiveUsers);
router.get('/system/health', monitoreoController.getSystemHealth);

export default router; 