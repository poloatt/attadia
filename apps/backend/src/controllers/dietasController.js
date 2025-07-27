import { BaseController } from './BaseController.js';
import { Dietas } from '../models/Dietas.js';

class DietasController extends BaseController {
  constructor() {
    super(Dietas, {
      searchFields: ['tipo', 'notas']
    });

    // Bind de los métodos al contexto de la instancia
    this.getAllAdmin = this.getAllAdmin.bind(this);
    this.getAdminStats = this.getAdminStats.bind(this);
  }

  // GET /api/dietas/admin/all
  async getAllAdmin(req, res) {
    try {
      const result = await this.Model.paginate(
        {},
        {
          populate: { path: 'usuario', select: 'nombre email' },
          sort: { fecha: 'desc' }
        }
      );
      res.json(result);
    } catch (error) {
      console.error('Error al obtener dietas:', error);
      res.status(500).json({ error: 'Error al obtener dietas' });
    }
  }

  // GET /api/dietas/admin/stats
  async getAdminStats(req, res) {
    try {
      const stats = await this.Model.aggregate([
        {
          $group: {
            _id: '$tipo',
            count: { $sum: 1 },
            caloriasTotales: { $sum: '$calorias' }
          }
        }
      ]);
      res.json(stats);
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
  }
}

export const dietasController = new DietasController(); 