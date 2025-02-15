import express from 'express';
import { dataCorporalController } from '../controllers/dataCorporalController.js';
import { checkAuth } from '../middleware/auth.js';

const router = express.Router();

// Rutas protegidas
router.use(checkAuth);

// GET /api/datacorporal
router.get('/', dataCorporalController.getAll);

// GET /api/datacorporal/:id
router.get('/:id', dataCorporalController.getById);

// POST /api/datacorporal
router.post('/', dataCorporalController.create);

// PUT /api/datacorporal/:id
router.put('/:id', dataCorporalController.update);

// DELETE /api/datacorporal/:id
router.delete('/:id', dataCorporalController.delete);

export default router; 