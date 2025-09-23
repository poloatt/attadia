import { passportConfig } from '../config/passport.js';

const handleAuthError = (error, req) => {
  console.error('Error de autenticación:', {
    error: error.message,
    path: req.path,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  return { status: 500, message: 'Error en autenticación' };
};

const handleUnauthorized = (req) => {
  // Reducir los mensajes de log en las rutas comunes de verificación
  if (!req.path.includes('/check') && !req.path.includes('/auth/check')) {
    console.warn('Acceso no autorizado:', {
      path: req.path,
      method: req.method,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
  }
  
  // Para rutas de check, permitir que el controlador maneje la respuesta
  if (req.path === '/check' || req.path === '/auth/check') {
    return null; // No devolver respuesta, permitir que continúe al controlador
  }
  
  // Para otras rutas, devolver error 401
  return { status: 401, message: { error: 'Token no válido o expirado' } };
};

export const checkAuth = (req, res, next) => {
  // Identificar endpoints comunes para reducir logging
  const isCommonEndpoint = req.path.includes('/check') || 
                           req.path.includes('/api/auth/check') ||
                           req.path.endsWith('/status') ||
                           req.path.includes('/api/rutinas');

  // Solo loggear en desarrollo y para rutas no comunes
  const shouldLog = process.env.NODE_ENV === 'development' && !isCommonEndpoint;
  
  if (shouldLog) {
    console.log('Verificando autenticación para:', {
      path: req.path,
      method: req.method
    });
  }

  // Eliminar decodificación manual innecesaria del token para mejorar rendimiento
  passportConfig.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      if (shouldLog) {
        console.error('Error en autenticación JWT:', err.message);
      }
      // Para rutas de check, permitir que el controlador maneje el error
      if (req.path === '/check' || req.path === '/auth/check') {
        req.user = null;
        return next();
      }
      const { status, message } = handleAuthError(err, req);
      return res.status(status).json(message);
    }

    if (!user) {
      if (shouldLog) {
        console.log('Usuario no encontrado o token inválido');
      }
      const unauthorizedResponse = handleUnauthorized(req);
      if (unauthorizedResponse) {
        return res.status(unauthorizedResponse.status).json(unauthorizedResponse.message);
      }
      req.user = null;
      return next();
    }

    // Verificar si el usuario está activo - optimizado
    if (!user.activo) {
      if (shouldLog) {
        console.warn('Usuario inactivo:', user.id);
      }
      // Para rutas de check, permitir que el controlador maneje usuarios inactivos
      if (req.path === '/check' || req.path === '/auth/check') {
        req.user = null;
        return next();
      }
      return res.status(403).json({ error: 'Usuario inactivo' });
    }

    if (shouldLog) {
      console.log('Usuario autenticado:', user.id);
    }

    req.user = user;
    next();
  })(req, res, next);
};

// checkRole se ha movido a ./checkRole.js para evitar duplicación
// Importar desde: import { checkRole } from './checkRole.js'; 