import { BaseController } from './BaseController.js';
import { Transacciones, Cuentas } from '../models/index.js';
import mongoose from 'mongoose';
import { buildEstadoFilter } from '../utils/transaccionEstado.js';

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

  // GET /api/transacciones/stats?fechaInicio&fechaFin&estado
  async getStats(req, res) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const { fechaInicio, fechaFin, estado = 'PAGADO' } = req.query;
      const now = new Date();
      const defaultInicio = new Date(now.getFullYear(), now.getMonth(), 1);
      const defaultFin = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      const inicio = fechaInicio ? new Date(fechaInicio) : defaultInicio;
      const fin = fechaFin ? new Date(fechaFin) : defaultFin;
      if (fechaFin && !fechaFin.includes('T')) {
        fin.setHours(23, 59, 59, 999);
      }

      const query = {
        usuario: new mongoose.Types.ObjectId(req.user.id),
        fecha: { $gte: inicio, $lte: fin },
      };
      const estadoFilter = buildEstadoFilter(estado);
      if (estadoFilter) query.estado = estadoFilter;

      const resultados = await this.Model.aggregate([
        { $match: query },
        {
          $group: {
            _id: { tipo: '$tipo', moneda: '$moneda' },
            total: { $sum: { $ifNull: ['$monto', 0] } },
          },
        },
        {
          $lookup: {
            from: 'monedas',
            localField: '_id.moneda',
            foreignField: '_id',
            as: 'monedaDoc',
          },
        },
        { $unwind: { path: '$monedaDoc', preserveNullAndEmptyArrays: true } },
      ]);

      let ingresos = 0;
      let egresos = 0;
      const porMonedaMap = new Map();

      for (const row of resultados) {
        const monto = row.total || 0;
        const tipo = row._id?.tipo;
        const monedaId = row._id?.moneda?.toString?.() || row._id?.moneda || 'sin-moneda';

        if (tipo === 'INGRESO') ingresos += monto;
        else if (tipo === 'EGRESO') egresos += monto;

        if (!porMonedaMap.has(monedaId)) {
          porMonedaMap.set(monedaId, {
            monedaId,
            codigo: row.monedaDoc?.codigo || '—',
            simbolo: row.monedaDoc?.simbolo || '$',
            color: row.monedaDoc?.color || '#4CAF50',
            ingresos: 0,
            egresos: 0,
          });
        }
        const entry = porMonedaMap.get(monedaId);
        if (tipo === 'INGRESO') entry.ingresos += monto;
        else if (tipo === 'EGRESO') entry.egresos += monto;
      }

      const porMoneda = [...porMonedaMap.values()].map((m) => ({
        ...m,
        balance: m.ingresos - m.egresos,
      }));

      res.json({
        ingresos,
        egresos,
        balance: ingresos - egresos,
        fechaInicio: inicio.toISOString().split('T')[0],
        fechaFin: fin.toISOString().split('T')[0],
        estado,
        porMoneda,
        // Compatibilidad con consumidores antiguos
        ingresosMensuales: ingresos,
        egresosMensuales: egresos,
        balanceTotal: ingresos - egresos,
      });
    } catch (error) {
      console.error('Error en getStats transacciones:', error);
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

      if (estado) query.estado = buildEstadoFilter(estado);
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
      console.log('Creando transacción con datos:', req.body);
      
      // Validar que el ID de la cuenta sea válido
      if (!mongoose.Types.ObjectId.isValid(req.body.cuenta)) {
        return res.status(400).json({ message: 'ID de cuenta inválido' });
      }

      // Validar que la cuenta exista y pertenezca al usuario
      const cuenta = await Cuentas.findOne({
        _id: req.body.cuenta,
        usuario: req.user.id
      });

      if (!cuenta) {
        console.error('Cuenta no encontrada:', {
          cuentaId: req.body.cuenta,
          userId: req.user.id
        });
        return res.status(404).json({ message: 'La cuenta seleccionada no existe o no pertenece al usuario' });
      }

      // Crear la transacción - el middleware se encargará de asignar la moneda
      const transaccion = new this.Model({
        ...req.body,
        usuario: req.user.id,
        cuenta: cuenta._id
        // No asignamos moneda aquí - lo hace el middleware
      });

      await transaccion.save();
      await transaccion.populate(['moneda', 'cuenta']);
      
      res.status(201).json(transaccion);
    } catch (error) {
      console.error('Error al crear transacción:', error);
      if (error.name === 'ValidationError') {
        return res.status(400).json({ 
          message: 'Error de validación', 
          errors: Object.values(error.errors).map(e => e.message)
        });
      }
      res.status(500).json({ message: error.message });
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

  // Sobrescribimos el método getAll del BaseController
  getAll = async (req, res) => {
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

      const query = { usuario: req.user.id };

      if (estado) query.estado = buildEstadoFilter(estado);
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
        populate: ['moneda', 'cuenta'],
        lean: true, // Para mejor rendimiento
        leanWithId: true, // Agrega 'id' además de '_id'
      };

      const result = await this.Model.paginate(query, options);
      
      // Transformar los IDs en la respuesta
      const transformedDocs = result.docs.map(doc => ({
        ...doc,
        id: doc._id.toString(),
        moneda: doc.moneda ? {
          ...doc.moneda,
          id: doc.moneda._id.toString()
        } : null,
        cuenta: doc.cuenta ? {
          ...doc.cuenta,
          id: doc.cuenta._id.toString()
        } : null
      }));

      res.json({
        ...result,
        docs: transformedDocs
      });
    } catch (error) {
      console.error('Error en getAll:', error);
      res.status(500).json({ error: error.message });
    }
  };
}

export const transaccionesController = new TransaccionesController(); 