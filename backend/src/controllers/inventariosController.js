import { BaseController } from './BaseController.js';
import { Inventarios } from '../models/index.js';

class InventariosController extends BaseController {
  constructor() {
    super(Inventarios, {
      searchFields: ['nombre', 'descripcion', 'categoria']
    });

    // Bind de los métodos al contexto de la instancia
    this.getAllAdmin = this.getAllAdmin.bind(this);
    this.getAdminStats = this.getAdminStats.bind(this);
  }

  // GET /api/inventarios/admin/all
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
      console.error('Error al obtener inventarios:', error);
      res.status(500).json({ error: 'Error al obtener inventarios' });
    }
  }

  // GET /api/inventarios/admin/stats
  async getAdminStats(req, res) {
    try {
      const stats = await this.Model.aggregate([
        {
          $group: {
            _id: '$estado',
            count: { $sum: 1 },
            valorTotal: { $sum: '$valorEstimado' }
          }
        }
      ]);

      const formattedStats = stats.reduce((acc, stat) => {
        acc[stat._id.toLowerCase()] = {
          cantidad: stat.count,
          valorTotal: stat.valorTotal
        };
        return acc;
      }, {});

      res.json(formattedStats);
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
  }
}

export const inventariosController = new InventariosController(); 