import { BaseController } from './BaseController.js';
import { Objetivos } from '../models/index.js';

class ObjetivosController extends BaseController {
  constructor() {
    super(Objetivos, {
      searchFields: ['titulo', 'descripcion', 'tipo']
    });

    // Bind de los métodos al contexto de la instancia
    this.getStats = this.getStats.bind(this);
    this.getAllAdmin = this.getAllAdmin.bind(this);
    this.getAdminStats = this.getAdminStats.bind(this);
  }

  // GET /api/objetivos/stats
  async getStats(req, res) {
    try {
      const stats = await this.Model.aggregate([
        { $match: { usuario: req.user.id } },
        {
          $group: {
            _id: '$estado',
            count: { $sum: 1 }
          }
        }
      ]);

      const formattedStats = stats.reduce((acc, curr) => {
        acc[curr._id.toLowerCase()] = curr.count;
        return acc;
      }, {});

      res.json(formattedStats);
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
  }

  // GET /api/objetivos/admin/all
  async getAllAdmin(req, res) {
    try {
      const result = await this.Model.paginate(
        {},
        {
          populate: { path: 'usuario', select: 'nombre email' },
          sort: { fechaLimite: 'asc' }
        }
      );
      res.json(result);
    } catch (error) {
      console.error('Error al obtener objetivos:', error);
      res.status(500).json({ error: 'Error al obtener objetivos' });
    }
  }

  // GET /api/objetivos/admin/stats
  async getAdminStats(req, res) {
    try {
      const stats = await this.Model.aggregate([
        {
          $group: {
            _id: '$estado',
            count: { $sum: 1 },
            montoTotal: { $sum: '$montoObjetivo' }
          }
        }
      ]);

      const formattedStats = stats.reduce((acc, stat) => {
        acc[stat._id.toLowerCase()] = {
          cantidad: stat.count,
          montoTotal: stat.montoTotal
        };
        return acc;
      }, {});

      // Agregar estadísticas adicionales
      const totalObjetivos = await this.Model.countDocuments();
      const objetivosCumplidos = await this.Model.countDocuments({ estado: 'CUMPLIDO' });
      
      formattedStats.general = {
        total: totalObjetivos,
        cumplidos: objetivosCumplidos,
        porcentajeCumplimiento: (objetivosCumplidos / totalObjetivos) * 100
      };

      res.json(formattedStats);
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
  }
}

export const objetivosController = new ObjetivosController(); 