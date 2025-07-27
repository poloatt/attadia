import express from 'express';
import { labsController } from '../controllers/labsController.js';
import { checkAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(checkAuth);

// Rutas para usuarios autenticados
router.get('/', labsController.getAll);
router.post('/', labsController.create);
router.get('/:id', labsController.getById);
router.put('/:id', labsController.update);
router.delete('/:id', labsController.delete);

export default router;