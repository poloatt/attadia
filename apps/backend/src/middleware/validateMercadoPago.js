import { check, validationResult } from 'express-validator';

// Validación para la URL de autorización de MercadoPago
export const validateMercadoPagoAuthUrl = [
  check('redirect_uri')
    .notEmpty()
    .withMessage('redirect_uri es requerido')
    .custom((value) => {
      // Validación custom más permisiva para localhost
      try {
        const url = new URL(value);
        
        // Permitir http en localhost/127.0.0.1
        const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
        
        // Validar protocolo
        if (!['http:', 'https:'].includes(url.protocol)) {
          throw new Error('redirect_uri debe usar protocolo http o https');
        }
        
        // En producción, requerir HTTPS (excepto localhost)
        if (process.env.NODE_ENV === 'production' && url.protocol === 'http:' && !isLocalhost) {
          throw new Error('redirect_uri debe usar HTTPS en producción');
        }
        
        return true;
      } catch (error) {
        throw new Error('redirect_uri debe ser una URL válida');
      }
    }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('❌ [MercadoPago] Validación fallida:', {
        redirect_uri: req.query.redirect_uri,
        errors: errors.array()
      });
      return res.status(400).json({ 
        error: 'Parámetros inválidos',
        details: errors.array() 
      });
    }
    console.log('✅ [MercadoPago] Validación exitosa - redirect_uri:', req.query.redirect_uri);
    next();
  }
];

// Validación para el callback de MercadoPago
export const validateMercadoPagoCallback = [
  check('code')
    .notEmpty()
    .withMessage('Código de autorización es requerido')
    .isString()
    .withMessage('Código debe ser una cadena de texto')
    .isLength({ min: 10, max: 100 })
    .withMessage('Código debe tener entre 10 y 100 caracteres'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Parámetros inválidos',
        details: errors.array() 
      });
    }
    next();
  }
];

// Validación para sincronización
export const validateSyncRequest = [
  check('id')
    .isMongoId()
    .withMessage('ID de conexión inválido'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Parámetros inválidos',
        details: errors.array() 
      });
    }
    next();
  }
]; 