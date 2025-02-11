import { BaseController } from './BaseController.js';
import { Inquilinos } from '../models/index.js';

class InquilinosController extends BaseController {
  constructor() {
    super(Inquilinos, {
      searchFields: ['nombre', 'apellido', 'dni', 'email', 'telefono']
    });

    // Bind de los métodos al contexto de la instancia
    this.getActivos = this.getActivos.bind(this);
    this.getAllAdmin = this.getAllAdmin.bind(this);
    this.getAdminStats = this.getAdminStats.bind(this);
    this.updateStatus = this.updateStatus.bind(this);
  }

  // GET /api/inquilinos/activos
  async getActivos(req, res) {
    try {
      const inquilinos = await this.Model.paginate(
        {
          usuario: req.user.id,
          estado: 'ACTIVO'
        },
        {
          populate: {
            path: 'contratos',
            match: { estado: 'ACTIVO' },
            populate: { 
              path: 'propiedad habitacion moneda',
              select: 'nombre numero simbolo'
            }
          }
        }
      );
      
      res.json(inquilinos);
    } catch (error) {
      console.error('Error al obtener inquilinos activos:', error);
      res.status(500).json({ error: 'Error al obtener inquilinos activos' });
    }
  }

  // GET /api/inquilinos/admin/all
  async getAllAdmin(req, res) {
    try {
      const result = await this.Model.paginate(
        {},
        {
          populate: 'usuario',
          sort: { createdAt: 'desc' }
        }
      );
      res.json(result);
    } catch (error) {
      console.error('Error al obtener todos los inquilinos:', error);
      res.status(500).json({ error: 'Error al obtener todos los inquilinos' });
    }
  }

  // GET /api/inquilinos/admin/stats
  async getAdminStats(req, res) {
    try {
      const totalInquilinos = await this.Model.countDocuments();
      const inquilinosActivos = await this.Model.countDocuments({ estado: 'ACTIVO' });
      const inquilinosInactivos = await this.Model.countDocuments({ estado: 'INACTIVO' });
      
      const inquilinosPorUsuario = await this.Model.aggregate([
        {
          $group: {
            _id: '$usuario',
            count: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'usuario'
          }
        },
        {
          $unwind: '$usuario'
        }
      ]);

      res.json({
        totalInquilinos,
        inquilinosActivos,
        inquilinosInactivos,
        inquilinosPorUsuario
      });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
  }

  // PATCH /api/inquilinos/:id/status
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { estado } = req.body;

      const inquilino = await this.Model.findByIdAndUpdate(
        id,
        { estado },
        { new: true }
      ).populate('usuario');

      if (!inquilino) {
        return res.status(404).json({ error: 'Inquilino no encontrado' });
      }

      res.json(inquilino);
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      res.status(500).json({ error: 'Error al actualizar estado' });
    }
  }
}

export const inquilinosController = new InquilinosController(); 