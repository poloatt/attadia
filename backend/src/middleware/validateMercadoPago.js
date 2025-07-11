import { check, validationResult } from 'express-validator';

// Validación para la URL de autorización de MercadoPago
export const validateMercadoPagoAuthUrl = [
  check('redirect_uri')
    .notEmpty()
    .withMessage('redirect_uri es requerido')
    .isURL()
    .withMessage('redirect_uri debe ser una URL válida')
    .custom((value) => {
      // Validar que la URL sea HTTPS en producción
      if (process.env.NODE_ENV === 'production' && !value.startsWith('https://')) {
        throw new Error('redirect_uri debe usar HTTPS en producción');
      }
      return true;
    }),
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