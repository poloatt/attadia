import express from 'express';
import { habitacionController } from '../controllers/habitacionController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);
router.get('/', habitacionController.getAll);
router.post('/', habitacionController.create);
router.put('/:id', habitacionController.update);
router.delete('/:id', habitacionController.delete);

export default router; 