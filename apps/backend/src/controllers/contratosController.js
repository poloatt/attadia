import { BaseController } from './BaseController.js';
import { Contratos, Inquilinos, Propiedades } from '../models/index.js';
import mongoose from 'mongoose';
import statusCache from '../utils/statusCache.js';

class ContratosController extends BaseController {
  constructor() {
    super(Contratos, {
      searchFields: ['observaciones', 'tipoContrato'],
      populate: [
        { 
          path: 'propiedad',
          select: 'titulo direccion ciudad estado tipo metrosCuadrados precio'
        },
        {
          path: 'inquilino',
          select: 'nombre apellido email telefono estado'
        },
        {
          path: 'habitacion',
          select: 'nombre tipo'
        },
        { 
          path: 'cuenta',
          populate: { 
            path: 'moneda',
            select: 'nombre simbolo codigo'
          }
        },
        {
          path: 'moneda',
          select: 'nombre simbolo codigo'
        }
      ]
    });

    // Bind de los métodos al contexto de la instancia
    this.getActivos = this.getActivos.bind(this);
    this.getAllAdmin = this.getAllAdmin.bind(this);
    this.getAdminStats = this.getAdminStats.bind(this);
    this.updateStatus = this.updateStatus.bind(this);
    this.create = this.create.bind(this);
    this.getAll = this.getAll.bind(this);
    this.getAllByPropiedad = this.getAllByPropiedad.bind(this);
    this.getByEstado = this.getByEstado.bind(this);
    this.finalizarContrato = this.finalizarContrato.bind(this);
    this.getByPropiedad = this.getByPropiedad.bind(this);
    this.getActivosByPropiedad = this.getActivosByPropiedad.bind(this);
    this.getMantenimientoByPropiedad = this.getMantenimientoByPropiedad.bind(this);
    this.getByInquilino = this.getByInquilino.bind(this);
    this.getActivoByInquilino = this.getActivoByInquilino.bind(this);
    this.getHistorialByInquilino = this.getHistorialByInquilino.bind(this);
    this.update = this.update.bind(this);
    this.getById = this.getById.bind(this);
    this.delete = this.delete.bind(this);
    this.toggleActive = this.toggleActive.bind(this);
    this.getSelectOptions = this.getSelectOptions.bind(this);
  }

  // Método auxiliar para formatear la respuesta
  formatResponse(doc) {
    if (!doc) return null;
    const formatted = doc.toObject ? doc.toObject() : doc;
    
    // Asegurarse que las propiedades relacionadas existan
    const propiedad = formatted.propiedad || {};
    const inquilinos = Array.isArray(formatted.inquilino) ? formatted.inquilino : [formatted.inquilino];
    const habitacion = formatted.habitacion || {};
    const cuenta = formatted.cuenta || {};
    
    return {
      ...formatted,
      id: formatted._id,
      propiedad: {
        ...propiedad,
        id: propiedad._id,
        titulo: propiedad.titulo || 'Propiedad no encontrada'
      },
      inquilino: inquilinos.filter(Boolean).map(inq => ({
        ...inq,
        id: inq._id
      })),
      habitacion: habitacion._id ? {
        ...habitacion,
        id: habitacion._id
      } : null,
      cuenta: cuenta._id ? {
        ...cuenta,
        id: cuenta._id,
        moneda: cuenta.moneda ? {
          ...cuenta.moneda,
          id: cuenta.moneda._id
        } : null
      } : null
    };
  }

  // GET /api/contratos
  async getAll(req, res) {
    try {
      console.log('Obteniendo contratos...');
      
      // Verificar si hay un usuario autenticado
      if (!req.user) {
        console.log('No hay usuario autenticado');
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }
      
      const { usuario } = req.query;
      
      // Si no se proporciona un usuario en la query, usar el ID del usuario autenticado
      const filtros = {
        usuario: new mongoose.Types.ObjectId(usuario || req.user.id)
      };
      
      console.log('Filtros aplicados:', filtros);
      
      // Usar el método del BaseController con filtros personalizados
      const originalQuery = req.query;
      req.query = { ...originalQuery, filter: JSON.stringify(filtros) };
      
      // Llamar al método del BaseController
      await super.getAll(req, res);
      
      // Debug: Verificar la respuesta antes de enviarla
      const originalJson = res.json;
      res.json = function(data) {
        console.log('Debug precioTotal en respuesta API:', data.docs?.map(c => ({
          id: c._id,
          precioTotal: c.precioTotal,
          alquilerMensualPromedio: c.alquilerMensualPromedio,
          tipo: typeof c.precioTotal,
          esMantenimiento: c.esMantenimiento
        })));
        return originalJson.call(this, data);
      };
      
      // Restaurar la query original
      req.query = originalQuery;
      
    } catch (error) {
      console.error('Error al obtener contratos:', error);
      res.status(500).json({ error: 'Error al obtener contratos' });
    }
  }

  // GET /api/contratos/estado-actual
  async getConEstadoActual(req, res) {
    try {
      // Verificar si hay un usuario autenticado
      if (!req.user) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }
      
      const { usuario } = req.query;
      const filtros = {
        usuario: new mongoose.Types.ObjectId(usuario || req.user.id)
      };
      
      // Obtener contratos con populate usando lean() para mejor rendimiento
      const contratos = await this.Model.find(filtros)
        .populate(this.options.populate)
        .lean();
      
      // Usar el cache optimizado para calcular estados
      const contratosFormateados = statusCache.procesarContratos(contratos);
      
      res.json({
        docs: contratosFormateados,
        totalDocs: contratosFormateados.length,
        limit: contratosFormateados.length,
        page: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
        nextPage: null,
        prevPage: null
      });
    } catch (error) {
      console.error('Error al obtener contratos con estado actual:', error);
      res.status(500).json({ error: 'Error al obtener contratos' });
    }
  }

  // POST /api/contratos
  async create(req, res) {
    try {
      console.log('Creando contrato:', req.body);
      
      let moneda = null;
      let cuenta = null;

      // Solo buscar cuenta y moneda si no es mantenimiento
      if (req.body.tipoContrato !== 'MANTENIMIENTO') {
        // Obtener la cuenta y su moneda
        const Cuentas = mongoose.model('Cuentas');
        cuenta = await Cuentas.findById(req.body.cuenta).populate('moneda');
        if (!cuenta) {
          throw new Error('Cuenta no encontrada');
        }
        moneda = cuenta.moneda._id;
      }

      // Debug: Verificar valores antes del procesamiento
      console.log('=== DEBUG PRECIO TOTAL ===');
      console.log('req.body.precioTotal:', req.body.precioTotal, 'tipo:', typeof req.body.precioTotal);
      console.log('req.body.montoMensual:', req.body.montoMensual, 'tipo:', typeof req.body.montoMensual);
      console.log('req.body.tipoContrato:', req.body.tipoContrato);
      console.log('req.body.esMantenimiento:', req.body.esMantenimiento);
      
      // Calcular precioTotal de forma segura
      let precioTotalCalculado = 0;
      if (req.body.tipoContrato === 'MANTENIMIENTO' || req.body.esMantenimiento === true) {
        precioTotalCalculado = 0;
      } else {
        const precioTotalRaw = req.body.precioTotal || req.body.montoMensual || 0;
        console.log('precioTotalRaw:', precioTotalRaw, 'tipo:', typeof precioTotalRaw);
        precioTotalCalculado = parseFloat(precioTotalRaw) || 0;
      }
      console.log('precioTotalCalculado:', precioTotalCalculado);
      
      const data = {
        ...req.body,
        fechaInicio: new Date(req.body.fechaInicio),
        fechaFin: req.body.fechaFin ? new Date(req.body.fechaFin) : null,
        precioTotal: precioTotalCalculado,
        deposito: req.body.deposito ? parseFloat(req.body.deposito) : null,
        propiedad: req.body.propiedadId || req.body.propiedad,
        inquilino: req.body.tipoContrato === 'MANTENIMIENTO' ? [] : (req.body.inquilinoId || req.body.inquilino || []),
        habitacion: req.body.habitacionId || req.body.habitacion,
        cuenta: req.body.tipoContrato === 'MANTENIMIENTO' ? null : (req.body.cuentaId || req.body.cuenta),
        moneda: req.body.tipoContrato === 'MANTENIMIENTO' ? null : moneda,
        esMantenimiento: req.body.tipoContrato === 'MANTENIMIENTO' || req.body.esMantenimiento === true
      };

      // Agregar el usuario (requerido)
      if (req.user && req.user.id) {
        data.usuario = new mongoose.Types.ObjectId(req.user.id);
      } else if (req.user && req.user._id) {
        data.usuario = new mongoose.Types.ObjectId(req.user._id);
      } else {
        throw new Error('Usuario no autenticado');
      }

      console.log('Datos procesados:', data);
      console.log('Datos procesados JSON:', JSON.stringify(data, null, 2));
      const contrato = await this.Model.create(data);
      // Sincronizar campo 'contrato' en cada inquilino asociado
      if (Array.isArray(data.inquilino)) {
        for (const inquilinoId of data.inquilino) {
          await Inquilinos.findByIdAndUpdate(inquilinoId, { contrato: contrato._id });
        }
      }
      const populatedContrato = await this.Model.findById(contrato._id)
        .populate([
          'propiedad', 
          'inquilino', 
          'habitacion',
          { 
            path: 'cuenta',
            populate: { path: 'moneda' }
          }
        ]);

      console.log('Contrato creado:', populatedContrato);
      res.status(201).json(this.formatResponse(populatedContrato));
    } catch (error) {
      console.error('Error al crear contrato:', error);
      console.error('Error stack:', error.stack);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      
      // Si es un error de validación de Mongoose, mostrar más detalles
      if (error.name === 'ValidationError') {
        console.error('Errores de validación:', error.errors);
        const validationErrors = {};
        for (const field in error.errors) {
          validationErrors[field] = error.errors[field].message;
        }
        return res.status(400).json({ 
          error: 'Error de validación al crear contrato',
          details: error.message,
          validationErrors
        });
      }
      
      res.status(400).json({ 
        error: 'Error al crear contrato',
        details: error.message 
      });
    }
  }

  // GET /api/contratos/activos
  async getActivos(req, res) {
    try {
      const now = new Date();
      const result = await this.Model.paginate(
        {
          $or: [
            // Contratos de alquiler activos
            {
              tipoContrato: 'ALQUILER',
              fechaInicio: { $lte: now },
              fechaFin: { $gt: now }
            },
            // Contratos de mantenimiento activos
            {
              tipoContrato: 'MANTENIMIENTO',
              fechaInicio: { $lte: now },
              fechaFin: { $gt: now }
            }
          ]
        },
        {
          populate: ['propiedad', 'inquilino', 'habitacion', 'moneda'],
          sort: { createdAt: 'desc' }
        }
      );
      
      const docs = result.docs.map(doc => this.formatResponse(doc));
      res.json({ ...result, docs });
    } catch (error) {
      console.error('Error al obtener contratos activos:', error);
      res.status(500).json({ error: 'Error al obtener contratos activos' });
    }
  }

  // GET /api/contratos/propiedad/:propiedadId
  async getAllByPropiedad(req, res) {
    try {
      const { propiedadId } = req.params;
      const result = await this.Model.paginate(
        { propiedad: propiedadId },
        {
          populate: ['inquilino', 'habitacion', 'moneda'],
          sort: { fechaInicio: 'desc' }
        }
      );

      const docs = result.docs.map(doc => this.formatResponse(doc));
      res.json({ ...result, docs });
    } catch (error) {
      console.error('Error al obtener contratos de la propiedad:', error);
      res.status(500).json({ error: 'Error al obtener contratos de la propiedad' });
    }
  }

  // GET /api/contratos/admin/all
  async getAllAdmin(req, res) {
    try {
      const result = await this.Model.paginate(
        {},
        {
          populate: ['propiedad', 'inquilino', 'habitacion', 'moneda'],
          sort: { createdAt: 'desc' }
        }
      );
      const docs = result.docs.map(doc => this.formatResponse(doc));
      res.json({ ...result, docs });
    } catch (error) {
      console.error('Error al obtener todos los contratos:', error);
      res.status(500).json({ error: 'Error al obtener todos los contratos' });
    }
  }

  // GET /api/contratos/admin/stats
  async getAdminStats(req, res) {
    try {
      const totalContratos = await this.Model.countDocuments();
      const contratosActivos = await this.Model.countDocuments({ estado: 'ACTIVO' });
      const contratosFinalizados = await this.Model.countDocuments({ estado: 'FINALIZADO' });
      const contratosCancelados = await this.Model.countDocuments({ estado: 'CANCELADO' });
      const contratosPendientes = await this.Model.countDocuments({ estado: 'PENDIENTE' });
      
      res.json({
        total: totalContratos,
        activos: contratosActivos,
        finalizados: contratosFinalizados,
        cancelados: contratosCancelados,
        pendientes: contratosPendientes
      });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
  }

  // PATCH /api/contratos/:id/status
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { estado } = req.body;

      const contrato = await this.Model.findByIdAndUpdate(
        id,
        { estado },
        { new: true }
      ).populate(['propiedad', 'inquilino', 'habitacion', 'moneda']);

      if (!contrato) {
        return res.status(404).json({ error: 'Contrato no encontrado' });
      }

      res.json(this.formatResponse(contrato));
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      res.status(500).json({ error: 'Error al actualizar estado' });
    }
  }

  // GET /api/contratos/estado/:estado
  async getByEstado(req, res) {
    try {
      const { estado } = req.params;
      const result = await this.Model.paginate(
        { 
          usuario: new mongoose.Types.ObjectId(req.user._id),
          estado: estado.toUpperCase()
        },
        {
          populate: ['propiedad', 'inquilino'],
          sort: { fechaInicio: 'desc' }
        }
      );

      const docs = result.docs.map(doc => this.formatResponse(doc));
      res.json({ ...result, docs });
    } catch (error) {
      console.error('Error al obtener contratos por estado:', error);
      res.status(500).json({ error: 'Error al obtener contratos por estado' });
    }
  }

  // PUT /api/contratos/:id/finalizar
  async finalizarContrato(req, res) {
    try {
      const { id } = req.params;
      const contrato = await this.Model.findById(id);
      
      if (!contrato) {
        return res.status(404).json({ error: 'Contrato no encontrado' });
      }
      
      contrato.estado = 'FINALIZADO';
      contrato.fechaFin = new Date();
      await contrato.save();

      const updated = await contrato.populate(['propiedad', 'inquilino']);
      res.json(this.formatResponse(updated));
    } catch (error) {
      console.error('Error al finalizar contrato:', error);
      res.status(500).json({ error: 'Error al finalizar contrato' });
    }
  }

  // GET /api/contratos/propiedad/:propiedadId
  async getByPropiedad(req, res) {
    try {
      const { propiedadId } = req.params;
      const result = await this.Model.paginate(
        {
          usuario: new mongoose.Types.ObjectId(req.user._id),
          propiedad: propiedadId
        },
        {
          populate: ['inquilino'],
          sort: { fechaInicio: 'desc' }
        }
      );

      const docs = result.docs.map(doc => this.formatResponse(doc));
      res.json({ ...result, docs });
    } catch (error) {
      console.error('Error al obtener contratos por propiedad:', error);
      res.status(500).json({ error: 'Error al obtener contratos por propiedad' });
    }
  }

  // GET /api/contratos/propiedad/:propiedadId/activos
  async getActivosByPropiedad(req, res) {
    try {
      const { propiedadId } = req.params;
      const now = new Date();
      const result = await this.Model.paginate(
        {
          propiedad: propiedadId,
          fechaInicio: { $lte: now },
          fechaFin: { $gt: now }
        },
        {
          populate: ['inquilino', 'habitacion', 'moneda'],
          sort: { fechaInicio: 'desc' }
        }
      );
      const docs = result.docs.map(doc => this.formatResponse(doc));
      res.json({ ...result, docs });
    } catch (error) {
      console.error('Error al obtener contratos activos por propiedad:', error);
      res.status(500).json({ error: 'Error al obtener contratos activos por propiedad' });
    }
  }

  // GET /api/contratos/propiedad/:propiedadId/finalizados
  async getFinalizadosByPropiedad(req, res) {
    try {
      const { propiedadId } = req.params;
      const now = new Date();
      const result = await this.Model.paginate(
        {
          propiedad: propiedadId,
          fechaFin: { $lte: now }
        },
        {
          populate: ['inquilino', 'habitacion', 'moneda'],
          sort: { fechaFin: 'desc' }
        }
      );
      const docs = result.docs.map(doc => this.formatResponse(doc));
      res.json({ ...result, docs });
    } catch (error) {
      console.error('Error al obtener contratos finalizados por propiedad:', error);
      res.status(500).json({ error: 'Error al obtener contratos finalizados por propiedad' });
    }
  }

  // GET /api/contratos/propiedad/:propiedadId/mantenimiento
  async getMantenimientoByPropiedad(req, res) {
    try {
      const { propiedadId } = req.params;
      const now = new Date();
      
      const result = await this.Model.paginate(
        {
          usuario: new mongoose.Types.ObjectId(req.user._id),
          propiedad: propiedadId,
          esMantenimiento: true,
          fechaInicio: { $lte: now },
          fechaFin: { $gt: now }
        },
        {
          sort: { fechaInicio: 'desc' }
        }
      );

      const docs = result.docs.map(doc => this.formatResponse(doc));
      res.json({ ...result, docs });
    } catch (error) {
      console.error('Error al obtener contratos de mantenimiento:', error);
      res.status(500).json({ error: 'Error al obtener contratos de mantenimiento' });
    }
  }

  // GET /api/contratos/inquilino/:inquilinoId
  async getByInquilino(req, res) {
    try {
      const { inquilinoId } = req.params;
      const result = await this.Model.paginate(
        {
          usuario: new mongoose.Types.ObjectId(req.user._id),
          inquilino: inquilinoId
        },
        {
          populate: ['propiedad'],
          sort: { fechaInicio: 'desc' }
        }
      );

      const docs = result.docs.map(doc => this.formatResponse(doc));
      res.json({ ...result, docs });
    } catch (error) {
      console.error('Error al obtener contratos por inquilino:', error);
      res.status(500).json({ error: 'Error al obtener contratos por inquilino' });
    }
  }

  // GET /api/contratos/inquilino/:inquilinoId/activo
  async getActivoByInquilino(req, res) {
    try {
      const { inquilinoId } = req.params;
      const now = new Date();
      
      const contrato = await this.Model.findOne({
        usuario: new mongoose.Types.ObjectId(req.user._id),
        inquilino: inquilinoId,
        fechaInicio: { $lte: now },
        fechaFin: { $gt: now }
      }).populate(['propiedad']);

      if (!contrato) {
        return res.status(404).json({ error: 'No se encontró contrato activo' });
      }

      res.json(this.formatResponse(contrato));
    } catch (error) {
      console.error('Error al obtener contrato activo:', error);
      res.status(500).json({ error: 'Error al obtener contrato activo' });
    }
  }

  // GET /api/contratos/inquilino/:inquilinoId/historial
  async getHistorialByInquilino(req, res) {
    try {
      const { inquilinoId } = req.params;
      const result = await this.Model.paginate(
        {
          usuario: new mongoose.Types.ObjectId(req.user._id),
          inquilino: inquilinoId,
          estado: { $in: ['FINALIZADO', 'ACTIVO'] }
        },
        {
          populate: ['propiedad'],
          sort: { fechaInicio: 'desc' }
        }
      );

      const docs = result.docs.map(doc => this.formatResponse(doc));
      res.json({ ...result, docs });
    } catch (error) {
      console.error('Error al obtener historial de contratos:', error);
      res.status(500).json({ error: 'Error al obtener historial de contratos' });
    }
  }

  // GET /api/contratos/inquilino/:inquilinoId/activos
  async getActivosByInquilino(req, res) {
    try {
      const { inquilinoId } = req.params;
      const now = new Date();
      const result = await this.Model.paginate(
        {
          inquilino: inquilinoId,
          fechaInicio: { $lte: now },
          fechaFin: { $gt: now }
        },
        {
          populate: ['propiedad', 'habitacion', 'moneda'],
          sort: { fechaInicio: 'desc' }
        }
      );
      const docs = result.docs.map(doc => this.formatResponse(doc));
      res.json({ ...result, docs });
    } catch (error) {
      console.error('Error al obtener contratos activos por inquilino:', error);
      res.status(500).json({ error: 'Error al obtener contratos activos por inquilino' });
    }
  }

  // GET /api/contratos/inquilino/:inquilinoId/finalizados
  async getFinalizadosByInquilino(req, res) {
    try {
      const { inquilinoId } = req.params;
      const now = new Date();
      const result = await this.Model.paginate(
        {
          inquilino: inquilinoId,
          fechaFin: { $lte: now }
        },
        {
          populate: ['propiedad', 'habitacion', 'moneda'],
          sort: { fechaFin: 'desc' }
        }
      );
      const docs = result.docs.map(doc => this.formatResponse(doc));
      res.json({ ...result, docs });
    } catch (error) {
      console.error('Error al obtener contratos finalizados por inquilino:', error);
      res.status(500).json({ error: 'Error al obtener contratos finalizados por inquilino' });
    }
  }

  // Sobreescribimos el método update
  async update(req, res) {
    try {
      const { id } = req.params;
      console.log('=== UPDATE CONTRATO ===');
      console.log('ID del contrato:', id);
      console.log('Datos recibidos en req.body:', JSON.stringify(req.body, null, 2));
      console.log('req.body.precioTotal:', req.body.precioTotal, 'tipo:', typeof req.body.precioTotal);
      console.log('req.body.tipoContrato:', req.body.tipoContrato, 'tipo:', typeof req.body.tipoContrato);
      console.log('req.body.esMantenimiento:', req.body.esMantenimiento, 'tipo:', typeof req.body.esMantenimiento);
      
      const contrato = await this.Model.findById(id);
      
      if (!contrato) {
        return res.status(404).json({ error: 'Contrato no encontrado' });
      }

      console.log('Contrato original:', {
        _id: contrato._id,
        precioTotal: contrato.precioTotal,
        tipoContrato: contrato.tipoContrato,
        esMantenimiento: contrato.esMantenimiento
      });

      // Si se están actualizando los inquilinos, validar que existan
      if (req.body.inquilino && !contrato.esMantenimiento) {
        for (const inquilinoId of req.body.inquilino) {
          const inquilinoDoc = await Inquilinos.findById(inquilinoId);
          if (!inquilinoDoc) {
            return res.status(400).json({ error: `El inquilino ${inquilinoId} no existe` });
          }
          // Actualizar la propiedad del inquilino
          inquilinoDoc.propiedad = contrato.propiedad;
          await inquilinoDoc.save();
        }
      }

      // Preservar campos existentes si no se envían en la actualización
      const updateData = {
        ...contrato.toObject(),
        ...req.body,
        usuario: new mongoose.Types.ObjectId(req.user._id) || contrato.usuario, // Preservar el usuario o usar el autenticado
        fechaInicio: req.body.fechaInicio ? new Date(req.body.fechaInicio) : contrato.fechaInicio,
        fechaFin: req.body.fechaFin ? new Date(req.body.fechaFin) : contrato.fechaFin,
        precioTotal: req.body.precioTotal !== undefined ? parseFloat(req.body.precioTotal) : 
                    req.body.montoMensual !== undefined ? parseFloat(req.body.montoMensual) : 
                    contrato.precioTotal, // Preservar el precioTotal original si no se envía
        deposito: req.body.deposito !== undefined ? parseFloat(req.body.deposito) : contrato.deposito,
        cuenta: req.body.cuenta !== undefined ? req.body.cuenta : contrato.cuenta,
        moneda: req.body.moneda !== undefined ? req.body.moneda : contrato.moneda
      };

      console.log('=== UPDATE DATA PREPARADO ===');
      console.log('updateData.precioTotal:', updateData.precioTotal, 'tipo:', typeof updateData.precioTotal);
      console.log('updateData.tipoContrato:', updateData.tipoContrato, 'tipo:', typeof updateData.tipoContrato);
      console.log('updateData.esMantenimiento:', updateData.esMantenimiento, 'tipo:', typeof updateData.esMantenimiento);
      console.log('updateData completo:', JSON.stringify(updateData, null, 2));

      // Si el contrato no es de mantenimiento, asegurarse que los campos requeridos existan
      console.log('=== VALIDACIÓN DE CONTRATO ===');
      console.log('updateData.esMantenimiento:', updateData.esMantenimiento, 'tipo:', typeof updateData.esMantenimiento);
      console.log('updateData.tipoContrato:', updateData.tipoContrato, 'tipo:', typeof updateData.tipoContrato);
      console.log('updateData.precioTotal:', updateData.precioTotal, 'tipo:', typeof updateData.precioTotal);
      console.log('updateData.cuenta:', updateData.cuenta, 'tipo:', typeof updateData.cuenta);
      
      const noEsMantenimiento = !updateData.esMantenimiento;
      const noEsTipoMantenimiento = updateData.tipoContrato !== 'MANTENIMIENTO';
      const debeValidar = noEsMantenimiento && noEsTipoMantenimiento;
      
      console.log('Validación lógica:', {
        noEsMantenimiento,
        noEsTipoMantenimiento,
        debeValidar
      });
      
      if (debeValidar) {
        console.log('Contrato NO es de mantenimiento, validando campos requeridos...');
        console.log('precioTotal a validar:', updateData.precioTotal, 'es truthy:', !!updateData.precioTotal, 'es > 0:', updateData.precioTotal > 0);
        
        if (!updateData.precioTotal || updateData.precioTotal <= 0) {
          console.log('ERROR: precioTotal inválido:', updateData.precioTotal);
          return res.status(400).json({ error: 'El precio total es requerido y debe ser mayor a 0 para contratos de alquiler' });
        }
        if (!updateData.cuenta) {
          console.log('ERROR: cuenta faltante');
          return res.status(400).json({ error: 'La cuenta es requerida para contratos de alquiler' });
        }
        console.log('Validación exitosa');
      } else {
        console.log('Contrato ES de mantenimiento o tipo MANTENIMIENTO, saltando validación de precioTotal');
      }

      // Asegurarse de que el usuario esté presente
      if (!updateData.usuario && req.user) {
        updateData.usuario = new mongoose.Types.ObjectId(req.user._id);
      }

      console.log('=== ANTES DE OBJECT.ASSIGN ===');
      console.log('contrato.precioTotal antes:', contrato.precioTotal);
      console.log('updateData.precioTotal:', updateData.precioTotal);
      
      Object.assign(contrato, updateData);
      
      console.log('=== DESPUÉS DE OBJECT.ASSIGN ===');
      console.log('contrato.precioTotal después:', contrato.precioTotal);
      console.log('contrato.tipoContrato:', contrato.tipoContrato);
      console.log('contrato.esMantenimiento:', contrato.esMantenimiento);
      
      console.log('=== ANTES DE SAVE ===');
      try {
        await contrato.save();
        console.log('=== SAVE EXITOSO ===');
      } catch (saveError) {
        console.log('=== ERROR EN SAVE ===');
        console.log('Error completo:', saveError);
        console.log('Error message:', saveError.message);
        console.log('Error name:', saveError.name);
        if (saveError.errors) {
          console.log('Errores de validación:', Object.keys(saveError.errors).map(key => ({
            field: key,
            message: saveError.errors[key].message,
            value: saveError.errors[key].value
          })));
        }
        throw saveError;
      }
      // Sincronizar campo 'contrato' en cada inquilino asociado tras update
      if (Array.isArray(contrato.inquilino)) {
        for (const inquilinoId of contrato.inquilino) {
          await Inquilinos.findByIdAndUpdate(inquilinoId, { contrato: contrato._id });
        }
      }
      const updated = await contrato.populate(['propiedad', 'inquilino', 'cuenta']);
      res.json(this.formatResponse(updated));
    } catch (error) {
      console.error('Error al actualizar contrato:', error);
      console.error('Error stack:', error.stack);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      
      // Si es un error de validación de Mongoose, mostrar más detalles
      if (error.name === 'ValidationError') {
        console.error('Errores de validación:', error.errors);
        const validationErrors = {};
        for (const field in error.errors) {
          validationErrors[field] = error.errors[field].message;
        }
        return res.status(400).json({ 
          error: 'Error de validación al actualizar contrato',
          details: error.message,
          validationErrors
        });
      }
      
      res.status(400).json({ 
        error: 'Error al actualizar contrato',
        details: error.message 
      });
    }
  }

  // POST /api/contratos/actualizar-estados
  async actualizarEstados(req, res) {
    try {
      console.log('Solicitud de actualización de estados recibida');
      const resultado = await this.Model.actualizarEstados();
      
      res.json({
        message: 'Estados de contratos actualizados exitosamente',
        resultado
      });
    } catch (error) {
      console.error('Error al actualizar estados de contratos:', error);
      res.status(500).json({ 
        error: 'Error al actualizar estados de contratos',
        details: error.message
      });
    }
  }

  // POST /api/contratos/wizard/validate-step
  async validateWizardStep(req, res) {
    try {
      const { step, data } = req.body;
      const errors = {};

      switch (step) {
        case 'basic':
          if (!data.tipoContrato) {
            errors.tipoContrato = 'El tipo de contrato es requerido';
          }
          if (!data.fechaInicio) {
            errors.fechaInicio = 'La fecha de inicio es requerida';
          }
          break;

        case 'property':
          if (!data.propiedad) {
            errors.propiedad = 'La propiedad es requerida';
          }
          if (data.tipoContrato !== 'MANTENIMIENTO' && (!data.inquilino || data.inquilino.length === 0)) {
            errors.inquilino = 'Al menos un inquilino es requerido para contratos de alquiler';
          }
          break;

        case 'financial':
          if (data.tipoContrato !== 'MANTENIMIENTO') {
            if (!data.precioTotal || data.precioTotal <= 0) {
              errors.precioTotal = 'El precio total debe ser mayor a 0';
            }
            if (!data.cuenta) {
              errors.cuenta = 'La cuenta es requerida para contratos de alquiler';
            }
          }
          break;

        case 'payments':
          if (data.tipoContrato !== 'MANTENIMIENTO' && data.deposito && data.deposito < 0) {
            errors.deposito = 'El depósito no puede ser negativo';
          }
          break;

        default:
          errors.general = 'Paso no válido';
      }

      res.json({
        isValid: Object.keys(errors).length === 0,
        errors
      });
    } catch (error) {
      console.error('Error al validar paso del wizard:', error);
      res.status(500).json({ error: 'Error al validar paso del wizard' });
    }
  }

  // POST /api/contratos/wizard/preview
  async previewWizardContract(req, res) {
    try {
      const { data } = req.body;
      
      // Calcular resumen financiero
      const resumen = {
        precioTotal: parseFloat(data.precioTotal || 0),
        deposito: parseFloat(data.deposito || 0),
        duracionMeses: 0,
        alquilerMensual: 0,
        totalConDeposito: 0
      };

      if (data.fechaInicio && data.fechaFin) {
        const inicio = new Date(data.fechaInicio);
        const fin = new Date(data.fechaFin);
        const diffTime = Math.abs(fin - inicio);
        resumen.duracionMeses = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
        resumen.alquilerMensual = resumen.precioTotal / resumen.duracionMeses;
      }

      resumen.totalConDeposito = resumen.precioTotal + resumen.deposito;

      // Obtener datos relacionados para el preview
      const propiedad = data.propiedad ? await this.Model.db.models.Propiedades.findById(data.propiedad) : null;
      const inquilinos = data.inquilino ? await this.Model.db.models.Inquilinos.find({ _id: { $in: data.inquilino } }) : [];
      const cuenta = data.cuenta ? await this.Model.db.models.Cuentas.findById(data.cuenta).populate('moneda') : null;

      res.json({
        resumen,
        propiedad: propiedad ? this.formatResponse(propiedad) : null,
        inquilinos: inquilinos.map(inq => this.formatResponse(inq)),
        cuenta: cuenta ? this.formatResponse(cuenta) : null
      });
    } catch (error) {
      console.error('Error al generar preview del contrato:', error);
      res.status(500).json({ error: 'Error al generar preview del contrato' });
    }
  }

  // GET /api/contratos/wizard/suggestions
  async getWizardSuggestions(req, res) {
    try {
      const { propiedadId, inquilinoId } = req.query;
      const suggestions = {};

      if (propiedadId) {
        // Sugerencias basadas en la propiedad
        const propiedad = await this.Model.db.models.Propiedades.findById(propiedadId);
        if (propiedad) {
          suggestions.precioTotal = propiedad.precio || propiedad.montoMensual;
          suggestions.deposito = propiedad.deposito || (propiedad.precio * 2);
          suggestions.cuenta = propiedad.cuenta;
          suggestions.habitaciones = await this.Model.db.models.Habitaciones.find({ propiedad: propiedadId });
        }
      }

      if (inquilinoId) {
        // Sugerencias basadas en el inquilino
        const inquilino = await this.Model.db.models.Inquilinos.findById(inquilinoId);
        if (inquilino) {
          suggestions.propiedad = inquilino.propiedad;
          // Buscar contratos previos del inquilino para sugerir términos similares
          const contratosPrevios = await this.Model.find({ inquilino: inquilinoId })
            .sort({ fechaInicio: -1 })
            .limit(1);
          
          if (contratosPrevios.length > 0) {
            const ultimoContrato = contratosPrevios[0];
            suggestions.precioTotal = ultimoContrato.precioTotal;
            suggestions.deposito = ultimoContrato.deposito;
          }
        }
      }

      res.json(suggestions);
    } catch (error) {
      console.error('Error al obtener sugerencias del wizard:', error);
      res.status(500).json({ error: 'Error al obtener sugerencias' });
    }
  }

  // POST /api/contratos/bulk-update
  async bulkUpdate(req, res) {
    try {
      const { ids, updates } = req.body;
      
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Se requieren IDs válidos' });
      }

      const result = await this.Model.updateMany(
        { _id: { $in: ids }, usuario: new mongoose.Types.ObjectId(req.user._id) },
        updates
      );

      res.json({
        message: `${result.modifiedCount} contratos actualizados exitosamente`,
        modifiedCount: result.modifiedCount
      });
    } catch (error) {
      console.error('Error en actualización masiva:', error);
      res.status(500).json({ error: 'Error en actualización masiva' });
    }
  }

  // GET /api/contratos/stats/summary
  async getSummaryStats(req, res) {
    try {
      const userId = new mongoose.Types.ObjectId(req.user._id);
      const now = new Date();

      const [
        totalContratos,
        contratosActivos,
        contratosFinalizados,
        contratosPlaneados,
        contratosMantenimiento
      ] = await Promise.all([
        this.Model.countDocuments({ usuario: userId }),
        this.Model.countDocuments({
          usuario: userId,
          fechaInicio: { $lte: now },
          fechaFin: { $gt: now },
          esMantenimiento: false
        }),
        this.Model.countDocuments({
          usuario: userId,
          fechaFin: { $lt: now }
        }),
        this.Model.countDocuments({
          usuario: userId,
          fechaInicio: { $gt: now }
        }),
        this.Model.countDocuments({
          usuario: userId,
          esMantenimiento: true,
          fechaInicio: { $lte: now },
          fechaFin: { $gt: now }
        })
      ]);

      res.json({
        total: totalContratos,
        activos: contratosActivos,
        finalizados: contratosFinalizados,
        planeados: contratosPlaneados,
        mantenimiento: contratosMantenimiento
      });
    } catch (error) {
      console.error('Error al obtener estadísticas resumidas:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
  }

  // GET /api/contratos/stats/financial
  async getFinancialStats(req, res) {
    try {
      const userId = new mongoose.Types.ObjectId(req.user._id);
      const now = new Date();

      const contratosActivos = await this.Model.find({
        usuario: userId,
        fechaInicio: { $lte: now },
        fechaFin: { $gt: now },
        esMantenimiento: false
      }).populate('moneda');

      const stats = {
        ingresosMensuales: 0,
        depositosTotales: 0,
        contratosPorMoneda: {}
      };

      contratosActivos.forEach(contrato => {
        const moneda = contrato.moneda?.simbolo || 'USD';
        const precio = parseFloat(contrato.precioTotal || 0);
        const deposito = parseFloat(contrato.deposito || 0);

        stats.ingresosMensuales += precio;
        stats.depositosTotales += deposito;

        if (!stats.contratosPorMoneda[moneda]) {
          stats.contratosPorMoneda[moneda] = {
            cantidad: 0,
            ingresosMensuales: 0,
            depositosTotales: 0
          };
        }

        stats.contratosPorMoneda[moneda].cantidad++;
        stats.contratosPorMoneda[moneda].ingresosMensuales += precio;
        stats.contratosPorMoneda[moneda].depositosTotales += deposito;
      });

      res.json(stats);
    } catch (error) {
      console.error('Error al obtener estadísticas financieras:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas financieras' });
    }
  }

  // POST /api/contratos/:id/renovar
  async renovarContrato(req, res) {
    try {
      const { id } = req.params;
      const { nuevaFechaFin, nuevoPrecio } = req.body;

      const contrato = await this.Model.findById(id);
      if (!contrato) {
        return res.status(404).json({ error: 'Contrato no encontrado' });
      }

      // Crear nuevo contrato basado en el actual
      const nuevoContrato = new this.Model({
        ...contrato.toObject(),
        _id: undefined,
        fechaInicio: contrato.fechaFin,
        fechaFin: nuevaFechaFin ? new Date(nuevaFechaFin) : null,
        precioTotal: nuevoPrecio || contrato.precioTotal,
        estado: 'PLANEADO',
        contratoAnterior: contrato._id
      });

      // Finalizar contrato actual
      contrato.estado = 'FINALIZADO';
      contrato.contratoSiguiente = nuevoContrato._id;
      await contrato.save();

      await nuevoContrato.save();
      const populated = await nuevoContrato.populate(['propiedad', 'inquilino', 'cuenta']);

      res.json({
        message: 'Contrato renovado exitosamente',
        contrato: this.formatResponse(populated)
      });
    } catch (error) {
      console.error('Error al renovar contrato:', error);
      res.status(500).json({ error: 'Error al renovar contrato' });
    }
  }

  // POST /api/contratos/:id/suspender
  async suspenderContrato(req, res) {
    try {
      const { id } = req.params;
      const { motivo, fechaSuspension } = req.body;

      const contrato = await this.Model.findById(id);
      if (!contrato) {
        return res.status(404).json({ error: 'Contrato no encontrado' });
      }

      contrato.estado = 'SUSPENDIDO';
      contrato.motivoSuspension = motivo;
      contrato.fechaSuspension = fechaSuspension ? new Date(fechaSuspension) : new Date();
      await contrato.save();

      res.json({
        message: 'Contrato suspendido exitosamente',
        contrato: this.formatResponse(contrato)
      });
    } catch (error) {
      console.error('Error al suspender contrato:', error);
      res.status(500).json({ error: 'Error al suspender contrato' });
    }
  }

  // POST /api/contratos/:id/reactivar
  async reactivarContrato(req, res) {
    try {
      const { id } = req.params;

      const contrato = await this.Model.findById(id);
      if (!contrato) {
        return res.status(404).json({ error: 'Contrato no encontrado' });
      }

      contrato.estado = 'ACTIVO';
      contrato.motivoSuspension = undefined;
      contrato.fechaSuspension = undefined;
      await contrato.save();

      res.json({
        message: 'Contrato reactivado exitosamente',
        contrato: this.formatResponse(contrato)
      });
    } catch (error) {
      console.error('Error al reactivar contrato:', error);
      res.status(500).json({ error: 'Error al reactivar contrato' });
    }
  }

  // GET /api/contratos/search/advanced
  async advancedSearch(req, res) {
    try {
      const { 
        query, 
        estado, 
        fechaInicio, 
        fechaFin, 
        propiedad, 
        inquilino,
        precioMin,
        precioMax,
        esMantenimiento
      } = req.query;

      const filtros = { usuario: new mongoose.Types.ObjectId(req.user._id) };

      if (query) {
        filtros.$or = [
          { observaciones: { $regex: query, $options: 'i' } },
          { tipoContrato: { $regex: query, $options: 'i' } }
        ];
      }

      if (estado) filtros.estado = estado;
      if (propiedad) filtros.propiedad = propiedad;
      if (inquilino) filtros.inquilino = inquilino;
      if (esMantenimiento !== undefined) filtros.esMantenimiento = esMantenimiento === 'true';

      if (fechaInicio || fechaFin) {
        filtros.fechaInicio = {};
        if (fechaInicio) filtros.fechaInicio.$gte = new Date(fechaInicio);
        if (fechaFin) filtros.fechaInicio.$lte = new Date(fechaFin);
      }

      if (precioMin || precioMax) {
        filtros.precioTotal = {};
        if (precioMin) filtros.precioTotal.$gte = parseFloat(precioMin);
        if (precioMax) filtros.precioTotal.$lte = parseFloat(precioMax);
      }

      const result = await this.Model.paginate(filtros, {
        populate: ['propiedad', 'inquilino', 'cuenta'],
        sort: { fechaInicio: 'desc' }
      });

      const docs = result.docs.map(doc => this.formatResponse(doc));
      res.json({ ...result, docs });
    } catch (error) {
      console.error('Error en búsqueda avanzada:', error);
      res.status(500).json({ error: 'Error en búsqueda avanzada' });
    }
  }

  // GET /api/contratos/filter/by-status
  async filterByStatus(req, res) {
    try {
      const { estado } = req.query;
      const filtros = { usuario: new mongoose.Types.ObjectId(req.user._id) };
      
      if (estado) {
        filtros.estado = estado;
      }

      const result = await this.Model.paginate(filtros, {
        populate: ['propiedad', 'inquilino', 'cuenta'],
        sort: { fechaInicio: 'desc' }
      });

      const docs = result.docs.map(doc => this.formatResponse(doc));
      res.json({ ...result, docs });
    } catch (error) {
      console.error('Error al filtrar por estado:', error);
      res.status(500).json({ error: 'Error al filtrar por estado' });
    }
  }

  // GET /api/contratos/filter/by-date-range
  async filterByDateRange(req, res) {
    try {
      const { fechaInicio, fechaFin } = req.query;
      const filtros = { usuario: new mongoose.Types.ObjectId(req.user._id) };

      if (fechaInicio || fechaFin) {
        filtros.fechaInicio = {};
        if (fechaInicio) filtros.fechaInicio.$gte = new Date(fechaInicio);
        if (fechaFin) filtros.fechaInicio.$lte = new Date(fechaFin);
      }

      const result = await this.Model.paginate(filtros, {
        populate: ['propiedad', 'inquilino', 'cuenta'],
        sort: { fechaInicio: 'desc' }
      });

      const docs = result.docs.map(doc => this.formatResponse(doc));
      res.json({ ...result, docs });
    } catch (error) {
      console.error('Error al filtrar por rango de fechas:', error);
      res.status(500).json({ error: 'Error al filtrar por rango de fechas' });
    }
  }

  // GET /api/contratos/filter/by-property
  async filterByProperty(req, res) {
    try {
      const { propiedad } = req.query;
      const filtros = { usuario: new mongoose.Types.ObjectId(req.user._id) };

      if (propiedad) {
        filtros.propiedad = propiedad;
      }

      const result = await this.Model.paginate(filtros, {
        populate: ['propiedad', 'inquilino', 'cuenta'],
        sort: { fechaInicio: 'desc' }
      });

      const docs = result.docs.map(doc => this.formatResponse(doc));
      res.json({ ...result, docs });
    } catch (error) {
      console.error('Error al filtrar por propiedad:', error);
      res.status(500).json({ error: 'Error al filtrar por propiedad' });
    }
  }

  // GET /api/contratos/filter/by-tenant
  async filterByTenant(req, res) {
    try {
      const { inquilino } = req.query;
      const filtros = { usuario: new mongoose.Types.ObjectId(req.user._id) };

      if (inquilino) {
        filtros.inquilino = inquilino;
      }

      const result = await this.Model.paginate(filtros, {
        populate: ['propiedad', 'inquilino', 'cuenta'],
        sort: { fechaInicio: 'desc' }
      });

      const docs = result.docs.map(doc => this.formatResponse(doc));
      res.json({ ...result, docs });
    } catch (error) {
      console.error('Error al filtrar por inquilino:', error);
      res.status(500).json({ error: 'Error al filtrar por inquilino' });
    }
  }
}

export const contratosController = new ContratosController(); 