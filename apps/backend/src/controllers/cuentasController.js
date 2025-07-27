import { BaseController } from './BaseController.js';
import { Cuentas } from '../models/index.js';

class CuentasController extends BaseController {
  constructor() {
    super(Cuentas, {
      searchFields: ['nombre', 'numero'],
      populate: [
        {
          path: 'moneda',
          select: 'nombre simbolo codigo'
        }
      ]
    });

    // Bind de los métodos al contexto de la instancia
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.getAllAdmin = this.getAllAdmin.bind(this);
    this.getAdminStats = this.getAdminStats.bind(this);
  }

  // Sobreescribir el método create para asegurar que se asigna el usuario y la moneda
  async create(req, res) {
    try {
      console.log('Creando cuenta con datos:', req.body);
      console.log('Usuario actual:', req.user);

      if (!req.user?.id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      if (!req.body.moneda) {
        return res.status(400).json({ error: 'Debe especificar una moneda' });
      }

      const cuenta = new this.Model({
        ...req.body,
        usuario: req.user.id
      });

      await cuenta.save();
      
      // Poblar la referencia a moneda antes de enviar la respuesta
      await cuenta.populate('moneda');
      console.log('Cuenta creada:', cuenta);

      res.status(201).json(cuenta);
    } catch (error) {
      console.error('Error al crear cuenta:', error);
      if (error.name === 'ValidationError') {
        return res.status(400).json({ 
          error: 'Error de validación', 
          details: Object.values(error.errors).map(e => e.message)
        });
      }
      res.status(500).json({ error: error.message });
    }
  }

  // Sobreescribir el método update para mantener el usuario original y manejar moneda
  async update(req, res) {
    try {
      console.log('Actualizando cuenta:', req.params.id);
      console.log('Datos de actualización:', req.body);

      const cuenta = await this.Model.findById(req.params.id);
      if (!cuenta) {
        return res.status(404).json({ error: 'Cuenta no encontrada' });
      }

      if (!req.body.moneda) {
        return res.status(400).json({ error: 'Debe especificar una moneda' });
      }

      // Mantener el usuario original y actualizar el resto de campos
      const datosActualizados = {
        ...req.body,
        usuario: cuenta.usuario // Mantener el usuario original
      };

      const cuentaActualizada = await this.Model.findByIdAndUpdate(
        req.params.id,
        datosActualizados,
        { new: true, runValidators: true }
      ).populate('moneda');

      console.log('Cuenta actualizada:', cuentaActualizada);
      res.json(cuentaActualizada);
    } catch (error) {
      console.error('Error al actualizar cuenta:', error);
      if (error.name === 'ValidationError') {
        return res.status(400).json({ 
          error: 'Error de validación', 
          details: Object.values(error.errors).map(e => e.message)
        });
      }
      res.status(500).json({ error: error.message });
    }
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