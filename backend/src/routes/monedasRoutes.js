import express from 'express';
import { monedasController } from '../controllers/monedasController.js';
import { checkAuth } from '../middleware/auth.js';
import { checkRole, ROLES } from '../middleware/checkRole.js';

const router = express.Router();

router.use(checkAuth);

router.get('/', monedasController.getAll);
router.get('/:id', monedasController.getById);
router.post('/', [checkRole([ROLES.ADMIN])], monedasController.create);
router.put('/:id', [checkRole([ROLES.ADMIN])], monedasController.update);
router.delete('/:id', [checkRole([ROLES.ADMIN])], monedasController.delete);
router.get('/rates/update', [checkRole([ROLES.ADMIN])], monedasController.updateRates);

export default router; 