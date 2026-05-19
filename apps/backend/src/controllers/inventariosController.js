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
    this.getAllByPropiedad = this.getAllByPropiedad.bind(this);
    this.getAllByHabitacion = this.getAllByHabitacion.bind(this);
    this.create = this.create.bind(this);
    this.getAll = this.getAll.bind(this);
  }

  // Método auxiliar para formatear la respuesta
  formatResponse(doc) {
    if (!doc) return null;
    const formatted = doc.toObject ? doc.toObject() : doc;
    return {
      ...formatted,
      id: formatted._id,
      propiedadId: formatted.propiedad?._id || formatted.propiedad,
      habitacionId: formatted.habitacion?._id || formatted.habitacion,
      contenedorId: formatted.contenedor?._id || formatted.contenedor,
      items: formatted.items || [] // hijos directos
    };
  }

  buildUbicacionFilter(ubicacion) {
    if (ubicacion === 'propiedad') {
      return { propiedad: { $exists: true, $ne: null } };
    }
    if (ubicacion === 'sin') {
      return {
        $or: [
          { propiedad: { $exists: false } },
          { propiedad: null },
        ],
      };
    }
    return {};
  }

  // GET /api/inventarios?ubicacion=propiedad|sin
  async getAll(req, res) {
    try {
      console.log('Obteniendo inventario...');
      const filter = this.buildUbicacionFilter(req.query.ubicacion);
      const result = await this.Model.paginate(
        filter,
        {
          populate: ['propiedad', 'habitacion'],
          sort: { createdAt: 'desc' }
        }
      );

      const docs = result.docs.map(doc => this.formatResponse(doc));
      console.log('Items encontrados:', docs.length);
      res.json({ ...result, docs });
    } catch (error) {
      console.error('Error al obtener inventario:', error);
      res.status(500).json({ error: 'Error al obtener inventario' });
    }
  }

  // POST /api/inventarios
  async create(req, res) {
    try {
      const data = {
        ...req.body,
        propiedad: req.body.propiedadId,
        habitacion: req.body.habitacionId,
        contenedor: req.body.contenedorId,
        cantidad: parseInt(req.body.cantidad),
        valorEstimado: req.body.valorEstimado ? parseFloat(req.body.valorEstimado) : undefined
      };

      if (data.habitacion && !data.propiedad) {
        return res.status(400).json({ error: 'No puede asignar habitación sin propiedad' });
      }

      if (data.propiedad) {
        const Propiedades = require('../models/Propiedades.js').Propiedades;
        const propiedad = await Propiedades.findById(data.propiedad);
        if (!propiedad) {
          return res.status(400).json({ error: 'La propiedad especificada no existe' });
        }

        if (data.habitacion) {
          const Habitaciones = require('../models/Habitaciones.js').Habitaciones;
          const habitacion = await Habitaciones.findById(data.habitacion);
          if (!habitacion) {
            return res.status(400).json({ error: 'La habitación especificada no existe' });
          }
          if (String(habitacion.propiedad) !== String(data.propiedad)) {
            return res.status(400).json({ error: 'La habitación no pertenece a la propiedad especificada' });
          }
        }
      } else {
        data.habitacion = null;
      }

      const item = await this.Model.create(data);
      const populatedItem = await this.Model.findById(item._id)
        .populate(['propiedad', 'habitacion', 'contenedor', 'items']);

      res.status(201).json(this.formatResponse(populatedItem));
    } catch (error) {
      console.error('Error al crear item:', error);
      res.status(400).json({ 
        error: 'Error al crear item',
        details: error.message 
      });
    }
  }

  // GET /api/inventarios/propiedad/:propiedadId
  async getAllByPropiedad(req, res) {
    try {
      const { propiedadId } = req.params;
      const result = await this.Model.paginate(
        { propiedad: propiedadId },
        {
          populate: ['habitacion'],
          sort: { createdAt: 'desc' }
        }
      );

      const docs = result.docs.map(doc => this.formatResponse(doc));
      res.json({ ...result, docs });
    } catch (error) {
      console.error('Error al obtener inventario de la propiedad:', error);
      res.status(500).json({ error: 'Error al obtener inventario de la propiedad' });
    }
  }

  // GET /api/inventarios/habitacion/:habitacionId
  async getAllByHabitacion(req, res) {
    try {
      const { habitacionId } = req.params;
      const result = await this.Model.paginate(
        { habitacion: habitacionId },
        {
          populate: ['propiedad'],
          sort: { createdAt: 'desc' }
        }
      );

      const docs = result.docs.map(doc => this.formatResponse(doc));
      res.json({ ...result, docs });
    } catch (error) {
      console.error('Error al obtener inventario de la habitación:', error);
      res.status(500).json({ error: 'Error al obtener inventario de la habitación' });
    }
  }

  // GET /api/inventarios/admin/all
  async getAllAdmin(req, res) {
    try {
      const result = await this.Model.paginate(
        {},
        {
          populate: ['propiedad', 'habitacion', 'usuario'],
          sort: { createdAt: 'desc' }
        }
      );
      const docs = result.docs.map(doc => this.formatResponse(doc));
      res.json({ ...result, docs });
    } catch (error) {
      console.error('Error al obtener todos los items:', error);
      res.status(500).json({ error: 'Error al obtener todos los items' });
    }
  }

  // GET /api/inventarios/admin/stats
  async getAdminStats(req, res) {
    try {
      const totalItems = await this.Model.countDocuments();
      const itemsNuevos = await this.Model.countDocuments({ estado: 'NUEVO' });
      const itemsBuenEstado = await this.Model.countDocuments({ estado: 'BUEN_ESTADO' });
      const itemsRegular = await this.Model.countDocuments({ estado: 'REGULAR' });
      const itemsMalos = await this.Model.countDocuments({ estado: 'MALO' });
      const itemsReparacion = await this.Model.countDocuments({ estado: 'REPARACION' });
      
      const valorTotal = await this.Model.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: '$valorEstimado' }
          }
        }
      ]);

      res.json({
        total: totalItems,
        nuevos: itemsNuevos,
        buenEstado: itemsBuenEstado,
        regular: itemsRegular,
        malos: itemsMalos,
        enReparacion: itemsReparacion,
        valorTotal: valorTotal[0]?.total || 0
      });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
  }
}

export const inventariosController = new InventariosController(); 