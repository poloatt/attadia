import express from 'express';
import BankConnectionController from '../controllers/bankConnectionController.js';
import { checkAuth } from '../middleware/auth.js';
import { checkOwnership } from '../middleware/checkOwnership.js';
import { BankConnection } from '../models/BankConnection.js';
import { 
  validateMercadoPagoAuthUrl, 
  validateMercadoPagoCallback, 
  validateSyncRequest 
} from '../middleware/validateMercadoPago.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting específico para MercadoPago (evitar exceder límites de API)
const mercadopagoLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // máximo 10 requests por minuto para MercadoPago
  message: { 
    error: 'Demasiadas peticiones a MercadoPago. Por favor, espera un momento.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Usar IP real para rate limiting
    return req.headers['x-real-ip'] || 
           req.headers['x-forwarded-for']?.split(',')[0] || 
           req.ip;
  }
});

// Rate limiting para sincronización (evitar sobrecarga)
const syncLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 5, // máximo 5 sincronizaciones por 5 minutos
  message: { 
    error: 'Demasiadas sincronizaciones. Por favor, espera antes de intentar nuevamente.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.headers['x-real-ip'] || 
           req.headers['x-forwarded-for']?.split(',')[0] || 
           req.ip;
  }
});

// Aplicar autenticación a todas las rutas
router.use(checkAuth);

// Endpoint temporal para pago de prueba con MercadoPago
router.post('/pagos/prueba', (req, res) => {
  const controller = new BankConnectionController();
  controller.pagoPrueba(req, res);
});

// Endpoint de diagnóstico para MercadoPago
router.post('/pagos/diagnostico', (req, res) => {
  const controller = new BankConnectionController();
  controller.pagoPruebaSimple(req, res);
});

// Endpoint para probar permisos de token de usuario
router.post('/mercadopago/probar-token', (req, res) => {
  const controller = new BankConnectionController();
  controller.probarTokenUsuario(req, res);
});

// Rutas de MercadoPago con rate limiting y validación
router.get('/mercadopago/auth-url', 
  mercadopagoLimiter, 
  validateMercadoPagoAuthUrl,
  (req, res) => {
    const controller = new BankConnectionController();
    controller.getMercadoPagoAuthUrl(req, res);
  }
);

router.post('/mercadopago/callback', 
  mercadopagoLimiter, 
  validateMercadoPagoCallback,
  (req, res) => {
    const controller = new BankConnectionController();
    controller.mercadoPagoCallback(req, res);
  }
);

// Nuevos endpoints para datos completos de MercadoPago
router.get('/mercadopago/datos-completos/:conexionId', 
  mercadopagoLimiter,
  (req, res) => {
    const controller = new BankConnectionController();
    controller.obtenerDatosCompletosMercadoPago(req, res);
  }
);

router.post('/mercadopago/procesar-datos/:conexionId', 
  mercadopagoLimiter,
  (req, res) => {
    const controller = new BankConnectionController();
    controller.procesarDatosMercadoPago(req, res);
  }
);

// Rutas de sincronización con rate limiting y validación
router.post('/sync/:id', 
  syncLimiter, 
  validateSyncRequest,
  (req, res) => {
    const controller = new BankConnectionController();
    controller.sincronizarConexion(req, res);
  }
);

router.post('/sync-all', 
  syncLimiter, 
  (req, res) => {
    const controller = new BankConnectionController();
    controller.sincronizarTodas(req, res);
  }
);

// Rutas estándar CRUD
router.get('/', (req, res) => {
  const controller = new BankConnectionController();
  controller.getAll(req, res);
});

router.post('/', (req, res) => {
  const controller = new BankConnectionController();
  controller.create(req, res);
});

router.get('/:id', checkOwnership(BankConnection), (req, res) => {
  const controller = new BankConnectionController();
  controller.getById(req, res);
});

router.put('/:id', checkOwnership(BankConnection), (req, res) => {
  const controller = new BankConnectionController();
  controller.update(req, res);
});

router.delete('/:id', checkOwnership(BankConnection), (req, res) => {
  const controller = new BankConnectionController();
  controller.delete(req, res);
});

// Ruta de verificación
router.post('/verify', (req, res) => {
  const controller = new BankConnectionController();
  controller.verificarConexion(req, res);
});

export default router; 