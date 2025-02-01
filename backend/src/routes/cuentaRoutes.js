import express from 'express';
import { cuentaController } from '../controllers/cuentaController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);
router.get('/', cuentaController.getAll);
router.post('/', cuentaController.create);
router.put('/:id', cuentaController.update);
router.delete('/:id', cuentaController.delete);

export default router; 