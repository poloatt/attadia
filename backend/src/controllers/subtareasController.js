import { BaseController } from './BaseController.js';
import { Subtareas } from '../models/index.js';
import mongoose from 'mongoose';

class SubtareasController extends BaseController {
  constructor() {
    super(Subtareas, {
      searchFields: ['titulo', 'descripcion']
    });

    // Bind de los métodos al contexto de la instancia
    this.getAllByTarea = this.getAllByTarea.bind(this);
    this.getAllAdmin = this.getAllAdmin.bind(this);
    this.toggleCompletada = this.toggleCompletada.bind(this);
  }

  // GET /api/subtareas/tarea/:tareaId
  async getAllByTarea(req, res) {
    try {
      const result = await this.Model.paginate(
        { 
          tarea: req.params.tareaId,
          usuario: req.user.id 
        },
        { sort: { orden: 'asc' } }
      );
      res.json(result);
    } catch (error) {
      console.error('Error al obtener subtareas:', error);
      res.status(500).json({ error: 'Error al obtener subtareas' });
    }
  }

  // GET /api/subtareas/admin/all
  async getAllAdmin(req, res) {
    try {
      const result = await this.Model.paginate(
        {},
        {
          populate: ['tarea', 'usuario'],
          sort: { createdAt: 'desc' }
        }
      );
      res.json(result);
    } catch (error) {
      console.error('Error al obtener subtareas:', error);
      res.status(500).json({ error: 'Error al obtener subtareas' });
    }
  }

  // PATCH /api/subtareas/:id/toggle
  async toggleCompletada(req, res) {
    try {
      const subtarea = await this.Model.findOne({
        _id: req.params.id,
        usuario: req.user.id
      });

      if (!subtarea) {
        return res.status(404).json({ error: 'Subtarea no encontrada' });
      }

      // Cambiar el estado de completada
      subtarea.completada = !subtarea.completada;
      await subtarea.save();

      // Obtener la tarea actualizada con todas sus subtareas
      const Tareas = mongoose.model('Tareas');
      const tareaActualizada = await Tareas.findById(subtarea.tarea).populate('subtareas');

      res.json(tareaActualizada);
    } catch (error) {
      console.error('Error al actualizar subtarea:', error);
      res.status(500).json({ error: 'Error al actualizar subtarea' });
    }
  }
}

export const subtareasController = new SubtareasController(); 