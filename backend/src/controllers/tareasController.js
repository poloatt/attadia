import { Tareas } from '../models/index.js';

export const tareasController = {
  getAll: async (req, res) => {
    try {
      const tareas = await Tareas.find({ usuario: req.user.id })
        .populate('proyecto')
        .sort({ fechaVencimiento: 'asc' });
      res.json(tareas);
    } catch (error) {
      console.error('Error al obtener tareas:', error);
      res.status(500).json({ error: 'Error al obtener tareas' });
    }
  },

  create: async (req, res) => {
    try {
      const {
        titulo,
        descripcion,
        prioridad,
        estado,
        fechaVencimiento,
        proyectoId,
        subtareas
      } = req.body;

      const tarea = await Tareas.create({
        titulo,
        descripcion,
        prioridad,
        estado,
        fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
        proyecto: proyectoId,
        subtareas: subtareas || [],
        usuario: req.user.id
      });

      const tareaPopulada = await tarea.populate('proyecto');
      res.status(201).json(tareaPopulada);
    } catch (error) {
      console.error('Error al crear tarea:', error);
      res.status(500).json({ error: 'Error al crear tarea' });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const tarea = await Tareas.findOne({ 
        _id: id, 
        usuario: req.user.id 
      }).populate('proyecto');
      
      if (!tarea) {
        return res.status(404).json({ error: 'Tarea no encontrada' });
      }

      res.json(tarea);
    } catch (error) {
      console.error('Error al obtener tarea:', error);
      res.status(500).json({ error: 'Error al obtener tarea' });
    }
  },

  getAllByProyecto: async (req, res) => {
    try {
      const { proyectoId } = req.params;
      const tareas = await Tareas.find({ 
        proyecto: proyectoId,
        usuario: req.user.id 
      })
      .populate('proyecto')
      .sort({ fechaVencimiento: 'asc' });
      
      res.json(tareas);
    } catch (error) {
      console.error('Error al obtener tareas del proyecto:', error);
      res.status(500).json({ error: 'Error al obtener tareas del proyecto' });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };

      if (updateData.fechaVencimiento) {
        updateData.fechaVencimiento = new Date(updateData.fechaVencimiento);
      }

      const tarea = await Tareas.findOneAndUpdate(
        { _id: id, usuario: req.user.id },
        updateData,
        { new: true }
      ).populate('proyecto');

      if (!tarea) {
        return res.status(404).json({ error: 'Tarea no encontrada' });
      }

      res.json(tarea);
    } catch (error) {
      console.error('Error al actualizar tarea:', error);
      res.status(500).json({ error: 'Error al actualizar tarea' });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const tarea = await Tareas.findOneAndDelete({
        _id: id,
        usuario: req.user.id
      });

      if (!tarea) {
        return res.status(404).json({ error: 'Tarea no encontrada' });
      }

      res.json({ message: 'Tarea eliminada correctamente' });
    } catch (error) {
      console.error('Error al eliminar tarea:', error);
      res.status(500).json({ error: 'Error al eliminar tarea' });
    }
  },

  updateSubtareas: async (req, res) => {
    try {
      const { id } = req.params;
      const { subtareas } = req.body;

      const tarea = await Tareas.findOneAndUpdate(
        { _id: id, usuario: req.user.id },
        { subtareas },
        { new: true }
      );

      if (!tarea) {
        return res.status(404).json({ error: 'Tarea no encontrada' });
      }

      res.json(tarea);
    } catch (error) {
      console.error('Error al actualizar subtareas:', error);
      res.status(500).json({ error: 'Error al actualizar subtareas' });
    }
  },

  getAllAdmin: async (req, res) => {
    try {
      const tareas = await Tareas.find()
        .populate([
          { path: 'proyecto', select: 'nombre descripcion' },
          { path: 'usuario', select: 'nombre email' }
        ])
        .sort({ createdAt: 'desc' });
      res.json(tareas);
    } catch (error) {
      console.error('Error al obtener todas las tareas:', error);
      res.status(500).json({ error: 'Error al obtener todas las tareas' });
    }
  },

  getAdminStats: async (req, res) => {
    try {
      const totalTareas = await Tareas.countDocuments();
      const tareasPorEstado = await Tareas.aggregate([
        {
          $group: {
            _id: '$estado',
            count: { $sum: 1 }
          }
        }
      ]);

      const tareasPorPrioridad = await Tareas.aggregate([
        {
          $group: {
            _id: '$prioridad',
            count: { $sum: 1 }
          }
        }
      ]);

      const tareasPorProyecto = await Tareas.aggregate([
        {
          $group: {
            _id: '$proyecto',
            count: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'proyectos',
            localField: '_id',
            foreignField: '_id',
            as: 'proyecto'
          }
        },
        {
          $unwind: '$proyecto'
        }
      ]);

      res.json({
        totalTareas,
        tareasPorEstado,
        tareasPorPrioridad,
        tareasPorProyecto
      });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
  }
}; 