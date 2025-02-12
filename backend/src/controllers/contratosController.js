import { BaseController } from './BaseController.js';
import { Contratos } from '../models/index.js';

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
    return {
      ...formatted,
      id: formatted._id,
      propiedadId: formatted.propiedad?._id || formatted.propiedad,
      inquilinoId: formatted.inquilino?._id || formatted.inquilino,
      habitacionId: formatted.habitacion?._id || formatted.habitacion,
      monedaId: formatted.moneda?._id || formatted.moneda
    };
  }

  // GET /api/contratos
  async getAll(req, res) {
    try {
      console.log('Obteniendo contratos...');
      const result = await this.Model.paginate(
        {},
        {
          populate: ['propiedad', 'inquilino', 'habitacion', 'moneda'],
          sort: { createdAt: 'desc' }
        }
      );

      const docs = result.docs.map(doc => this.formatResponse(doc));
      console.log('Contratos encontrados:', docs.length);
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
      const data = {
        ...req.body,
        fechaInicio: new Date(req.body.fechaInicio),
        fechaFin: req.body.fechaFin ? new Date(req.body.fechaFin) : null,
        montoMensual: parseFloat(req.body.montoMensual),
        deposito: req.body.deposito ? parseFloat(req.body.deposito) : null,
        propiedad: req.body.propiedadId,
        inquilino: req.body.inquilinoId,
        habitacion: req.body.habitacionId,
        moneda: req.body.monedaId
      };

      console.log('Datos procesados:', data);

      const contrato = await this.Model.create(data);
      const populatedContrato = await this.Model.findById(contrato._id)
        .populate(['propiedad', 'inquilino', 'habitacion', 'moneda']);

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
      const data = {
        ...req.body,
        fechaInicio: new Date(req.body.fechaInicio),
        fechaFin: req.body.fechaFin ? new Date(req.body.fechaFin) : null,
        montoMensual: parseFloat(req.body.montoMensual),
        deposito: req.body.deposito ? parseFloat(req.body.deposito) : null,
        propiedad: req.body.propiedadId,
        inquilino: req.body.inquilinoId,
        habitacion: req.body.habitacionId,
        moneda: req.body.monedaId
      };

      const contrato = await this.Model.findByIdAndUpdate(
        id,
        data,
        { new: true }
      ).populate(['propiedad', 'inquilino', 'habitacion', 'moneda']);

      if (!contrato) {
        return res.status(404).json({ error: 'Contrato no encontrado' });
      }

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