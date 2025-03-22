import { BaseController } from './BaseController.js';
import { Contratos, Inquilinos, Propiedades } from '../models/index.js';
import mongoose from 'mongoose';

class ContratosController extends BaseController {
  constructor() {
    super(Contratos);

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
      const result = await this.Model.paginate(
        {},
        {
          populate: [
            { 
              path: 'propiedad',
              select: 'titulo direccion ciudad estado tipo'
            },
            {
              path: 'inquilino',
              select: 'nombre apellido email'
            },
            {
              path: 'habitacion',
              select: 'nombre tipo'
            },
            { 
              path: 'cuenta',
              populate: { 
                path: 'moneda',
                select: 'nombre simbolo'
              }
            },
            {
              path: 'moneda',
              select: 'nombre simbolo codigo'
            }
          ],
          sort: { createdAt: 'desc' }
        }
      );

      console.log('Contratos sin formatear:', result.docs);
      const docs = result.docs.map(doc => {
        const formatted = this.formatResponse(doc);
        console.log('Contrato formateado:', formatted);
        return formatted;
      });
      
      console.log('Total contratos encontrados:', docs.length);
      res.json({ ...result, docs });
    } catch (error) {
      console.error('Error al obtener contratos:', error);
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
      if (!req.body.esMantenimiento) {
        // Obtener la cuenta y su moneda
        const Cuentas = mongoose.model('Cuentas');
        cuenta = await Cuentas.findById(req.body.cuenta).populate('moneda');
        if (!cuenta) {
          throw new Error('Cuenta no encontrada');
        }
        moneda = cuenta.moneda._id;
      }

      const data = {
        ...req.body,
        fechaInicio: new Date(req.body.fechaInicio),
        fechaFin: req.body.fechaFin ? new Date(req.body.fechaFin) : null,
        montoMensual: parseFloat(req.body.montoMensual),
        deposito: req.body.deposito ? parseFloat(req.body.deposito) : null,
        propiedad: req.body.propiedadId || req.body.propiedad,
        inquilino: req.body.inquilinoId || req.body.inquilino,
        habitacion: req.body.habitacionId || req.body.habitacion,
        cuenta: req.body.esMantenimiento ? null : (req.body.cuentaId || req.body.cuenta),
        moneda: req.body.esMantenimiento ? null : moneda
      };

      // Solo agregar el usuario si está disponible
      if (req.user && req.user.id) {
        data.usuario = req.user.id;
      }

      console.log('Datos procesados:', data);

      const contrato = await this.Model.create(data);
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
              fechaFin: { $gt: now },
              estado: 'ACTIVO'
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
          usuario: req.user._id,
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
          usuario: req.user._id,
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
          usuario: req.user._id,
          propiedad: propiedadId,
          estado: 'ACTIVO',
          fechaInicio: { $lte: now },
          fechaFin: { $gt: now }
        },
        {
          populate: ['inquilino'],
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

  // GET /api/contratos/propiedad/:propiedadId/mantenimiento
  async getMantenimientoByPropiedad(req, res) {
    try {
      const { propiedadId } = req.params;
      const now = new Date();
      
      const result = await this.Model.paginate(
        {
          usuario: req.user._id,
          propiedad: propiedadId,
          esMantenimiento: true,
          estado: 'MANTENIMIENTO',
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
          usuario: req.user._id,
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
        usuario: req.user._id,
        inquilino: inquilinoId,
        estado: 'ACTIVO',
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
          usuario: req.user._id,
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

  // Sobreescribimos el método update
  async update(req, res) {
    try {
      const { id } = req.params;
      const contrato = await this.Model.findById(id);
      
      if (!contrato) {
        return res.status(404).json({ error: 'Contrato no encontrado' });
      }

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
        usuario: req.user._id || contrato.usuario, // Preservar el usuario o usar el autenticado
        montoMensual: req.body.montoMensual || contrato.montoMensual,
        deposito: req.body.deposito || contrato.deposito,
        cuenta: req.body.cuenta || contrato.cuenta,
        moneda: req.body.moneda || contrato.moneda
      };

      // Si el contrato no es de mantenimiento, asegurarse que los campos requeridos existan
      if (!updateData.esMantenimiento && updateData.tipoContrato !== 'MANTENIMIENTO') {
        if (!updateData.montoMensual) {
          return res.status(400).json({ error: 'El monto mensual es requerido para contratos de alquiler' });
        }
        if (!updateData.cuenta) {
          return res.status(400).json({ error: 'La cuenta es requerida para contratos de alquiler' });
        }
      }

      // Asegurarse de que el usuario esté presente
      if (!updateData.usuario && req.user) {
        updateData.usuario = req.user._id;
      }

      Object.assign(contrato, updateData);
      await contrato.save();

      const updated = await contrato.populate(['propiedad', 'inquilino', 'cuenta']);
      res.json(this.formatResponse(updated));
    } catch (error) {
      console.error('Error al actualizar contrato:', error);
      res.status(400).json({ 
        error: 'Error al actualizar contrato',
        details: error.message 
      });
    }
  }
}

export const contratosController = new ContratosController(); 