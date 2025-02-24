import { passportConfig } from '../config/passport.js';

export const checkAuth = (req, res, next) => {
  passportConfig.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      console.error('Error en autenticación:', err);
      return res.status(500).json({ error: 'Error en autenticación' });
    }

    if (!user) {
      // Si es una petición a /api/auth/check, devolver authenticated: false
      if (req.path === '/check') {
        return res.json({ authenticated: false });
      }
      // Para otras rutas, devolver error 401
      return res.status(401).json({ error: 'Token no válido o expirado' });
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