import express from 'express';
import { perfilController } from '../controllers/perfilController.js';
import { checkAuth } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(checkAuth);

router.get('/', perfilController.getPerfil);
router.put('/', perfilController.updatePerfil);
router.put('/password', perfilController.updatePassword);
router.delete('/', perfilController.deletePerfil);
router.get('/preferences', perfilController.getPreferences);
router.put('/preferences', perfilController.updatePreferences);

export default router; 