import { Labs } from '../models/index.js';

export const labsController = {
  getAll: async (req, res) => {
    try {
      const labs = await Labs.find({ usuario: req.user.id })
        .sort({ fecha: 'desc' });
      res.json(labs);
    } catch (error) {
      console.error('Error al obtener labs:', error);
      res.status(500).json({ error: 'Error al obtener labs' });
    }
  },

  create: async (req, res) => {
    try {
      const {
        nombre,
        descripcion,
        tipo,
        resultado,
        estado
      } = req.body;

      const lab = await Labs.create({
        nombre,
        descripcion,
        tipo,
        resultado,
        estado,
        usuario: req.user.id
      });

      res.status(201).json(lab);
    } catch (error) {
      console.error('Error al crear lab:', error);
      res.status(500).json({ error: 'Error al crear lab' });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const lab = await Labs.findOne({ _id: id, usuario: req.user.id });
      
      if (!lab) {
        return res.status(404).json({ error: 'Lab no encontrado' });
      }

      res.json(lab);
    } catch (error) {
      console.error('Error al obtener lab:', error);
      res.status(500).json({ error: 'Error al obtener lab' });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };

      const lab = await Labs.findOneAndUpdate(
        { _id: id, usuario: req.user.id },
        updateData,
        { new: true }
      );

      if (!lab) {
        return res.status(404).json({ error: 'Lab no encontrado' });
      }

      res.json(lab);
    } catch (error) {
      console.error('Error al actualizar lab:', error);
      res.status(500).json({ error: 'Error al actualizar lab' });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const lab = await Labs.findOneAndDelete({
        _id: id,
        usuario: req.user.id
      });

      if (!lab) {
        return res.status(404).json({ error: 'Lab no encontrado' });
      }

      res.json({ message: 'Lab eliminado correctamente' });
    } catch (error) {
      console.error('Error al eliminar lab:', error);
      res.status(500).json({ error: 'Error al eliminar lab' });
    }
  },

  getAllAdmin: async (req, res) => {
    try {
      const labs = await Labs.find()
        .populate('usuario', 'nombre email')
        .sort({ createdAt: 'desc' });
      res.json(labs);
    } catch (error) {
      console.error('Error al obtener todos los labs:', error);
      res.status(500).json({ error: 'Error al obtener todos los labs' });
    }
  },

  getAdminStats: async (req, res) => {
    try {
      const totalLabs = await Labs.countDocuments();
      const labsPorEstado = await Labs.aggregate([
        {
          $group: {
            _id: '$estado',
            count: { $sum: 1 }
          }
        }
      ]);

      const labsPorTipo = await Labs.aggregate([
        {
          $group: {
            _id: '$tipo',
            count: { $sum: 1 }
          }
        }
      ]);

      res.json({
        totalLabs,
        labsPorEstado,
        labsPorTipo
      });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
  }
}; 