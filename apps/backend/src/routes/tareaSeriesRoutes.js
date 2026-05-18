import express from 'express';
import { checkAuth } from '../middleware/auth.js';
import {
  createSerie,
  updateSerie,
  deleteSerie,
  getSerie,
} from '../controllers/tareaSeriesController.js';

const router = express.Router();

router.use(checkAuth);

router.post('/', createSerie);
router.get('/:id', getSerie);
router.patch('/:id', updateSerie);
router.delete('/:id', deleteSerie);

export default router;
