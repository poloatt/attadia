import { Dietas } from '../models/index.js';

export const dietasController = {
  getAll: async (req, res) => {
    try {
      const dietas = await Dietas.find({ usuario: req.user.id })
        .sort({ fecha: 'desc' });
      res.json(dietas);
    } catch (error) {
      console.error('Error al obtener dietas:', error);
      res.status(500).json({ error: 'Error al obtener dietas' });
    }
  },

  getById: async (req, res) => {
    try {
      const dieta = await Dietas.findOne({
        _id: req.params.id,
        usuario: req.user.id
      });
      if (!dieta) {
        return res.status(404).json({ error: 'Dieta no encontrada' });
      }
      res.json(dieta);
    } catch (error) {
      console.error('Error al obtener dieta:', error);
      res.status(500).json({ error: 'Error al obtener dieta' });
    }
  },

  create: async (req, res) => {
    try {
      const dieta = await Dietas.create({
        ...req.body,
        usuario: req.user.id
      });
      res.status(201).json(dieta);
    } catch (error) {
      console.error('Error al crear dieta:', error);
      res.status(500).json({ error: 'Error al crear dieta' });
    }
  },

  update: async (req, res) => {
    try {
      const dieta = await Dietas.findOneAndUpdate(
        { _id: req.params.id, usuario: req.user.id },
        req.body,
        { new: true }
      );
      if (!dieta) {
        return res.status(404).json({ error: 'Dieta no encontrada' });
      }
      res.json(dieta);
    } catch (error) {
      console.error('Error al actualizar dieta:', error);
      res.status(500).json({ error: 'Error al actualizar dieta' });
    }
  },

  delete: async (req, res) => {
    try {
      const dieta = await Dietas.findOneAndDelete({
        _id: req.params.id,
        usuario: req.user.id
      });
      if (!dieta) {
        return res.status(404).json({ error: 'Dieta no encontrada' });
      }
      res.json({ message: 'Dieta eliminada correctamente' });
    } catch (error) {
      console.error('Error al eliminar dieta:', error);
      res.status(500).json({ error: 'Error al eliminar dieta' });
    }
  },

  getAllAdmin: async (req, res) => {
    try {
      const dietas = await Dietas.find()
        .populate('usuario', 'nombre email')
        .sort({ fecha: 'desc' });
      res.json(dietas);
    } catch (error) {
      console.error('Error al obtener dietas:', error);
      res.status(500).json({ error: 'Error al obtener dietas' });
    }
  },

  getAdminStats: async (req, res) => {
    try {
      const stats = await Dietas.aggregate([
        {
          $group: {
            _id: '$tipo',
            count: { $sum: 1 },
            caloriasTotales: { $sum: '$calorias' }
          }
        }
      ]);
      res.json(stats);
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
  }
}; 