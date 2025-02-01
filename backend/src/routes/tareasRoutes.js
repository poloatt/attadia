import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getTareas, createTarea } from '../controllers/tareaController.js';

const router = express.Router();

router.get('/', authMiddleware, getTareas);
router.post('/', authMiddleware, createTarea);

export default router; 