import { BaseController } from './BaseController.js';
import { Inquilinos, Propiedades, Contratos } from '../models/index.js';
import mongoose from 'mongoose';

// Utilidades para labels y descripciones de estado de inquilino
const ESTADO_LABELS = {
  'ACTIVO': 'Huésped actual',
  'RESERVADO': 'Próximo huésped',
  'PENDIENTE': 'Pendiente de ingreso',
  'INACTIVO': 'Sin estadía actual',
  'SIN_CONTRATO': 'Sin contrato'
};
const ESTADO_DESCS = {
  'ACTIVO': 'El inquilino está actualmente alojado en una de tus propiedades.',
  'RESERVADO': 'El inquilino tiene una reserva futura en una de tus propiedades.',
  'PENDIENTE': 'El inquilino está asignado pero aún no tiene contrato activo ni futuro.',
  'INACTIVO': 'El inquilino no tiene contratos activos ni futuros.',
  'SIN_CONTRATO': 'El inquilino nunca tuvo un contrato.'
};
function getInquilinoEstadoLabel(estado) {
  return ESTADO_LABELS[estado] || estado;
}
function getInquilinoEstadoDescripcion(estado) {
  return ESTADO_DESCS[estado] || '';
}

class InquilinosController extends BaseController {
  constructor() {
    super(Inquilinos, {
      searchFields: ['nombre', 'apellido', 'dni', 'email', 'telefono'],
      populate: [
        {
          path: 'propiedad',
          select: 'titulo direccion ciudad estado tipo'
        },
        {
          path: 'contratos',
          select: 'fechaInicio fechaFin tipoContrato esMantenimiento',
        }
      ]
    });

    // Bind de los métodos al contexto de la instancia
    this.getActivos = this.getActivos.bind(this);
    this.getAdminStats = this.getAdminStats.bind(this);
    this.create = this.create.bind(this);
    this.getAll = this.getAll.bind(this);
    this.getAllByPropiedad = this.getAllByPropiedad.bind(this);
    this.checkIn = this.checkIn.bind(this);
    this.getFullInfo = this.getFullInfo.bind(this);
    this.getByEstado = this.getByEstado.bind(this);
    this.getActivosByPropiedad = this.getActivosByPropiedad.bind(this);
    this.getPendientesByPropiedad = this.getPendientesByPropiedad.bind(this);
  }

  // Método auxiliar para formatear la respuesta
  formatResponse(doc) {
    if (!doc) return null;
    const formatted = doc.toObject ? doc.toObject() : doc;
    const estado = formatted.estadoActual || formatted.estado;
    return {
      ...formatted,
      id: formatted._id,
      propiedadId: formatted.propiedad?._id || formatted.propiedad,
      estado,
      estadoLabel: getInquilinoEstadoLabel(estado),
      estadoDescripcion: getInquilinoEstadoDescripcion(estado)
    };
  }

  // GET /api/inquilinos
  async getAll(req, res) {
    try {
      console.log('Obteniendo inquilinos...');
      
      // Verificar si hay un usuario autenticado
      if (!req.user) {
        console.log('No hay usuario autenticado');
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }
      
      const { usuario } = req.query;
      
      // Si no se proporciona un usuario en la query, usar el ID del usuario autenticado
      const filtros = {
        usuario: usuario || req.user._id
      };
      
      console.log('Filtros aplicados:', filtros);
      
      // Obtener inquilinos con populate de propiedad y contratos
      const result = await this.Model.paginate(
        filtros,
        {
          populate: [
            {
              path: 'propiedad',
              select: 'titulo direccion ciudad estado tipo'
            },
            {
              path: 'contratos',
              select: 'fechaInicio fechaFin tipoContrato esMantenimiento estado propiedad',
              populate: {
                path: 'propiedad',
                select: 'titulo nombre'
              }
            }
          ],
          sort: { createdAt: 'desc' }
        }
      );

      // Procesar cada inquilino para clasificar sus contratos y formatear la respuesta
      const docs = await Promise.all(result.docs.map(async (inquilino) => {
        const contratosClasificados = await inquilino.getContratosClasificados();
        // Usar formatResponse para agregar los labels y descripciones
        const formatted = this.formatResponse(inquilino);
        return {
          ...formatted,
          contratosClasificados
        };
      }));

      res.json({ ...result, docs });
      
    } catch (error) {
      console.error('Error al obtener inquilinos:', error);
      res.status(500).json({ error: 'Error al obtener inquilinos' });
    }
  }

  // POST /api/inquilinos/:id/check-in/:propiedadId
  async checkIn(req, res) {
    try {
      const { id, propiedadId } = req.params;
      
      const inquilino = await this.Model.findById(id);
      if (!inquilino) {
        return res.status(404).json({ error: 'Inquilino no encontrado' });
      }

      await inquilino.checkIn(propiedadId);
      const updated = await inquilino.populate('propiedad');
      
      res.json(this.formatResponse(updated));
    } catch (error) {
      console.error('Error en check-in:', error);
      res.status(400).json({ 
        error: 'Error en check-in',
        details: error.message 
      });
    }
  }

  // GET /api/inquilinos/:id/full-info
  async getFullInfo(req, res) {
    try {
      const { id } = req.params;
      const inquilino = await this.Model.findById(id);
      
      if (!inquilino) {
        return res.status(404).json({ error: 'Inquilino no encontrado' });
      }

      const fullInfo = await inquilino.getFullInfo();
      res.json(this.formatResponse(fullInfo));
    } catch (error) {
      console.error('Error al obtener información completa:', error);
      res.status(500).json({ error: 'Error al obtener información completa' });
    }
  }

  // GET /api/inquilinos/estado/:estado
  async getByEstado(req, res) {
    try {
      const { estado } = req.params;
      const result = await this.Model.paginate(
        { 
          usuario: req.user._id,
          estado: estado.toUpperCase()
        },
        {
          populate: ['propiedad'],
          sort: { createdAt: 'desc' }
        }
      );

      const docs = result.docs.map(doc => this.formatResponse(doc));
      res.json({ ...result, docs });
    } catch (error) {
      console.error('Error al obtener inquilinos por estado:', error);
      res.status(500).json({ error: 'Error al obtener inquilinos por estado' });
    }
  }

  // GET /api/inquilinos/propiedad/:propiedadId/activos
  async getActivosByPropiedad(req, res) {
    try {
      const { propiedadId } = req.params;
      console.log(`Obteniendo inquilinos activos para propiedad ID: ${propiedadId}`);
      
      // Obtener contratos activos de esta propiedad
      const contratosActivos = await Contratos.find({
        usuario: req.user._id,
        propiedad: propiedadId,
        estado: 'ACTIVO'
      }).populate('inquilino');
      
      console.log(`Contratos activos encontrados: ${contratosActivos.length}`);
      
      // Extraer los inquilinos únicos de los contratos activos
      const inquilinosIds = [...new Set(contratosActivos
        .filter(contrato => contrato.inquilino && contrato.inquilino._id)
        .map(contrato => contrato.inquilino._id.toString())
      )];
      
      console.log(`Inquilinos activos únicos encontrados: ${inquilinosIds.length}`);
      
      let inquilinos = [];
      if (inquilinosIds.length > 0) {
        // Obtener los inquilinos completos
        inquilinos = await this.Model.find({
          _id: { $in: inquilinosIds },
          usuario: req.user._id
        }).populate('contratos');
      }
      
      // Procesar cada inquilino para clasificar sus contratos
      const inquilinosProcesados = await Promise.all(inquilinos.map(async (inquilino) => {
        const inquilinoObj = inquilino.toObject ? inquilino.toObject() : inquilino;
        
        // Obtener contratos clasificados usando el método del modelo
        const contratosClasificados = await inquilino.getContratosClasificados();
        
        return {
          ...inquilinoObj,
          contratosClasificados,
          estado: inquilinoObj.estadoActual || inquilinoObj.estado
        };
      }));
      
      console.log(`Inquilinos activos procesados retornados: ${inquilinosProcesados.length}`);
      
      res.json({ 
        docs: inquilinosProcesados,
        totalDocs: inquilinosProcesados.length,
        limit: inquilinosProcesados.length,
        page: 1,
        totalPages: 1
      });
    } catch (error) {
      console.error('Error al obtener inquilinos activos por propiedad:', error);
      res.status(500).json({ error: 'Error al obtener inquilinos activos por propiedad' });
    }
  }

  // GET /api/inquilinos/propiedad/:propiedadId/pendientes
  async getPendientesByPropiedad(req, res) {
    try {
      const { propiedadId } = req.params;
      const result = await this.Model.paginate(
        {
          usuario: req.user._id,
          propiedad: propiedadId,
          estado: 'PENDIENTE'
        },
        {
          populate: ['propiedad'],
          sort: { createdAt: 'desc' }
        }
      );

      const docs = result.docs.map(doc => this.formatResponse(doc));
      res.json({ ...result, docs });
    } catch (error) {
      console.error('Error al obtener inquilinos pendientes por propiedad:', error);
      res.status(500).json({ error: 'Error al obtener inquilinos pendientes por propiedad' });
    }
  }

  // Sobreescribimos el método create
  async create(req, res) {
    try {
      console.log('Creando inquilino:', req.body);
      const inquilino = await this.Model.create({
        ...req.body,
        usuario: req.user._id
      });
      
      const populatedInquilino = await this.Model.findById(inquilino._id)
        .populate('propiedad');

      console.log('Inquilino creado:', populatedInquilino);
      res.status(201).json(this.formatResponse(populatedInquilino));
    } catch (error) {
      console.error('Error al crear inquilino:', error);
      res.status(400).json({ 
        error: 'Error al crear inquilino',
        details: error.message 
      });
    }
  }

  // GET /api/inquilinos/activos
  async getActivos(req, res) {
    try {
      const inquilinos = await this.Model.paginate(
        { 
          usuario: req.user._id,
          estado: 'ACTIVO'
        },
        {
          populate: ['propiedad'],
          sort: { createdAt: 'desc' }
        }
      );
      
      const docs = inquilinos.docs.map(doc => this.formatResponse(doc));
      res.json({ ...inquilinos, docs });
    } catch (error) {
      console.error('Error al obtener inquilinos activos:', error);
      res.status(500).json({ error: 'Error al obtener inquilinos activos' });
    }
  }

  // GET /api/inquilinos/admin/stats
  async getAdminStats(req, res) {
    try {
      const stats = await Promise.all([
        this.Model.countDocuments(),
        this.Model.countDocuments({ estado: 'ACTIVO' }),
        this.Model.countDocuments({ estado: 'INACTIVO' }),
        this.Model.countDocuments({ estado: 'PENDIENTE' }),
        this.Model.countDocuments({ estado: 'RESERVADO' })
      ]);
      
      res.json({
        total: stats[0],
        activos: stats[1],
        inactivos: stats[2],
        pendientes: stats[3],
        reservados: stats[4]
      });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
  }

  // GET /api/inquilinos/propiedad/:propiedadId
  async getAllByPropiedad(req, res) {
    try {
      const { propiedadId } = req.params;
      console.log(`Obteniendo inquilinos para propiedad ID: ${propiedadId}`);
      
      // Primero, obtener todos los contratos activos de esta propiedad
      const contratosActivos = await Contratos.find({
        usuario: req.user._id,
        propiedad: propiedadId,
        estado: 'ACTIVO'
      }).populate('inquilino');
      
      console.log(`Contratos activos encontrados: ${contratosActivos.length}`);
      
      // Extraer los inquilinos únicos de los contratos activos
      const inquilinosIds = [...new Set(contratosActivos
        .filter(contrato => contrato.inquilino && contrato.inquilino._id)
        .map(contrato => contrato.inquilino._id.toString())
      )];
      
      console.log(`Inquilinos únicos encontrados: ${inquilinosIds.length}`);
      
      // Si no hay contratos activos, buscar inquilinos que tengan esta propiedad asignada directamente
      let inquilinos = [];
      if (inquilinosIds.length > 0) {
        // Obtener los inquilinos completos
        inquilinos = await this.Model.find({
          _id: { $in: inquilinosIds },
          usuario: req.user._id
        }).populate('contratos');
      } else {
        // Fallback: buscar inquilinos que tengan esta propiedad asignada directamente
        const result = await this.Model.paginate(
          {
            propiedad: propiedadId,
            usuario: req.user._id
          },
          {
            populate: ['contratos'],
            sort: { createdAt: 'desc' }
          }
        );
        inquilinos = result.docs;
      }
      
      // Procesar cada inquilino para clasificar sus contratos
      const inquilinosProcesados = await Promise.all(inquilinos.map(async (inquilino) => {
        const inquilinoObj = inquilino.toObject ? inquilino.toObject() : inquilino;
        
        // Obtener contratos clasificados usando el método del modelo
        const contratosClasificados = await inquilino.getContratosClasificados();
        
        return {
          ...inquilinoObj,
          contratosClasificados,
          estado: inquilinoObj.estadoActual || inquilinoObj.estado
        };
      }));
      
      console.log(`Inquilinos procesados retornados: ${inquilinosProcesados.length}`);
      
      res.json({ 
        docs: inquilinosProcesados,
        totalDocs: inquilinosProcesados.length,
        limit: inquilinosProcesados.length,
        page: 1,
        totalPages: 1
      });
    } catch (error) {
      console.error(`Error al obtener inquilinos para propiedad ${req.params.propiedadId}:`, error);
      res.status(500).json({ error: 'Error al obtener inquilinos para esta propiedad' });
    }
  }

  // PUT /api/inquilinos/:id
  async update(req, res) {
    try {
      console.log('Actualizando inquilino:', req.params.id);
      console.log('Datos de actualización:', req.body);

      const inquilino = await this.Model.findOne({
        _id: req.params.id,
        usuario: req.user._id
      });

      if (!inquilino) {
        return res.status(404).json({ error: 'Inquilino no encontrado' });
      }

      // Actualizar campos permitidos
      const camposPermitidos = [
        'nombre', 'apellido', 'email', 'telefono', 'dni',
        'nacionalidad', 'ocupacion', 'propiedad'
      ];

      camposPermitidos.forEach(campo => {
        if (req.body[campo] !== undefined) {
          inquilino[campo] = req.body[campo];
        }
      });

      // Si se está actualizando la propiedad, asegurarse de que el estado sea correcto
      if (req.body.propiedad) {
        if (!inquilino.estado || inquilino.estado === 'INACTIVO') {
          inquilino.estado = 'PENDIENTE';
        }
      }

      await inquilino.save();
      console.log('Inquilino actualizado:', inquilino);

      const inquilinoActualizado = await this.Model.findById(inquilino._id)
        .populate('propiedad');

      res.json(this.formatResponse(inquilinoActualizado));
    } catch (error) {
      console.error('Error al actualizar inquilino:', error);
      res.status(400).json({
        error: 'Error al actualizar inquilino',
        details: error.message
      });
    }
  }

  // Método para obtener inquilinos por propiedad
  async getByPropiedad(req, res) {
    try {
      const inquilinos = await this.Model.find({
        propiedad: req.params.propiedadId,
        usuario: req.user._id
      }).populate('propiedad');

      res.json(this.formatResponse(inquilinos));
    } catch (error) {
      console.error('Error al obtener inquilinos por propiedad:', error);
      res.status(400).json({
        error: 'Error al obtener inquilinos',
        details: error.message
      });
    }
  }
}

export const inquilinosController = new InquilinosController(); 