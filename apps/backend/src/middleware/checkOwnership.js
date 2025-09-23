import { AUTH_ERRORS, requireAuth, canAccessResource } from './authUtils.js';

/**
 * Middleware para verificar que el usuario sea propietario del recurso o admin
 * @param {Model} Model - Modelo de Mongoose para buscar el recurso
 * @param {Object} options - Opciones de configuración
 * @param {string} options.resourceParam - Nombre del parámetro que contiene el ID (default: 'id')
 * @param {string} options.userField - Campo que contiene el ID del usuario propietario (default: 'usuario')
 * @returns {Function} Middleware function
 */
export const checkOwnership = (Model, options = {}) => {
  const { 
    resourceParam = 'id', 
    userField = 'usuario' 
  } = options;
  
  return async (req, res, next) => {
    try {
      // Verificar autenticación básica
      if (!requireAuth(req, res)) {
        return;
      }

      // Buscar el recurso
      const resourceId = req.params[resourceParam];
      const resource = await Model.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({ error: AUTH_ERRORS.RESOURCE_NOT_FOUND });
      }

      // Verificar si el recurso tiene usuario asignado
      if (!resource[userField]) {
        console.error(`Recurso sin ${userField} asignado:`, {
          model: Model.modelName,
          resourceId,
          resource: resource.toObject ? resource.toObject() : resource
        });
        return res.status(400).json({ error: AUTH_ERRORS.RESOURCE_WITHOUT_USER });
      }

      // Verificar permisos de acceso
      if (!canAccessResource(resource, req.user)) {
        return res.status(403).json({ error: AUTH_ERRORS.RESOURCE_ACCESS_DENIED });
      }

      // Adjuntar el recurso al request para uso posterior
      req.resource = resource;
      next();
    } catch (error) {
      console.error('Error en checkOwnership:', {
        model: Model.modelName,
        resourceId: req.params[resourceParam],
        error: error.message,
        userId: req.user?.id
      });
      res.status(500).json({ error: 'Error al verificar propiedad del recurso' });
    }
  };
}; 