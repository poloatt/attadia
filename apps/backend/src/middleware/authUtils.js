// Constantes de roles
export const ROLES = {
  ADMIN: 'ADMIN',
  USER: 'USER'
};

// Mensajes de error estandarizados
export const AUTH_ERRORS = {
  NOT_AUTHENTICATED: 'Usuario no autenticado',
  INSUFFICIENT_PERMISSIONS: 'No tienes permisos para realizar esta acción',
  RESOURCE_NOT_FOUND: 'Recurso no encontrado',
  RESOURCE_ACCESS_DENIED: 'No tienes permisos para acceder a este recurso',
  RESOURCE_WITHOUT_USER: 'Recurso sin usuario asignado'
};

// Utilidad para verificar autenticación básica
export const requireAuth = (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: AUTH_ERRORS.NOT_AUTHENTICATED });
    return false;
  }
  return true;
};

// Utilidad para verificar si el usuario es admin
export const isAdmin = (user) => {
  return user && user.role === ROLES.ADMIN;
};

// Utilidad para verificar propiedad de recurso
export const isResourceOwner = (resource, userId) => {
  if (!resource || !resource.usuario || !userId) {
    return false;
  }
  
  const resourceUserId = resource.usuario.toString ? 
    resource.usuario.toString() : 
    resource.usuario;
    
  return resourceUserId === userId;
};

// Utilidad para verificar si el usuario puede acceder al recurso
export const canAccessResource = (resource, user) => {
  if (!user) return false;
  if (isAdmin(user)) return true;
  return isResourceOwner(resource, user.id);
};
