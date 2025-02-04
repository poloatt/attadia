import { Rutinas } from '../models/index.js';

export const rutinasController = {
  getAll: async (req, res) => {
    try {
      const rutinas = await Rutinas.find({ usuario: req.user.id })
        .populate('propiedad')
        .sort({ fechaInicio: 'desc' });
      res.json(rutinas);
    } catch (error) {
      console.error('Error al obtener rutinas:', error);
      res.status(500).json({ error: 'Error al obtener rutinas' });
    }
  },

  create: async (req, res) => {
    try {
      const {
        nombre,
        descripcion,
        tipo,
        frecuencia,
        fechaInicio,
        fechaFin,
        propiedadId
      } = req.body;

      const rutina = await Rutinas.create({
        nombre,
        descripcion,
        tipo,
        frecuencia,
        fechaInicio: new Date(fechaInicio),
        fechaFin: fechaFin ? new Date(fechaFin) : null,
        propiedad: propiedadId,
        usuario: req.user.id
      });

      const rutinaPopulada = await rutina.populate('propiedad');
      res.status(201).json(rutinaPopulada);
    } catch (error) {
      console.error('Error al crear rutina:', error);
      res.status(500).json({ error: 'Error al crear rutina' });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const rutina = await Rutinas.findOne({ 
        _id: id, 
        usuario: req.user.id 
      }).populate('propiedad');
      
      if (!rutina) {
        return res.status(404).json({ error: 'Rutina no encontrada' });
      }

      res.json(rutina);
    } catch (error) {
      console.error('Error al obtener rutina:', error);
      res.status(500).json({ error: 'Error al obtener rutina' });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };

      if (updateData.fechaInicio) updateData.fechaInicio = new Date(updateData.fechaInicio);
      if (updateData.fechaFin) updateData.fechaFin = new Date(updateData.fechaFin);

      const rutina = await Rutinas.findOneAndUpdate(
        { _id: id, usuario: req.user.id },
        updateData,
        { new: true }
      ).populate('propiedad');

      if (!rutina) {
        return res.status(404).json({ error: 'Rutina no encontrada' });
      }

      res.json(rutina);
    } catch (error) {
      console.error('Error al actualizar rutina:', error);
      res.status(500).json({ error: 'Error al actualizar rutina' });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const rutina = await Rutinas.findOneAndDelete({
        _id: id,
        usuario: req.user.id
      });

      if (!rutina) {
        return res.status(404).json({ error: 'Rutina no encontrada' });
      }

      res.json({ message: 'Rutina eliminada correctamente' });
    } catch (error) {
      console.error('Error al eliminar rutina:', error);
      res.status(500).json({ error: 'Error al eliminar rutina' });
    }
  },

  getAllAdmin: async (req, res) => {
    try {
      const rutinas = await Rutinas.find()
        .populate([
          { path: 'propiedad', select: 'nombre direccion' },
          { path: 'usuario', select: 'nombre email' }
        ])
        .sort({ createdAt: 'desc' });
      res.json(rutinas);
    } catch (error) {
      console.error('Error al obtener todas las rutinas:', error);
      res.status(500).json({ error: 'Error al obtener todas las rutinas' });
    }
  },

  getAdminStats: async (req, res) => {
    try {
      const totalRutinas = await Rutinas.countDocuments();
      const rutinasPorTipo = await Rutinas.aggregate([
        {
          $group: {
            _id: '$tipo',
            count: { $sum: 1 }
          }
        }
      ]);

      const rutinasPorFrecuencia = await Rutinas.aggregate([
        {
          $group: {
            _id: '$frecuencia',
            count: { $sum: 1 }
          }
        }
      ]);

      const rutinasPorPropiedad = await Rutinas.aggregate([
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
        totalRutinas,
        rutinasPorTipo,
        rutinasPorFrecuencia,
        rutinasPorPropiedad
      });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
  }
}; 