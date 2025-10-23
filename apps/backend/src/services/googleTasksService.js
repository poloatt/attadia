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

      // Ya no usamos defaultTaskList, cada proyecto tiene su propia TaskList
      // Solo actualizar si no existe ninguna configuración
      const user = await Users.findById(userId);
      if (!user.googleTasksConfig.defaultTaskList) {
        await Users.findByIdAndUpdate(userId, {
          'googleTasksConfig.defaultTaskList': targetList.id
        });
      }

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

    // Limpiar título básicamente antes de sincronizar
    const tituloOriginal = tarea.titulo;
    const tituloLimpio = this.cleanTitle(tarea.titulo);
    
    // Si el título cambió, actualizarlo automáticamente
    if (tituloLimpio !== tituloOriginal) {
      logger.dev(`🔧 Limpiando título: "${tituloOriginal}" -> "${tituloLimpio}"`);
      tarea.titulo = tituloLimpio;
      await tarea.save();
    }

    // Protección básica: evitar sincronizaciones concurrentes
    if (tarea.googleTasksSync?.syncStatus === 'syncing') {
      logger.dev(`⚠️ Tarea "${tarea.titulo}" ya está siendo sincronizada, saltando...`);
      return;
    }

    await this.setUserCredentials(userId);
    
    // Usar la TaskList del proyecto específico
    if (!tarea.proyecto || !tarea.proyecto.googleTasksSync?.googleTaskListId) {
      throw new Error('La tarea debe tener un proyecto con TaskList configurada en Google Tasks');
    }
    
    const taskListId = tarea.proyecto.googleTasksSync.googleTaskListId;

    try {
      // Usar el método del modelo para obtener el formato de Google Tasks
      const googleTaskData = tarea.toGoogleTaskFormat();
      
      // Construir notas con subtareas
      googleTaskData.notes = this.buildTaskNotes(tarea);
      
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
        'googleTasksSync.syncStatus': 'syncing',
        'googleTasksSync.syncingStartedAt': new Date()
      });
      
      if (tarea.googleTasksSync.googleTaskId) {
        try {
          // Actualizar tarea existente con retry
          googleTask = await this.executeWithRetry(
            () => this.tasks.tasks.update({
              tasklist: taskListId,
              task: tarea.googleTasksSync.googleTaskId,
              requestBody: googleTaskData,
              fields: 'id,title,status,updated' // Solo campos necesarios
            }),
            `actualizar tarea ${tarea.titulo}`
          );
        } catch (error) {
          // Si la tarea no existe en Google (404), crear una nueva
          if (error.status === 404) {
            console.log(`[INFO] Tarea ${tarea.titulo} no existe en Google, creando nueva...`);
            delete googleTaskData.id; // Eliminar ID para crear nueva
            googleTask = await this.executeWithRetry(
              () => this.tasks.tasks.insert({
                tasklist: taskListId,
                requestBody: googleTaskData,
                fields: 'id,title,status,updated'
              }),
              `crear tarea ${tarea.titulo} (reemplazando inexistente)`
            );
          } else {
            throw error; // Re-lanzar otros errores
          }
        }
      } else {
        // Crear nueva tarea con retry
        googleTask = await this.executeWithRetry(
          () => this.tasks.tasks.insert({
            tasklist: taskListId,
            requestBody: googleTaskData,
            fields: 'id,title,status,updated' // Solo campos necesarios
          }),
          `crear tarea ${tarea.titulo}`
        );

        // Actualizar el documento local con el ID de Google
        await Tareas.findByIdAndUpdate(tareaId, {
          'googleTasksSync.googleTaskId': googleTask.data.id,
          'googleTasksSync.googleTaskListId': taskListId
        });
      }

      // Sincronizar subtareas como tareas hijas en Google Tasks
      if (tarea.subtareas && tarea.subtareas.length > 0) {
        await this.syncSubtasksToGoogle(tarea.subtareas, taskListId, googleTask.data.id, userId);
        
        // Guardar cambios en las subtareas (googleTaskId actualizado)
        await tarea.save();
      }

      // Actualizar estado de sincronización
      await Tareas.findByIdAndUpdate(tareaId, {
        'googleTasksSync.lastSyncDate': new Date(),
        'googleTasksSync.syncStatus': 'synced',
        'googleTasksSync.syncErrors': [],
        'googleTasksSync.syncingStartedAt': null // Limpiar timestamp
      });

      return googleTask.data;
    } catch (error) {
      console.error('Error al sincronizar tarea a Google:', error);
      
      // Registrar error
      await Tareas.findByIdAndUpdate(tareaId, {
        'googleTasksSync.syncStatus': 'error',
        'googleTasksSync.syncErrors': [error.message],
        'googleTasksSync.syncingStartedAt': null // Limpiar timestamp
      });
      
      throw error;
    }
  }

  /**
   * Sincroniza subtareas como tareas hijas en Google Tasks con detección de duplicados
   */
  async syncSubtasksToGoogle(subtareas, taskListId, parentTaskId, userId) {
    try {
      // Obtener todas las subtareas existentes en Google para esta tarea padre
      const existingGoogleSubtasks = await this.executeWithRetry(
        () => this.tasks.tasks.list({
          tasklist: taskListId,
          showCompleted: true,
          showHidden: true,
          fields: 'items(id,title,status,parent)'
        }),
        `obtener subtareas existentes para tarea padre ${parentTaskId}`
      );

      const googleSubtasks = existingGoogleSubtasks.data.items?.filter(task => task.parent === parentTaskId) || [];
      
      logger.sync(`🔄 Sincronizando ${subtareas.length} subtareas locales con ${googleSubtasks.length} existentes en Google`);

      // 1. Actualizar subtareas existentes y crear nuevas
      for (const [index, subtarea] of subtareas.entries()) {
        let googleSubtask;
        
        if (subtarea.googleTaskId) {
          try {
            // Actualizar subtarea existente
            const subtaskData = {
              title: subtarea.titulo,
              status: subtarea.completada ? 'completed' : 'needsAction',
              parent: parentTaskId, // ¡IMPORTANTE! Incluir parent para subtareas
              position: String(index).padStart(20, '0')
            };

            googleSubtask = await this.executeWithRetry(
              () => this.tasks.tasks.update({
                tasklist: taskListId,
                task: subtarea.googleTaskId,
                requestBody: subtaskData,
                fields: 'id,title,status'
              }),
              `actualizar subtarea ${subtarea.titulo}`
            );
            
            logger.sync(`📝 Actualizada subtarea: "${subtarea.titulo}"`);
            
          } catch (error) {
            // Si la subtarea no existe en Google (404), crear una nueva
            if (error.status === 404) {
              console.log(`[INFO] Subtarea "${subtarea.titulo}" no existe en Google, creando nueva...`);
              subtarea.googleTaskId = null; // Limpiar ID inválido
              // Continuar al bloque de creación
            } else {
              throw error; // Re-lanzar otros errores
            }
          }
        }
        
        if (!subtarea.googleTaskId) {
          // Crear nueva subtarea
          const subtaskData = {
            title: subtarea.titulo,
            status: subtarea.completada ? 'completed' : 'needsAction',
            parent: parentTaskId,
            position: String(index).padStart(20, '0')
          };

          googleSubtask = await this.executeWithRetry(
            () => this.tasks.tasks.insert({
              tasklist: taskListId,
              requestBody: subtaskData,
              fields: 'id,title,status,parent'
            }),
            `crear subtarea ${subtarea.titulo}`
          );
          
          // Guardar el googleTaskId en la subtarea
          subtarea.googleTaskId = googleSubtask.data.id;
          subtarea.lastSyncDate = new Date();
          
          logger.sync(`📥 Creada subtarea: "${subtarea.titulo}"`);
        }
      }

      // 2. Eliminar subtareas que ya no existen en Attadia
      const localGoogleTaskIds = subtareas.map(st => st.googleTaskId).filter(Boolean);
      const subtasksToDelete = googleSubtasks.filter(gt => !localGoogleTaskIds.includes(gt.id));
      
      for (const subtaskToDelete of subtasksToDelete) {
        try {
          await this.executeWithRetry(
            () => this.tasks.tasks.delete({
              tasklist: taskListId,
              task: subtaskToDelete.id
            }),
            `eliminar subtarea ${subtaskToDelete.title}`
          );
          
          logger.sync(`🗑️ Eliminada subtarea de Google: "${subtaskToDelete.title}"`);
        } catch (error) {
          logger.warn(`No se pudo eliminar subtarea "${subtaskToDelete.title}":`, error.message);
        }
      }

    } catch (error) {
      console.error('Error al sincronizar subtareas a Google:', error);
      throw error;
    }
  }

  /**
   * Sincroniza desde Google Tasks hacia Attadia - MAPEA TASKLISTS A PROYECTOS
   */
  async syncTasksFromGoogle(userId) {
    const user = await this.setUserCredentials(userId);
    const { Proyectos } = await import('../models/index.js');

    try {
      // Obtener TODAS las TaskLists del usuario
      const taskListsResponse = await this.executeWithRetry(
        () => this.tasks.tasklists.list(),
        'obtener todas las TaskLists'
      );

      const googleTaskLists = taskListsResponse.data.items || [];
      const syncResults = {
        created: 0,
        updated: 0,
        errors: [],
        skipped: 0
      };

      logger.sync(`📥 Importando desde ${googleTaskLists.length} TaskLists de Google Tasks`);
      
      // Por cada TaskList, buscar o crear el proyecto correspondiente
      for (const taskList of googleTaskLists) {
        try {
          // Buscar proyecto existente por googleTaskListId
          let proyecto = await Proyectos.findOne({
            'googleTasksSync.googleTaskListId': taskList.id,
            usuario: userId
          });

          if (!proyecto) {
            // Crear nuevo proyecto desde TaskList
            proyecto = new Proyectos({
              nombre: taskList.title,
              usuario: userId,
              descripcion: `Proyecto importado desde Google Tasks: ${taskList.title}`,
              googleTasksSync: {
                enabled: true,
                googleTaskListId: taskList.id,
                syncStatus: 'synced',
                needsSync: false,
                lastSyncDate: new Date(),
                etag: taskList.etag,
                selfLink: taskList.selfLink
              }
            });
            
            await proyecto.save();
            logger.sync(`📁 Creado proyecto desde TaskList: "${taskList.title}"`);
          } else {
            // Actualizar proyecto existente si el nombre cambió
            if (proyecto.nombre !== taskList.title) {
              proyecto.nombre = taskList.title;
              proyecto.googleTasksSync.lastSyncDate = new Date();
              await proyecto.save();
              logger.sync(`📝 Actualizado proyecto desde TaskList: "${taskList.title}"`);
            }
          }

          // Importar tareas de esta TaskList al proyecto
          const tasksResponse = await this.executeWithRetry(
            () => this.tasks.tasks.list({
              tasklist: taskList.id,
              showCompleted: true,
              showHidden: true,
              maxResults: 100,
              fields: 'items(id,title,notes,status,updated,due,parent,position)'
            }),
            `obtener tareas de TaskList ${taskList.title}`
          );

          const googleTasks = tasksResponse.data.items || [];
          
          // Filtrar solo tareas principales (sin parent) - las subtareas se manejan por separado
          const mainTasks = googleTasks.filter(task => !task.parent);
          
          logger.sync(`📋 Procesando ${mainTasks.length} tareas principales de "${taskList.title}"`);

          for (const googleTask of mainTasks) {
            try {
              // Buscar tarea existente por Google Task ID
              let tarea = await Tareas.findOne({
                'googleTasksSync.googleTaskId': googleTask.id,
                usuario: userId
              });

              if (tarea) {
                // Actualizar tarea existente
                tarea.updateFromGoogleTask(googleTask);
                await tarea.save();
                syncResults.updated++;
                logger.sync(`📝 Actualizada tarea: "${googleTask.title}"`);
              } else {
                // Crear nueva tarea
                const tituloLimpio = this.cleanTitle(googleTask.title);
                
                const nuevaTarea = new Tareas({
                  titulo: tituloLimpio,
                  descripcion: googleTask.notes || '',
                  usuario: userId,
                  fechaInicio: new Date(),
                  prioridad: 'BAJA',
                  proyecto: proyecto._id
                });
                
                nuevaTarea.updateFromGoogleTask(googleTask);
                nuevaTarea.googleTasksSync.googleTaskListId = taskList.id;
                
                await nuevaTarea.save();
                syncResults.created++;
                logger.sync(`📥 Creada tarea: "${tituloLimpio}"`);
              }

              // Procesar subtareas de esta tarea principal
              const subtasks = googleTasks.filter(task => task.parent === googleTask.id);
              if (subtasks.length > 0) {
                await this.syncSubtasksFromGoogle(subtasks, googleTask.id, userId);
              }

            } catch (error) {
              console.error(`Error al procesar tarea "${googleTask.title}":`, error);
              syncResults.errors.push(`${googleTask.title}: ${error.message}`);
            }
          }

        } catch (error) {
          console.error(`Error al procesar TaskList "${taskList.title}":`, error);
          syncResults.errors.push(`TaskList ${taskList.title}: ${error.message}`);
        }
      }

      // Actualizar última sincronización del usuario
      await Users.findByIdAndUpdate(userId, {
        'googleTasksConfig.lastSync': new Date()
      });

      logger.sync(`📊 Resumen de importación: ${syncResults.created} creadas, ${syncResults.updated} actualizadas`);
      return syncResults;
      
    } catch (error) {
      console.error('Error al sincronizar desde Google Tasks:', error);
      throw error;
    }
  }

  /**
   * Sincroniza subtareas desde Google hacia Attadia
   */
  async syncSubtasksFromGoogle(googleSubtasks, parentTaskId, userId) {
    try {
      // Buscar la tarea padre en Attadia
      const tareaPadre = await Tareas.findOne({
        'googleTasksSync.googleTaskId': parentTaskId,
        usuario: userId
      });

      if (!tareaPadre) {
        logger.warn(`No se encontró tarea padre para subtareas con parent: ${parentTaskId}`);
        return;
      }

      logger.sync(`🔄 Sincronizando ${googleSubtasks.length} subtareas hacia "${tareaPadre.titulo}"`);

      // Obtener subtareas existentes en Attadia
      const subtareasExistentes = tareaPadre.subtareas || [];

      // Procesar cada subtarea de Google
      for (const googleSubtask of googleSubtasks) {
        // Buscar subtarea existente por googleTaskId
        const subtareaExistente = subtareasExistentes.find(st => st.googleTaskId === googleSubtask.id);

        if (subtareaExistente) {
          // Actualizar subtarea existente
          subtareaExistente.titulo = googleSubtask.title;
          subtareaExistente.completada = googleSubtask.status === 'completed';
          subtareaExistente.lastSyncDate = new Date();
          
          logger.sync(`📝 Actualizada subtarea: "${googleSubtask.title}"`);
        } else {
          // Crear nueva subtarea
          const nuevaSubtarea = {
            titulo: googleSubtask.title,
            completada: googleSubtask.status === 'completed',
            googleTaskId: googleSubtask.id,
            lastSyncDate: new Date()
          };
          
          tareaPadre.subtareas.push(nuevaSubtarea);
          logger.sync(`📥 Creada subtarea: "${googleSubtask.title}"`);
        }
      }

      // Eliminar subtareas que ya no existen en Google
      const googleSubtaskIds = googleSubtasks.map(gt => gt.id);
      tareaPadre.subtareas = tareaPadre.subtareas.filter(st => 
        !st.googleTaskId || googleSubtaskIds.includes(st.googleTaskId)
      );

      await tareaPadre.save();
      
    } catch (error) {
      console.error('Error al sincronizar subtareas desde Google:', error);
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
   * Sincroniza proyectos con TaskLists - UN PROYECTO = UNA TASKLIST
   */
  async syncProyectosWithTaskLists(userId) {
    try {
      await this.setUserCredentials(userId);
      const { Proyectos } = await import('../models/index.js');
      
      // Obtener todos los proyectos del usuario
      const proyectos = await Proyectos.find({ usuario: userId });
      
      logger.sync(`🔄 Sincronizando ${proyectos.length} proyectos con Google TaskLists`);
      
      const results = {
        created: 0,
        updated: 0,
        errors: []
      };
      
      // Por cada proyecto, crear o actualizar su TaskList correspondiente
      for (const proyecto of proyectos) {
        try {
          if (!proyecto.googleTasksSync?.googleTaskListId) {
            // Crear nueva TaskList en Google
            const taskListData = {
              title: proyecto.nombre
            };
            
            const googleTaskList = await this.executeWithRetry(
              () => this.tasks.tasklists.insert({
                requestBody: taskListData
              }),
              `crear TaskList para proyecto ${proyecto.nombre}`
            );
            
            // Actualizar proyecto con el ID de la TaskList
            proyecto.googleTasksSync = {
              enabled: true,
              googleTaskListId: googleTaskList.data.id,
              syncStatus: 'synced',
              needsSync: false,
              lastSyncDate: new Date(),
              etag: googleTaskList.data.etag,
              selfLink: googleTaskList.data.selfLink
            };
            
            await proyecto.save();
            results.created++;
            logger.sync(`📁 Creada TaskList "${proyecto.nombre}" en Google`);
            
          } else {
            // Actualizar TaskList existente si el nombre cambió
            const googleTaskList = await this.executeWithRetry(
              () => this.tasks.tasklists.get({
                tasklist: proyecto.googleTasksSync.googleTaskListId
              }),
              `obtener TaskList ${proyecto.googleTasksSync.googleTaskListId}`
            );
            
            if (googleTaskList.data.title !== proyecto.nombre) {
              // Actualizar título de la TaskList
              await this.executeWithRetry(
                () => this.tasks.tasklists.update({
                  tasklist: proyecto.googleTasksSync.googleTaskListId,
                  requestBody: {
                    title: proyecto.nombre,
                    etag: googleTaskList.data.etag
                  }
                }),
                `actualizar TaskList ${proyecto.nombre}`
              );
              
              proyecto.googleTasksSync.lastSyncDate = new Date();
              await proyecto.save();
              results.updated++;
              logger.sync(`📝 Actualizada TaskList "${proyecto.nombre}" en Google`);
            }
          }
          
        } catch (error) {
          console.error(`Error al sincronizar proyecto "${proyecto.nombre}":`, error);
          results.errors.push(`${proyecto.nombre}: ${error.message}`);
        }
      }
      
      logger.sync(`📊 Sincronización de proyectos completada: ${results.created} creadas, ${results.updated} actualizadas`);
      return results;
      
    } catch (error) {
      logger.error('Error al sincronizar proyectos con Google Tasks:', error);
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
   * Sincronización bidireccional completa con flujo correcto
   */
  async fullSyncWithUser(user) {
    if (!user || !user.googleTasksConfig?.enabled) {
      throw new Error('Google Tasks no está habilitado para este usuario');
    }

    const userId = user._id || user.id;
    const results = {
      proyectos: { created: 0, updated: 0, errors: [] },
      tareas: { toGoogle: { success: 0, errors: [] }, fromGoogle: null }
    };

    try {
      logger.sync(`🔄 Iniciando sincronización completa para usuario ${userId}`);

      // PASO 1: Sincronizar Proyectos ↔ TaskLists (bidireccional)
      logger.sync(`📁 Paso 1: Sincronizando proyectos con TaskLists`);
      results.proyectos = await this.syncProyectosWithTaskLists(userId);

      // PASO 2: Importar desde Google Tasks hacia Attadia
      logger.sync(`📥 Paso 2: Importando desde Google Tasks`);
      results.tareas.fromGoogle = await this.syncTasksFromGoogle(userId);

      // PASO 3: Sincronizar tareas locales pendientes hacia Google
      logger.sync(`📤 Paso 3: Sincronizando tareas locales hacia Google`);
      
      // Habilitar Google Tasks para todas las tareas existentes del usuario
      await this.enableGoogleTasksForAllUserTasks(userId);
      
      // Obtener tareas que necesitan sincronización hacia Google
      const tareasLocales = await Tareas.find({
        usuario: userId,
        'googleTasksSync.enabled': true,
        $or: [
          // Tareas con sincronización pendiente
          { 'googleTasksSync.syncStatus': 'pending' },
          { 'googleTasksSync.needsSync': true },
          // Tareas que NO tienen googleTaskId (nunca se han sincronizado)
          { 'googleTasksSync.googleTaskId': { $exists: false } },
          // Tareas con timeout de sincronización
          { 
            'googleTasksSync.syncStatus': 'syncing',
            'googleTasksSync.syncingStartedAt': { 
              $lt: new Date(Date.now() - 5 * 60 * 1000) // Hace más de 5 minutos
            }
          }
        ]
      }).populate('proyecto');
      
      logger.sync(`🔄 Encontradas ${tareasLocales.length} tareas locales para sincronizar hacia Google`);

      for (const tarea of tareasLocales) {
        try {
          // Verificar timeout antes de sincronizar
          if (tarea.isSyncTimedOut && tarea.isSyncTimedOut()) {
            logger.warn(`⏰ Limpiando timeout de sincronización para: "${tarea.titulo}"`);
            tarea.clearSyncTimeout();
            await tarea.save();
          }

          await this.syncTaskToGoogle(tarea._id, userId);
          results.tareas.toGoogle.success++;
        } catch (error) {
          results.tareas.toGoogle.errors.push(`${tarea.titulo}: ${error.message}`);
          logger.error(`Error al sincronizar tarea "${tarea.titulo}":`, error);
        }
      }

      // Actualizar última sincronización del usuario
      await Users.findByIdAndUpdate(userId, {
        'googleTasksConfig.lastSync': new Date()
      });

      logger.sync(`✅ Sincronización completa finalizada:`);
      logger.sync(`   📁 Proyectos: ${results.proyectos.created} creados, ${results.proyectos.updated} actualizados`);
      logger.sync(`   📤 Tareas a Google: ${results.tareas.toGoogle.success} sincronizadas`);
      logger.sync(`   📥 Tareas desde Google: ${results.tareas.fromGoogle.created} creadas, ${results.tareas.fromGoogle.updated} actualizadas`);

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
   * Limpia un título básicamente - solo espacios y caracteres extraños
   */
  cleanTitle(rawTitle) {
    if (!rawTitle) return 'Tarea importada';
    let title = String(rawTitle).trim();
    
    // Limpiar espacios múltiples
    title = title.replace(/\s{2,}/g, ' ').trim();
    
    // Si queda vacío después de limpiar, usar título genérico
    if (!title || title.length < 2) {
      return 'Tarea importada';
    }
    
    return title;
  }
}

export default new GoogleTasksService();
