import { BaseController } from './BaseController.js';
import { Propiedades, Habitaciones, Inquilinos, Contratos, Inventarios } from '../models/index.js';

class PropiedadesController extends BaseController {
  constructor() {
    super(Propiedades, {
      searchFields: ['titulo', 'descripcion', 'direccion', 'ciudad'],
      populate: [
        'moneda', 
        'cuenta',
        {
          path: 'habitaciones',
          select: 'tipo nombrePersonalizado activo'
        },
        {
          path: 'contratos',
          populate: {
            path: 'inquilino',
            select: 'nombre apellido email telefono estado'
          }
        },
        {
          path: 'inquilinos',
          select: 'nombre apellido email telefono estado'
        },
        {
          path: 'inventarios',
          match: { activo: true },
          select: 'nombre descripcion activo'
        }
      ]
    });

    // Bind de los métodos al contexto de la instancia
    this.getStats = this.getStats.bind(this);
    this.getAllAdmin = this.getAllAdmin.bind(this);
    this.updateStatus = this.updateStatus.bind(this);
    this.create = this.create.bind(this);
    this.getAll = this.getAll.bind(this);
    this.getResumenHabitaciones = this.getResumenHabitaciones.bind(this);
    this.getByEstado = this.getByEstado.bind(this);
    this.getDisponibles = this.getDisponibles.bind(this);
    this.getOcupadas = this.getOcupadas.bind(this);
    this.getEnMantenimiento = this.getEnMantenimiento.bind(this);
    this.getInquilinos = this.getInquilinos.bind(this);
    this.getInquilinosActivos = this.getInquilinosActivos.bind(this);
    this.getInquilinosPendientes = this.getInquilinosPendientes.bind(this);
    this.getContratos = this.getContratos.bind(this);
    this.getContratosActivos = this.getContratosActivos.bind(this);
    this.getContratosMantenimiento = this.getContratosMantenimiento.bind(this);
    this.getAdminStats = this.getAdminStats.bind(this);
  }

  // Método para obtener el resumen de habitaciones
  async getResumenHabitaciones(propiedadId) {
    const habitaciones = await Habitaciones.find({ propiedad: propiedadId });
    
    const resumen = {
      dormitoriosSimples: habitaciones.filter(h => h.tipo === 'DORMITORIO_SIMPLE').length,
      dormitoriosDobles: habitaciones.filter(h => h.tipo === 'DORMITORIO_DOBLE').length,
      banos: habitaciones.filter(h => h.tipo === 'BAÑO' || h.tipo === 'TOILETTE').length
    };

    resumen.totalDormitorios = resumen.dormitoriosSimples + resumen.dormitoriosDobles;

    return resumen;
  }

  // Método auxiliar para formatear la respuesta
  async formatResponse(doc) {
    if (!doc) return null;
    const formatted = doc.toObject ? doc.toObject() : doc;
    
    // Obtener resumen de habitaciones
    const resumenHabitaciones = await this.getResumenHabitaciones(formatted._id);
    
    return {
      ...formatted,
      id: formatted._id,
      monedaId: formatted.moneda?._id || formatted.moneda,
      cuentaId: formatted.cuenta?._id || formatted.cuenta,
      ...resumenHabitaciones
    };
  }

  // GET /api/propiedades
  async getAll(req, res) {
    try {
      console.log('Obteniendo propiedades...');
      
      // Verificar si hay un usuario autenticado
      if (!req.user) {
        console.log('No hay usuario autenticado');
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }
      
      const { usuario } = req.query;
      
      // Si no se proporciona un usuario en la query, usar el ID del usuario autenticado
      const filtros = {
        usuario: usuario || req.user.id
      };
      
      console.log('Filtros aplicados:', filtros);
      
      // Obtener propiedades con populate
      const propiedades = await this.Model.find(filtros)
        .populate(this.options.populate || []);
      
      // Usar getFullInfo para asegurar estado como string
      const propiedadesFull = await Promise.all(propiedades.map(p => p.getFullInfo()));
      res.json({ docs: propiedadesFull });
      
    } catch (error) {
      console.error('Error al obtener propiedades:', error);
      res.status(500).json({ 
        error: 'Error al obtener propiedades',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // Sobreescribimos el método create para asignar el usuario
  async create(req, res) {
    try {
      console.log('Datos recibidos:', req.body);
      
      const data = {
        ...req.body,
        usuario: req.user.id,
        moneda: req.body.monedaId || req.body.moneda,
        cuenta: req.body.cuentaId || req.body.cuenta
      };

      console.log('Datos a guardar:', data);

      const propiedad = await this.Model.create(data);
      const populatedPropiedad = await this.Model.findById(propiedad._id)
        .populate(['moneda', 'cuenta', 'habitaciones']);

      const formattedResponse = await this.formatResponse(populatedPropiedad);
      res.status(201).json(formattedResponse);
    } catch (error) {
      console.error('Error al crear propiedad:', error);
      res.status(400).json({ 
        error: 'Error al crear propiedad',
        details: error.message 
      });
    }
  }

  // GET /api/propiedades/stats
  async getStats(req, res) {
    try {
      console.log('Obteniendo estadísticas de propiedades...');
      const total = await this.Model.countDocuments({ usuario: req.user.id });
      const ocupadas = await this.Model.countDocuments({ 
        usuario: req.user.id,
        estado: { $in: ['OCUPADA'] }
      });
      const disponibles = await this.Model.countDocuments({ 
        usuario: req.user.id,
        estado: { $in: ['DISPONIBLE'] }
      });
      const mantenimiento = await this.Model.countDocuments({ 
        usuario: req.user.id,
        estado: { $in: ['MANTENIMIENTO'] }
      });
      const reservadas = await this.Model.countDocuments({ 
        usuario: req.user.id,
        estado: { $in: ['RESERVADA'] }
      });

      // Obtener estadísticas de habitaciones
      const propiedades = await this.Model.find({ usuario: req.user.id });
      let totalDormitorios = 0;
      let totalBanos = 0;

      for (const propiedad of propiedades) {
        const resumen = await this.getResumenHabitaciones(propiedad._id);
        totalDormitorios += resumen.totalDormitorios;
        totalBanos += resumen.banos;
      }

      console.log('Estadísticas calculadas:', {
        total,
        ocupadas,
        disponibles,
        mantenimiento,
        reservadas,
        totalDormitorios,
        totalBanos
      });

      res.json({
        total,
        ocupadas,
        disponibles,
        mantenimiento,
        reservadas,
        totalDormitorios,
        totalBanos
      });
    } catch (error) {
      console.error('Error en getStats propiedades:', error);
      res.status(500).json({ message: error.message });
    }
  }

  // GET /api/propiedades/admin/all
  async getAllAdmin(req, res) {
    try {
      const result = await this.Model.paginate(
        {},
        {
          populate: [
            { path: 'usuario', select: 'nombre email' },
            'moneda',
            'cuenta',
            'habitaciones'
          ],
          sort: { createdAt: 'desc' }
        }
      );

      const docs = await Promise.all(result.docs.map(doc => this.formatResponse(doc)));
      res.json({ ...result, docs });
    } catch (error) {
      console.error('Error al obtener propiedades:', error);
      res.status(500).json({ error: 'Error al obtener propiedades' });
    }
  }

  // PATCH /api/propiedades/:id/status
  async updateStatus(req, res) {
    try {
      const { status } = req.body;
      const propiedad = await this.Model.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      ).populate(['usuario', 'moneda', 'cuenta', 'habitaciones']);

      if (!propiedad) {
        return res.status(404).json({ error: 'Propiedad no encontrada' });
      }

      const formattedResponse = await this.formatResponse(propiedad);
      res.json(formattedResponse);
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      res.status(500).json({ error: 'Error al actualizar estado' });
    }
  }

  // GET /api/propiedades/estado/:estado
  async getByEstado(req, res) {
    try {
      const { estado } = req.params;
      const result = await this.Model.paginate(
        { 
          usuario: req.user._id,
          estado: { $in: [estado.toUpperCase()] }
        },
        {
          sort: { createdAt: 'desc' }
        }
      );

      const docs = result.docs.map(doc => this.formatResponse(doc));
      res.json({ ...result, docs });
    } catch (error) {
      console.error('Error al obtener propiedades por estado:', error);
      res.status(500).json({ error: 'Error al obtener propiedades por estado' });
    }
  }

  // GET /api/propiedades/disponibles
  async getDisponibles(req, res) {
    try {
      const result = await this.Model.paginate(
        {
          usuario: req.user._id,
          estado: { $in: ['DISPONIBLE'] }
        },
        {
          sort: { createdAt: 'desc' }
        }
      );

      const docs = result.docs.map(doc => this.formatResponse(doc));
      res.json({ ...result, docs });
    } catch (error) {
      console.error('Error al obtener propiedades disponibles:', error);
      res.status(500).json({ error: 'Error al obtener propiedades disponibles' });
    }
  }

  // GET /api/propiedades/ocupadas
  async getOcupadas(req, res) {
    try {
      const result = await this.Model.paginate(
        {
          usuario: req.user._id,
          estado: { $in: ['OCUPADA'] }
        },
        {
          sort: { createdAt: 'desc' }
        }
      );

      const docs = result.docs.map(doc => this.formatResponse(doc));
      res.json({ ...result, docs });
    } catch (error) {
      console.error('Error al obtener propiedades ocupadas:', error);
      res.status(500).json({ error: 'Error al obtener propiedades ocupadas' });
    }
  }

  // GET /api/propiedades/mantenimiento
  async getEnMantenimiento(req, res) {
    try {
      const result = await this.Model.paginate(
        {
          usuario: req.user._id,
          estado: { $in: ['MANTENIMIENTO'] }
        },
        {
          sort: { createdAt: 'desc' }
        }
      );

      const docs = result.docs.map(doc => this.formatResponse(doc));
      res.json({ ...result, docs });
    } catch (error) {
      console.error('Error al obtener propiedades en mantenimiento:', error);
      res.status(500).json({ error: 'Error al obtener propiedades en mantenimiento' });
    }
  }

  // GET /api/propiedades/:id/inquilinos
  async getInquilinos(req, res) {
    try {
      const { id } = req.params;
      const result = await Inquilinos.paginate(
        {
          usuario: req.user._id,
          propiedad: id
        },
        {
          sort: { createdAt: 'desc' }
        }
      );

      res.json(result);
    } catch (error) {
      console.error('Error al obtener inquilinos de la propiedad:', error);
      res.status(500).json({ error: 'Error al obtener inquilinos de la propiedad' });
    }
  }

  // GET /api/propiedades/:id/inquilinos/activos
  async getInquilinosActivos(req, res) {
    try {
      const { id } = req.params;
      const result = await Inquilinos.paginate(
        {
          usuario: req.user._id,
          propiedad: id,
          estado: 'ACTIVO'
        },
        {
          sort: { createdAt: 'desc' }
        }
      );

      res.json(result);
    } catch (error) {
      console.error('Error al obtener inquilinos activos:', error);
      res.status(500).json({ error: 'Error al obtener inquilinos activos' });
    }
  }

  // GET /api/propiedades/:id/inquilinos/pendientes
  async getInquilinosPendientes(req, res) {
    try {
      const { id } = req.params;
      const result = await Inquilinos.paginate(
        {
          usuario: req.user._id,
          propiedad: id,
          estado: 'PENDIENTE'
        },
        {
          sort: { createdAt: 'desc' }
        }
      );

      res.json(result);
    } catch (error) {
      console.error('Error al obtener inquilinos pendientes:', error);
      res.status(500).json({ error: 'Error al obtener inquilinos pendientes' });
    }
  }

  // GET /api/propiedades/:id/contratos
  async getContratos(req, res) {
    try {
      const { id } = req.params;
      const result = await Contratos.paginate(
        {
          usuario: req.user._id,
          propiedad: id
        },
        {
          populate: ['inquilino'],
          sort: { fechaInicio: 'desc' }
        }
      );

      res.json(result);
    } catch (error) {
      console.error('Error al obtener contratos de la propiedad:', error);
      res.status(500).json({ error: 'Error al obtener contratos de la propiedad' });
    }
  }

  // GET /api/propiedades/:id/contratos/activos
  async getContratosActivos(req, res) {
    try {
      const { id } = req.params;
      const now = new Date();
      
      const result = await Contratos.paginate(
        {
          usuario: req.user._id,
          propiedad: id,
          estado: 'ACTIVO',
          fechaInicio: { $lte: now },
          fechaFin: { $gt: now }
        },
        {
          populate: ['inquilino'],
          sort: { fechaInicio: 'desc' }
        }
      );

      res.json(result);
    } catch (error) {
      console.error('Error al obtener contratos activos:', error);
      res.status(500).json({ error: 'Error al obtener contratos activos' });
    }
  }

  // GET /api/propiedades/:id/contratos/mantenimiento
  async getContratosMantenimiento(req, res) {
    try {
      const { id } = req.params;
      const now = new Date();
      
      const result = await Contratos.paginate(
        {
          usuario: req.user._id,
          propiedad: id,
          esMantenimiento: true,
          estado: 'MANTENIMIENTO',
          fechaInicio: { $lte: now },
          fechaFin: { $gt: now }
        },
        {
          sort: { fechaInicio: 'desc' }
        }
      );

      res.json(result);
    } catch (error) {
      console.error('Error al obtener contratos de mantenimiento:', error);
      res.status(500).json({ error: 'Error al obtener contratos de mantenimiento' });
    }
  }

  // GET /api/propiedades/admin/stats
  async getAdminStats(req, res) {
    try {
      const stats = await Promise.all([
        this.Model.countDocuments(),
        this.Model.countDocuments({ estado: { $in: ['DISPONIBLE'] } }),
        this.Model.countDocuments({ estado: { $in: ['OCUPADA'] } }),
        this.Model.countDocuments({ estado: { $in: ['MANTENIMIENTO'] } }),
        this.Model.countDocuments({ estado: { $in: ['RESERVADA'] } })
      ]);
      
      res.json({
        total: stats[0],
        disponibles: stats[1],
        ocupadas: stats[2],
        mantenimiento: stats[3],
        reservadas: stats[4]
      });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
  }
}

export const propiedadesController = new PropiedadesController(); 