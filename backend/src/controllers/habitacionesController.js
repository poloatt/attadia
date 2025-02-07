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
      res.json(result);
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
      ).populate('propiedad', 'nombre direccion');

      if (!habitacion) {
        return res.status(404).json({ error: 'Habitación no encontrada' });
      }

      res.json(habitacion);
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      res.status(500).json({ error: 'Error al actualizar estado' });
    }
  }
}

export const habitacionesController = new HabitacionesController(); 