import { BaseController } from './BaseController.js';
import { Transacciones, Cuentas } from '../models/index.js';
import mongoose from 'mongoose';

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
      console.log('Usuario actual:', req.user);
      
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const query = { 
        estado: 'COMPLETADA',
        usuario: new mongoose.Types.ObjectId(req.user.id)
      };

      console.log('Query a ejecutar:', JSON.stringify(query, null, 2));

      const pipeline = [
        { 
          $match: query
        },
        {
          $group: {
            _id: '$tipo',
            total: { $sum: { $ifNull: ['$monto', 0] } }
          }
        }
      ];

      console.log('Pipeline a ejecutar:', JSON.stringify(pipeline, null, 2));

      const resultados = await this.Model.aggregate(pipeline);
      console.log('Resultados de agregación:', resultados);

      const ingresos = resultados.find(r => r._id === 'INGRESO')?.total || 0;
      const egresos = resultados.find(r => r._id === 'EGRESO')?.total || 0;

      const response = {
        ingresosMensuales: ingresos,
        egresosMensuales: egresos,
        balanceTotal: ingresos - egresos,
        monedaPrincipal: 'USD'
      };

      console.log('Respuesta a enviar:', response);
      res.json(response);
    } catch (error) {
      console.error('Error detallado en getStats:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code
      });

      if (error.name === 'MongoError' || error.name === 'MongoServerError') {
        return res.status(500).json({ 
          error: 'Error en la base de datos',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }

      if (error.name === 'ValidationError') {
        return res.status(400).json({ 
          error: 'Error de validación',
          details: error.message
        });
      }

      res.status(500).json({ 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
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
      console.log('Creando transacción con datos:', req.body);
      
      // Validar que el ID de la cuenta sea válido
      if (!mongoose.Types.ObjectId.isValid(req.body.cuenta)) {
        return res.status(400).json({ message: 'ID de cuenta inválido' });
      }

      // Validar que la cuenta exista y pertenezca al usuario
      const cuenta = await Cuentas.findOne({
        _id: req.body.cuenta,
        usuario: req.user.id
      }).populate('moneda');

      if (!cuenta) {
        console.error('Cuenta no encontrada:', {
          cuentaId: req.body.cuenta,
          userId: req.user.id
        });
        return res.status(404).json({ message: 'La cuenta seleccionada no existe o no pertenece al usuario' });
      }

      if (!cuenta.moneda) {
        console.error('Cuenta sin moneda asociada:', cuenta);
        return res.status(400).json({ message: 'La cuenta seleccionada no tiene una moneda asociada' });
      }

      // Crear la transacción usando los _id
      const transaccion = new this.Model({
        ...req.body,
        usuario: req.user.id,
        cuenta: cuenta._id,
        moneda: cuenta.moneda._id
      });

      await transaccion.save();
      await transaccion.populate(['moneda', 'cuenta']);
      
      // La transformación a JSON ya está manejada por el BaseSchema
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