import express from 'express';
import * as googleTasksController from '../controllers/googleTasksController.js';
import { checkAuth } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(checkAuth);

// Rutas de configuración
router.get('/auth-url', googleTasksController.getAuthUrl);
router.get('/callback', googleTasksController.handleCallback);
router.get('/status', googleTasksController.getStatus);
router.put('/config', googleTasksController.updateConfig);
router.delete('/disconnect', googleTasksController.disconnect);

// Rutas de sincronización
router.post('/sync', googleTasksController.manualSync);
router.post('/sync/task/:taskId', googleTasksController.syncTask);

// Rutas adicionales
router.get('/stats', googleTasksController.getStats);
router.get('/task-lists', googleTasksController.getTaskLists);

export default router;
