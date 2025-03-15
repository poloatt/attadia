import { BaseController } from './BaseController.js';
import { Contratos } from '../models/index.js';
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
      const result = await this.Model.paginate(
        { estado: 'ACTIVO' },
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

  // Sobreescribimos el método update para manejar los campos correctamente
  async update(req, res) {
    try {
      const { id } = req.params;
      console.log('Actualizando contrato:', id);
      console.log('Datos recibidos:', req.body);
      
      // Buscar el contrato existente primero
      const existingContrato = await this.Model.findById(id);
      if (!existingContrato) {
        return res.status(404).json({ error: 'Contrato no encontrado' });
      }
      
      // Procesar los datos recibidos
      const data = {
        ...req.body,
        fechaInicio: req.body.fechaInicio ? new Date(req.body.fechaInicio) : undefined,
        fechaFin: req.body.fechaFin ? new Date(req.body.fechaFin) : undefined,
        montoMensual: req.body.montoMensual !== undefined ? parseFloat(req.body.montoMensual) : undefined,
        deposito: req.body.deposito !== undefined ? parseFloat(req.body.deposito) : undefined,
        propiedad: req.body.propiedad || req.body.propiedadId || existingContrato.propiedad,
        inquilino: req.body.inquilino || req.body.inquilinoId || existingContrato.inquilino,
        habitacion: req.body.habitacion || req.body.habitacionId || existingContrato.habitacion,
        cuenta: req.body.cuenta || req.body.cuentaId || existingContrato.cuenta,
        moneda: req.body.moneda || req.body.monedaId || existingContrato.moneda
      };

      // Solo agregar el usuario si está disponible
      if (req.user && req.user.id) {
        data.usuario = req.user.id;
      } else if (existingContrato.usuario) {
        data.usuario = existingContrato.usuario;
      }

      console.log('Datos procesados para actualización:', data);

      // Actualizar el contrato
      const contrato = await this.Model.findByIdAndUpdate(
        id,
        data,
        { new: true, runValidators: true }
      ).populate(['propiedad', 'inquilino', 'habitacion', 'cuenta', 'moneda']);

      console.log('Contrato actualizado:', contrato);
      res.json(this.formatResponse(contrato));
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