import { BaseController } from './BaseController.js';
import { Inquilinos } from '../models/index.js';

class InquilinosController extends BaseController {
  constructor() {
    super(Inquilinos, {
      searchFields: ['nombre', 'apellido', 'dni', 'email', 'telefono']
    });

    // Bind de los métodos al contexto de la instancia
    this.getActivos = this.getActivos.bind(this);
    this.getAllAdmin = this.getAllAdmin.bind(this);
    this.getAdminStats = this.getAdminStats.bind(this);
    this.updateStatus = this.updateStatus.bind(this);
    this.create = this.create.bind(this);
    this.getAll = this.getAll.bind(this);
  }

  // Método auxiliar para formatear la respuesta
  formatResponse(doc) {
    if (!doc) return null;
    const formatted = doc.toObject ? doc.toObject() : doc;
    return {
      ...formatted,
      id: formatted._id,
      propiedadId: formatted.propiedad?._id || formatted.propiedad,
      contratoId: formatted.contrato?._id || formatted.contrato
    };
  }

  // GET /api/inquilinos
  async getAll(req, res) {
    try {
      console.log('Obteniendo inquilinos...');
      const result = await this.Model.paginate(
        {},
        {
          populate: ['propiedad', 'contrato'],
          sort: { createdAt: 'desc' }
        }
      );

      const docs = result.docs.map(doc => this.formatResponse(doc));
      console.log('Inquilinos encontrados:', docs.length);
      res.json({ ...result, docs });
    } catch (error) {
      console.error('Error al obtener inquilinos:', error);
      res.status(500).json({ error: 'Error al obtener inquilinos' });
    }
  }

  // Sobreescribimos el método create
  async create(req, res) {
    try {
      console.log('Creando inquilino:', req.body);
      const inquilino = await this.Model.create(req.body);
      const populatedInquilino = await this.Model.findById(inquilino._id)
        .populate(['propiedad', 'contrato']);

      console.log('Inquilino creado:', populatedInquilino);
      res.status(201).json(this.formatResponse(populatedInquilino));
    } catch (error) {
      console.error('Error al crear inquilino:', error);
      res.status(400).json({ 
        error: 'Error al crear inquilino',
        details: error.message 
      });
    }
  }

  // GET /api/inquilinos/activos
  async getActivos(req, res) {
    try {
      const inquilinos = await this.Model.paginate(
        { estado: 'ACTIVO' },
        {
          populate: ['propiedad', 'contrato'],
          sort: { createdAt: 'desc' }
        }
      );
      
      const docs = inquilinos.docs.map(doc => this.formatResponse(doc));
      res.json({ ...inquilinos, docs });
    } catch (error) {
      console.error('Error al obtener inquilinos activos:', error);
      res.status(500).json({ error: 'Error al obtener inquilinos activos' });
    }
  }

  // GET /api/inquilinos/admin/all
  async getAllAdmin(req, res) {
    try {
      const result = await this.Model.paginate(
        {},
        {
          populate: ['usuario', 'propiedad', 'contrato'],
          sort: { createdAt: 'desc' }
        }
      );
      const docs = result.docs.map(doc => this.formatResponse(doc));
      res.json({ ...result, docs });
    } catch (error) {
      console.error('Error al obtener todos los inquilinos:', error);
      res.status(500).json({ error: 'Error al obtener todos los inquilinos' });
    }
  }

  // GET /api/inquilinos/admin/stats
  async getAdminStats(req, res) {
    try {
      const totalInquilinos = await this.Model.countDocuments();
      const inquilinosActivos = await this.Model.countDocuments({ estado: 'ACTIVO' });
      const inquilinosInactivos = await this.Model.countDocuments({ estado: 'INACTIVO' });
      const inquilinosPendientes = await this.Model.countDocuments({ estado: 'PENDIENTE' });
      
      res.json({
        total: totalInquilinos,
        activos: inquilinosActivos,
        inactivos: inquilinosInactivos,
        pendientes: inquilinosPendientes
      });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
  }

  // PATCH /api/inquilinos/:id/status
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { estado } = req.body;

      const inquilino = await this.Model.findByIdAndUpdate(
        id,
        { estado },
        { new: true }
      ).populate(['propiedad', 'contrato']);

      if (!inquilino) {
        return res.status(404).json({ error: 'Inquilino no encontrado' });
      }

      res.json(this.formatResponse(inquilino));
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      res.status(500).json({ error: 'Error al actualizar estado' });
    }
  }
}

export const inquilinosController = new InquilinosController(); 