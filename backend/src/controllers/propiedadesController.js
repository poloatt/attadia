import { BaseController } from './BaseController.js';
import { Propiedades, Habitaciones } from '../models/index.js';

class PropiedadesController extends BaseController {
  constructor() {
    super(Propiedades, {
      searchFields: ['titulo', 'descripcion', 'direccion', 'ciudad']
    });

    // Bind de los métodos al contexto de la instancia
    this.getStats = this.getStats.bind(this);
    this.getAllAdmin = this.getAllAdmin.bind(this);
    this.updateStatus = this.updateStatus.bind(this);
    this.create = this.create.bind(this);
    this.getAll = this.getAll.bind(this);
    this.getResumenHabitaciones = this.getResumenHabitaciones.bind(this);
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
      console.log('Usuario actual:', req.user);
      
      // Asegurarnos de que tenemos un usuario válido
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const query = { usuario: req.user.id };
      console.log('Query de búsqueda:', query);

      const result = await this.Model.paginate(
        query,
        {
          populate: [
            'moneda', 
            'cuenta',
            {
              path: 'habitaciones',
              populate: ['inventarios']
            }
          ],
          sort: { createdAt: 'desc' }
        }
      );

      console.log('Resultado de la búsqueda:', result);

      // Formatear cada documento con el resumen de habitaciones
      const docs = await Promise.all(result.docs.map(doc => this.formatResponse(doc)));
      console.log('Documentos formateados:', docs);

      res.json({ ...result, docs });
    } catch (error) {
      console.error('Error al obtener propiedades:', error);
      res.status(500).json({ error: 'Error al obtener propiedades' });
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
        estado: 'OCUPADA'
      });
      const disponibles = await this.Model.countDocuments({ 
        usuario: req.user.id,
        estado: 'DISPONIBLE'
      });
      const mantenimiento = await this.Model.countDocuments({ 
        usuario: req.user.id,
        estado: 'MANTENIMIENTO'
      });
      const reservadas = await this.Model.countDocuments({ 
        usuario: req.user.id,
        estado: 'RESERVADA'
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
}

export const propiedadesController = new PropiedadesController(); 