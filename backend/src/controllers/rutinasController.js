import { Rutinas } from '../models/Rutinas.js';

export const rutinasController = {
  getAll: async (req, res) => {
    try {
      const rutinas = await Rutinas.find({ usuario: req.user.id })
        .sort({ fecha: -1 });
      res.json(rutinas);
    } catch (error) {
      console.error('Error al obtener rutinas:', error);
      res.status(500).json({ msg: 'Hubo un error al obtener las rutinas' });
    }
  },

  create: async (req, res) => {
    try {
      const { weight, muscle, fatPercent, stress, sleep, completitud } = req.body;

      const nuevaRutina = new Rutinas({
        weight,
        muscle,
        fatPercent,
        stress,
        sleep,
        completitud,
        usuario: req.user.id
      });

      await nuevaRutina.save();
      res.json(nuevaRutina);
    } catch (error) {
      console.error('Error al crear rutina:', error);
      res.status(500).json({ msg: 'Hubo un error al crear la rutina' });
    }
  },

  getById: async (req, res) => {
    try {
      const rutina = await Rutinas.findById(req.params.id);
      if (!rutina) {
        return res.status(404).json({ msg: 'Rutina no encontrada' });
      }
      res.json(rutina);
    } catch (error) {
      console.error('Error al obtener rutina:', error);
      res.status(500).json({ msg: 'Hubo un error al obtener la rutina' });
    }
  },

  update: async (req, res) => {
    try {
      const { weight, muscle, fatPercent, stress, sleep, completitud } = req.body;
      const rutina = await Rutinas.findByIdAndUpdate(
        req.params.id,
        { weight, muscle, fatPercent, stress, sleep, completitud },
        { new: true }
      );
      if (!rutina) {
        return res.status(404).json({ msg: 'Rutina no encontrada' });
      }
      res.json(rutina);
    } catch (error) {
      console.error('Error al actualizar rutina:', error);
      res.status(500).json({ msg: 'Hubo un error al actualizar la rutina' });
    }
  },

  delete: async (req, res) => {
    try {
      const rutina = await Rutinas.findByIdAndDelete(req.params.id);
      if (!rutina) {
        return res.status(404).json({ msg: 'Rutina no encontrada' });
      }
      res.json({ msg: 'Rutina eliminada' });
    } catch (error) {
      console.error('Error al eliminar rutina:', error);
      res.status(500).json({ msg: 'Hubo un error al eliminar la rutina' });
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