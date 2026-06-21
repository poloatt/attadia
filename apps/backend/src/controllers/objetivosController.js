import { BaseController } from './BaseController.js';
import { Objetivos, Tareas } from '../models/index.js';

class ObjetivosController extends BaseController {
  constructor() {
    super(Objetivos, {
      searchFields: ['nombre', 'descripcion'],
      defaultPopulate: [
        {
          path: 'moneda'
        },
        {
          path: 'propiedad',
          select: 'nombre direccion'
        }
      ]
    });

    this.getAllAdmin = this.getAllAdmin.bind(this);
    this.getAdminStats = this.getAdminStats.bind(this);
    this.getTareasByObjetivo = this.getTareasByObjetivo.bind(this);
    this.addTareaToObjetivo = this.addTareaToObjetivo.bind(this);
  }

  async getAll(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        sort = '-createdAt',
        search,
        filter,
        light,
      } = req.query;

      const isLight =
        light === 'true' || light === true || light === '1';

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

      const objetivos = await this.Model.find(query)
        .select(isLight ? '_id nombre descripcion estado color googleTasksSync' : undefined)
        .lean();

      if (!isLight) {
        for (const objetivo of objetivos) {
          const tareasDelObjetivo = await Tareas.find({
            objetivo: objetivo._id,
            usuario: req.user.id,
          })
            .select(
              'titulo descripcion estado fechaInicio fechaVencimiento fechaFin prioridad completada subtareas googleTasksSync',
            )
            .lean();

          objetivo.tareas = tareasDelObjetivo;
        }
      }

      // En light devolvemos todos los objetivos del usuario sin paginar, así que
      // el total es la longitud ya cargada (evita un countDocuments extra).
      const total = isLight
        ? objetivos.length
        : await this.Model.countDocuments(query);

      res.json({
        docs: objetivos,
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

  async getTareasByObjetivo(req, res) {
    try {
      const { id } = req.params;
      const tareas = await Tareas.find({ objetivo: id })
        .sort({ orden: 'asc' });

      res.json(tareas);
    } catch (error) {
      console.error('Error al obtener tareas del objetivo:', error);
      res.status(500).json({ error: 'Error al obtener tareas del objetivo' });
    }
  }

  async addTareaToObjetivo(req, res) {
    try {
      const { id } = req.params;
      const objetivo = await this.Model.findById(id);

      if (!objetivo) {
        return res.status(404).json({ error: 'Objetivo no encontrado' });
      }

      const count = await Tareas.countDocuments({ objetivo: id });

      const tarea = new Tareas({
        ...req.body,
        objetivo: id,
        usuario: req.user.id,
        orden: count + 1
      });

      await tarea.save();

      res.status(201).json(tarea);
    } catch (error) {
      console.error('Error al añadir tarea al objetivo:', error);
      res.status(500).json({ error: 'Error al añadir tarea al objetivo' });
    }
  }

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
      console.error('Error al obtener todos los objetivos:', error);
      res.status(500).json({ error: 'Error al obtener todos los objetivos' });
    }
  }

  async getAdminStats(req, res) {
    try {
      const totalObjetivos = await this.Model.countDocuments();
      const objetivosPorEstado = await this.Model.aggregate([
        {
          $group: {
            _id: '$estado',
            count: { $sum: 1 },
            presupuestoTotal: { $sum: '$presupuesto' }
          }
        }
      ]);

      const objetivosPorPropiedad = await this.Model.aggregate([
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
        totalObjetivos,
        objetivosPorEstado,
        objetivosPorPropiedad,
        tareasStats
      });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
  }

  async create(req, res) {
    try {
      const item = new this.Model({
        ...req.body,
        usuario: req.user.id
      });
      const savedItem = await item.save();

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

export const objetivosController = new ObjetivosController();
