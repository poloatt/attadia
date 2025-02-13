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
  }

  async getAll(req, res) {
    try {
      const query = { usuario: req.user.id };
      const options = {
        ...this.paginateOptions,
        sort: { fecha: -1 },
        limit: req.query.limit || 10,
        lean: true
      };

      const result = await this.Model.paginate(query, options);
      
      // Asegurarnos de que cada documento tenga su _id y sea un objeto plano
      result.docs = result.docs.map(doc => {
        // Si doc._id es un ObjectId, convertirlo a string
        const _id = doc._id?.toString() || doc._id;
        
        // Crear un nuevo objeto plano con _id al inicio
        return {
          _id,
          ...doc,
          // Asegurarnos de que los subdocumentos también sean objetos planos
          morning: { ...doc.morning },
          cleaning: { ...doc.cleaning },
          ejercicio: { ...doc.ejercicio },
          cooking: { ...doc.cooking },
          night: { ...doc.night }
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
      const fechaInicio = new Date(fecha);
      fechaInicio.setHours(0, 0, 0, 0);
      
      const fechaFin = new Date(fecha);
      fechaFin.setHours(23, 59, 59, 999);

      // Verificar si ya existe una rutina para este día
      const existingRutina = await this.Model.findOne({
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

      // Asegurar que todos los campos de checklist estén presentes
      const checklistData = {
        morning: {
          wakeUp: false,
          skinCareDay: false,
          meds: false,
          teeth: false,
          ...req.body.morning
        },
        cleaning: {
          platos: false,
          piso: false,
          ropa: false,
          ...req.body.cleaning
        },
        ejercicio: {
          cardio: false,
          stretching: false,
          gym: false,
          protein: false,
          meditate: false,
          ...req.body.ejercicio
        },
        cooking: {
          cocinar: false,
          agua: false,
          food: false,
          ...req.body.cooking
        },
        night: {
          skinCareNight: false,
          bath: false,
          bodyCream: false,
          ...req.body.night
        }
      };

      // Crear la nueva rutina
      const newDoc = new this.Model({
        ...req.body,
        ...checklistData,
        usuario: req.user.id,
        fecha: fechaInicio
      });

      const savedDoc = await newDoc.save();
      res.status(201).json(savedDoc);
    } catch (error) {
      console.error('Error al crear rutina:', error);
      res.status(500).json({ 
        error: 'Error al crear la rutina',
        details: error.message 
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
        morning: {
          ...currentRutina.morning,
          ...(req.body.morning || {})
        },
        cleaning: {
          ...currentRutina.cleaning,
          ...(req.body.cleaning || {})
        },
        ejercicio: {
          ...currentRutina.ejercicio,
          ...(req.body.ejercicio || {})
        },
        cooking: {
          ...currentRutina.cooking,
          ...(req.body.cooking || {})
        },
        night: {
          ...currentRutina.night,
          ...(req.body.night || {})
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
          lean: true // Obtener un objeto plano
        }
      );

      if (!updatedDoc) {
        return res.status(404).json({ error: 'Rutina no encontrada' });
      }

      // Asegurarnos de que el documento devuelto tenga el formato correcto
      const formattedDoc = {
        _id: updatedDoc._id.toString(),
        ...updatedDoc,
        morning: { ...updatedDoc.morning },
        cleaning: { ...updatedDoc.cleaning },
        ejercicio: { ...updatedDoc.ejercicio },
        cooking: { ...updatedDoc.cooking },
        night: { ...updatedDoc.night }
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
}

export const rutinasController = new RutinasController(); 