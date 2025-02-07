import { BaseController } from './BaseController.js';
import { Rutinas } from '../models/Rutinas.js';

class RutinasController extends BaseController {
  constructor() {
    super(Rutinas, {
      searchFields: ['tipo', 'notas']
    });

    // Bind de los métodos al contexto de la instancia
    this.getAllAdmin = this.getAllAdmin.bind(this);
    this.getAdminStats = this.getAdminStats.bind(this);
  }

  // GET /api/rutinas/admin/all
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
      console.error('Error al obtener todas las rutinas:', error);
      res.status(500).json({ error: 'Error al obtener todas las rutinas' });
    }
  }

  // GET /api/rutinas/admin/stats
  async getAdminStats(req, res) {
    try {
      const totalRutinas = await this.Model.countDocuments();
      const rutinasPorTipo = await this.Model.aggregate([
        {
          $group: {
            _id: '$tipo',
            count: { $sum: 1 }
          }
        }
      ]);

      const rutinasPorFrecuencia = await this.Model.aggregate([
        {
          $group: {
            _id: '$frecuencia',
            count: { $sum: 1 }
          }
        }
      ]);

      const rutinasPorPropiedad = await this.Model.aggregate([
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
        totalRutinas,
        rutinasPorTipo,
        rutinasPorFrecuencia,
        rutinasPorPropiedad
      });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
  }
}

export const rutinasController = new RutinasController(); 