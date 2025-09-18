import { google } from 'googleapis';
import { Users, Tareas } from '../models/index.js';
import config from '../config/config.js';

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
          console.warn(`⚠️ Intento ${attempt}/${this.maxRetries} falló para ${context}:`, error.message);
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
    
    const errorCode = error.code || error.status || '';
    const errorMessage = error.message || '';
    
    return retryableErrors.some(retryableError => 
      errorCode.includes(retryableError) || 
      errorMessage.includes(retryableError)
    );
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

    await this.setUserCredentials(userId);
    
    // Siempre usar la TaskList por defecto para evitar confusión
    // Los proyectos de Attadia se mapean conceptualmente, no estructuralmente
    const taskList = await this.getOrCreateDefaultTaskList(userId);

    try {
      // Usar el método del modelo para obtener el formato de Google Tasks
      const googleTaskData = tarea.toGoogleTaskFormat();
      
      // Asegurar que notes tenga el formato correcto con información del proyecto
      googleTaskData.notes = this.buildTaskNotes(tarea);
      
      // Agregar información del proyecto en el título si existe
      if (tarea.proyecto && tarea.proyecto.nombre) {
        googleTaskData.title = `[${tarea.proyecto.nombre}] ${googleTaskData.title}`;
      }
      
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

        console.log(`📥 Subtarea sincronizada a Google: "${subtarea.titulo}" (parent: ${parentTaskId})`);
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

      console.log(`📥 Importando ${googleTasks.length} tareas de Google Tasks desde TaskList: ${taskList.title}`);
      
      // Debug: mostrar las primeras 3 tareas para verificar su estructura
      if (googleTasks.length > 0) {
        console.log('🔍 DEBUG - Primeras tareas de Google:', googleTasks.slice(0, 3).map(task => ({
          id: task.id,
          title: task.title,
          notes: task.notes,
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
            console.log(`⏭️ Saltando tarea antigua: "${googleTask.title}" (${taskDate.toISOString()})`);
            syncResults.skipped++;
            continue;
          }

          // Buscar tarea existente por Google Task ID
          let tarea = await Tareas.findOne({
            'googleTasksSync.googleTaskId': googleTask.id,
            usuario: userId
          });

          if (tarea) {
            // Actualizar tarea existente usando el nuevo método del modelo
            tarea.updateFromGoogleTask(googleTask);
            await tarea.save();
            syncResults.updated++;
            console.log(`📝 Actualizada tarea desde Google: "${googleTask.title}"`);
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
                console.log(`📥 Creada subtarea desde Google: "${googleTask.title}" en tarea padre: "${tareaPadre.titulo}"`);
              } else {
                console.warn(`⚠️  No se encontró tarea padre para subtarea: "${googleTask.title}"`);
                syncResults.errors.push(`${googleTask.title}: Tarea padre no encontrada`);
              }
            } else {
              // Es una tarea principal, extraer información del proyecto del título si existe
              const { Proyectos } = await import('../models/index.js');
              
              let tituloLimpio = googleTask.title;
              let proyecto = null;
              
              // Extraer proyecto del título si tiene formato [Proyecto] Tarea
              const proyectoMatch = googleTask.title.match(/^\[([^\]]+)\]\s*(.+)$/);
              if (proyectoMatch) {
                const nombreProyecto = proyectoMatch[1];
                tituloLimpio = proyectoMatch[2];
                
                // Buscar o crear proyecto
                proyecto = await Proyectos.findOne({ 
                  usuario: userId, 
                  nombre: nombreProyecto 
                });
                
                if (!proyecto) {
                  proyecto = new Proyectos({
                    nombre: nombreProyecto,
                    usuario: userId,
                    descripcion: `Proyecto creado automáticamente desde Google Tasks`
                  });
                  await proyecto.save();
                  console.log(`📁 Creado proyecto automáticamente: "${nombreProyecto}"`);
                }
              } else {
                // Buscar un proyecto por defecto
                proyecto = await Proyectos.findOne({ usuario: userId });
              }
              
              const nuevaTarea = new Tareas({
                titulo: tituloLimpio,
                descripcion: googleTask.notes || '',
                usuario: userId,
                fechaInicio: new Date(),
                prioridad: 'BAJA',
                proyecto: proyecto?._id || null
              });
              
              // Usar el método del modelo para configurar Google Tasks
              nuevaTarea.updateFromGoogleTask(googleTask);
              nuevaTarea.googleTasksSync.googleTaskListId = taskList.id;
              
              console.log(`📥 Creando nueva tarea desde Google: "${tituloLimpio}" en proyecto: ${proyecto?.nombre || 'Sin proyecto'}`);
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

      console.log(`📊 Resumen de sincronización desde Google: ${syncResults.created} creadas, ${syncResults.updated} actualizadas, ${syncResults.skipped} omitidas (antiguas)`);
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
   * Sincroniza proyectos con Google TaskLists
   * NOTA: Los proyectos de Attadia se mapean conceptualmente a Google Tasks,
   * no estructuralmente. Todos los proyectos se sincronizan a la misma TaskList.
   */
  async syncProyectosWithTaskLists(userId) {
    try {
      // IMPORTANTE: Configurar credenciales OAuth antes de hacer llamadas a la API
      await this.setUserCredentials(userId);
      
      const { Proyectos } = await import('../models/index.js');
      
      // Obtener todos los proyectos del usuario
      const proyectos = await Proyectos.find({ usuario: userId });
      
      // Obtener la TaskList por defecto
      const taskList = await this.getOrCreateDefaultTaskList(userId);
      
      console.log(`🔄 Habilitando Google Tasks para ${proyectos.length} proyectos`);
      console.log(`📋 Usando TaskList: "${taskList.title}" (${taskList.id})`);
      
      // Habilitar Google Tasks para proyectos existentes
      for (const proyecto of proyectos) {
        if (!proyecto.googleTasksSync?.enabled) {
          if (!proyecto.googleTasksSync) proyecto.googleTasksSync = {};
          proyecto.googleTasksSync.enabled = true;
          proyecto.googleTasksSync.syncStatus = 'pending';
          proyecto.googleTasksSync.needsSync = true;
          proyecto.googleTasksSync.googleTaskListId = taskList.id;
          await proyecto.save();
        }
      }
      
      return { proyectos: proyectos.length, taskList: taskList.title };
    } catch (error) {
      console.error('Error al sincronizar proyectos con TaskLists:', error);
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
      
      console.log(`✅ Habilitadas ${result.modifiedCount} tareas para sincronización con Google Tasks`);
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
      
      // 3. Sincronizar tareas locales pendientes hacia Google
      const tareasLocales = await Tareas.find({
        usuario: userId,
        $or: [
          // Tareas con sincronización pendiente
          { 'googleTasksSync.syncStatus': 'pending' },
          { 'googleTasksSync.needsSync': true },
          // Tareas habilitadas que no están sincronizadas
          { 'googleTasksSync.enabled': true, 'googleTasksSync.syncStatus': { $ne: 'synced' } },
          // Tareas que NO tienen googleTaskId (nunca se han sincronizado)
          { 'googleTasksSync.enabled': true, 'googleTasksSync.googleTaskId': { $exists: false } }
        ]
      });
      
      console.log(`🔄 Encontradas ${tareasLocales.length} tareas locales para sincronizar hacia Google:`, 
        tareasLocales.map(t => ({ titulo: t.titulo, hasGoogleSync: !!t.googleTasksSync, enabled: t.googleTasksSync?.enabled })));

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
    let notes = tarea.descripcion || '';
    
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

    // Agregar información de sincronización
    notes += `\n\n---\nSincronizado desde Attadia el ${new Date().toLocaleString()}`;

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

}

export default new GoogleTasksService();
