import { Objetivos } from '../models/index.js';

export const objetivosController = {
  getAll: async (req, res) => {
    try {
      const objetivos = await Objetivos.find({ usuario: req.user.id })
        .populate('propiedad')
        .sort({ fechaObjetivo: 'asc' });
      res.json(objetivos);
    } catch (error) {
      console.error('Error al obtener objetivos:', error);
      res.status(500).json({ error: 'Error al obtener objetivos' });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const objetivo = await Objetivos.findOne({ _id: id, usuario: req.user.id })
        .populate('propiedad');

      if (!objetivo) {
        return res.status(404).json({ error: 'Objetivo no encontrado' });
      }

      res.json(objetivo);
    } catch (error) {
      console.error('Error al obtener objetivo:', error);
      res.status(500).json({ error: 'Error al obtener objetivo' });
    }
  },

  create: async (req, res) => {
    try {
      const {
        titulo,
        descripcion,
        tipo,
        fechaInicio,
        fechaObjetivo,
        metrica,
        propiedadId
      } = req.body;

      const objetivo = await Objetivos.create({
        titulo,
        descripcion,
        tipo,
        fechaInicio: new Date(fechaInicio),
        fechaObjetivo: new Date(fechaObjetivo),
        metrica,
        propiedad: propiedadId,
        usuario: req.user.id
      });

      const objetivoPopulado = await objetivo.populate('propiedad');
      res.status(201).json(objetivoPopulado);
    } catch (error) {
      console.error('Error al crear objetivo:', error);
      res.status(500).json({ error: 'Error al crear objetivo' });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };

      if (updateData.fechaInicio) updateData.fechaInicio = new Date(updateData.fechaInicio);
      if (updateData.fechaObjetivo) updateData.fechaObjetivo = new Date(updateData.fechaObjetivo);

      const objetivo = await Objetivos.findOneAndUpdate(
        { _id: id, usuario: req.user.id },
        updateData,
        { new: true }
      ).populate('propiedad');

      if (!objetivo) {
        return res.status(404).json({ error: 'Objetivo no encontrado' });
      }

      res.json(objetivo);
    } catch (error) {
      console.error('Error al actualizar objetivo:', error);
      res.status(500).json({ error: 'Error al actualizar objetivo' });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const objetivo = await Objetivos.findOneAndDelete({
        _id: id,
        usuario: req.user.id
      });

      if (!objetivo) {
        return res.status(404).json({ error: 'Objetivo no encontrado' });
      }

      res.json({ message: 'Objetivo eliminado correctamente' });
    } catch (error) {
      console.error('Error al eliminar objetivo:', error);
      res.status(500).json({ error: 'Error al eliminar objetivo' });
    }
  },

  getStats: async (req, res) => {
    try {
      const stats = await Objetivos.aggregate([
        { $match: { usuario: req.user.id } },
        {
          $group: {
            _id: '$estado',
            count: { $sum: 1 }
          }
        }
      ]);

      const formattedStats = stats.reduce((acc, curr) => {
        acc[curr._id.toLowerCase()] = curr.count;
        return acc;
      }, {});

      res.json(formattedStats);
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
  },

  getAllAdmin: async (req, res) => {
    try {
      const objetivos = await Objetivos.find()
        .populate('usuario', 'nombre email')
        .sort({ fechaLimite: 'asc' });
      res.json(objetivos);
    } catch (error) {
      console.error('Error al obtener objetivos:', error);
      res.status(500).json({ error: 'Error al obtener objetivos' });
    }
  },

  getAdminStats: async (req, res) => {
    try {
      const stats = await Objetivos.aggregate([
        {
          $group: {
            _id: '$estado',
            count: { $sum: 1 },
            montoTotal: { $sum: '$montoObjetivo' }
          }
        }
      ]);

      const formattedStats = stats.reduce((acc, stat) => {
        acc[stat._id.toLowerCase()] = {
          cantidad: stat.count,
          montoTotal: stat.montoTotal
        };
        return acc;
      }, {});

      // Agregar estadísticas adicionales
      const totalObjetivos = await Objetivos.countDocuments();
      const objetivosCumplidos = await Objetivos.countDocuments({ estado: 'CUMPLIDO' });
      
      formattedStats.general = {
        total: totalObjetivos,
        cumplidos: objetivosCumplidos,
        porcentajeCumplimiento: (objetivosCumplidos / totalObjetivos) * 100
      };

      res.json(formattedStats);
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
  }
}; 