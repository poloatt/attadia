import { BaseController } from './BaseController.js';
import { Transacciones, Cuentas } from '../models/index.js';

class TransaccionesController extends BaseController {
  constructor() {
    super(Transacciones, {
      searchFields: ['descripcion', 'categoria']
    });

    // Bind de los métodos al contexto de la instancia
    this.getStats = this.getStats.bind(this);
    this.getBalance = this.getBalance.bind(this);
    this.getByCuenta = this.getByCuenta.bind(this);
    this.create = this.create.bind(this);
    this.updateEstado = this.updateEstado.bind(this);
    this.getResumen = this.getResumen.bind(this);
  }

  // GET /api/transacciones/stats
  async getStats(req, res) {
    try {
      const query = { 
        usuario: req.user.id,
        estado: 'COMPLETADA'
      };

      const [ingresos, egresos] = await Promise.all([
        this.Model.aggregate([
          { 
            $match: { 
              ...query,
              tipo: 'INGRESO'
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$monto' }
            }
          }
        ]),
        this.Model.aggregate([
          { 
            $match: { 
              ...query,
              tipo: 'EGRESO'
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$monto' }
            }
          }
        ])
      ]);

      res.json({
        ingresosMensuales: ingresos[0]?.total || 0,
        egresosMensuales: egresos[0]?.total || 0,
        balanceTotal: (ingresos[0]?.total || 0) - (egresos[0]?.total || 0),
        monedaPrincipal: 'USD'
      });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // GET /api/transacciones/balance/:cuentaId
  getBalance = async (req, res) => {
    try {
      const balance = await this.Model.getBalance(req.params.cuentaId);
      res.json(balance);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // GET /api/transacciones/by-cuenta/:cuentaId
  getByCuenta = async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 10, 
        sort = '-fecha',
        estado,
        tipo,
        categoria,
        fechaInicio,
        fechaFin
      } = req.query;

      const query = { cuenta: req.params.cuentaId };

      if (estado) query.estado = estado;
      if (tipo) query.tipo = tipo;
      if (categoria) query.categoria = categoria;
      if (fechaInicio || fechaFin) {
        query.fecha = {};
        if (fechaInicio) query.fecha.$gte = new Date(fechaInicio);
        if (fechaFin) query.fecha.$lte = new Date(fechaFin);
      }

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort,
        populate: ['moneda']
      };

      const result = await this.Model.paginate(query, options);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // POST /api/transacciones
  create = async (req, res) => {
    try {
      // Validar que la cuenta exista y pertenezca al usuario
      const cuenta = await Cuentas.findOne({
        _id: req.body.cuenta,
        usuario: req.user.id
      });

      if (!cuenta) {
        return res.status(404).json({ message: 'Cuenta no encontrada' });
      }

      const transaccion = new this.Model({
        ...req.body,
        usuario: req.user.id
      });

      await transaccion.save();
      res.status(201).json(transaccion);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  // PATCH /api/transacciones/:id/estado
  updateEstado = async (req, res) => {
    try {
      const { estado } = req.body;
      
      if (!['PENDIENTE', 'COMPLETADA', 'CANCELADA'].includes(estado)) {
        return res.status(400).json({ message: 'Estado no válido' });
      }

      const transaccion = await this.Model.findOneAndUpdate(
        { _id: req.params.id, usuario: req.user.id },
        { estado },
        { new: true, runValidators: true }
      );

      if (!transaccion) {
        return res.status(404).json({ message: 'Transacción no encontrada' });
      }

      res.json(transaccion);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

  // GET /api/transacciones/resumen
  getResumen = async (req, res) => {
    try {
      const { fechaInicio, fechaFin } = req.query;
      const query = { 
        usuario: req.user.id,
        estado: 'COMPLETADA'
      };

      if (fechaInicio || fechaFin) {
        query.fecha = {};
        if (fechaInicio) query.fecha.$gte = new Date(fechaInicio);
        if (fechaFin) query.fecha.$lte = new Date(fechaFin);
      }

      const resumen = await this.Model.aggregate([
        { $match: query },
        { $group: {
          _id: {
            tipo: '$tipo',
            categoria: '$categoria',
            moneda: '$moneda'
          },
          total: { $sum: '$monto' },
          cantidad: { $sum: 1 }
        }},
        { $group: {
          _id: '$_id.moneda',
          categorias: {
            $push: {
              tipo: '$_id.tipo',
              categoria: '$_id.categoria',
              total: '$total',
              cantidad: '$cantidad'
            }
          }
        }},
        { $lookup: {
          from: 'monedas',
          localField: '_id',
          foreignField: '_id',
          as: 'moneda'
        }},
        { $unwind: '$moneda' }
      ]);

      res.json(resumen);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
}

export const transaccionesController = new TransaccionesController(); 