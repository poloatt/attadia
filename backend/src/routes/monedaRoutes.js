import express from 'express';
import { monedaController } from '../controllers/monedaController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);
router.get('/', monedaController.getAll);
router.post('/', monedaController.create);
router.put('/:id', monedaController.update);
router.delete('/:id', monedaController.delete);

export default router; 