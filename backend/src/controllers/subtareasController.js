import { BaseController } from './BaseController.js';
import { Subtareas } from '../models/index.js';

class SubtareasController extends BaseController {
  constructor() {
    super(Subtareas, {
      searchFields: ['titulo', 'descripcion']
    });

    // Bind de los métodos al contexto de la instancia
    this.getAllByTarea = this.getAllByTarea.bind(this);
    this.getAllAdmin = this.getAllAdmin.bind(this);
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
}

export const subtareasController = new SubtareasController(); 