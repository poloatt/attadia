import { Proyectos } from '../models/index.js';

export const proyectosController = {
  getAll: async (req, res) => {
    try {
      const proyectos = await Proyectos.find({ usuario: req.user.id })
        .populate('propiedad')
        .sort({ fechaInicio: 'desc' });
      res.json(proyectos);
    } catch (error) {
      console.error('Error al obtener proyectos:', error);
      res.status(500).json({ error: 'Error al obtener proyectos' });
    }
  },

  create: async (req, res) => {
    try {
      const { 
        nombre, 
        descripcion, 
        estado, 
        fechaInicio, 
        fechaFin,
        presupuesto,
        propiedadId 
      } = req.body;

      const proyecto = await Proyectos.create({
        nombre,
        descripcion,
        estado,
        fechaInicio: new Date(fechaInicio),
        fechaFin: fechaFin ? new Date(fechaFin) : null,
        presupuesto: parseFloat(presupuesto),
        usuario: req.user.id,
        propiedad: propiedadId
      });

      const proyectoPopulado = await proyecto.populate('propiedad');
      res.status(201).json(proyectoPopulado);
    } catch (error) {
      console.error('Error al crear proyecto:', error);
      res.status(500).json({ error: 'Error al crear proyecto' });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const proyecto = await Proyectos.findOne({ 
        _id: id, 
        usuario: req.user.id 
      }).populate('propiedad');
      
      if (!proyecto) {
        return res.status(404).json({ error: 'Proyecto no encontrado' });
      }

      res.json(proyecto);
    } catch (error) {
      console.error('Error al obtener proyecto:', error);
      res.status(500).json({ error: 'Error al obtener proyecto' });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };
      
      if (updateData.fechaInicio) updateData.fechaInicio = new Date(updateData.fechaInicio);
      if (updateData.fechaFin) updateData.fechaFin = new Date(updateData.fechaFin);
      if (updateData.presupuesto) updateData.presupuesto = parseFloat(updateData.presupuesto);

      const proyecto = await Proyectos.findOneAndUpdate(
        { _id: id, usuario: req.user.id },
        updateData,
        { new: true }
      ).populate('propiedad');

      if (!proyecto) {
        return res.status(404).json({ error: 'Proyecto no encontrado' });
      }

      res.json(proyecto);
    } catch (error) {
      console.error('Error al actualizar proyecto:', error);
      res.status(500).json({ error: 'Error al actualizar proyecto' });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const proyecto = await Proyectos.findOneAndDelete({
        _id: id,
        usuario: req.user.id
      });

      if (!proyecto) {
        return res.status(404).json({ error: 'Proyecto no encontrado' });
      }

      res.json({ message: 'Proyecto eliminado correctamente' });
    } catch (error) {
      console.error('Error al eliminar proyecto:', error);
      res.status(500).json({ error: 'Error al eliminar proyecto' });
    }
  },

  getAllAdmin: async (req, res) => {
    try {
      const proyectos = await Proyectos.find()
        .populate([
          { path: 'propiedad', select: 'nombre direccion' },
          { path: 'usuario', select: 'nombre email' }
        ])
        .sort({ createdAt: 'desc' });
      res.json(proyectos);
    } catch (error) {
      console.error('Error al obtener todos los proyectos:', error);
      res.status(500).json({ error: 'Error al obtener todos los proyectos' });
    }
  },

  getAdminStats: async (req, res) => {
    try {
      const totalProyectos = await Proyectos.countDocuments();
      const proyectosPorEstado = await Proyectos.aggregate([
        {
          $group: {
            _id: '$estado',
            count: { $sum: 1 },
            presupuestoTotal: { $sum: '$presupuesto' }
          }
        }
      ]);

      const proyectosPorPropiedad = await Proyectos.aggregate([
        {
          $group: {
            _id: '$propiedad',
            count: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'propiedades',
            localField: '_id',
            foreignField: '_id',
            as: 'propiedad'
          }
        },
        {
          $unwind: '$propiedad'
        }
      ]);

      res.json({
        totalProyectos,
        proyectosPorEstado,
        proyectosPorPropiedad
      });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
  }
}; 