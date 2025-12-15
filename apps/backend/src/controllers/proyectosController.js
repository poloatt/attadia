import { BaseController } from './BaseController.js';
import { Proyectos, Tareas } from '../models/index.js';

class ProyectosController extends BaseController {
  constructor() {
    super(Proyectos, {
      searchFields: ['nombre', 'descripcion'],
      defaultPopulate: [
        {
          path: 'tareas',
          model: 'Tareas',
          select: 'titulo descripcion estado fechaInicio fechaFin fechaVencimiento prioridad completada subtareas googleTasksSync',
          populate: {
            path: 'subtareas',
            model: 'Subtareas',
            select: 'titulo completada orden'
          }
        },
        {
          path: 'presupuesto.moneda'
        },
        {
          path: 'propiedad',
          select: 'nombre direccion'
        }
      ]
    });

    // Bind de los métodos al contexto de la instancia
    this.getAllAdmin = this.getAllAdmin.bind(this);
    this.getAdminStats = this.getAdminStats.bind(this);
    this.getTareasByProyecto = this.getTareasByProyecto.bind(this);
    this.addTareaToProyecto = this.addTareaToProyecto.bind(this);
  }

  // Sobrescribir getAll para incluir filtro de usuario
  async getAll(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        sort = '-createdAt',
        search,
        filter
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

      // Obtener todos los proyectos
      const proyectos = await this.Model.find(query).lean();

      // Para cada proyecto, sincronizar sus tareas
      for (const proyecto of proyectos) {
        // Encontrar todas las tareas asociadas a este proyecto (incluyendo campos de Google Tasks)
        const tareasDelProyecto = await Tareas.find({
          proyecto: proyecto._id,
          usuario: req.user.id
        })
        .select('titulo estado fechaInicio fechaVencimiento fechaFin prioridad completada') // Incluir fechas para UI
        // Remover populate de subtareas para reducir datos
        .lean();

        // Actualizar el array de tareas en el proyecto
        await this.Model.findByIdAndUpdate(
          proyecto._id,
          { $set: { tareas: tareasDelProyecto.map(t => t._id) } }
        );

        // Asignar las tareas al proyecto en memoria
        proyecto.tareas = tareasDelProyecto;
      }

      const total = await this.Model.countDocuments(query);
      
      // Solo log en desarrollo para reducir ruido
      if (process.env.NODE_ENV === 'development') {
        console.log('Número de proyectos encontrados:', proyectos.length);
      }
      
      res.json({
        docs: proyectos,
        totalDocs: total,
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
        page: parseInt(page),
        pagingCounter: (parseInt(page) - 1) * parseInt(limit) + 1,
        hasPrevPage: parseInt(page) > 1,
        hasNextPage: parseInt(page) * parseInt(limit) < total,
        prevPage: parseInt(page) > 1 ? parseInt(page) - 1 : null,
        nextPage: parseInt(page) * parseInt(limit) < total ? parseInt(page) + 1 : null
      });
    } catch (error) {
      console.error('Error en getAll:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // GET /api/proyectos/:id/tareas
  async getTareasByProyecto(req, res) {
    try {
      const { id } = req.params;
      const tareas = await Tareas.find({ proyecto: id })
        .populate('subtareas')
        .sort({ orden: 'asc' });
      
      res.json(tareas);
    } catch (error) {
      console.error('Error al obtener tareas del proyecto:', error);
      res.status(500).json({ error: 'Error al obtener tareas del proyecto' });
    }
  }

  // POST /api/proyectos/:id/tareas
  async addTareaToProyecto(req, res) {
    try {
      const { id } = req.params;
      const proyecto = await this.Model.findById(id);
      
      if (!proyecto) {
        return res.status(404).json({ error: 'Proyecto no encontrado' });
      }

      const tarea = new Tareas({
        ...req.body,
        proyecto: id,
        usuario: req.user.id,
        orden: (proyecto.tareas?.length || 0) + 1
      });

      await tarea.save();
      
      proyecto.tareas.push(tarea._id);
      await proyecto.save();

      res.status(201).json(tarea);
    } catch (error) {
      console.error('Error al añadir tarea al proyecto:', error);
      res.status(500).json({ error: 'Error al añadir tarea al proyecto' });
    }
  }

  // GET /api/proyectos/admin/all
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
      console.error('Error al obtener todos los proyectos:', error);
      res.status(500).json({ error: 'Error al obtener todos los proyectos' });
    }
  }

  // GET /api/proyectos/admin/stats
  async getAdminStats(req, res) {
    try {
      const totalProyectos = await this.Model.countDocuments();
      const proyectosPorEstado = await this.Model.aggregate([
        {
          $group: {
            _id: '$estado',
            count: { $sum: 1 },
            presupuestoTotal: { $sum: '$presupuesto.monto' }
          }
        }
      ]);

      const proyectosPorPropiedad = await this.Model.aggregate([
        {
          $group: {
            _id: '$propiedad',
            count: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'propiedades',
            localField: '_id',
            foreignField: '_id',
            as: 'propiedad'
          }
        },
        {
          $unwind: '$propiedad'
        }
      ]);

      const tareasStats = await Tareas.aggregate([
        {
          $group: {
            _id: '$estado',
            count: { $sum: 1 }
          }
        }
      ]);

      res.json({
        totalProyectos,
        proyectosPorEstado,
        proyectosPorPropiedad,
        tareasStats
      });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
  }

  // Sobrescribir create para incluir el usuario
  async create(req, res) {
    try {
      const item = new this.Model({
        ...req.body,
        usuario: req.user.id
      });
      const savedItem = await item.save();
      
      // Incluir información de Google Tasks en la respuesta
      const response = {
        ...savedItem.toObject(),
        isGoogleTasksEnabled: savedItem.googleTasksSync?.enabled || false,
        googleTaskListId: savedItem.googleTasksSync?.googleTaskListId || null,
        googleTasksSyncStatus: savedItem.googleTasksSync?.syncStatus || null
      };
      
      res.status(201).json(response);
    } catch (error) {
      console.error('Error en create:', error);
      res.status(400).json({ error: error.message });
    }
  }
}

export const proyectosController = new ProyectosController(); 