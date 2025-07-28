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
  // No loggear verificaciones de autenticación para rutas de comprobación
  // que se usan frecuentemente en la aplicación
  const isCommonEndpoint = req.path.includes('/check') || 
                           req.path.includes('/api/auth/check') ||
                           req.path.endsWith('/status');
                           
  if (!isCommonEndpoint) {
    console.log('Verificando autenticación para:', {
      path: req.path,
      method: req.method
    });
  }

  // Decodificar el token manualmente para debugging solo en rutas no comunes
  if (req.headers.authorization && !isCommonEndpoint) {
    const token = req.headers.authorization.split(' ')[1];
    try {
      const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      console.log('Token decodificado:', {
        userId: decoded.user?.id,
        type: decoded.type
      });
    } catch (error) {
      console.error('Error al decodificar token:', error);
    }
  }

  passportConfig.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      console.error('Error en autenticación JWT:', err);
      // Para rutas de check, permitir que el controlador maneje el error
      if (req.path === '/check' || req.path === '/auth/check') {
        req.user = null;
        return next();
      }
      const { status, message } = handleAuthError(err, req);
      return res.status(status).json(message);
    }

    if (!user) {
      // Reducir logging para endpoints comunes
      if (!isCommonEndpoint) {
        console.log('Usuario no encontrado o token inválido. Info:', info);
      }
      const unauthorizedResponse = handleUnauthorized(req);
      if (unauthorizedResponse) {
        return res.status(unauthorizedResponse.status).json(unauthorizedResponse.message);
      }
      // Si no hay respuesta específica, continuar al controlador con req.user = null
      req.user = null;
      return next();
    }

    // Verificar si el usuario está activo
    if (!user.activo) {
      console.warn('Usuario inactivo intentando acceder:', {
        userId: user.id,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      });
      return res.status(403).json({ error: 'Usuario inactivo' });
    }

    // Reducir logging para endpoints comunes
    if (!isCommonEndpoint) {
      console.log('Usuario autenticado:', {
        userId: user.id,
        email: user.email,
        role: user.role
      });
    }

    req.user = user;
    next();
  })(req, res, next);
};

export const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'No tienes permisos para realizar esta acción' });
    }

    next();
  };
}; 