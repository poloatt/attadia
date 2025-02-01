import express from 'express';
import { inquilinoController } from '../controllers/inquilinoController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);
router.get('/', inquilinoController.getAll);
router.post('/', inquilinoController.create);
router.put('/:id', inquilinoController.update);
router.delete('/:id', inquilinoController.delete);

export default router; 