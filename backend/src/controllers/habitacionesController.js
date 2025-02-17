import { BaseController } from './BaseController.js';
import { Habitaciones } from '../models/index.js';

class HabitacionesController extends BaseController {
  constructor() {
    super(Habitaciones, {
      searchFields: ['tipo', 'nombrePersonalizado']
    });

    // Bind de los métodos al contexto de la instancia
    this.getAllByPropiedad = this.getAllByPropiedad.bind(this);
    this.getAllAdmin = this.getAllAdmin.bind(this);
    this.create = this.create.bind(this);
    this.delete = this.delete.bind(this);
    this.update = this.update.bind(this);
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
      const habitaciones = await this.Model.find()
        .populate(['propiedad', 'inventarios'])
        .sort({ createdAt: 'desc' });

      const docs = habitaciones.map(doc => this.formatResponse(doc));
      res.json({ docs });
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
        propiedad: req.body.propiedadId
      };

      // Validación adicional para nombrePersonalizado
      if (data.tipo === 'OTRO' && (!data.nombrePersonalizado || data.nombrePersonalizado.trim() === '')) {
        throw new Error('Por favor, especifica el tipo de habitación personalizado');
      }

      const habitacion = await this.Model.create(data);
      const populatedHabitacion = await this.Model.findById(habitacion._id)
        .populate(['propiedad', 'inventarios']);

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
      const habitaciones = await this.Model.find({ propiedad: propiedadId })
        .populate(['propiedad', 'inventarios'])
        .sort({ createdAt: 'desc' });

      const docs = habitaciones.map(doc => this.formatResponse(doc));
      res.json({ docs });
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
            { path: 'propiedad', select: 'titulo direccion' },
            { path: 'inventarios' },
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

  // Sobreescribimos el método update para manejar propiedadId
  async update(req, res) {
    try {
      const { id } = req.params;
      const data = {
        ...req.body,
        propiedad: req.body.propiedadId
      };

      // Validación adicional para nombrePersonalizado
      if (data.tipo === 'OTRO' && (!data.nombrePersonalizado || data.nombrePersonalizado.trim() === '')) {
        throw new Error('Por favor, especifica el tipo de habitación personalizado');
      }

      const habitacion = await this.Model.findByIdAndUpdate(
        id,
        data,
        { new: true }
      ).populate(['propiedad', 'inventarios']);

      if (!habitacion) {
        return res.status(404).json({ error: 'Habitación no encontrada' });
      }

      res.json(this.formatResponse(habitacion));
    } catch (error) {
      console.error('Error al actualizar habitación:', error);
      res.status(400).json({ 
        error: 'Error al actualizar habitación',
        details: error.message 
      });
    }
  }
}

export const habitacionesController = new HabitacionesController(); 