import { BaseController } from './BaseController.js';
import { Tareas, Subtareas, Proyectos } from '../models/index.js';
import mongoose from 'mongoose';

class TareasController extends BaseController {
  constructor() {
    super(Tareas, {
      searchFields: ['titulo', 'descripcion'],
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
    this.getByProyecto = this.getByProyecto.bind(this);
    this.getAllAdmin = this.getAllAdmin.bind(this);
    this.getAdminStats = this.getAdminStats.bind(this);
    this.updateSubtareas = this.updateSubtareas.bind(this);
    this.addSubtarea = this.addSubtarea.bind(this);
    this.removeSubtarea = this.removeSubtarea.bind(this);
    this.create = this.create.bind(this);
    this.updateEstado = this.updateEstado.bind(this);
  }

  // GET /api/tareas/proyecto/:proyectoId
  async getByProyecto(req, res) {
    try {
      const { proyectoId } = req.params;
      const { 
        page = 1, 
        limit = 10, 
        sort = '-fechaInicio',
        estado
      } = req.query;

      const query = { 
        proyecto: proyectoId,
        usuario: req.user.id 
      };

      if (estado) query.estado = estado;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort,
        populate: ['proyecto']
      };

      const result = await this.Model.paginate(query, options);
      res.json(result);
    } catch (error) {
      console.error('Error en getByProyecto:', error);
      res.status(500).json({ error: error.message });
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

  // POST /api/tareas
  async create(req, res) {
    try {
      console.log('Creando tarea con datos:', req.body);
      
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      // Validar que el proyecto exista y pertenezca al usuario
      const proyecto = await Proyectos.findOne({
        _id: req.body.proyecto,
        usuario: req.user.id
      });

      if (!proyecto) {
        return res.status(404).json({ error: 'El proyecto no existe o no pertenece al usuario' });
      }

      const tarea = new this.Model({
        ...req.body,
        usuario: req.user.id
      });

      await tarea.save();
      await tarea.populate('proyecto');
      
      res.status(201).json(tarea);
    } catch (error) {
      console.error('Error al crear tarea:', error);
      if (error.name === 'ValidationError') {
        return res.status(400).json({ 
          error: 'Error de validación', 
          details: Object.values(error.errors).map(e => e.message)
        });
      }
      res.status(500).json({ error: error.message });
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
      const { subtareaId, completada } = req.body;

      // Verificar que la tarea exista y pertenezca al usuario
      const tarea = await this.Model.findOne({ 
        _id: id, 
        usuario: req.user.id 
      });

      if (!tarea) {
        return res.status(404).json({ error: 'Tarea no encontrada' });
      }

      // Actualizar la subtarea específica
      if (subtareaId) {
        const subtareaIndex = tarea.subtareas.findIndex(
          st => st._id.toString() === subtareaId
        );

        if (subtareaIndex === -1) {
          return res.status(404).json({ error: 'Subtarea no encontrada' });
        }

        // Actualizar el estado de la subtarea
        tarea.subtareas[subtareaIndex].completada = completada;

        // Actualizar el estado de la tarea basado en las subtareas
        const todasCompletadas = tarea.subtareas.every(st => st.completada);
        const algunaCompletada = tarea.subtareas.some(st => st.completada);

        if (todasCompletadas) {
          tarea.estado = 'COMPLETADA';
        } else if (algunaCompletada) {
          tarea.estado = 'EN_PROGRESO';
        } else {
          tarea.estado = 'PENDIENTE';
        }

        await tarea.save();

        // Obtener la tarea actualizada
        const tareaActualizada = await this.Model.findById(id)
          .populate('proyecto');

        return res.json(tareaActualizada);
      }

      // Si no hay subtareaId, actualizar todas las subtareas
      const { subtareas } = req.body;
      tarea.subtareas = subtareas;
      await tarea.save();

      const tareaActualizada = await this.Model.findById(id)
        .populate('proyecto');

      res.json(tareaActualizada);
    } catch (error) {
      console.error('Error al actualizar subtareas:', error);
      res.status(500).json({ error: 'Error al actualizar subtareas' });
    }
  }

  // PATCH /api/tareas/:id/estado
  async updateEstado(req, res) {
    try {
      const { estado } = req.body;
      
      if (!['PENDIENTE', 'EN_PROGRESO', 'COMPLETADA'].includes(estado)) {
        return res.status(400).json({ error: 'Estado no válido' });
      }

      const tarea = await this.Model.findOneAndUpdate(
        { _id: req.params.id, usuario: req.user.id },
        { estado },
        { new: true, runValidators: true }
      );

      if (!tarea) {
        return res.status(404).json({ error: 'Tarea no encontrada' });
      }

      res.json(tarea);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Sobrescribimos el método getAll del BaseController
  async getAll(req, res) {
    try {
      const { 
        page = 1, 
        limit = 50, // Aumentamos el límite para mostrar más tareas
        sort = 'fechaInicio', // Ordenar por fecha de inicio por defecto
        estado,
        proyecto,
        periodo
      } = req.query;

      const query = { usuario: req.user.id };
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (estado) query.estado = estado;
      if (proyecto) query.proyecto = proyecto;

      // Filtrar por período si se especifica
      if (periodo) {
        switch (periodo) {
          case 'hoy':
            query.fechaInicio = {
              $gte: today,
              $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
            };
            break;
          case 'semana':
            const weekEnd = new Date(today);
            weekEnd.setDate(today.getDate() + 7);
            query.fechaInicio = { $gte: today, $lt: weekEnd };
            break;
          case 'mes':
            const monthEnd = new Date(today);
            monthEnd.setMonth(today.getMonth() + 1);
            query.fechaInicio = { $gte: today, $lt: monthEnd };
            break;
          case 'trimestre':
            const quarterEnd = new Date(today);
            quarterEnd.setMonth(today.getMonth() + 3);
            query.fechaInicio = { $gte: today, $lt: quarterEnd };
            break;
          case 'año':
            const yearEnd = new Date(today);
            yearEnd.setFullYear(today.getFullYear() + 1);
            query.fechaInicio = { $gte: today, $lt: yearEnd };
            break;
        }
      }

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort,
        populate: ['proyecto', 'subtareas'],
        lean: true,
        leanWithId: true
      };

      const result = await this.Model.paginate(query, options);
      
      const transformedDocs = result.docs.map(doc => ({
        ...doc,
        id: doc._id.toString(),
        proyecto: doc.proyecto ? {
          ...doc.proyecto,
          id: doc.proyecto._id.toString()
        } : null
      }));

      res.json({
        ...result,
        docs: transformedDocs
      });
    } catch (error) {
      console.error('Error en getAll:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export const tareasController = new TareasController(); 