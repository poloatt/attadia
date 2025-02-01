import express from 'express';
import authRoutes from './authRoutes.js';
import propiedadRoutes from './propiedadRoutes.js';
import transaccionesRoutes from './transaccionesRoutes.js';
import monedaRoutes from './monedaRoutes.js';
import cuentaRoutes from './cuentaRoutes.js';
import contratoRoutes from './contratoRoutes.js';
import inquilinoRoutes from './inquilinoRoutes.js';
import habitacionRoutes from './habitacionRoutes.js';
import healthRoutes from './health.js';
// ... otros imports

const router = express.Router();

// Rutas públicas
router.use('/auth', authRoutes);
router.use('/health', healthRoutes);

// Rutas protegidas
router.use('/propiedades', propiedadRoutes);
router.use('/transacciones', transaccionesRoutes);
router.use('/monedas', monedaRoutes);
router.use('/cuentas', cuentaRoutes);
router.use('/contratos', contratoRoutes);
router.use('/inquilinos', inquilinoRoutes);
router.use('/habitaciones', habitacionRoutes);
// ... otras rutas

export default router; 