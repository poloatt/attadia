import express from 'express';
import { propiedadesController } from '../controllers/propiedadesController.js';
import { checkAuth } from '../middleware/auth.js';
import { checkRole } from '../middleware/checkRole.js';
import { checkOwnership } from '../middleware/checkOwnership.js';
import { Propiedades } from '../models/index.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(checkAuth);

// Rutas básicas
router.get('/', propiedadesController.getAll);
router.post('/', propiedadesController.create);
router.get('/:id', propiedadesController.getById);
router.put('/:id', propiedadesController.update);
router.delete('/:id', propiedadesController.delete);

// Rutas por estado
router.get('/estado/:estado', propiedadesController.getByEstado);
router.get('/disponibles', propiedadesController.getDisponibles);
router.get('/ocupadas', propiedadesController.getOcupadas);
router.get('/mantenimiento', propiedadesController.getEnMantenimiento);

// Rutas de inquilinos
router.get('/:id/inquilinos', propiedadesController.getInquilinos);
router.get('/:id/inquilinos/activos', propiedadesController.getInquilinosActivos);
router.get('/:id/inquilinos/pendientes', propiedadesController.getInquilinosPendientes);

// Rutas de contratos
router.get('/:id/contratos', propiedadesController.getContratos);
router.get('/:id/contratos/activos', propiedadesController.getContratosActivos);
router.get('/:id/contratos/mantenimiento', propiedadesController.getContratosMantenimiento);

// Rutas administrativas
router.get('/admin/all', [checkRole([ROLES.ADMIN])], propiedadesController.getAllAdmin);
router.get('/admin/stats', [checkRole([ROLES.ADMIN])], propiedadesController.getAdminStats);

// Rutas de documentos
router.get('/:id/documentos', propiedadesController.getDocumentos);
router.post('/:id/documentos/sincronizar', propiedadesController.sincronizarDocumentos);
router.post('/:id/documentos', propiedadesController.agregarDocumento);
router.delete('/:id/documentos/:googleDriveId', propiedadesController.eliminarDocumento);
router.get('/:id/documentos/categoria/:categoria', propiedadesController.getDocumentosPorCategoria);
router.post('/:id/documentos/crear-carpeta', propiedadesController.crearCarpetaGoogleDrive);

export default router; 