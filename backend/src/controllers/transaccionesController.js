import { Transacciones } from '../models/index.js';

export const transaccionesController = {
  getAll: async (req, res) => {
    try {
      const transacciones = await Transacciones.find({ usuario: req.user.id })
        .populate('moneda')
        .populate('cuenta')
        .sort({ fecha: 'desc' });
      res.json(transacciones);
    } catch (error) {
      console.error('Error al obtener transacciones:', error);
      res.status(500).json({ error: 'Error al obtener transacciones' });
    }
  },

  create: async (req, res) => {
    try {
      const { 
        descripcion, 
        monto, 
        fecha, 
        categoria, 
        estado, 
        tipo,
        monedaId, 
        cuentaId 
      } = req.body;

      const transaccion = await Transacciones.create({
        descripcion,
        monto: parseFloat(monto),
        fecha: new Date(fecha),
        categoria,
        estado,
        tipo,
        usuario: req.user.id,
        moneda: monedaId,
        cuenta: cuentaId
      });

      const transaccionPopulada = await transaccion
        .populate(['moneda', 'cuenta']);

      res.status(201).json(transaccionPopulada);
    } catch (error) {
      console.error('Error al crear transacción:', error);
      res.status(500).json({ 
        error: 'Error al crear transacción',
        details: error.message 
      });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const transaccion = await Transacciones.findOne({ 
        _id: id, 
        usuario: req.user.id 
      }).populate(['moneda', 'cuenta']);
      
      if (!transaccion) {
        return res.status(404).json({ error: 'Transacción no encontrada' });
      }

      res.json(transaccion);
    } catch (error) {
      console.error('Error al obtener transacción:', error);
      res.status(500).json({ error: 'Error al obtener transacción' });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { 
        descripcion, 
        monto, 
        fecha, 
        categoria, 
        estado, 
        tipo,
        monedaId, 
        cuentaId 
      } = req.body;

      const transaccion = await Transacciones.findOneAndUpdate(
        { _id: id, usuario: req.user.id },
        {
          descripcion,
          monto: parseFloat(monto),
          fecha: new Date(fecha),
          categoria,
          estado,
          tipo,
          moneda: monedaId,
          cuenta: cuentaId
        },
        { new: true }
      ).populate(['moneda', 'cuenta']);

      if (!transaccion) {
        return res.status(404).json({ error: 'Transacción no encontrada' });
      }

      res.json(transaccion);
    } catch (error) {
      console.error('Error al actualizar transacción:', error);
      res.status(500).json({ error: 'Error al actualizar transacción' });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const transaccion = await Transacciones.findOneAndDelete({
        _id: id,
        usuario: req.user.id
      });

      if (!transaccion) {
        return res.status(404).json({ error: 'Transacción no encontrada' });
      }

      res.json({ message: 'Transacción eliminada correctamente' });
    } catch (error) {
      console.error('Error al eliminar transacción:', error);
      res.status(500).json({ error: 'Error al eliminar transacción' });
    }
  },

  getStats: async (req, res) => {
    try {
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);

      const transaccionesMes = await Transacciones.find({
        usuario: req.user.id,
        fecha: { $gte: inicioMes }
      });

      const ingresosMensuales = transaccionesMes
        .filter(t => t.tipo === 'INGRESO')
        .reduce((sum, t) => sum + t.monto, 0);

      const egresosMensuales = transaccionesMes
        .filter(t => t.tipo === 'EGRESO')
        .reduce((sum, t) => sum + t.monto, 0);

      res.json({
        ingresosMensuales,
        egresosMensuales,
        balance: ingresosMensuales - egresosMensuales
      });
    } catch (error) {
      console.error('Error en getStats transacciones:', error);
      res.status(500).json({ message: error.message });
    }
  },

  getAllAdmin: async (req, res) => {
    try {
      const transacciones = await Transacciones.find()
        .populate([
          { path: 'moneda', select: 'nombre simbolo' },
          { path: 'cuenta', select: 'nombre numero' },
          { path: 'usuario', select: 'nombre email' }
        ])
        .sort({ createdAt: 'desc' });
      res.json(transacciones);
    } catch (error) {
      console.error('Error al obtener todas las transacciones:', error);
      res.status(500).json({ error: 'Error al obtener todas las transacciones' });
    }
  },

  getAdminStats: async (req, res) => {
    try {
      const totalTransacciones = await Transacciones.countDocuments();
      
      const transaccionesPorTipo = await Transacciones.aggregate([
        {
          $group: {
            _id: '$tipo',
            count: { $sum: 1 },
            montoTotal: { $sum: '$monto' }
          }
        }
      ]);

      const transaccionesPorCategoria = await Transacciones.aggregate([
        {
          $group: {
            _id: '$categoria',
            count: { $sum: 1 },
            montoTotal: { $sum: '$monto' }
          }
        }
      ]);

      const transaccionesPorMoneda = await Transacciones.aggregate([
        {
          $group: {
            _id: '$moneda',
            count: { $sum: 1 },
            montoTotal: { $sum: '$monto' }
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
        totalTransacciones,
        transaccionesPorTipo,
        transaccionesPorCategoria,
        transaccionesPorMoneda
      });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
  }
}; 