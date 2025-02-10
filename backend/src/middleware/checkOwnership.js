export const checkOwnership = (Model) => {
  return async (req, res, next) => {
    try {
      const resource = await Model.findById(req.params.id);
      
      if (!resource) {
        return res.status(404).json({ error: 'Recurso no encontrado' });
      }

      // Verificar si el recurso tiene usuario asignado
      if (!resource.usuario) {
        console.error('Recurso sin usuario asignado:', resource);
        return res.status(400).json({ error: 'Recurso sin usuario asignado' });
      }

      // Verificar si el usuario actual tiene permiso
      const resourceUserId = resource.usuario.toString ? resource.usuario.toString() : resource.usuario;
      const currentUserId = req.user?.id;

      if (!currentUserId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      if (resourceUserId !== currentUserId && req.user.role !== 'ADMIN') {
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