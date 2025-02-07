import express from 'express';
import authRoutes from './authRoutes.js';
import usersRoutes from './usersRoutes.js';
import propiedadesRoutes from './propiedadesRoutes.js';
import inquilinosRoutes from './inquilinosRoutes.js';
import contratosRoutes from './contratosRoutes.js';
import inventariosRoutes from './inventariosRoutes.js';
import habitacionesRoutes from './habitacionesRoutes.js';
import monedasRoutes from './monedasRoutes.js';
import cuentasRoutes from './cuentasRoutes.js';
import transaccionesRoutes from './transaccionesRoutes.js';
import proyectosRoutes from './proyectosRoutes.js';
import tareasRoutes from './tareasRoutes.js';
import subtareasRoutes from './subtareasRoutes.js';
import rutinasRoutes from './rutinasRoutes.js';
import labsRoutes from './labsRoutes.js';
import dietasRoutes from './dietasRoutes.js';
import objetivosRoutes from './objetivosRoutes.js';
import monitoreoRoutes from './monitoreoRoutes.js';
import perfilRoutes from './perfilRoutes.js';
import healthRoutes from './healthRoutes.js';

const router = express.Router();

// Rutas de salud y autenticación
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);

// Rutas de usuarios y perfil
router.use('/users', usersRoutes);
router.use('/perfil', perfilRoutes);

// Rutas de gestión de propiedades
router.use('/propiedades', propiedadesRoutes);
router.use('/inquilinos', inquilinosRoutes);
router.use('/contratos', contratosRoutes);
router.use('/inventarios', inventariosRoutes);
router.use('/habitaciones', habitacionesRoutes);

// Rutas de gestión financiera
router.use('/monedas', monedasRoutes);
router.use('/cuentas', cuentasRoutes);
router.use('/transacciones', transaccionesRoutes);

// Rutas de gestión de proyectos
router.use('/proyectos', proyectosRoutes);
router.use('/tareas', tareasRoutes);
router.use('/subtareas', subtareasRoutes);

// Rutas de salud y bienestar
router.use('/rutinas', rutinasRoutes);
router.use('/labs', labsRoutes);
router.use('/dietas', dietasRoutes);
router.use('/objetivos', objetivosRoutes);

// Rutas de monitoreo
router.use('/monitoreo', monitoreoRoutes);

export { router }; 