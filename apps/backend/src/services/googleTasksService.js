import mongoose from 'mongoose';
import { google } from 'googleapis';
import { Users, Tareas } from '../models/index.js';
import config from '../config/config.js';
import logger from '../utils/logger.js';

class GoogleTasksService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      config.google.clientId,
      config.google.clientSecret,
      `${config.backendUrl}/api/google-tasks/callback`
    );
    
    this.tasks = google.tasks({ 
      version: 'v1', 
      auth: this.oauth2Client,
      // Configuración para mejores prácticas de Google APIs
      params: {
        quotaUser: 'attadia-app'
      }
    });
    
    // Rate limiting y retry configuration
    this.rateLimitDelay = 100; // ms entre requests
    this.maxRetries = 3;
    this.retryDelay = 1000; // ms
  }

  /**
   * Configura las credenciales OAuth2 para un usuario específico
   */
  async setUserCredentials(userId) {
    const user = await Users.findById(userId);
    if (!user || !user.googleTasksConfig.accessToken) {
      throw new Error('Usuario no tiene configuración de Google Tasks');
    }

    this.oauth2Client.setCredentials({
      access_token: user.googleTasksConfig.accessToken,
      refresh_token: user.googleTasksConfig.refreshToken
    });

    return user;
  }

  /**
   * Ejecuta una operación con retry automático siguiendo las mejores prácticas de Google
   */
  async executeWithRetry(operation, context = '') {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        // Rate limiting
        if (attempt > 1) {
          await this.delay(this.rateLimitDelay * attempt);
        }
        
        const result = await operation();
        return result;
      } catch (error) {
        lastError = error;
        
        // Verificar si es un error que vale la pena reintentar
        if (this.shouldRetry(error, attempt)) {
          logger.warn(`⚠️ Intento ${attempt}/${this.maxRetries} falló para ${context}:`, error.message);
          await this.delay(this.retryDelay * attempt);
          continue;
        } else {
          // Error no recuperable, fallar inmediatamente
          throw error;
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Determina si un error debe ser reintentado
   */
  shouldRetry(error, attempt) {
    if (attempt >= this.maxRetries) return false;
    
    const retryableErrors = [
      'rateLimitExceeded',
      'quotaExceeded', 
      'userRateLimitExceeded',
      'internalError',
      'backendError',
      'timeout'
    ];
    
    // Códigos de error HTTP que son reintentatables
    const retryableHttpCodes = [429, 500, 502, 503, 504];
    
    // Convertir errorCode a string para evitar errores de tipo
    const errorCode = String(error.code || error.status || '');
    const errorMessage = String(error.message || '');
    const httpStatus = parseInt(error.code || error.status || 0);
    
    // Verificar si el error es reintentable por código de texto o código HTTP
    return retryableErrors.some(retryableError => 
      errorCode.includes(retryableError) || 
      errorMessage.includes(retryableError)
    ) || retryableHttpCodes.includes(httpStatus);
  }

  /**
   * Delay utility
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Optimiza operaciones en lote para reducir llamadas a la API
   */
  async batchOperation(operations, batchSize = 10) {
    const results = [];
    
    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);
      
      // Ejecutar operaciones en paralelo dentro del lote
      const batchPromises = batch.map(async (operation, index) => {
        try {
          // Pequeño delay entre operaciones para evitar rate limiting
          await this.delay(this.rateLimitDelay * (index + 1));
          return await operation();
        } catch (error) {
          console.error(`Error en operación ${i + index + 1}:`, error);
          return { error: error.message };
        }
      });
      
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults);
      
      // Delay entre lotes para evitar rate limiting
      if (i + batchSize < operations.length) {
        await this.delay(this.rateLimitDelay * batchSize);
      }
    }
    
    return results;
  }

  /**
   * Obtiene o crea la lista de tareas por defecto en Google Tasks
   */
  async getOrCreateDefaultTaskList(userId) {
    await this.setUserCredentials(userId);

    try {
      // Primero intentar obtener las listas existentes con retry
      const response = await this.executeWithRetry(
        () => this.tasks.tasklists.list(),
        'obtener listas de tareas'
      );
      const taskLists = response.data.items || [];

      // Buscar una lista llamada "Attadia Tasks" o usar la primera disponible
      let targetList = taskLists.find(list => list.title === 'Attadia Tasks');
      
      if (!targetList && taskLists.length > 0) {
        // Si no existe "Attadia Tasks", usar la lista por defecto (primera)
        targetList = taskLists[0];
      }

      if (!targetList) {
        // Si no hay listas, crear una nueva con retry
        const createResponse = await this.executeWithRetry(
          () => this.tasks.tasklists.insert({
            requestBody: {
              title: 'Attadia Tasks'
            }
          }),
          'crear lista de tareas'
        );
        targetList = createResponse.data;
      }

      // Actualizar la configuración del usuario
      await Users.findByIdAndUpdate(userId, {
        'googleTasksConfig.defaultTaskList': targetList.id
      });

      return targetList;
    } catch (error) {
      console.error('Error al obtener/crear lista de tareas:', error);
      
      // Manejo específico de errores de Google APIs
      if (error.code === 403) {
        throw new Error('Permisos insuficientes para acceder a Google Tasks. Verifica que la aplicación tenga los permisos necesarios.');
      } else if (error.code === 401) {
        throw new Error('Token de acceso inválido. Por favor, reconecta tu cuenta de Google.');
      } else if (error.code === 429) {
        throw new Error('Límite de solicitudes excedido. Intenta nuevamente en unos minutos.');
      } else if (error.code >= 500) {
        throw new Error('Error temporal del servidor de Google. Intenta nuevamente más tarde.');
      } else {
        throw new Error(`Error al acceder a Google Tasks: ${error.message}`);
      }
    }
  }

  /**
   * Sincroniza una tarea de Attadia hacia Google Tasks
   */
  async syncTaskToGoogle(tareaId, userId) {
    const tarea = await Tareas.findById(tareaId).populate('proyecto');
    if (!tarea) {
      throw new Error('Tarea no encontrada');
    }

    // CORRECCIÓN AUTOMÁTICA: Normalizar y limpiar antes de sincronizar
    const tituloOriginal = tarea.titulo;
    const tituloNormalizado = this.normalizeTitle(tarea.titulo);
    
    // Si el título cambió, actualizarlo automáticamente
    if (tituloNormalizado !== tituloOriginal) {
      logger.dev(`🔧 Auto-corrigiendo título: "${tituloOriginal}" -> "${tituloNormalizado}"`);
      tarea.titulo = tituloNormalizado;
      await tarea.save();
    }

    // Protección básica: evitar sincronizaciones concurrentes
    if (tarea.googleTasksSync?.syncStatus === 'syncing') {
      logger.dev(`⚠️ Tarea "${tarea.titulo}" ya está siendo sincronizada, saltando...`);
      return;
    }

    await this.setUserCredentials(userId);
    
    // Siempre usar la TaskList por defecto para evitar confusión
    // Los proyectos de Attadia se mapean conceptualmente, no estructuralmente
    const taskList = await this.getOrCreateDefaultTaskList(userId);

    try {
      // Usar el método del modelo para obtener el formato de Google Tasks
      const googleTaskData = tarea.toGoogleTaskFormat();
      
      // CORRECCIÓN: Limpiar notas antes de construir nuevas para evitar duplicados
      const notasLimpias = this.buildTaskNotes(tarea);
      googleTaskData.notes = notasLimpias;
      
      // CORRECCIÓN: NO agregar proyecto al título - Attadia ya agrupa por proyecto
      // El proyecto se maneja como campo separado, no en el título
      
      // Eliminar campos que Google Tasks maneja automáticamente en creación
      if (!tarea.googleTasksSync?.googleTaskId) {
        delete googleTaskData.id;
        delete googleTaskData.updated;
      }

      let googleTask;
      
      // Inicializar googleTasksSync si no existe
      if (!tarea.googleTasksSync) {
        tarea.googleTasksSync = {
          enabled: true,
          syncStatus: 'pending',
          needsSync: true,
          localVersion: 1
        };
      }

      // Marcar como "syncing" para evitar sincronizaciones concurrentes
      await Tareas.findByIdAndUpdate(tareaId, {
        'googleTasksSync.syncStatus': 'syncing'
      });
      
      if (tarea.googleTasksSync.googleTaskId) {
        // Actualizar tarea existente con retry
        googleTask = await this.executeWithRetry(
          () => this.tasks.tasks.update({
            tasklist: taskList.id,
            task: tarea.googleTasksSync.googleTaskId,
            requestBody: googleTaskData,
            fields: 'id,title,status,updated' // Solo campos necesarios
          }),
          `actualizar tarea ${tarea.titulo}`
        );
      } else {
        // Crear nueva tarea con retry
        googleTask = await this.executeWithRetry(
          () => this.tasks.tasks.insert({
            tasklist: taskList.id,
            requestBody: googleTaskData,
            fields: 'id,title,status,updated' // Solo campos necesarios
          }),
          `crear tarea ${tarea.titulo}`
        );

        // Actualizar el documento local con el ID de Google
        await Tareas.findByIdAndUpdate(tareaId, {
          'googleTasksSync.googleTaskId': googleTask.data.id,
          'googleTasksSync.googleTaskListId': taskList.id
        });
      }

      // Sincronizar subtareas como tareas hijas en Google Tasks
      if (tarea.subtareas && tarea.subtareas.length > 0) {
        await this.syncSubtasksToGoogle(tarea.subtareas, taskList.id, googleTask.data.id, userId);
      }

      // Actualizar estado de sincronización
      await Tareas.findByIdAndUpdate(tareaId, {
        'googleTasksSync.lastSyncDate': new Date(),
        'googleTasksSync.syncStatus': 'synced',
        'googleTasksSync.syncErrors': []
      });

      return googleTask.data;
    } catch (error) {
      console.error('Error al sincronizar tarea a Google:', error);
      
      // Registrar error
      await Tareas.findByIdAndUpdate(tareaId, {
        'googleTasksSync.syncStatus': 'error',
        'googleTasksSync.syncErrors': [error.message]
      });
      
      throw error;
    }
  }

  /**
   * Sincroniza subtareas como tareas hijas en Google Tasks
   */
  async syncSubtasksToGoogle(subtareas, taskListId, parentTaskId, userId) {
    try {
      for (const [index, subtarea] of subtareas.entries()) {
        const subtaskData = {
          title: subtarea.titulo,
          status: subtarea.completada ? 'completed' : 'needsAction',
          parent: parentTaskId,
          position: String(index).padStart(20, '0') // Mantener orden
        };

        // Crear la subtarea en Google Tasks con retry
        const googleSubtask = await this.executeWithRetry(
          () => this.tasks.tasks.insert({
            tasklist: taskListId,
            requestBody: subtaskData,
            fields: 'id,title,status,parent' // Solo campos necesarios
          }),
          `crear subtarea ${subtarea.titulo}`
        );

        logger.sync(`📥 Subtarea sincronizada a Google: "${subtarea.titulo}" (parent: ${parentTaskId})`);
      }
    } catch (error) {
      console.error('Error al sincronizar subtareas a Google:', error);
      throw error;
    }
  }

  /**
   * Sincroniza desde Google Tasks hacia Attadia
   */
  async syncTasksFromGoogle(userId) {
    const user = await this.setUserCredentials(userId);
    const taskList = await this.getOrCreateDefaultTaskList(userId);

    try {
      const response = await this.executeWithRetry(
        () => this.tasks.tasks.list({
          tasklist: taskList.id,
          showCompleted: true,
          showHidden: true,
          maxResults: 100, // Limitar resultados para mejor performance
          fields: 'items(id,title,notes,status,updated,due,parent,position)' // Solo campos necesarios
        }),
        'obtener tareas de Google'
      );

      const googleTasks = response.data.items || [];
      const syncResults = {
        created: 0,
        updated: 0,
        errors: [],
        skipped: 0
      };

      // Filtro de fecha: solo sincronizar tareas de los últimos 30 días
      const oneMonthAgo = new Date();
      oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

      logger.sync(`📥 Importando ${googleTasks.length} tareas de Google Tasks desde TaskList: ${taskList.title}`);
      
      // Debug: mostrar las primeras 3 tareas para verificar su estructura (solo en desarrollo)
      if (googleTasks.length > 0) {
        logger.data('Primeras tareas de Google', googleTasks.slice(0, 3).map(task => ({
          id: task.id,
          title: task.title,
          notes: task.notes?.substring(0, 100) + '...', // Truncar notas largas
          status: task.status,
          parent: task.parent,
          hasParent: !!task.parent
        })));
      }

      for (const googleTask of googleTasks) {
        try {
          // Verificar si la tarea es anterior a un mes
          const taskDate = googleTask.updated ? new Date(googleTask.updated) : 
                         googleTask.due ? new Date(googleTask.due) : 
                         new Date();
          
          if (taskDate < oneMonthAgo) {
            logger.dev(`⏭️ Saltando tarea antigua: "${googleTask.title}" (${taskDate.toISOString()})`);
            syncResults.skipped++;
            continue;
          }

          // Buscar tarea existente por Google Task ID
          let tarea = await Tareas.findOne({
            'googleTasksSync.googleTaskId': googleTask.id,
            usuario: userId
          });

          // Si no existe, crear nueva tarea automáticamente
          if (!tarea) {
            logger.sync(`📥 Creando nueva tarea desde Google: "${googleTask.title}"`);
          }

          if (tarea) {
            // Limpiar notas duplicadas antes de actualizar
            if (googleTask.notes) {
              const notasLimpias = this.cleanDuplicatedNotes(googleTask.notes);
              
              if (notasLimpias !== googleTask.notes) {
                logger.dev(`🧹 Limpiando notas duplicadas para: "${googleTask.title}"`);
                googleTask.notes = notasLimpias;
              }
            }
            
            // Actualizar tarea existente usando el nuevo método del modelo
            tarea.updateFromGoogleTask(googleTask);
            await tarea.save();
            syncResults.updated++;
            logger.sync(`📝 Actualizada tarea desde Google: "${googleTask.title}"`);
          } else {
            // Verificar si es una subtarea (tiene parent)
            if (googleTask.parent) {
              // Es una subtarea, buscar la tarea padre
              const tareaPadre = await Tareas.findOne({
                'googleTasksSync.googleTaskId': googleTask.parent,
                usuario: userId
              });
              
              if (tareaPadre) {
                // Agregar como subtarea
                const nuevaSubtarea = {
                  titulo: googleTask.title,
                  completada: googleTask.status === 'completed'
                };
                
                tareaPadre.subtareas.push(nuevaSubtarea);
                await tareaPadre.save();
                syncResults.created++;
                logger.sync(`📥 Creada subtarea desde Google: "${googleTask.title}" en tarea padre: "${tareaPadre.titulo}"`);
              } else {
                logger.warn(`⚠️  No se encontró tarea padre para subtarea: "${googleTask.title}"`);
                syncResults.errors.push(`${googleTask.title}: Tarea padre no encontrada`);
              }
            } else {
              // Es una tarea principal - crear automáticamente con normalización
              const { Proyectos } = await import('../models/index.js');
              
              // Normalizar el título automáticamente (sin prefijos de proyecto)
              const tituloNormalizado = this.normalizeTitle(googleTask.title);
              
              // Buscar proyecto por defecto o crear uno genérico
              let proyecto = await Proyectos.findOne({ usuario: userId });
              if (!proyecto) {
                proyecto = new Proyectos({
                  nombre: 'Tareas Generales',
                  usuario: userId,
                  descripcion: 'Proyecto por defecto para tareas sin proyecto específico'
                });
                await proyecto.save();
                logger.sync(`📁 Creado proyecto por defecto: "Tareas Generales"`);
              }
              
              const nuevaTarea = new Tareas({
                titulo: tituloNormalizado, // Título limpio sin prefijos
                descripcion: googleTask.notes || '',
                usuario: userId,
                fechaInicio: new Date(),
                prioridad: 'BAJA',
                proyecto: proyecto._id
              });
              
              // Configurar Google Tasks
              nuevaTarea.updateFromGoogleTask(googleTask);
              nuevaTarea.googleTasksSync.googleTaskListId = taskList.id;
              
              logger.sync(`📥 Creando nueva tarea desde Google: "${tituloNormalizado}"`);
              await nuevaTarea.save();
              syncResults.created++;
            }
          }
        } catch (error) {
          console.error(`Error al procesar tarea de Google "${googleTask.title}":`, error);
          syncResults.errors.push(`${googleTask.title}: ${error.message}`);
        }
      }

      // Actualizar última sincronización del usuario
      await Users.findByIdAndUpdate(userId, {
        'googleTasksConfig.lastSync': new Date()
      });

      logger.sync(`📊 Resumen de sincronización desde Google: ${syncResults.created} creadas, ${syncResults.updated} actualizadas, ${syncResults.skipped} omitidas (antiguas)`);  
      return syncResults;
    } catch (error) {
      console.error('Error al sincronizar desde Google Tasks:', error);
      throw error;
    }
  }

  /**
   * Sincronización bidireccional completa
   */
  async fullSync(userId) {
    const user = await Users.findById(userId);
    if (!user || !user.googleTasksConfig.enabled) {
      throw new Error('Google Tasks no está habilitado para este usuario');
    }

    return this.fullSyncWithUser(user);
  }

  /**
   * CORRECCIÓN: Los proyectos NO se sincronizan como TaskLists separadas
   * Todos los proyectos de Attadia se mapean conceptualmente a UNA TaskList
   * El proyecto se indica en el título de la tarea: [Proyecto] Tarea
   */
  async syncProyectosWithTaskLists(userId) {
    try {
      // IMPORTANTE: Configurar credenciales OAuth antes de hacer llamadas a la API
      await this.setUserCredentials(userId);
      
      const { Proyectos } = await import('../models/index.js');
      
      // Obtener todos los proyectos del usuario
      const proyectos = await Proyectos.find({ usuario: userId });
      
      // Obtener la TaskList por defecto (UNA SOLA para todos los proyectos)
      const taskList = await this.getOrCreateDefaultTaskList(userId);
      
      logger.sync(`🔄 Configurando Google Tasks para ${proyectos.length} proyectos`);
      logger.sync(`📋 Usando TaskList única: "${taskList.title}" (${taskList.id})`);
      
      // Habilitar Google Tasks para proyectos existentes (solo configuración, no sincronización)
      for (const proyecto of proyectos) {
        if (!proyecto.googleTasksSync?.enabled) {
          if (!proyecto.googleTasksSync) proyecto.googleTasksSync = {};
          proyecto.googleTasksSync.enabled = true;
          proyecto.googleTasksSync.syncStatus = 'synced'; // No necesita sincronización como TaskList
          proyecto.googleTasksSync.needsSync = false; // Los proyectos no se sincronizan como TaskLists
          proyecto.googleTasksSync.googleTaskListId = taskList.id;
          await proyecto.save();
        }
      }
      
      return { proyectos: proyectos.length, taskList: taskList.title };
    } catch (error) {
      logger.error('Error al configurar proyectos con Google Tasks:', error);
      throw error;
    }
  }

  /**
   * Habilita Google Tasks para todas las tareas existentes de un usuario
   */
  async enableGoogleTasksForAllUserTasks(userId) {
    try {
      const result = await Tareas.updateMany(
        { 
          usuario: userId,
          $or: [
            { 'googleTasksSync': { $exists: false } },
            { 'googleTasksSync.enabled': false }
          ]
        },
        {
          $set: {
            'googleTasksSync.enabled': true,
            'googleTasksSync.syncStatus': 'pending',
            'googleTasksSync.needsSync': true,
            'googleTasksSync.localVersion': 1
          }
        }
      );
      
      logger.sync(`✅ Habilitadas ${result.modifiedCount} tareas para sincronización con Google Tasks`);
      return result;
    } catch (error) {
      console.error('Error al habilitar Google Tasks para tareas existentes:', error);
      throw error;
    }
  }

  /**
   * Sincronización bidireccional completa con usuario ya cargado
   */
  async fullSyncWithUser(user) {
    if (!user || !user.googleTasksConfig?.enabled) {
      throw new Error('Google Tasks no está habilitado para este usuario');
    }

    const userId = user._id || user.id;
    const results = {
      toGoogle: { success: 0, errors: [] },
      fromGoogle: null
    };

    try {
      // 1. Sincronizar proyectos con Google TaskLists
      await this.syncProyectosWithTaskLists(userId);

      // 2. Habilitar Google Tasks para todas las tareas existentes del usuario
      await this.enableGoogleTasksForAllUserTasks(userId);
      
      // 3. Sincronizar tareas locales pendientes hacia Google (con filtro más estricto)
      const tareasLocales = await Tareas.find({
        usuario: userId,
        'googleTasksSync.enabled': true,
        $or: [
          // Tareas con sincronización pendiente
          { 'googleTasksSync.syncStatus': 'pending' },
          { 'googleTasksSync.needsSync': true },
          // Tareas que NO tienen googleTaskId (nunca se han sincronizado)
          { 'googleTasksSync.googleTaskId': { $exists: false } },
          // Tareas modificadas recientemente (menos de 1 hora) que necesitan actualización
          { 
            'googleTasksSync.syncStatus': { $ne: 'synced' },
            'googleTasksSync.lastSyncDate': { 
              $lt: new Date(Date.now() - 60 * 60 * 1000) // Hace más de 1 hora
            }
          }
        ]
      });
      
      logger.sync(`🔄 Encontradas ${tareasLocales.length} tareas locales para sincronizar hacia Google`);

      for (const tarea of tareasLocales) {
        try {
          await this.syncTaskToGoogle(tarea._id, userId);
          results.toGoogle.success++;
        } catch (error) {
          results.toGoogle.errors.push(`${tarea.titulo}: ${error.message}`);
        }
      }

      // 2. Sincronizar desde Google hacia local
      results.fromGoogle = await this.syncTasksFromGoogle(userId);

      return results;
    } catch (error) {
      console.error('Error en sincronización completa:', error);
      throw error;
    }
  }

  /**
   * Habilita Google Tasks para un usuario
   */
  async enableGoogleTasks(userId, accessToken, refreshToken) {
    await Users.findByIdAndUpdate(userId, {
      'googleTasksConfig.enabled': true,
      'googleTasksConfig.accessToken': accessToken,
      'googleTasksConfig.refreshToken': refreshToken
    });

    // Realizar primera sincronización
    return await this.fullSync(userId);
  }

  /**
   * Obtiene estadísticas de sincronización para un usuario
   */
  async getStats(userId) {
    const user = await Users.findById(userId);
    if (!user || !user.googleTasksConfig.enabled) {
      return {
        enabled: false,
        tasks: { synced: 0, pending: 0, errors: 0, total: 0 },
        lastSync: null
      };
    }

    // Contar tareas por estado de sincronización
    const totalTasks = await Tareas.countDocuments({ usuario: userId });
    const syncedTasks = await Tareas.countDocuments({ 
      usuario: userId, 
      'googleTasksSync.syncStatus': 'synced' 
    });
    const pendingTasks = await Tareas.countDocuments({ 
      usuario: userId, 
      'googleTasksSync.syncStatus': 'pending' 
    });
    const errorTasks = await Tareas.countDocuments({ 
      usuario: userId, 
      'googleTasksSync.syncStatus': 'error' 
    });

    return {
      enabled: true,
      tasks: {
        synced: syncedTasks,
        pending: pendingTasks,
        errors: errorTasks,
        total: totalTasks
      },
      lastSync: user.googleTasksConfig.lastSync
    };
  }

  /**
   * Sincroniza una tarea específica
   */
  async syncSpecificTask(userId, taskId) {
    const tarea = await Tareas.findOne({ _id: taskId, usuario: userId });
    if (!tarea) {
      throw new Error('Tarea no encontrada');
    }

    return await this.syncTaskToGoogle(taskId, userId);
  }

  /**
   * Obtiene las listas de tareas de Google
   */
  async getTaskLists(userId) {
    await this.setUserCredentials(userId);

    try {
      const response = await this.tasks.tasklists.list();
      return response.data.items || [];
    } catch (error) {
      console.error('Error al obtener listas de tareas:', error);
      throw new Error('No se pudieron obtener las listas de tareas de Google');
    }
  }

  // Métodos auxiliares
  buildTaskNotes(tarea) {
    // Limpiar descripción existente de duplicados antes de procesar
    let notes = this.cleanDuplicatedNotes(tarea.descripcion || '');
    
    if (tarea.subtareas && tarea.subtareas.length > 0) {
      notes += '\n\nSubtareas:\n';
      tarea.subtareas.forEach(subtarea => {
        const status = subtarea.completada ? '✓' : '○';
        notes += `${status} ${subtarea.titulo}\n`;
      });
    }

    if (tarea.proyecto) {
      notes += `\nProyecto: ${tarea.proyecto.nombre || 'Sin nombre'}`;
    }

    // SOLO agregar información de sincronización si es una tarea nueva que nunca se ha sincronizado
    if (!tarea.googleTasksSync?.googleTaskId) {
      notes += `\n\n---\nTarea creada desde Attadia el ${new Date().toLocaleString()}`;
    }

    return notes;
  }

  extractDescriptionFromNotes(notes) {
    if (!notes) return '';
    
    // Extraer solo la descripción, antes de "Subtareas:", "Proyecto:" o "---"
    const lines = notes.split('\n');
    const endMarkers = ['Subtareas:', 'Proyecto:', '---'];
    
    let description = '';
    for (const line of lines) {
      if (endMarkers.some(marker => line.startsWith(marker))) {
        break;
      }
      description += line + '\n';
    }
    
    return description.trim();
  }

  /**
   * Limpia las notas duplicadas de sincronización y repeticiones masivas
   */
  cleanDuplicatedNotes(notes) {
    if (!notes) return '';
    
    // Primero limpiar repeticiones masivas de "Proyecto: Salud"
    let cleanedNotes = notes.replace(/(Proyecto: Salud\n)+/g, 'Proyecto: Salud\n');
    
    // Limpiar múltiples saltos de línea
    cleanedNotes = cleanedNotes.replace(/\n{3,}/g, '\n\n');
    
    // Dividir por "---" para separar secciones
    const sections = cleanedNotes.split('---');
    
    if (sections.length < 2) return cleanedNotes.trim();
    
    // Tomar solo la primera sección (contenido útil) y limpiar espacios
    let result = sections[0].trim();
    
    // Si había contenido útil después de las secciones de sincronización,
    // también incluirlo
    const hasSubtareas = sections.some(section => section.includes('Subtareas:'));
    const hasProyecto = sections.some(section => section.includes('Proyecto:'));
    
    if (hasSubtareas || hasProyecto) {
      // Buscar la primera sección que contenga información útil (Subtareas o Proyecto)
      for (let i = 1; i < sections.length; i++) {
        if (sections[i].includes('Subtareas:') || sections[i].includes('Proyecto:')) {
          result += '\n---' + sections[i].trim();
          break;
        }
      }
    }
    
    return result;
  }

  mapEstadoToGoogleStatus(estado) {
    switch (estado) {
      case 'COMPLETADA':
        return 'completed';
      default:
        return 'needsAction';
    }
  }

  mapGoogleStatusToEstado(status) {
    switch (status) {
      case 'completed':
        return 'COMPLETADA';
      default:
        return 'PENDIENTE';
    }
  }

  /**
   * Elimina una tarea en Google Tasks
   */
  async deleteGoogleTask(userId, taskListId, taskId) {
    await this.setUserCredentials(userId);
    const taskList = taskListId || (await this.getOrCreateDefaultTaskList(userId)).id;
    await this.executeWithRetry(
      () => this.tasks.tasks.delete({ tasklist: taskList, task: taskId }),
      `eliminar tarea ${taskId}`
    );
  }

  /**
   * Actualiza el título de una tarea en Google Tasks
   */
  async updateGoogleTaskTitle(userId, taskListId, taskId, title) {
    await this.setUserCredentials(userId);
    const taskList = taskListId || (await this.getOrCreateDefaultTaskList(userId)).id;
    await this.executeWithRetry(
      () => this.tasks.tasks.patch({
        tasklist: taskList,
        task: taskId,
        requestBody: { title },
        fields: 'id,title,updated'
      }),
      `actualizar título de tarea ${taskId}`
    );
  }

  /**
   * Normaliza un título eliminando prefijos duplicados
   * CORRECCIÓN: NO preservar prefijos de proyecto - Attadia maneja proyectos como campo separado
   */
  normalizeTitle(rawTitle) {
    if (!rawTitle) return '';
    let title = String(rawTitle).trim();
    
    // Fase 1: Detectar y manejar títulos spam
    if (this.isSpamTitle(title)) {
      logger.dev(`🚨 Detectado título spam: "${title}"`);
      // Para títulos spam, tratamos de extraer solo el contenido útil
      const spamCleaned = this.cleanSpamTitle(title);
      if (spamCleaned) {
        return spamCleaned;
      }
      // Si no se puede limpiar, usar un título genérico
      return 'Tarea importada';
    }
    
    // Fase 2: Eliminar TODOS los prefijos [X] - los proyectos se manejan como campo separado
    const prefixRegex = /^((\[[^\]]+\]\s*)+)/;
    if (prefixRegex.test(title)) {
      title = title.replace(prefixRegex, '').trim();
    }
    
    // Fase 3: Limpiar espacios y caracteres extraños
    title = title.replace(/\s{2,}/g, ' ').trim();
    
    // Si queda vacío después de limpiar, usar título genérico
    if (!title) {
      title = 'Tarea importada';
    }
    
    return title;
  }

  /**
   * Detecta si un título es considerado spam
   * CORRECCIÓN: Ahora que no preservamos prefijos, detectamos spam de manera diferente
   */
  isSpamTitle(title) {
    if (!title) return false;
    const t = String(title).trim();
    
    // Patrón 1: Título que contiene solo números
    if (/^(\d+\s*)+$/.test(t)) {
      return true;
    }
    
    // Patrón 2: Títulos muy cortos con solo números pequeños
    if (/^[12]\s*$/.test(t)) {
      return true;
    }
    
    // Patrón 3: Títulos vacíos o solo espacios
    if (!t || t.length < 2) {
      return true;
    }
    
    // Patrón 4: Múltiples prefijos duplicados (aunque los eliminemos, detectamos antes)
    const matches = t.match(/\[[^\]]+\]/g) || [];
    if (matches.length >= 3) {
      const uniquePrefixes = [...new Set(matches)];
      if (uniquePrefixes.length < matches.length) {
        return true; // Hay prefijos duplicados consecutivos
      }
    }
    
    return false;
  }

  /**
   * Intenta limpiar un título spam
   * CORRECCIÓN: Ya no preservamos prefijos de proyecto
   */
  cleanSpamTitle(spamTitle) {
    // Extraer contenido después de cualquier prefijo
    const cleanContent = spamTitle.replace(/^((\[[^\]]+\]\s*)+)/, '').trim();
    
    // Si hay contenido útil después de limpiar prefijos, mantenerlo
    if (cleanContent && cleanContent.length > 2 && !/^[12]\s*$/.test(cleanContent)) {
      return cleanContent;
    }
    
    // Si no hay contenido útil, crear un título genérico
    return 'Tarea importada';
  }
}

export default new GoogleTasksService();
