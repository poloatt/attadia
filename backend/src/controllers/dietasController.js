import { Dietas } from '../models/Dietas.js';

export const dietasController = {
  getAll: async (req, res) => {
    try {
      const dietas = await Dietas.find({ usuario: req.user.id })
        .sort({ fecha: -1 });
      res.json(dietas);
    } catch (error) {
      console.error('Error al obtener dietas:', error);
      res.status(500).json({ msg: 'Hubo un error al obtener las dietas' });
    }
  },

  getById: async (req, res) => {
    try {
      const dieta = await Dietas.findById(req.params.id);
      if (!dieta) {
        return res.status(404).json({ msg: 'Dieta no encontrada' });
      }
      res.json(dieta);
    } catch (error) {
      console.error('Error al obtener dieta:', error);
      res.status(500).json({ msg: 'Hubo un error al obtener la dieta' });
    }
  },

  create: async (req, res) => {
    try {
      const { tipo, calorias, proteinas, carbohidratos, grasas, notas } = req.body;

      const nuevaDieta = new Dietas({
        tipo,
        calorias,
        proteinas,
        carbohidratos,
        grasas,
        notas,
        usuario: req.user.id
      });

      await nuevaDieta.save();
      res.json(nuevaDieta);
    } catch (error) {
      console.error('Error al crear dieta:', error);
      res.status(500).json({ msg: 'Hubo un error al crear la dieta' });
    }
  },

  update: async (req, res) => {
    try {
      const { tipo, calorias, proteinas, carbohidratos, grasas, notas } = req.body;
      const dieta = await Dietas.findByIdAndUpdate(
        req.params.id,
        { tipo, calorias, proteinas, carbohidratos, grasas, notas },
        { new: true }
      );
      if (!dieta) {
        return res.status(404).json({ msg: 'Dieta no encontrada' });
      }
      res.json(dieta);
    } catch (error) {
      console.error('Error al actualizar dieta:', error);
      res.status(500).json({ msg: 'Hubo un error al actualizar la dieta' });
    }
  },

  delete: async (req, res) => {
    try {
      const dieta = await Dietas.findByIdAndDelete(req.params.id);
      if (!dieta) {
        return res.status(404).json({ msg: 'Dieta no encontrada' });
      }
      res.json({ msg: 'Dieta eliminada' });
    } catch (error) {
      console.error('Error al eliminar dieta:', error);
      res.status(500).json({ msg: 'Hubo un error al eliminar la dieta' });
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