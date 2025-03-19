import { BaseController } from './BaseController.js';
import { Rutinas } from '../models/Rutinas.js';

class RutinasController extends BaseController {
  constructor() {
    super(Rutinas, {
      searchFields: ['tipo', 'notas'],
      defaultSort: { fecha: -1 }
    });

    // Bind de los métodos al contexto de la instancia
    this.getAllAdmin = this.getAllAdmin.bind(this);
    this.getAdminStats = this.getAdminStats.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.getAll = this.getAll.bind(this);
    this.verifyDate = this.verifyDate.bind(this);
    this.getById = this.getById.bind(this);
  }

  async getAll(req, res) {
    try {
      const query = { usuario: req.user.id };
      const options = {
        ...this.paginateOptions,
        sort: { fecha: -1 },
        limit: req.query.limit || 10,
        page: parseInt(req.query.page) || 1,
        lean: true
      };

      console.log('Query params:', {
        page: req.query.page,
        limit: req.query.limit,
        sort: req.query.sort
      });

      const result = await this.Model.paginate(query, options);
      
      console.log('Resultados de paginación:', {
        totalDocs: result.totalDocs,
        limit: result.limit,
        totalPages: result.totalPages,
        page: result.page,
        pagingCounter: result.pagingCounter,
        hasPrevPage: result.hasPrevPage,
        hasNextPage: result.hasNextPage,
        prevPage: result.prevPage,
        nextPage: result.nextPage,
        docs: result.docs.map(doc => ({
          _id: doc._id,
          fecha: doc.fecha,
          completitud: doc.completitud
        }))
      });

      // Asegurarnos de que cada documento tenga su _id y sea un objeto plano
      result.docs = result.docs.map(doc => {
        // Si doc._id es un ObjectId, convertirlo a string
        const _id = doc._id?.toString() || doc._id;
        
        // Crear un nuevo objeto plano con _id al inicio
        return {
          _id,
          ...doc,
          // Asegurarnos de que los subdocumentos también sean objetos planos
          bodyCare: { ...doc.bodyCare },
          nutricion: { ...doc.nutricion },
          ejercicio: { ...doc.ejercicio },
          cleaning: { ...doc.cleaning }
        };
      });

      res.json(result);
    } catch (error) {
      console.error('Error al obtener rutinas:', error);
      res.status(500).json({ 
        error: 'Error al obtener rutinas',
        details: error.message 
      });
    }
  }

  async create(req, res) {
    try {
      const { fecha } = req.body;
      
      // Normalizar la fecha a inicio del día en UTC
      const fechaInicio = new Date(fecha);
      fechaInicio.setUTCHours(0, 0, 0, 0);
      
      // Crear el rango del día completo
      const fechaFin = new Date(fechaInicio);
      fechaFin.setUTCHours(23, 59, 59, 999);

      console.log('Buscando rutina existente:', {
        fechaInicio,
        fechaFin,
        usuario: req.user.id
      });
      
      // Verificar si ya existe una rutina para este día
      const existingRutina = await this.Model.findOne({
        fecha: {
          $gte: fechaInicio,
          $lte: fechaFin
        },
        usuario: req.user.id
      });

      if (existingRutina) {
        console.log('Rutina existente encontrada:', existingRutina);
        return res.status(409).json({
          error: 'Ya existe una rutina para esta fecha',
          rutina: existingRutina
        });
      }

      console.log('Creando nueva rutina para fecha:', fechaInicio);

      // Crear la nueva rutina con la estructura correcta
      const newDoc = new this.Model({
        fecha: fechaInicio,
        usuario: req.user.id,
        bodyCare: {
          bath: false,
          skinCareDay: false,
          skinCareNight: false,
          bodyCream: false
        },
        nutricion: {
          cocinar: false,
          agua: false,
          protein: false,
          meds: false
        },
        ejercicio: {
          meditate: false,
          stretching: false,
          gym: false,
          cardio: false
        },
        cleaning: {
          bed: false,
          platos: false,
          piso: false,
          ropa: false
        }
      });

      const savedDoc = await newDoc.save();
      console.log('Rutina creada exitosamente:', savedDoc);
      res.status(201).json(savedDoc);
    } catch (error) {
      console.error('Error al crear rutina:', error);
      res.status(500).json({ 
        error: 'Error al crear la rutina',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      
      // Obtener la rutina actual
      const currentRutina = await this.Model.findOne({ 
        _id: id, 
        usuario: req.user.id 
      });
      
      if (!currentRutina) {
        return res.status(404).json({ error: 'Rutina no encontrada' });
      }

      // Si se está actualizando la fecha, verificar duplicados
      if (req.body.fecha && req.body.fecha !== currentRutina.fecha.toISOString()) {
        const fechaInicio = new Date(req.body.fecha);
        fechaInicio.setHours(0, 0, 0, 0);
        
        const fechaFin = new Date(req.body.fecha);
        fechaFin.setHours(23, 59, 59, 999);

        const existingRutina = await this.Model.findOne({
          _id: { $ne: id },
          fecha: {
            $gte: fechaInicio,
            $lte: fechaFin
          },
          usuario: req.user.id
        });

        if (existingRutina) {
          return res.status(409).json({
            error: 'Ya existe una rutina para esta fecha'
          });
        }
      }

      // Preparar los datos actualizados preservando los campos existentes
      const updateData = {
        ...currentRutina.toObject(),
        ...req.body,
        bodyCare: {
          ...currentRutina.bodyCare,
          ...(req.body.bodyCare || {})
        },
        nutricion: {
          ...currentRutina.nutricion,
          ...(req.body.nutricion || {})
        },
        ejercicio: {
          ...currentRutina.ejercicio,
          ...(req.body.ejercicio || {})
        },
        cleaning: {
          ...currentRutina.cleaning,
          ...(req.body.cleaning || {})
        }
      };

      // Eliminar campos que no queremos actualizar
      delete updateData._id;
      delete updateData.id;
      delete updateData.__v;
      delete updateData.createdAt;
      delete updateData.updatedAt;

      const updatedDoc = await this.Model.findOneAndUpdate(
        { _id: id, usuario: req.user.id },
        updateData,
        { 
          new: true,
          runValidators: true,
          lean: true
        }
      );

      if (!updatedDoc) {
        return res.status(404).json({ error: 'Rutina no encontrada' });
      }

      // Asegurarnos de que el documento devuelto tenga el formato correcto
      const formattedDoc = {
        _id: updatedDoc._id.toString(),
        ...updatedDoc,
        bodyCare: { ...updatedDoc.bodyCare },
        nutricion: { ...updatedDoc.nutricion },
        ejercicio: { ...updatedDoc.ejercicio },
        cleaning: { ...updatedDoc.cleaning }
      };

      res.json(formattedDoc);
    } catch (error) {
      console.error('Error al actualizar rutina:', error);
      res.status(500).json({ 
        error: 'Error al actualizar la rutina',
        details: error.message 
      });
    }
  }

  // GET /api/rutinas/admin/all
  async getAllAdmin(req, res) {
    try {
      const result = await this.Model.paginate(
        {},
        {
          populate: [
            { path: 'usuario', select: 'nombre email' }
          ],
          sort: { createdAt: 'desc' }
        }
      );
      res.json(result);
    } catch (error) {
      console.error('Error al obtener todas las rutinas:', error);
      res.status(500).json({ 
        error: 'Error al obtener todas las rutinas',
        details: error.message 
      });
    }
  }

  // GET /api/rutinas/admin/stats
  async getAdminStats(req, res) {
    try {
      const totalRutinas = await this.Model.countDocuments();
      const rutinasPorCompletitud = await this.Model.aggregate([
        {
          $group: {
            _id: {
              $cond: [
                { $gte: ['$completitud', 0.8] },
                'Alta',
                {
                  $cond: [
                    { $gte: ['$completitud', 0.5] },
                    'Media',
                    'Baja'
                  ]
                }
              ]
            },
            count: { $sum: 1 }
          }
        }
      ]);

      res.json({
        totalRutinas,
        rutinasPorCompletitud
      });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ 
        error: 'Error al obtener estadísticas',
        details: error.message 
      });
    }
  }

  async verifyDate(req, res) {
    try {
      const { fecha } = req.query;
      
      if (!fecha) {
        return res.status(400).json({ error: 'La fecha es requerida' });
      }
      
      // Normalizar la fecha a inicio del día en UTC
      const fechaInicio = new Date(fecha);
      fechaInicio.setUTCHours(0, 0, 0, 0);
      
      // Crear el rango del día completo
      const fechaFin = new Date(fechaInicio);
      fechaFin.setUTCHours(23, 59, 59, 999);
      
      console.log('Verificando rutina existente:', {
        fechaInicio,
        fechaFin,
        usuario: req.user.id
      });
      
      // Verificar si ya existe una rutina para este día
      const existingRutina = await this.Model.findOne({
        fecha: {
          $gte: fechaInicio,
          $lte: fechaFin
        },
        usuario: req.user.id
      });
      
      if (existingRutina) {
        console.log('Rutina existente encontrada para verificación:', existingRutina._id);
        return res.json({
          exists: true,
          rutinaId: existingRutina._id
        });
      }
      
      return res.json({
        exists: false
      });
    } catch (error) {
      console.error('Error al verificar fecha:', error);
      res.status(500).json({ 
        error: 'Error al verificar fecha',
        details: error.message 
      });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      
      const doc = await this.Model.findOne({ 
        _id: id,
        usuario: req.user.id
      }).lean();
      
      if (!doc) {
        return res.status(404).json({ error: 'Rutina no encontrada' });
      }
      
      // Formatear el documento para mantener consistencia
      const formattedDoc = {
        _id: doc._id.toString(),
        ...doc,
        bodyCare: { ...doc.bodyCare },
        nutricion: { ...doc.nutricion },
        ejercicio: { ...doc.ejercicio },
        cleaning: { ...doc.cleaning }
      };
      
      res.json(formattedDoc);
    } catch (error) {
      console.error('Error al obtener rutina por ID:', error);
      res.status(500).json({ 
        error: 'Error al obtener rutina',
        details: error.message 
      });
    }
  }
}

export const rutinasController = new RutinasController(); 