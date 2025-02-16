import { BaseController } from './BaseController.js';
import { Proyectos, Tareas } from '../models/index.js';

class ProyectosController extends BaseController {
  constructor() {
    super(Proyectos, {
      searchFields: ['nombre', 'descripcion'],
      defaultPopulate: [
        {
          path: 'tareas',
          populate: {
            path: 'subtareas',
            model: 'Subtareas'
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
      res.status(201).json(savedItem);
    } catch (error) {
      console.error('Error en create:', error);
      res.status(400).json({ error: error.message });
    }
  }
}

export const proyectosController = new ProyectosController(); 