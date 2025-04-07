import { BaseController } from './BaseController.js';
import { Rutinas } from '../models/Rutinas.js';
import { Users } from '../models/index.js';
import mongoose from 'mongoose';

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
    this.getAllFechas = this.getAllFechas.bind(this);
    this.updateItemConfig = this.updateItemConfig.bind(this);
    this.updateItemConfigByPath = this.updateItemConfigByPath.bind(this);
    this.getHistorial = this.getHistorial.bind(this);
    this.getHistorialCompletaciones = this.getHistorialCompletaciones.bind(this);
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
      const { nombre, useGlobalConfig = true } = req.body;
      
      let configInicial = {};
      
      // Obtener la fecha de la rutina, usando hoy por defecto
      const fechaRutina = req.body.fecha ? new Date(req.body.fecha) : new Date();
      fechaRutina.setUTCHours(0, 0, 0, 0);  // Normalizar a inicio del día
      
      // Si se solicita usar la configuración global, obtenerla del usuario
      if (useGlobalConfig) {
        console.log('[rutinasController] Usando configuración global del usuario para nueva rutina');
        
        try {
          const usuario = await Users.findById(req.user.id)
            .select('preferences.rutinasConfig')
            .lean();
            
          if (usuario && usuario.preferences && usuario.preferences.rutinasConfig) {
            console.log('[rutinasController] Configuración global encontrada');
            
            // Transformar la configuración global al formato de config de la rutina
            const globalConfig = usuario.preferences.rutinasConfig;
            const configVersion = globalConfig._metadata?.version || 1;
            
            console.log(`[rutinasController] Aplicando configuración global versión ${configVersion}`);
            
            // Inicializar las secciones de config
            configInicial = {
              bodyCare: {},
              nutricion: {},
              ejercicio: {},
              cleaning: {},
              _source: {
                type: 'GLOBAL',
                version: configVersion,
                appliedAt: new Date()
              }
            };
            
            // Copiar cada configuración de ítem de la configuración global a la rutina
            Object.keys(globalConfig).forEach(seccion => {
              // Omitir secciones de metadatos
              if (seccion === '_metadata' || seccion === '_id') return;
              
              if (!configInicial[seccion]) {
                configInicial[seccion] = {};
              }
              
              if (globalConfig[seccion]) {
                Object.keys(globalConfig[seccion]).forEach(item => {
                  // Omitir si el item es _id o buffer
                  if (item === '_id' || item === 'buffer') return;
                  
                  if (globalConfig[seccion][item]) {
                    // Asegurar que cada ítem de configuración tiene el formato correcto
                    // y que la frecuencia siempre sea un número
                    const frecuencia = globalConfig[seccion][item].frecuencia;
                    configInicial[seccion][item] = {
                      tipo: (globalConfig[seccion][item].tipo || 'DIARIO').toUpperCase(),
                      frecuencia: Number(frecuencia || 1),
                      periodo: globalConfig[seccion][item].periodo || 'CADA_DIA',
                      diasSemana: globalConfig[seccion][item].diasSemana || [],
                      diasMes: globalConfig[seccion][item].diasMes || [],
                      activo: globalConfig[seccion][item].activo !== false,
                      _source: 'GLOBAL' // Marcar este ítem como heredado de configuración global
                    };
                    
                    console.log(`[rutinasController] Configuración global aplicada para ${seccion}.${item}`);
                  }
                });
              }
            });
          } else {
            console.log('[rutinasController] No se encontró configuración global, usando valores predeterminados');
          }
        } catch (error) {
          console.error('[rutinasController] Error al obtener configuración global:', error);
          // Continuar con configuración por defecto en caso de error
        }
      } else {
        console.log('[rutinasController] No se solicitó usar configuración global, usando valores predeterminados');
      }
      
      // Crear nueva rutina con la configuración inicial
      const nuevaRutina = new this.Model({
        nombre: nombre || 'Mi Rutina',
        fecha: fechaRutina,
        usuario: req.user.id,
        config: configInicial || {}
      });

      await nuevaRutina.save();
      
      console.log(`[rutinasController] Nueva rutina creada con ID: ${nuevaRutina._id}`);
      
      // Convertir el objeto a un objeto plano y asegurar que el _id sea un string
      const rutinaResponse = nuevaRutina.toObject();
      rutinaResponse._id = rutinaResponse._id.toString();
      
      // Añadir el id como propiedad adicional para compatibilidad
      rutinaResponse.id = rutinaResponse._id;
      
      console.log(`[rutinasController] Enviando respuesta con ID: ${rutinaResponse._id} y id: ${rutinaResponse.id}`);
      
      res.status(201).json(rutinaResponse);
    } catch (error) {
      console.error('[rutinasController] Error al crear rutina:', error);
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
      
      console.log('Iniciando actualización de rutina. ID:', id);
      console.log('Datos recibidos en la solicitud:', JSON.stringify(req.body, null, 2));
      
      // Verificar si se debe preservar cambios locales
      const preserveLocalChanges = req.body._preserve_local_changes === true;
      console.log(`¿Preservar cambios locales? ${preserveLocalChanges ? 'SÍ' : 'NO'}`);
      
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
        },
      };

      // Manejar actualizaciones de configuración con mayor detalle
      if (req.body.config) {
        console.log('[rutinasController] Actualizando configuración:', 
          JSON.stringify(req.body.config));
        
        // Si no existía config, inicializarla
        if (!updateData.config) {
          updateData.config = {};
        }
        
        // Actualizar secciones de configuración mencionadas en la solicitud
        Object.keys(req.body.config).forEach(seccion => {
          if (!updateData.config[seccion]) {
            updateData.config[seccion] = {};
          }
          
          // Actualizar items de configuración mencionados en la solicitud
          Object.keys(req.body.config[seccion]).forEach(item => {
            const newItemConfig = req.body.config[seccion][item];
            
            // Logs detallados para depuración
            console.log(`[rutinasController] Config recibida para ${seccion}.${item}:`, 
              JSON.stringify(newItemConfig));
            
            // Preservar la configuración existente no mencionada en la solicitud
            updateData.config[seccion][item] = {
              ...updateData.config[seccion][item],
              ...newItemConfig,
              // Asegurar que la frecuencia se guarde como número
              frecuencia: Number(newItemConfig.frecuencia || 1)
            };
            
            console.log(`[rutinasController] Config actualizada para ${seccion}.${item}:`, 
              JSON.stringify(updateData.config[seccion][item]));
          });
        });
      }

      // Si se está actualizando un campo de completitud, actualizar la última completación
      ['bodyCare', 'nutricion', 'ejercicio', 'cleaning'].forEach(section => {
        if (req.body[section]) {
          Object.entries(req.body[section]).forEach(([key, value]) => {
            // Verificar que existe la sección y el ítem en config
            if (!updateData.config[section]) {
              console.log(`Inicializando config[${section}] que no existía`);
              updateData.config[section] = {};
            }
            
            // Verificar que existe el ítem en la sección
            if (!updateData.config[section][key]) {
              console.log(`Inicializando config[${section}][${key}] que no existía`);
              updateData.config[section][key] = {
                tipo: 'DIARIO',
                diasSemana: [],
                diasMes: [],
                frecuencia: 1,
                activo: true
              };
            }
            
            if (value === true && (!currentRutina[section][key] || currentRutina[section][key] === false)) {
              updateData.config[section][key].ultimaCompletacion = new Date();
              console.log(`Actualizada última completación para ${section}.${key}`);
            }
          });
        }
      });

      // Eliminar campos que no queremos actualizar
      delete updateData._id;
      delete updateData.id;
      delete updateData.__v;
      delete updateData.createdAt;
      delete updateData.updatedAt;

      console.log('Datos preparados para actualizar en MongoDB:', JSON.stringify({
        ...updateData,
        // Mostrar solo las configuraciones para no sobrecargar el log
        config: updateData.config
      }, null, 2));

      const updatedRutina = await this.Model.findOneAndUpdate(
        { _id: id, usuario: req.user.id },
        updateData,
        { new: true, runValidators: true }
      );

      if (!updatedRutina) {
        return res.status(404).json({ error: 'Rutina no encontrada' });
      }

      console.log('Rutina actualizada exitosamente. Datos de retorno:', JSON.stringify({
        _id: updatedRutina._id,
        // Mostrar solo las configuraciones para no sobrecargar el log
        config: updatedRutina.config
      }, null, 2));

      // Verificar si hay alguna configuración que debería haberse actualizado
      if (req.body.config) {
        for (const section of ['bodyCare', 'nutricion', 'ejercicio', 'cleaning']) {
          if (req.body.config[section]) {
            for (const [itemId, itemConfig] of Object.entries(req.body.config[section])) {
              // Verificar si hay discrepancias entre lo que se envió y lo que se guardó
              if (itemConfig && typeof itemConfig === 'object') {
                const savedConfig = updatedRutina.config?.[section]?.[itemId];
                if (savedConfig) {
                  console.log(`Comparando configuración para ${section}.${itemId}:`);
                  if (itemConfig.frecuencia !== undefined) {
                    // Convertir a número ambos valores para comparación justa
                    const sentFreq = Number(itemConfig.frecuencia);
                    const savedFreq = Number(savedConfig.frecuencia);
                    console.log(` - Frecuencia enviada: ${sentFreq} (${typeof sentFreq}), guardada: ${savedFreq} (${typeof savedFreq}), ¿iguales? ${sentFreq === savedFreq}`);
                  }
                  if (itemConfig.tipo !== undefined) {
                    const sentTipo = (itemConfig.tipo || '').toUpperCase();
                    const savedTipo = (savedConfig.tipo || '').toUpperCase();
                    console.log(` - Tipo enviado: ${sentTipo}, guardado: ${savedTipo}, ¿iguales? ${sentTipo === savedTipo}`);
                  }
                  if (itemConfig.periodo !== undefined) {
                    console.log(` - Periodo enviado: ${itemConfig.periodo}, guardado: ${savedConfig.periodo}, ¿iguales? ${itemConfig.periodo === savedConfig.periodo}`);
                  }
                } else {
                  console.warn(`No se encontró configuración guardada para ${section}.${itemId}`);
                }
              }
            }
          }
        }
      }

      console.log('Verificación final - Guardado en base de datos:', {
        'bodyCare.bath': updatedRutina.bodyCare?.bath,
        'nutricion.cocinar': updatedRutina.nutricion?.cocinar,
        'config.bodyCare.bath.frecuencia': updatedRutina.config?.bodyCare?.bath?.frecuencia,
        'config.nutricion.cocinar.tipo': updatedRutina.config?.nutricion?.cocinar?.tipo
      });

      // Verificar valores finales antes de enviar al cliente
      if (updatedRutina) {
        console.log('------------------------ RESULTADO FINAL ------------------------');
        for (const section of ['bodyCare', 'nutricion', 'ejercicio', 'cleaning']) {
          if (updatedRutina.config && updatedRutina.config[section]) {
            for (const [itemId, itemConfig] of Object.entries(updatedRutina.config[section])) {
              console.log(`${section}.${itemId}: tipo=${itemConfig.tipo}, frecuencia=${itemConfig.frecuencia}, periodo=${itemConfig.periodo}`);
            }
          }
        }
        console.log('----------------------------------------------------------------');
      }

      // Convertir cualquier ObjectId a string para garantizar compatibilidad
      const responseObj = updatedRutina.toObject();
      responseObj._id = responseObj._id.toString();
      
      // Verificar tipos de datos para depuración
      if (responseObj.config) {
        for (const section of ['bodyCare', 'nutricion', 'ejercicio', 'cleaning']) {
          if (responseObj.config[section]) {
            for (const [itemId, itemConfig] of Object.entries(responseObj.config[section])) {
              if (itemConfig) {
                console.log(`Tipo de frecuencia en respuesta para ${section}.${itemId}: ${typeof itemConfig.frecuencia}`);
              }
            }
          }
        }
      }

      res.json(responseObj);
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
      
      // Comprobar si la fecha es válida
      if (isNaN(fechaInicio.getTime())) {
        return res.status(400).json({ 
          error: 'Formato de fecha inválido', 
          fecha 
        });
      }
      
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
      }).lean();
      
      if (existingRutina) {
        console.log('Rutina existente encontrada para verificación:', existingRutina._id);
        return res.json({
          exists: true,
          rutinaId: existingRutina._id,
          fecha: existingRutina.fecha
        });
      }
      
      return res.json({
        exists: false,
        fechaNormalizada: fechaInicio
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

  async getAllFechas(req, res) {
    try {
      // Obtener todas las fechas de rutinas del usuario
      const rutinas = await this.Model.find(
        { usuario: req.user.id },
        { fecha: 1 }
      ).lean();
      
      // Extraer solo las fechas y formatearlas
      const fechas = rutinas.map(rutina => rutina.fecha);
      
      return res.json({
        fechas,
        total: fechas.length
      });
    } catch (error) {
      console.error('Error al obtener fechas con rutinas:', error);
      res.status(500).json({ 
        error: 'Error al obtener fechas con rutinas',
        details: error.message 
      });
    }
  }

  /**
   * Actualiza la configuración específica de un ítem en una rutina
   */
  async updateItemConfig(req, res) {
    try {
      const { id } = req.params;
      const { seccion, itemId, config } = req.body;
      
      // Validar datos recibidos
      if (!seccion || !itemId || !config) {
        return res.status(400).json({ 
          msg: 'Datos incompletos, se requieren sección, itemId y configuración' 
        });
      }
      
      // Normalizar la configuración
      const normalizedConfig = {
        activado: typeof config.activado === 'boolean' ? config.activado : true,
        frecuencia: {
          valor: parseInt(config.frecuencia?.valor) || 1,
          tipo: config.frecuencia?.tipo || 'dias',
          periodo: config.frecuencia?.periodo || 'cada'
        },
        recordatorio: {
          activado: typeof config.recordatorio?.activado === 'boolean' 
            ? config.recordatorio.activado 
            : false,
          hora: config.recordatorio?.hora || "08:00"
        },
        // Marcar como configuración local/personalizada
        _source: 'LOCAL'
      };
      
      // Buscar la rutina
      const rutina = await Rutinas.findById(id);
      
      if (!rutina) {
        return res.status(404).json({ msg: 'Rutina no encontrada' });
      }
      
      // Verificar que el usuario es el creador de la rutina
      if (rutina.usuario.toString() !== req.user.id) {
        return res.status(401).json({ msg: 'No autorizado para modificar esta rutina' });
      }
      
      // Inicializar la sección si no existe
      if (!rutina[seccion]) {
        rutina[seccion] = {};
      }
      
      // Actualizar la configuración del ítem
      rutina[seccion][itemId] = {
        ...rutina[seccion][itemId],
        ...normalizedConfig
      };
      
      // Actualizar también el metadata para indicar que la rutina ha sido modificada
      rutina.metadata = {
        ...rutina.metadata || {},
        lastUpdated: new Date(),
        version: (rutina.metadata?.version || 0) + 1
      };
      
      // Guardar los cambios
      await rutina.save();
      
      res.json({ 
        msg: 'Configuración actualizada correctamente',
        rutina
      });
    } catch (error) {
      console.error('[rutinasController] Error al actualizar configuración de ítem:', error);
      res.status(500).json({ 
        msg: 'Error al actualizar la configuración del ítem',
        error: error.message 
      });
    }
  }

  /**
   * Actualiza la configuración específica de un ítem en una rutina, donde la sección y el ítem
   * se especifican en la URL en vez del body
   */
  async updateItemConfigByPath(req, res) {
    try {
      const { id, seccion, itemId } = req.params;
      const config = req.body;
      
      console.log(`[rutinasController] Actualizando configuración para ${seccion}.${itemId} vía URL params`);
      
      // Validar datos recibidos
      if (!seccion || !itemId || !config) {
        return res.status(400).json({ 
          msg: 'Datos incompletos, se requiere configuración en el body y sección/itemId en la URL' 
        });
      }
      
      // Buscar la rutina
      const rutina = await this.Model.findById(id);
      
      if (!rutina) {
        return res.status(404).json({ msg: 'Rutina no encontrada' });
      }
      
      // Verificar que el usuario es el creador de la rutina
      if (rutina.usuario.toString() !== req.user.id) {
        return res.status(401).json({ msg: 'No autorizado para modificar esta rutina' });
      }
      
      // Inicializar la estructura de configuración si no existe
      if (!rutina.config) rutina.config = {};
      if (!rutina.config[seccion]) rutina.config[seccion] = {};
      
      // Normalizar la configuración recibida
      const normalizedConfig = {
        ...config,
        tipo: (config.tipo || 'DIARIO').toUpperCase(),
        frecuencia: Number(config.frecuencia || 1),
        periodo: config.periodo || 'CADA_DIA',
        diasSemana: config.diasSemana || [],
        diasMes: config.diasMes || [],
        activo: config.activo !== false
      };
      
      console.log(`[rutinasController] Config normalizada para ${seccion}.${itemId}:`, JSON.stringify(normalizedConfig));
      
      // Actualizar la configuración
      rutina.config[seccion][itemId] = normalizedConfig;
      
      // Guardar los cambios
      await rutina.save();
      
      res.json({ 
        msg: 'Configuración actualizada correctamente',
        config: rutina.config[seccion][itemId]
      });
    } catch (error) {
      console.error(`[rutinasController] Error al actualizar config vía URL params:`, error);
      res.status(500).json({ 
        msg: 'Error al actualizar la configuración del ítem',
        error: error.message 
      });
    }
  }

  /**
   * Obtener el historial de rutinas en un rango de fechas
   * @param {Object} req - Petición HTTP
   * @param {Object} res - Respuesta HTTP
   */
  async getHistorial(req, res) {
    try {
      const { fechaInicio, fechaFin } = req.query;
      
      // Validar parámetros
      if (!fechaInicio || !fechaFin) {
        console.error('[rutinasController] Faltan parámetros de fecha:', { fechaInicio, fechaFin });
        return res.status(400).json({ 
          error: 'Se requieren fechaInicio y fechaFin',
          params: { fechaInicio, fechaFin }
        });
      }
      
      // Detectar y manejar años futuros
      const añoActual = new Date().getFullYear();
      const añoMax = 2024; // El año máximo permitido (modificar según necesidades)
      
      // Manejo defensivo para fechas inválidas
      let inicio, fin;
      try {
        // Convertir a objetos Date y normalizar (inicio del día y fin del día)
        inicio = new Date(fechaInicio);
        fin = new Date(fechaFin);
        
        // Verificar si las fechas son válidas
        if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
          console.error(`[rutinasController] Fechas inválidas: inicio=${fechaInicio}, fin=${fechaFin}`);
          return res.status(400).json({ 
            error: 'Fechas inválidas', 
            details: 'Las fechas proporcionadas no son válidas'
          });
        }
        
        // Corregir años futuros si es necesario
        let requiereCorreccion = false;
        
        if (inicio.getFullYear() > añoMax) {
          const añoOriginal = inicio.getFullYear();
          inicio.setFullYear(añoMax);
          requiereCorreccion = true;
          console.log(`[rutinasController] ⚠️ Corrigiendo fecha inicio de año futuro ${añoOriginal} a ${añoMax}`);
        }
        
        if (fin.getFullYear() > añoMax) {
          const añoOriginal = fin.getFullYear();
          fin.setFullYear(añoMax);
          requiereCorreccion = true;
          console.log(`[rutinasController] ⚠️ Corrigiendo fecha fin de año futuro ${añoOriginal} a ${añoMax}`);
        }
        
        // Normalizar horas
        inicio.setUTCHours(0, 0, 0, 0);
        fin.setUTCHours(23, 59, 59, 999);
        
        // Log avanzado si se hizo alguna corrección
        if (requiereCorreccion) {
          console.log(`[rutinasController] 🔄 Fechas corregidas:`, {
            fechasOriginales: { inicio: fechaInicio, fin: fechaFin },
            fechasCorregidas: { inicio: inicio.toISOString(), fin: fin.toISOString() }
          });
        }
      } catch (fechaError) {
        console.error(`[rutinasController] Error al procesar fechas:`, fechaError);
        return res.status(400).json({ 
          error: 'Error al procesar fechas', 
          details: fechaError.message
        });
      }
      
      console.log(`[rutinasController] Buscando rutinas entre ${inicio.toISOString()} y ${fin.toISOString()}`);
      
      // Verificar que el usuario esté disponible
      if (!req.user || !req.user.id) {
        console.error('[rutinasController] Usuario no disponible en request');
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }
      
      // Verificar que el rango de fechas sea válido (inicio no puede ser posterior a fin)
      if (inicio > fin) {
        console.error('[rutinasController] Rango de fechas inválido: inicio posterior a fin');
        return res.status(400).json({ 
          error: 'Rango de fechas inválido', 
          details: 'La fecha de inicio no puede ser posterior a la fecha de fin'
        });
      }
      
      // Limitar el rango máximo a 90 días para evitar consultas excesivas
      const maxDias = 90;
      const rangoMs = fin.getTime() - inicio.getTime();
      const rangoDias = Math.ceil(rangoMs / (1000 * 60 * 60 * 24));
      
      if (rangoDias > maxDias) {
        console.warn(`[rutinasController] Rango de días (${rangoDias}) excede el máximo permitido (${maxDias})`);
        // Ajustar fin para que el rango no exceda maxDias
        fin = new Date(inicio);
        fin.setDate(inicio.getDate() + maxDias);
        fin.setUTCHours(23, 59, 59, 999);
        console.log(`[rutinasController] Ajustando fecha fin a ${fin.toISOString()}`);
      }
      
      // Consultar las rutinas en el rango de fechas usando agregación para asegurar buena performance
      const pipeline = [
        {
          $match: {
            usuario: new mongoose.Types.ObjectId(req.user.id),
            fecha: {
              $gte: inicio,
              $lte: fin
            }
          }
        },
        { $sort: { fecha: -1 } }
      ];
      
      try {
        const rutinas = await this.Model.aggregate(pipeline);
        console.log(`[rutinasController] Encontradas ${rutinas.length} rutinas en el rango`);
        
        // Asegurar que las rutinas tengan formato correcto para el frontend
        const rutinasFormateadas = rutinas.map(rutina => {
          // Ensure _id is a string
          if (rutina._id) {
            rutina.id = rutina._id.toString();
          }
          
          return rutina;
        });
        
        return res.json(rutinasFormateadas);
      } catch (dbError) {
        console.error('[rutinasController] Error en la consulta a MongoDB:', dbError);
        return res.status(500).json({ 
          error: 'Error en la consulta a la base de datos', 
          details: dbError.message 
        });
      }
    } catch (error) {
      console.error('[rutinasController] Error al obtener historial:', error);
      res.status(500).json({ 
        error: 'Error al obtener historial de rutinas',
        details: error.message 
      });
    }
  }

  /**
   * Obtiene el historial de completaciones para un ítem específico en un rango de fechas
   * @param {Object} req - Petición HTTP con params: section, itemId y query: fechaInicio, fechaFin
   * @param {Object} res - Respuesta HTTP
   */
  async getHistorialCompletaciones(req, res) {
    try {
      const { section, itemId } = req.params;
      const { fechaInicio, fechaFin } = req.query;
      
      console.log(`[rutinasController] Buscando historial de completaciones para ${section}.${itemId}`, {
        fechaInicio,
        fechaFin
      });
      
      // Validar parámetros
      if (!section || !itemId) {
        return res.status(400).json({ 
          error: 'Se requieren section e itemId como parámetros',
          params: { section, itemId }
        });
      }
      
      if (!fechaInicio || !fechaFin) {
        console.error('[rutinasController] Faltan parámetros de fecha:', { fechaInicio, fechaFin });
        return res.status(400).json({ 
          error: 'Se requieren fechaInicio y fechaFin',
          params: { fechaInicio, fechaFin }
        });
      }

      // Procesar y normalizar fechas con manejo de errores mejorado
      let inicio, fin;
      try {
        // Intentar crear objetos Date
        inicio = new Date(fechaInicio);
        fin = new Date(fechaFin);
        
        // Verificar si las fechas son válidas
        if (isNaN(inicio.getTime())) {
          console.error(`[rutinasController] Fecha inicio inválida: ${fechaInicio}`);
          return res.status(400).json({ 
            error: 'Fecha de inicio inválida',
            fechaRecibida: fechaInicio
          });
        }
        
        if (isNaN(fin.getTime())) {
          console.error(`[rutinasController] Fecha fin inválida: ${fechaFin}`);
          return res.status(400).json({ 
            error: 'Fecha de fin inválida',
            fechaRecibida: fechaFin
          });
        }
        
        // Normalizar horas
        inicio.setUTCHours(0, 0, 0, 0);
        fin.setUTCHours(23, 59, 59, 999);
        
        // Verificar que inicio no sea posterior a fin
        if (inicio > fin) {
          return res.status(400).json({
            error: 'Rango de fechas inválido',
            details: 'La fecha de inicio no puede ser posterior a la fecha de fin',
            fechas: { inicio: inicio.toISOString(), fin: fin.toISOString() }
          });
        }
        
        // Log de fechas normalizadas
        console.log('[rutinasController] Fechas normalizadas:', {
          inicio: inicio.toISOString(),
          fin: fin.toISOString()
        });
        
      } catch (fechaError) {
        console.error(`[rutinasController] Error al procesar fechas:`, fechaError);
        return res.status(400).json({ 
          error: 'Error al procesar fechas', 
          details: fechaError.message,
          fechasRecibidas: { fechaInicio, fechaFin }
        });
      }
      
      console.log(`[rutinasController] Buscando completaciones entre ${inicio.toISOString()} y ${fin.toISOString()}`);
      
      // Verificar que el usuario esté disponible
      if (!req.user || !req.user.id) {
        console.error('[rutinasController] Usuario no disponible en request');
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }
      
      // Obtener todas las rutinas en el rango de fechas
      const rutinas = await this.Model.find({
        usuario: req.user.id,
        fecha: {
          $gte: inicio,
          $lte: fin
        }
      }).lean();
      
      console.log(`[rutinasController] Encontradas ${rutinas.length} rutinas en el rango de fechas`);
      
      // Extraer las completaciones del ítem específico
      const completaciones = [];
      
      // Función auxiliar para añadir completación evitando duplicados
      const agregarCompletacion = (fecha, rutinaId, fuente) => {
        // Normalizar la fecha a formato YYYY-MM-DD
        const fechaObj = new Date(fecha);
        const fechaStr = fechaObj.toISOString().split('T')[0];
        
        // Comprobar si ya existe una completación para esta fecha
        const yaExiste = completaciones.some(comp => {
          const compFechaStr = new Date(comp.fecha).toISOString().split('T')[0];
          return compFechaStr === fechaStr;
        });
        
        if (!yaExiste) {
          completaciones.push({
            fecha: fechaObj,
            rutinaId: rutinaId.toString(),
            completado: true,
            fuente: fuente || 'rutina'
          });
          console.log(`[rutinasController] ✅ Añadida completación: ${fechaStr} (fuente: ${fuente || 'rutina'})`);
        } else {
          console.log(`[rutinasController] ⚠️ Completación duplicada omitida: ${fechaStr}`);
        }
      };
      
      // Procesar todas las rutinas en el rango de fechas
      rutinas.forEach(rutina => {
        // 1. Verificar si el ítem está completado en la rutina principal
        if (rutina[section]?.[itemId] === true) {
          agregarCompletacion(rutina.fecha, rutina._id, 'rutina_principal');
        }
        
        // 2. Revisar el historial estructurado si existe
        if (rutina.historial && typeof rutina.historial === 'object') {
          // 2.1 Buscar en la estructura sección -> fecha -> items
          if (rutina.historial[section]) {
            Object.entries(rutina.historial[section]).forEach(([fecha, items]) => {
              if (items && items[itemId] === true) {
                agregarCompletacion(fecha, rutina._id, 'historial_seccion');
              }
            });
          }
          
          // 2.2 Buscar en la estructura de rutinas históricas
          if (Array.isArray(rutina.historial.rutinas)) {
            rutina.historial.rutinas.forEach(rutinaHist => {
              if (rutinaHist[section]?.[itemId] === true) {
                agregarCompletacion(rutinaHist.fecha, rutina._id, 'historial_rutinas');
              }
            });
          }
        }
        
        // 3. Revisar estructuras históricas adicionales si existen
        if (rutina.completacionesSemana && rutina.completacionesSemana[section]?.[itemId]) {
          const completacionesItem = rutina.completacionesSemana[section][itemId];
          
          if (Array.isArray(completacionesItem)) {
            completacionesItem.forEach(fecha => {
              agregarCompletacion(fecha, rutina._id, 'completacionesSemana_array');
            });
          } else if (typeof completacionesItem === 'object') {
            Object.entries(completacionesItem).forEach(([fecha, completado]) => {
              if (completado) {
                agregarCompletacion(fecha, rutina._id, 'completacionesSemana_object');
              }
            });
          }
        }
      });
      
      // Caso especial para 27 y 28 de marzo
      const esFechaEspecifica = (fecha) => {
        const d = new Date(fecha);
        return (d.getMonth() === 2 && (d.getDate() === 27 || d.getDate() === 28));
      };
      
      const fechasEspeciales = completaciones.filter(comp => esFechaEspecifica(comp.fecha));
      if (fechasEspeciales.length > 0) {
        console.log(`[rutinasController] 🔍 DEBUGGEO ESPECIAL - Fechas 27 y 28 de marzo:`);
        fechasEspeciales.forEach(comp => {
          const fecha = new Date(comp.fecha);
          console.log(`[rutinasController]   - ${fecha.toISOString().split('T')[0]} (${comp.fuente})`);
        });
      }
      
      // Ordenar las completaciones por fecha
      completaciones.sort((a, b) => {
        const fechaA = new Date(a.fecha);
        const fechaB = new Date(b.fecha);
        return fechaA - fechaB;
      });
      
      console.log(`[rutinasController] Encontradas ${completaciones.length} completaciones para ${section}.${itemId}`);
      
      // Agrupar completaciones por semana para facilitar el procesamiento en el frontend
      const completacionesPorSemana = {};
      const completacionesPorMes = {};
      
      completaciones.forEach(comp => {
        const fecha = new Date(comp.fecha);
        
        // Obtener año y número de semana
        const año = fecha.getFullYear();
        
        // Para semanas
        // Obtener el inicio de la semana para usarlo como clave
        const inicioSemana = new Date(fecha);
        inicioSemana.setDate(fecha.getDate() - fecha.getDay());
        inicioSemana.setHours(0, 0, 0, 0);
        // Corregir el formato de clave para evitar la duplicación del año
        const claveSemana = inicioSemana.toISOString().split('T')[0];
        
        if (!completacionesPorSemana[claveSemana]) {
          completacionesPorSemana[claveSemana] = [];
        }
        completacionesPorSemana[claveSemana].push(comp);
        
        // Para meses
        const mes = fecha.getMonth() + 1; // +1 porque getMonth() devuelve 0-11
        const claveMes = `${año}-${mes.toString().padStart(2, '0')}`;
        
        if (!completacionesPorMes[claveMes]) {
          completacionesPorMes[claveMes] = [];
        }
        completacionesPorMes[claveMes].push(comp);
      });
      
      return res.json({
        section,
        itemId,
        completaciones,
        completacionesPorSemana,
        completacionesPorMes,
        total: completaciones.length,
        fechas: {
          inicio: inicio.toISOString(),
          fin: fin.toISOString()
        }
      });
      
    } catch (error) {
      console.error('[rutinasController] Error al obtener historial de completaciones:', error);
      res.status(500).json({ 
        error: 'Error al obtener historial de completaciones',
        details: error.message 
      });
    }
  }
}

export const rutinasController = new RutinasController(); 
