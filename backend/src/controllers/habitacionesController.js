import { BaseController } from './BaseController.js';
import { Habitaciones } from '../models/index.js';

class HabitacionesController extends BaseController {
  constructor() {
    super(Habitaciones, {
      searchFields: ['numero', 'tipo', 'descripcion']
    });

    // Bind de los métodos al contexto de la instancia
    this.getAllByPropiedad = this.getAllByPropiedad.bind(this);
    this.getAllAdmin = this.getAllAdmin.bind(this);
    this.updateStatus = this.updateStatus.bind(this);
    this.create = this.create.bind(this);
    this.delete = this.delete.bind(this);
  }

  // Método auxiliar para formatear la respuesta
  formatResponse(doc) {
    if (!doc) return null;
    const formatted = doc.toObject ? doc.toObject() : doc;
    return {
      ...formatted,
      id: formatted._id,
      propiedadId: formatted.propiedad?._id || formatted.propiedad
    };
  }

  // GET /api/habitaciones
  async getAll(req, res) {
    try {
      const result = await this.Model.paginate(
        {},
        {
          populate: 'propiedad',
          sort: { numero: 'asc' }
        }
      );

      const docs = result.docs.map(doc => this.formatResponse(doc));
      res.json({ ...result, docs });
    } catch (error) {
      console.error('Error al obtener habitaciones:', error);
      res.status(500).json({ error: 'Error al obtener habitaciones' });
    }
  }

  // Sobreescribimos el método create para manejar propiedadId
  async create(req, res) {
    try {
      const data = {
        ...req.body,
        propiedad: req.body.propiedadId,
        capacidad: Number(req.body.capacidad)
      };

      const habitacion = await this.Model.create(data);
      const populatedHabitacion = await this.Model.findById(habitacion._id)
        .populate('propiedad');

      res.status(201).json(this.formatResponse(populatedHabitacion));
    } catch (error) {
      console.error('Error al crear habitación:', error);
      res.status(400).json({ 
        error: 'Error al crear habitación',
        details: error.message 
      });
    }
  }

  // GET /api/habitaciones/propiedad/:propiedadId
  async getAllByPropiedad(req, res) {
    try {
      const { propiedadId } = req.params;
      const result = await this.Model.paginate(
        { propiedad: propiedadId },
        {
          populate: 'propiedad',
          sort: { numero: 'asc' }
        }
      );

      const docs = result.docs.map(doc => this.formatResponse(doc));
      res.json({ ...result, docs });
    } catch (error) {
      console.error('Error al obtener habitaciones:', error);
      res.status(500).json({ error: 'Error al obtener habitaciones' });
    }
  }

  // GET /api/habitaciones/admin/all
  async getAllAdmin(req, res) {
    try {
      const result = await this.Model.paginate(
        {},
        {
          populate: [
            { path: 'propiedad', select: 'nombre direccion' },
            { path: 'usuario', select: 'nombre email' }
          ],
          sort: { createdAt: 'desc' }
        }
      );
      res.json(result);
    } catch (error) {
      console.error('Error al obtener habitaciones:', error);
      res.status(500).json({ error: 'Error al obtener habitaciones' });
    }
  }

  // PATCH /api/habitaciones/:id/status
  async updateStatus(req, res) {
    try {
      const { estado } = req.body;
      const habitacion = await this.Model.findByIdAndUpdate(
        req.params.id,
        { estado },
        { new: true }
      ).populate('propiedad');

      if (!habitacion) {
        return res.status(404).json({ error: 'Habitación no encontrada' });
      }

      res.json(this.formatResponse(habitacion));
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      res.status(500).json({ error: 'Error al actualizar estado' });
    }
  }

  // Sobreescribimos el método delete para manejar la eliminación sin validación de usuario
  async delete(req, res) {
    try {
      const { id } = req.params;
      const habitacion = await this.Model.findByIdAndDelete(id);
      
      if (!habitacion) {
        return res.status(404).json({ error: 'Habitación no encontrada' });
      }

      res.json({ message: 'Habitación eliminada correctamente' });
    } catch (error) {
      console.error('Error al eliminar habitación:', error);
      res.status(500).json({ error: 'Error al eliminar habitación' });
    }
  }
}

export const habitacionesController = new HabitacionesController(); 