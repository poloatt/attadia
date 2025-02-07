import { BaseController } from './BaseController.js';
import { Cuentas } from '../models/index.js';

class CuentasController extends BaseController {
  constructor() {
    super(Cuentas, {
      searchFields: ['nombre', 'numero']
    });

    // Bind de los métodos al contexto de la instancia
    this.getAllAdmin = this.getAllAdmin.bind(this);
    this.getAdminStats = this.getAdminStats.bind(this);
  }

  // GET /api/cuentas/admin/all
  async getAllAdmin(req, res) {
    try {
      const result = await this.Model.paginate(
        {},
        {
          populate: [
            { path: 'moneda' },
            { path: 'usuario', select: 'nombre email' }
          ],
          sort: { createdAt: 'desc' }
        }
      );
      res.json(result);
    } catch (error) {
      console.error('Error al obtener todas las cuentas:', error);
      res.status(500).json({ error: 'Error al obtener todas las cuentas' });
    }
  }

  // GET /api/cuentas/admin/stats
  async getAdminStats(req, res) {
    try {
      const totalCuentas = await this.Model.countDocuments();
      const cuentasPorMoneda = await this.Model.aggregate([
        {
          $group: {
            _id: '$moneda',
            count: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'monedas',
            localField: '_id',
            foreignField: '_id',
            as: 'moneda'
          }
        },
        {
          $unwind: '$moneda'
        }
      ]);

      res.json({
        totalCuentas,
        cuentasPorMoneda
      });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
  }
}

export const cuentasController = new CuentasController(); 