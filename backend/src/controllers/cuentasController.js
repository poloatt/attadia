import { Cuentas } from '../models/index.js';

export const cuentasController = {
  getAll: async (req, res) => {
    try {
      const cuentas = await Cuentas.find({ usuario: req.user.id })
        .populate('moneda')
        .sort({ nombre: 'asc' });
      res.json(cuentas);
    } catch (error) {
      console.error('Error al obtener cuentas:', error);
      res.status(500).json({ error: 'Error al obtener cuentas' });
    }
  },

  create: async (req, res) => {
    try {
      const { nombre, numero, tipo, monedaId } = req.body;
      const cuenta = await Cuentas.create({
        nombre,
        numero,
        tipo,
        usuario: req.user.id,
        moneda: monedaId
      });

      const cuentaPopulada = await cuenta.populate('moneda');
      res.status(201).json(cuentaPopulada);
    } catch (error) {
      console.error('Error al crear cuenta:', error);
      res.status(500).json({ error: 'Error al crear cuenta' });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, numero, tipo, monedaId } = req.body;
      
      const cuenta = await Cuentas.findOneAndUpdate(
        { _id: id, usuario: req.user.id },
        {
          nombre,
          numero,
          tipo,
          moneda: monedaId
        },
        { new: true }
      ).populate('moneda');

      if (!cuenta) {
        return res.status(404).json({ error: 'Cuenta no encontrada' });
      }

      res.json(cuenta);
    } catch (error) {
      console.error('Error al actualizar cuenta:', error);
      res.status(500).json({ error: 'Error al actualizar cuenta' });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const cuenta = await Cuentas.findOneAndDelete({
        _id: id,
        usuario: req.user.id
      });

      if (!cuenta) {
        return res.status(404).json({ error: 'Cuenta no encontrada' });
      }

      res.json({ message: 'Cuenta eliminada correctamente' });
    } catch (error) {
      console.error('Error al eliminar cuenta:', error);
      res.status(500).json({ error: 'Error al eliminar cuenta' });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const cuenta = await Cuentas.findOne({ _id: id, usuario: req.user.id })
        .populate('moneda');

      if (!cuenta) {
        return res.status(404).json({ error: 'Cuenta no encontrada' });
      }

      res.json(cuenta);
    } catch (error) {
      console.error('Error al obtener cuenta:', error);
      res.status(500).json({ error: 'Error al obtener cuenta' });
    }
  },

  getAllAdmin: async (req, res) => {
    try {
      const cuentas = await Cuentas.find()
        .populate('moneda')
        .populate('usuario', 'nombre email')
        .sort({ createdAt: 'desc' });
      res.json(cuentas);
    } catch (error) {
      console.error('Error al obtener todas las cuentas:', error);
      res.status(500).json({ error: 'Error al obtener todas las cuentas' });
    }
  },

  getAdminStats: async (req, res) => {
    try {
      const totalCuentas = await Cuentas.countDocuments();
      const cuentasPorMoneda = await Cuentas.aggregate([
        {
          $group: {
            _id: '$moneda',
            count: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'monedas',
            localField: '_id',
            foreignField: '_id',
            as: 'moneda'
          }
        },
        {
          $unwind: '$moneda'
        }
      ]);

      res.json({
        totalCuentas,
        cuentasPorMoneda
      });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
  }
}; 