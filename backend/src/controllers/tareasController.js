import { BaseController } from './BaseController.js';
import { Tareas } from '../models/index.js';

class TareasController extends BaseController {
  constructor() {
    super(Tareas, {
      searchFields: ['titulo', 'descripcion']
    });

    // Bind de los métodos al contexto de la instancia
    this.getAllByProyecto = this.getAllByProyecto.bind(this);
    this.getAllAdmin = this.getAllAdmin.bind(this);
    this.getAdminStats = this.getAdminStats.bind(this);
    this.updateSubtareas = this.updateSubtareas.bind(this);
  }

  // GET /api/tareas/proyecto/:proyectoId
  async getAllByProyecto(req, res) {
    try {
      const { proyectoId } = req.params;
      const result = await this.Model.paginate(
        { 
          proyecto: proyectoId,
          usuario: req.user.id 
        },
        {
          populate: 'proyecto',
          sort: { fechaVencimiento: 'asc' }
        }
      );
      res.json(result);
    } catch (error) {
      console.error('Error al obtener tareas del proyecto:', error);
      res.status(500).json({ error: 'Error al obtener tareas del proyecto' });
    }
  }

  // GET /api/tareas/admin/all
  async getAllAdmin(req, res) {
    try {
      const result = await this.Model.paginate(
        {},
        {
          populate: [
            { path: 'proyecto', select: 'nombre descripcion' },
            { path: 'usuario', select: 'nombre email' }
          ],
          sort: { createdAt: 'desc' }
        }
      );
      res.json(result);
    } catch (error) {
      console.error('Error al obtener todas las tareas:', error);
      res.status(500).json({ error: 'Error al obtener todas las tareas' });
    }
  }

  // GET /api/tareas/admin/stats
  async getAdminStats(req, res) {
    try {
      const totalTareas = await this.Model.countDocuments();
      const tareasPorEstado = await this.Model.aggregate([
        {
          $group: {
            _id: '$estado',
            count: { $sum: 1 }
          }
        }
      ]);

      const tareasPorPrioridad = await this.Model.aggregate([
        {
          $group: {
            _id: '$prioridad',
            count: { $sum: 1 }
          }
        }
      ]);

      const tareasPorProyecto = await this.Model.aggregate([
        {
          $group: {
            _id: '$proyecto',
            count: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'proyectos',
            localField: '_id',
            foreignField: '_id',
            as: 'proyecto'
          }
        },
        {
          $unwind: '$proyecto'
        }
      ]);

      res.json({
        totalTareas,
        tareasPorEstado,
        tareasPorPrioridad,
        tareasPorProyecto
      });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
  }

  // PATCH /api/tareas/:id/subtareas
  async updateSubtareas(req, res) {
    try {
      const { id } = req.params;
      const { subtareas } = req.body;

      const tarea = await this.Model.findOneAndUpdate(
        { _id: id, usuario: req.user.id },
        { subtareas },
        { new: true }
      );

      if (!tarea) {
        return res.status(404).json({ error: 'Tarea no encontrada' });
      }

      res.json(tarea);
    } catch (error) {
      console.error('Error al actualizar subtareas:', error);
      res.status(500).json({ error: 'Error al actualizar subtareas' });
    }
  }
}

export const tareasController = new TareasController(); 