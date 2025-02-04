export const checkOwnership = (Model) => {
  return async (req, res, next) => {
    try {
      const resource = await Model.findById(req.params.id);
      
      if (!resource) {
        return res.status(404).json({ error: 'Recurso no encontrado' });
      }

      if (resource.usuario.toString() !== req.user.id && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'No tienes permiso para acceder a este recurso' });
      }

      req.resource = resource;
      next();
    } catch (error) {
      console.error('Error en checkOwnership:', error);
      res.status(500).json({ error: 'Error al verificar propiedad del recurso' });
    }
  };
}; 