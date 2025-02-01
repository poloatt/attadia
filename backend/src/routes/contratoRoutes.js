import express from 'express';
import { contratoController } from '../controllers/contratoController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);
router.get('/', contratoController.getAll);
router.post('/', contratoController.create);
router.put('/:id', contratoController.update);
router.delete('/:id', contratoController.delete);

export default router; 