import express from 'express';
import propiedadRoutes from './propiedadRoutes.js';
// ... otros imports

const router = express.Router();

// Por ahora solo usamos las rutas de propiedades
router.use('/propiedades', propiedadRoutes);
// ... otras rutas

export default router; 