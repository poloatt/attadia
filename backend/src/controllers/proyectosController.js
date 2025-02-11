import { BaseController } from './BaseController.js';
import { Proyectos } from '../models/index.js';

class ProyectosController extends BaseController {
  constructor() {
    super(Proyectos, {
      searchFields: ['nombre', 'descripcion']
    });

    // Bind de los métodos al contexto de la instancia
    this.getAllAdmin = this.getAllAdmin.bind(this);
    this.getAdminStats = this.getAdminStats.bind(this);
  }

  // GET /api/proyectos/admin/all
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
            presupuestoTotal: { $sum: '$presupuesto' }
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

      res.json({
        totalProyectos,
        proyectosPorEstado,
        proyectosPorPropiedad
      });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
  }
}

export const proyectosController = new ProyectosController(); 