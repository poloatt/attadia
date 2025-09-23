import { ROLES, AUTH_ERRORS, requireAuth } from './authUtils.js';

export { ROLES };

/**
 * Middleware para verificar que el usuario tenga uno de los roles especificados
 * @param {string|string[]} roles - Rol o array de roles permitidos
 * @returns {Function} Middleware function
 */
export const checkRole = (roles) => {
  // Normalizar a array para manejo uniforme
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req, res, next) => {
    // Verificar autenticación básica
    if (!requireAuth(req, res)) {
      return;
    }

    // Verificar rol
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: AUTH_ERRORS.INSUFFICIENT_PERMISSIONS });
    }

    next();
  };
}; 