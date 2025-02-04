import express from 'express';
import { monitoreoController } from '../controllers/monitoreoController.js';
import { checkAuth } from '../middleware/auth.js';
import { checkRole, ROLES } from '../middleware/checkRole.js';

const router = express.Router();
router.use(checkAuth);
router.use(checkRole([ROLES.ADMIN]));

router.get('/stats', monitoreoController.getStats);
router.get('/logs', monitoreoController.getLogs);
router.get('/users/active', monitoreoController.getActiveUsers);
router.get('/system/health', monitoreoController.getSystemHealth);

export default router; 