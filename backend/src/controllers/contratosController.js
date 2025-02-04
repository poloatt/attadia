import { Contratos } from '../models/index.js';

export const contratosController = {
  getAll: async (req, res) => {
    try {
      const contratos = await Contratos.find()
        .populate(['propiedad', 'inquilino', 'moneda'])
        .sort({ fechaInicio: 'desc' });
      res.json(contratos);
    } catch (error) {
      console.error('Error al obtener contratos:', error);
      res.status(500).json({ error: 'Error al obtener contratos' });
    }
  },

  create: async (req, res) => {
    try {
      const { 
        fechaInicio, 
        fechaFin, 
        montoAlquiler, 
        deposito, 
        estado, 
        documentoUrl, 
        propiedadId, 
        inquilinoId, 
        monedaId 
      } = req.body;

      const contrato = await Contratos.create({
        fechaInicio: new Date(fechaInicio),
        fechaFin: fechaFin ? new Date(fechaFin) : null,
        montoMensual: parseFloat(montoAlquiler),
        estado,
        propiedad: propiedadId,
        inquilino: inquilinoId,
        moneda: monedaId
      });

      const contratoPopulado = await contrato
        .populate(['propiedad', 'inquilino', 'moneda']);

      res.status(201).json(contratoPopulado);
    } catch (error) {
      console.error('Error al crear contrato:', error);
      res.status(500).json({ error: 'Error al crear contrato' });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };
      
      if (updateData.fechaInicio) updateData.fechaInicio = new Date(updateData.fechaInicio);
      if (updateData.fechaFin) updateData.fechaFin = new Date(updateData.fechaFin);
      if (updateData.montoAlquiler) updateData.montoAlquiler = parseFloat(updateData.montoAlquiler);
      if (updateData.deposito) updateData.deposito = parseFloat(updateData.deposito);

      const contrato = await Contratos.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      ).populate(['propiedad', 'inquilino', 'moneda']);

      if (!contrato) {
        return res.status(404).json({ error: 'Contrato no encontrado' });
      }

      res.json(contrato);
    } catch (error) {
      console.error('Error al actualizar contrato:', error);
      res.status(500).json({ error: 'Error al actualizar contrato' });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const contrato = await Contratos.findByIdAndDelete(id);

      if (!contrato) {
        return res.status(404).json({ error: 'Contrato no encontrado' });
      }

      res.json({ message: 'Contrato eliminado correctamente' });
    } catch (error) {
      console.error('Error al eliminar contrato:', error);
      res.status(500).json({ error: 'Error al eliminar contrato' });
    }
  },

  getActivos: async (req, res) => {
    try {
      const contratos = await Contratos.find({ estado: 'ACTIVO' })
        .populate(['propiedad', 'inquilino', 'moneda']);
      res.json(contratos);
    } catch (error) {
      console.error('Error al obtener contratos activos:', error);
      res.status(500).json({ error: 'Error al obtener contratos activos' });
    }
  },

  getAllAdmin: async (req, res) => {
    try {
      const contratos = await Contratos.find()
        .populate([
          { path: 'propiedad', select: 'nombre direccion' },
          { path: 'inquilino', select: 'nombre email' },
          { path: 'usuario', select: 'nombre email' }
        ])
        .sort({ fechaInicio: 'desc' });
      res.json(contratos);
    } catch (error) {
      console.error('Error al obtener contratos:', error);
      res.status(500).json({ error: 'Error al obtener contratos' });
    }
  },

  updateStatus: async (req, res) => {
    try {
      const { estado } = req.body;
      const contrato = await Contratos.findByIdAndUpdate(
        req.params.id,
        { estado },
        { new: true }
      ).populate([
        { path: 'propiedad', select: 'nombre direccion' },
        { path: 'inquilino', select: 'nombre email' }
      ]);

      if (!contrato) {
        return res.status(404).json({ error: 'Contrato no encontrado' });
      }

      res.json(contrato);
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      res.status(500).json({ error: 'Error al actualizar estado' });
    }
  },

  getAdminStats: async (req, res) => {
    try {
      const stats = await Contratos.aggregate([
        {
          $group: {
            _id: '$estado',
            count: { $sum: 1 },
            montoTotal: { $sum: '$montoMensual' }
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

      res.json(formattedStats);
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const contrato = await Contratos.findById(id)
        .populate(['propiedad', 'inquilino', 'moneda', 'habitacion']);
      
      if (!contrato) {
        return res.status(404).json({ error: 'Contrato no encontrado' });
      }
      
      res.json(contrato);
    } catch (error) {
      console.error('Error al obtener contrato:', error);
      res.status(500).json({ error: 'Error al obtener contrato' });
    }
  },

  getAllByPropiedad: async (req, res) => {
    try {
      const { propiedadId } = req.params;
      const contratos = await Contratos.find({ propiedad: propiedadId })
        .populate(['inquilino', 'moneda', 'habitacion'])
        .sort({ fechaInicio: 'desc' });
      res.json(contratos);
    } catch (error) {
      console.error('Error al obtener contratos de la propiedad:', error);
      res.status(500).json({ error: 'Error al obtener contratos de la propiedad' });
    }
  }
}; 