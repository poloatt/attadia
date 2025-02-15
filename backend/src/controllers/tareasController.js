import { BaseController } from './BaseController.js';
import { Tareas, Subtareas } from '../models/index.js';

class TareasController extends BaseController {
  constructor() {
    super(Tareas, {
      searchFields: ['titulo', 'descripcion', 'etiquetas'],
      defaultPopulate: [
        { 
          path: 'proyecto',
          select: 'nombre descripcion estado'
        },
        {
          path: 'subtareas',
          select: 'titulo descripcion estado completada orden'
        }
      ]
    });

    // Bind de los métodos al contexto de la instancia
    this.getAllByProyecto = this.getAllByProyecto.bind(this);
    this.getAllAdmin = this.getAllAdmin.bind(this);
    this.getAdminStats = this.getAdminStats.bind(this);
    this.updateSubtareas = this.updateSubtareas.bind(this);
    this.addSubtarea = this.addSubtarea.bind(this);
    this.removeSubtarea = this.removeSubtarea.bind(this);
  }

  // Sobrescribir getAll para incluir filtro de usuario
  async getAll(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        sort = 'orden',
        search,
        filter,
        select
      } = req.query;

      const query = {
        usuario: req.user.id
      };

      if (search) {
        query.$or = this.options.searchFields.map(field => ({
          [field]: { $regex: search, $options: 'i' }
        }));
      }

      if (filter) {
        Object.assign(query, JSON.parse(filter));
      }

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort,
        select,
        populate: this.options.defaultPopulate
      };

      const result = await this.Model.paginate(query, options);
      res.json(result);
    } catch (error) {
      console.error('Error en getAll:', error);
      res.status(500).json({ error: error.message });
    }
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
          populate: this.options.defaultPopulate,
          sort: { orden: 'asc', fechaVencimiento: 'asc' }
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
          populate: this.options.defaultPopulate,
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

      const subtareasStats = await Subtareas.aggregate([
        {
          $group: {
            _id: '$estado',
            count: { $sum: 1 }
          }
        }
      ]);

      res.json({
        totalTareas,
        tareasPorEstado,
        tareasPorPrioridad,
        tareasPorProyecto,
        subtareasStats
      });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
  }

  // POST /api/tareas/:id/subtareas
  async addSubtarea(req, res) {
    try {
      const { id } = req.params;
      const tarea = await this.Model.findOne({ _id: id, usuario: req.user.id });

      if (!tarea) {
        return res.status(404).json({ error: 'Tarea no encontrada' });
      }

      const subtarea = new Subtareas({
        ...req.body,
        tarea: id,
        usuario: req.user.id,
        orden: (tarea.subtareas?.length || 0) + 1
      });

      await subtarea.save();
      
      tarea.subtareas.push(subtarea._id);
      await tarea.save();

      res.status(201).json(subtarea);
    } catch (error) {
      console.error('Error al añadir subtarea:', error);
      res.status(500).json({ error: 'Error al añadir subtarea' });
    }
  }

  // DELETE /api/tareas/:id/subtareas/:subtareaId
  async removeSubtarea(req, res) {
    try {
      const { id, subtareaId } = req.params;
      const tarea = await this.Model.findOne({ _id: id, usuario: req.user.id });

      if (!tarea) {
        return res.status(404).json({ error: 'Tarea no encontrada' });
      }

      // Eliminar la subtarea
      await Subtareas.findOneAndDelete({ 
        _id: subtareaId,
        tarea: id,
        usuario: req.user.id
      });

      // Eliminar la referencia de la tarea
      tarea.subtareas = tarea.subtareas.filter(
        subtarea => subtarea.toString() !== subtareaId
      );
      await tarea.save();

      res.json({ message: 'Subtarea eliminada correctamente' });
    } catch (error) {
      console.error('Error al eliminar subtarea:', error);
      res.status(500).json({ error: 'Error al eliminar subtarea' });
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
      ).populate('subtareas');

      if (!tarea) {
        return res.status(404).json({ error: 'Tarea no encontrada' });
      }

      res.json(tarea);
    } catch (error) {
      console.error('Error al actualizar subtareas:', error);
      res.status(500).json({ error: 'Error al actualizar subtareas' });
    }
  }

  // Sobrescribir create para incluir el usuario
  async create(req, res) {
    try {
      const item = new this.Model({
        ...req.body,
        usuario: req.user.id,
        orden: await this.Model.countDocuments({ proyecto: req.body.proyecto }) + 1
      });
      const savedItem = await item.save();
      res.status(201).json(savedItem);
    } catch (error) {
      console.error('Error en create:', error);
      res.status(400).json({ error: error.message });
    }
  }
}

export const tareasController = new TareasController(); 