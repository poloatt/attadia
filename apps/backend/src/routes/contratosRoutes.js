import express from 'express';
import { contratosController } from '../controllers/contratosController.js';
import { checkAuth } from '../middleware/auth.js';
import { checkRole } from '../middleware/checkRole.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(checkAuth);

// Rutas específicas (deben ir ANTES que las rutas con parámetros dinámicos)
router.get('/estado-actual', (req, res) => contratosController.getConEstadoActual(req, res));
router.get('/activos', contratosController.getActivos);
router.get('/propiedad/:propiedadId', contratosController.getAllByPropiedad);

// Nuevas rutas para el wizard y mejoras UX
router.post('/wizard/validate-step', contratosController.validateWizardStep);
router.post('/wizard/preview', contratosController.previewWizardContract);
router.get('/wizard/suggestions', contratosController.getWizardSuggestions);
router.post('/bulk-update', contratosController.bulkUpdate);
router.get('/stats/summary', contratosController.getSummaryStats);
router.get('/stats/financial', contratosController.getFinancialStats);

// Rutas para búsqueda y filtros avanzados
router.get('/search/advanced', contratosController.advancedSearch);
router.get('/filter/by-status', contratosController.filterByStatus);
router.get('/filter/by-date-range', contratosController.filterByDateRange);
router.get('/filter/by-property', contratosController.filterByProperty);
router.get('/filter/by-tenant', contratosController.filterByTenant);

// Rutas administrativas
router.get('/admin/all', [checkRole([ROLES.ADMIN])], contratosController.getAllAdmin);
router.get('/admin/stats', [checkRole([ROLES.ADMIN])], contratosController.getAdminStats);
router.put('/admin/:id/status', [checkRole([ROLES.ADMIN])], contratosController.updateStatus);

// Rutas básicas CRUD
router.get('/', contratosController.getAll);
router.post('/', contratosController.create);
router.post('/actualizar-estados', contratosController.actualizarEstados);

// Rutas con parámetros dinámicos (deben ir AL FINAL)
router.get('/:id', contratosController.getById);
router.put('/:id', contratosController.update);
router.delete('/:id', contratosController.delete);

// Rutas para gestión avanzada de contratos (con parámetros)
router.post('/:id/finalizar', contratosController.finalizarContrato);
router.post('/:id/renovar', contratosController.renovarContrato);
router.post('/:id/suspender', contratosController.suspenderContrato);
router.post('/:id/reactivar', contratosController.reactivarContrato);

export default router;