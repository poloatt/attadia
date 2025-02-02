import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { transaccionController } from '../controllers/transaccionController.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/stats', transaccionController.getStats);
router.get('/', transaccionController.getAll);
router.post('/', transaccionController.create);
router.put('/:id', transaccionController.update);
router.delete('/:id', transaccionController.delete);

export default router; 