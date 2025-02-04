import { Subtareas } from '../models/index.js';

export const subtareasController = {
  getAll: async (req, res) => {
    try {
      const subtareas = await Subtareas.find({ usuario: req.user.id })
        .populate('tarea')
        .sort({ fechaVencimiento: 'asc' });
      res.json(subtareas);
    } catch (error) {
      console.error('Error al obtener subtareas:', error);
      res.status(500).json({ error: 'Error al obtener subtareas' });
    }
  },

  getByTarea: async (req, res) => {
    try {
      const { tareaId } = req.params;
      const subtareas = await Subtareas.find({
        tarea: tareaId,
        usuario: req.user.id
      }).sort({ fechaVencimiento: 'asc' });
      res.json(subtareas);
    } catch (error) {
      console.error('Error al obtener subtareas:', error);
      res.status(500).json({ error: 'Error al obtener subtareas' });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const subtarea = await Subtareas.findOne({ 
        _id: id, 
        usuario: req.user.id 
      }).populate('tarea');
      
      if (!subtarea) {
        return res.status(404).json({ error: 'Subtarea no encontrada' });
      }

      res.json(subtarea);
    } catch (error) {
      console.error('Error al obtener subtarea:', error);
      res.status(500).json({ error: 'Error al obtener subtarea' });
    }
  },

  getAllByTarea: async (req, res) => {
    try {
      const subtareas = await Subtareas.find({ 
        tarea: req.params.tareaId,
        usuario: req.user.id 
      }).sort({ orden: 'asc' });
      res.json(subtareas);
    } catch (error) {
      console.error('Error al obtener subtareas:', error);
      res.status(500).json({ error: 'Error al obtener subtareas' });
    }
  },

  create: async (req, res) => {
    try {
      const subtarea = await Subtareas.create({
        ...req.body,
        usuario: req.user.id
      });
      res.status(201).json(subtarea);
    } catch (error) {
      console.error('Error al crear subtarea:', error);
      res.status(500).json({ error: 'Error al crear subtarea' });
    }
  },

  update: async (req, res) => {
    try {
      const subtarea = await Subtareas.findOneAndUpdate(
        { _id: req.params.id, usuario: req.user.id },
        req.body,
        { new: true }
      );
      if (!subtarea) {
        return res.status(404).json({ error: 'Subtarea no encontrada' });
      }
      res.json(subtarea);
    } catch (error) {
      console.error('Error al actualizar subtarea:', error);
      res.status(500).json({ error: 'Error al actualizar subtarea' });
    }
  },

  delete: async (req, res) => {
    try {
      const subtarea = await Subtareas.findOneAndDelete({
        _id: req.params.id,
        usuario: req.user.id
      });
      if (!subtarea) {
        return res.status(404).json({ error: 'Subtarea no encontrada' });
      }
      res.json({ message: 'Subtarea eliminada correctamente' });
    } catch (error) {
      console.error('Error al eliminar subtarea:', error);
      res.status(500).json({ error: 'Error al eliminar subtarea' });
    }
  },

  getAllAdmin: async (req, res) => {
    try {
      const subtareas = await Subtareas.find()
        .populate(['tarea', 'usuario'])
        .sort({ createdAt: 'desc' });
      res.json(subtareas);
    } catch (error) {
      console.error('Error al obtener subtareas:', error);
      res.status(500).json({ error: 'Error al obtener subtareas' });
    }
  }
}; 