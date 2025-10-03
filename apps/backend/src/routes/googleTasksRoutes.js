import express from 'express';
import * as googleTasksController from '../controllers/googleTasksController.js';
import { checkAuth } from '../middleware/auth.js';

const router = express.Router();

// Callback de OAuth DEBE estar accesible sin autenticación JWT
router.get('/callback', googleTasksController.handleCallback);

// El resto de rutas requieren autenticación
router.use(checkAuth);

// Rutas de configuración
router.get('/auth-url', googleTasksController.getAuthUrl);
router.get('/status', googleTasksController.getStatus);
router.put('/config', googleTasksController.updateConfig);
router.delete('/disconnect', googleTasksController.disconnect);
// Alias para compatibilidad con el frontend actual
router.delete('/disable', googleTasksController.disconnect);

// Rutas de sincronización
router.post('/sync', googleTasksController.manualSync);
router.post('/sync/task/:taskId', googleTasksController.syncTask);
router.post('/cleanup', googleTasksController.cleanupDuplicates);

// Rutas adicionales
router.get('/stats', googleTasksController.getStats);
router.get('/task-lists', googleTasksController.getTaskLists);

// Rutas de sincronización automática
router.get('/auto-sync/status', googleTasksController.getAutoSyncStatus);
router.post('/auto-sync/start', googleTasksController.startAutoSync);
router.post('/auto-sync/stop', googleTasksController.stopAutoSync);
router.put('/auto-sync/interval', googleTasksController.setAutoSyncInterval);
router.post('/auto-sync/force', googleTasksController.forceAutoSync);

export default router;
