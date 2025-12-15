import mongoose from 'mongoose';
import { google } from 'googleapis';
import { Users, Tareas } from '../models/index.js';
import config from '../config/config.js';
import logger from '../utils/logger.js';
import { randomUUID } from 'crypto';

class GoogleTasksService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      config.google.clientId,
      config.google.clientSecret,
      `${config.backendUrl}/api/google-tasks/callback`
    );
    // Evitar warnings por múltiples listeners en procesos de sincronización
    if (typeof this.oauth2Client.setMaxListeners === 'function') {
      this.oauth2Client.setMaxListeners(50);
    }
    
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
   * Configura las credenciales OAuth2 para un usuario específico con manejo automático de refresh
   */
  async setUserCredentials(userId) {
    const user = await Users.findById(userId);
    if (!user || !user.googleTasksConfig.accessToken) {
      throw new Error('Usuario no tiene configuración de Google Tasks');
    }

    // Configurar credenciales con manejo automático de refresh
    this.oauth2Client.setCredentials({
      access_token: user.googleTasksConfig.accessToken,
      refresh_token: user.googleTasksConfig.refreshToken
    });

    // Configurar listener para actualizar tokens automáticamente (evitar múltiples listeners)
    this.oauth2Client.removeAllListeners('tokens');
    this.oauth2Client.on('tokens', async (tokens) => {
      if (tokens.access_token) {
        logger.sync(`🔄 Tokens actualizados automáticamente para usuario ${userId}`);
        await Users.findByIdAndUpdate(userId, {
          'googleTasksConfig.accessToken': tokens.access_token,
          'googleTasksConfig.refreshToken': tokens.refresh_token || user.googleTasksConfig.refreshToken,
          'googleTasksConfig.lastTokenRefresh': new Date(),
          // Limpiar errores previos de token si existían
          'googleTasksConfig.tokenError': null,
          'googleTasksConfig.tokenErrorDate': null
        });
      }
    });

    // Reconfigurar cliente de Google Tasks con quotaUser por usuario para mejor reparto de cuota
    const quotaSuffix = String(userId || user._id || '').toString().slice(-12);
    const quotaUser = `attadia-${quotaSuffix}`;
    this.tasks = google.tasks({
      version: 'v1',
      auth: this.oauth2Client,
      params: { quotaUser }
    });

    return user;
  }

  /**
   * Ejecuta una operación con retry automático siguiendo las mejores prácticas de Google
   */
  async executeWithRetry(operation, context = '', userId = null) {
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
        
        // Manejar errores específicos de OAuth2 primero
        if (userId && (error.message?.includes('invalid_grant') || 
                      error.response?.data?.error === 'invalid_grant')) {
          await this.handleOAuthError(error, userId);
          return; // No continuar con retry para errores de token
        }
        
        // Verificar si es un error que vale la pena reintentar
        if (this.shouldRetry(error, attempt)) {
          logger.warn(`⚠️ Intento ${attempt}/${this.maxRetries} falló para ${context}:`, error.message);
          // Backoff exponencial con jitter (25%)
          const base = this.retryDelay * Math.pow(2, attempt - 1);
          const jitter = Math.floor(Math.random() * Math.ceil(base * 0.25));
          await this.delay(base + jitter);
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

    // Nunca reintentar si la cuota se excedió (no es recuperable en el mismo ciclo)
    const errorMessage = String(error?.message || error?.response?.data?.error?.message || '');
    const reasons = [
      error?.response?.data?.error?.errors?.[0]?.reason,
      error?.errors?.[0]?.reason
    ].filter(Boolean);
    if (
      errorMessage.includes('quotaExceeded') ||
      errorMessage.includes('userRateLimitExceeded') ||
      reasons.includes('quotaExceeded') ||
      reasons.includes('userRateLimitExceeded')
    ) {
      return false;
    }
    
    const retryableErrors = [
      'rateLimitExceeded',
      'internalError',
      'backendError',
      'timeout'
    ];
    
    // Códigos de error HTTP que son reintentatables
    const retryableHttpCodes = [429, 500, 502, 503, 504];
    
    // Convertir errorCode a string para evitar errores de tipo
    const errorCode = String(error.code || error.status || '');
    const httpStatus = parseInt(error.code || error.status || 0);
    
    // Verificar si el error es reintentable por código de texto o código HTTP
    return retryableErrors.some(retryableError => 
      errorCode.includes(retryableError) || 
      errorMessage.includes(retryableError)
    ) || retryableHttpCodes.includes(httpStatus);
  }

  /**
   * Detecta errores de cuota para cortar ciclos/lotes
   */
  isQuotaError(error) {
    const msg = String(error?.message || error?.response?.data?.error?.message || '');
    const reason = error?.response?.data?.error?.errors?.[0]?.reason;
    return msg.includes('quotaExceeded') || msg.includes('userRateLimitExceeded') ||
           reason === 'quotaExceeded' || reason === 'userRateLimitExceeded';
  }

  /**
   * Categoriza errores en razones estándar para métricas/SLIs
   */
  categorizeError(error) {
    try {
      if (this.isQuotaError(error)) return 'quota';
      const status = Number(error?.status || error?.code || 0);
      const msg = String(error?.message || error?.response?.data?.error?.message || '').toLowerCase();
      const reason = (error?.response?.data?.error?.errors?.[0]?.reason || '').toLowerCase();

      if (status === 401 || msg.includes('unauthorized') || reason === 'authError') return 'auth';
      if (msg.includes('invalid_grant')) return 'auth';
      if (status === 404 || msg.includes('not found')) return 'not_found';
      if (status === 403 || msg.includes('forbidden')) return 'forbidden';
      if (status === 400 && (msg.includes('missing task id') || reason.includes('invalid'))) return 'validation';
      if ([500, 502, 503, 504].includes(status) || reason.includes('backenderror') || reason.includes('internalerror')) return 'server';
      if (status === 0 && msg.includes('network')) return 'network';
      return 'other';
    } catch {
      return 'other';
    }
  }

  /**
   * Formatea un error para logs/resultado de forma segura
   */
  formatErrorForLog(error) {
    try {
      const status = error?.status || error?.code || null;
      const reason = error?.response?.data?.error?.errors?.[0]?.reason || error?.errors?.[0]?.reason || null;
      const message = error?.message || error?.response?.data?.error?.message || String(error || '');
      const details = [];
      if (status) details.push(`status=${status}`);
      if (reason) details.push(`reason=${reason}`);
      details.push(`msg=${message}`);
      return details.join(' | ');
    } catch (e) {
      return String(error?.message || error || 'unknown error');
    }
  }

  /**
   * Verifica acceso a TaskList del proyecto; crea una nueva si es inaccesible
   */
  async ensureTaskListAccessible(proyecto, userId) {
    if (proyecto?.googleTasksSync?.googleTaskListId) {
      try {
        await this.executeWithRetry(
          () => this.tasks.tasklists.get({ tasklist: proyecto.googleTasksSync.googleTaskListId }),
          `verificar TaskList ${proyecto.googleTasksSync.googleTaskListId}`,
          userId
        );
        return proyecto.googleTasksSync.googleTaskListId;
      } catch (err) {
        if (err.status !== 404 && err.status !== 403) {
          throw err;
        }
        logger.warn(`TaskList inaccesible para "${proyecto.nombre}", creando nueva...`);
      }
    }

    // Crear nueva TaskList para el proyecto
    const createResp = await this.executeWithRetry(
      () => this.tasks.tasklists.insert({ requestBody: { title: proyecto.nombre } }),
      `crear TaskList para ${proyecto.nombre}`,
      userId
    );

    proyecto.googleTasksSync = {
      ...(proyecto.googleTasksSync || {}),
      enabled: true,
      googleTaskListId: createResp.data.id,
      syncStatus: 'synced',
      needsSync: false,
      lastSyncDate: new Date(),
      etag: createResp.data.etag,
      selfLink: createResp.data.selfLink
    };
    await proyecto.save();
    return createResp.data.id;
  }

  /**
   * Maneja errores específicos de OAuth2 y tokens
   */
  async handleOAuthError(error, userId) {
    const errorMessage = String(error.message || '');
    const errorData = error.response?.data || {};
    
    // Detectar error de token inválido
    if (errorMessage.includes('invalid_grant') || 
        errorData.error === 'invalid_grant' ||
        error.status === 400 && errorData.error === 'invalid_grant') {
      
      logger.warn(`🔑 Token inválido detectado para usuario ${userId}, limpiando credenciales`);
      
      // Limpiar tokens inválidos del usuario
      await Users.findByIdAndUpdate(userId, {
        'googleTasksConfig.enabled': false,
        'googleTasksConfig.accessToken': null,
        'googleTasksConfig.refreshToken': null,
        'googleTasksConfig.lastSync': null,
        'googleTasksConfig.tokenError': 'invalid_grant',
        'googleTasksConfig.tokenErrorDate': new Date()
      });
      
      throw new Error('TOKEN_INVALID: Los tokens de Google Tasks han expirado. Por favor, reconecta tu cuenta de Google.');
    }
    
    // Detectar otros errores de autenticación
    if (error.status === 401 || errorMessage.includes('unauthorized')) {
      logger.warn(`🔐 Error de autorización para usuario ${userId}`);
      throw new Error('AUTH_ERROR: Error de autorización con Google Tasks. Por favor, reconecta tu cuenta.');
    }
    
    // Re-lanzar otros errores sin modificar
    throw error;
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
      // Primero intentar obtener las listas existentes con retry (paginadas)
      const taskLists = [];
      let pageToken = undefined;
      do {
      const response = await this.executeWithRetry(
          () => this.tasks.tasklists.list({ pageToken }),
        'obtener listas de tareas',
        userId
      );
        taskLists.push(...(response.data.items || []));
        pageToken = response.data.nextPageToken;
      } while (pageToken);

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
          'crear lista de tareas',
          userId
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
    
    // Asegurar acceso a la TaskList del proyecto (crea o reubica si es necesario)
    if (!tarea.proyecto) {
      throw new Error('La tarea debe estar asociada a un proyecto');
    }
    const taskListId = await this.ensureTaskListAccessible(tarea.proyecto, userId);

    try {
      // Usar el método del modelo para obtener el formato de Google Tasks
      const googleTaskData = tarea.toGoogleTaskFormat();
      
      // Construir notas con subtareas
      googleTaskData.notes = this.buildTaskNotes(tarea);
      
        // Sanitizar requestBody para Google
        // - No enviar id/updated/parent/position
        delete googleTaskData.id;
        delete googleTaskData.updated;
        delete googleTaskData.parent;
        delete googleTaskData.position;
        // - Quitar completed si es null/undefined (Google lo calcula con status)
        if (googleTaskData.completed == null) {
          delete googleTaskData.completed;
        }
        // - Truncar notas por seguridad
        if (googleTaskData.notes && googleTaskData.notes.length > 7000) {
          googleTaskData.notes = googleTaskData.notes.slice(0, 7000);
        }
      
      // Eliminar campos que Google Tasks maneja automáticamente en creación
        // (ya eliminados arriba, mantenemos lógica por claridad)

      let googleTask;
      let parentGoogleTaskId = tarea.googleTasksSync?.googleTaskId || null;
      
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
          // Obtener estado actual para evitar PATCH si no hay cambios
          let shouldPatch = true;
          try {
            const current = await this.executeWithRetry(
              () => this.tasks.tasks.get({
                tasklist: taskListId,
                task: tarea.googleTasksSync.googleTaskId,
                fields: 'id,title,status,notes'
              }),
              `obtener tarea actual ${tarea.titulo}`,
              userId
            );
            if (this.equalsForPatch(current.data, googleTaskData)) {
              shouldPatch = false;
              logger.dev?.(`⏭️ Sin cambios para "${tarea.titulo}", se omite patch`);
            }
          } catch (getErr) {
            // Si falla el GET, seguir el flujo normal (PATCH intentará y manejará errores)
          }

          // Actualizar tarea existente con retry
          if (shouldPatch) {
            googleTask = await this.executeWithRetry(
              () => this.tasks.tasks.patch({
                tasklist: taskListId,
                task: tarea.googleTasksSync.googleTaskId,
                requestBody: googleTaskData,
                fields: 'id,title,status,updated' // Solo campos necesarios
              }),
              `actualizar tarea ${tarea.titulo}`,
              userId
            );
            parentGoogleTaskId = googleTask?.data?.id || tarea.googleTasksSync.googleTaskId;
            try {
              logger.sync?.(`📝 Actualizada tarea: "${tarea.titulo}" ctx=${JSON.stringify({ taskListId, taskId: parentGoogleTaskId })}`);
            } catch {}
          } else {
            // No hay cambios: asegurar que tenemos el id para subtareas
            parentGoogleTaskId = tarea.googleTasksSync.googleTaskId;
          }
        } catch (error) {
          // Si la tarea no existe o el ID es inválido/inaccesible, crear una nueva
          const isMissingOrInvalid =
            error?.status === 404 ||
            error?.status === 403 ||
            (error?.status === 400 && (
              String(error?.message || '').includes('Missing task ID') ||
              String(error?.errors?.[0]?.message || '').includes('Missing task ID') ||
              String(error?.response?.data?.error?.errors?.[0]?.message || '').includes('Missing task ID') ||
              String(error?.response?.data?.error?.reason || '').includes('invalid')
            ));

          if (isMissingOrInvalid) {
            console.log(`[INFO] Tarea "${tarea.titulo}" no existe/ID inválido o inaccesible, creando nueva...`);
            delete googleTaskData.id; // redundante por sanitización, pero seguro
            googleTask = await this.executeWithRetry(
              () => this.tasks.tasks.insert({
                tasklist: taskListId,
                requestBody: googleTaskData,
                fields: 'id,title,status,updated'
              }),
              `crear tarea ${tarea.titulo} (reemplazo de inválida/inexistente)`,
              userId
            );
            // Actualizar el documento local con el nuevo ID de Google
            await Tareas.findByIdAndUpdate(tareaId, {
              'googleTasksSync.googleTaskId': googleTask.data.id,
              'googleTasksSync.googleTaskListId': taskListId
            });
            parentGoogleTaskId = googleTask.data.id;
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
          `crear tarea ${tarea.titulo}`,
          userId
        );

        // Actualizar el documento local con el ID de Google
        await Tareas.findByIdAndUpdate(tareaId, {
          'googleTasksSync.googleTaskId': googleTask.data.id,
          'googleTasksSync.googleTaskListId': taskListId
        });
        parentGoogleTaskId = googleTask.data.id;
      }

      // Sincronizar subtareas como tareas hijas en Google Tasks
      if (tarea.subtareas && tarea.subtareas.length > 0) {
        const parentIdForSubtasks = parentGoogleTaskId || googleTask?.data?.id;
        if (parentIdForSubtasks) {
          await this.syncSubtasksToGoogle(tarea.subtareas, taskListId, parentIdForSubtasks, userId);
        } else {
          logger.warn(`No se pudo determinar parentGoogleTaskId para subtareas de "${tarea.titulo}"`);
        }
        
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

      // Devolver datos consistentes aun cuando no hubo PATCH/INSERT
      const resultData = googleTask?.data || {
        id: parentGoogleTaskId || tarea.googleTasksSync?.googleTaskId || null,
        title: tarea.titulo,
        status: tarea.completada ? 'completed' : 'needsAction'
      };
      return resultData;
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
      // Obtener todas las subtareas existentes en Google para esta tarea padre (paginadas)
      const googleSubtasks = [];
      let pageToken = undefined;
      do {
        const page = await this.executeWithRetry(
        () => this.tasks.tasks.list({
          tasklist: taskListId,
          showCompleted: true,
          showHidden: true,
            maxResults: 100,
            pageToken,
            fields: 'items(id,title,status,parent),nextPageToken'
        }),
        `obtener subtareas existentes para tarea padre ${parentTaskId}`,
        userId
      );
        const items = page.data.items?.filter(task => task.parent === parentTaskId) || [];
        googleSubtasks.push(...items);
        pageToken = page.data.nextPageToken;
      } while (pageToken);

      // Índices para reconciliación por id y por título
      const normalizeTitle = (t) => this.normalizeTitleStrong(t || '');
      const googleById = new Map(googleSubtasks.map(st => [st.id, st]));
      const googleByNormTitle = new Map(googleSubtasks.map(st => [normalizeTitle(st.title), st]));
      
      logger.sync(`🔄 Sincronizando ${subtareas.length} subtareas locales con ${googleSubtasks.length} existentes en Google`);

      // 1. Actualizar/crear subtareas y asegurar jerarquía/orden con tasks.move
      let previousSubtaskId = null;
      for (const [index, subtarea] of subtareas.entries()) {
        let googleSubtask;
        const localNormTitle = normalizeTitle(subtarea.titulo);

        // Prevalidar: si el id no está bajo este parent en Google, resetear para recrear/revincular
        if (subtarea.googleTaskId && !googleById.has(subtarea.googleTaskId)) {
          logger.warn(`⚠️ ID de subtarea no pertenece al parent actual, se recreará`, {
            taskListId,
            parentTaskId,
            googleTaskId: subtarea.googleTaskId,
            titulo: subtarea.titulo
          });
          subtarea.googleTaskId = null;
        }

        // Si no tenemos id, intentar vincular por título normalizado
        if (!subtarea.googleTaskId && googleByNormTitle.has(localNormTitle)) {
          const claimed = googleByNormTitle.get(localNormTitle);
          logger.sync(`🔎 Vinculada por título: "${subtarea.titulo}" → ${claimed.id}`);
          subtarea.googleTaskId = claimed.id;
          // Evitar reclamos repetidos por el mismo título normalizado
          googleByNormTitle.delete(localNormTitle);
        }
        
        if (subtarea.googleTaskId) {
          try {
            // Actualizar subtarea existente (sin parent/position en body)
            const subtaskData = {
              title: this.cleanTitle(subtarea.titulo),
              status: subtarea.completada ? 'completed' : 'needsAction'
            };

            googleSubtask = await this.executeWithRetry(
              () => this.tasks.tasks.patch({
                tasklist: taskListId,
                task: subtarea.googleTaskId,
                requestBody: subtaskData,
                fields: 'id,title,status'
              }),
              `actualizar subtarea ${subtarea.titulo}`,
              userId
            );

            // Asegurar jerarquía/orden con tasks.move
            await this.executeWithRetry(
              () => this.tasks.tasks.move({
                tasklist: taskListId,
                task: subtarea.googleTaskId,
                parent: parentTaskId,
                previous: previousSubtaskId || undefined
              }),
              `mover subtarea ${subtarea.titulo}`,
              userId
            );
            
            try {
              logger.sync?.(`📝 Actualizada subtarea: "${subtarea.titulo}" ctx=${JSON.stringify({ taskListId, parentTaskId, subId: subtarea.googleTaskId })}`);
            } catch {}
            
          } catch (error) {
            const isMissingOrInvalid =
              error?.status === 404 ||
              (error?.status === 400 && (
                String(error?.message || '').includes('Missing task ID') ||
                String(error?.errors?.[0]?.message || '').includes('Missing task ID') ||
                String(error?.response?.data?.error?.errors?.[0]?.message || '').includes('Missing task ID') ||
                String(error?.response?.data?.error?.reason || '').includes('invalid')
              ));
            if (isMissingOrInvalid) {
              console.log(`[INFO] Subtarea "${subtarea.titulo}" no existe/ID inválido, creando nueva...`);
              subtarea.googleTaskId = null; // Limpiar ID inválido
              // Continuar al bloque de creación
            } else {
              throw error; // Re-lanzar otros errores
            }
          }
        }
        
        if (!subtarea.googleTaskId) {
          // Crear nueva subtarea (solo datos propios; jerarquía se fija con move)
          const subtaskData = {
            title: this.cleanTitle(subtarea.titulo),
            status: subtarea.completada ? 'completed' : 'needsAction'
          };

          googleSubtask = await this.executeWithRetry(
            () => this.tasks.tasks.insert({
              tasklist: taskListId,
              requestBody: subtaskData,
              fields: 'id,title,status'
            }),
            `crear subtarea ${subtarea.titulo}`,
            userId
          );
          
          // Guardar el googleTaskId en la subtarea
          subtarea.googleTaskId = googleSubtask.data.id;
          subtarea.lastSyncDate = new Date();
          
          // Mover para establecer parent y orden
          try {
            await this.executeWithRetry(
              () => this.tasks.tasks.move({
                tasklist: taskListId,
                task: subtarea.googleTaskId,
                parent: parentTaskId,
                previous: previousSubtaskId || undefined
              }),
              `mover subtarea ${subtarea.titulo}`,
              userId
            );
          } catch (moveErr) {
            logger.warn(`No se pudo mover nueva subtarea "${subtarea.titulo}": ${moveErr.message}`);
          }

          try {
            logger.sync?.(`📥 Creada subtarea: "${subtarea.titulo}" ctx=${JSON.stringify({ taskListId, parentTaskId, subId: subtarea.googleTaskId })}`);
          } catch {}
        }

        previousSubtaskId = subtarea.googleTaskId;
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
            `eliminar subtarea ${subtaskToDelete.title}`,
            userId
          );
          
          try {
            logger.sync?.(`🗑️ Eliminada subtarea de Google: "${subtaskToDelete.title}" ctx=${JSON.stringify({ taskListId, parentTaskId, subId: subtaskToDelete.id })}`);
          } catch {}
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
      // Obtener TODAS las TaskLists del usuario (paginadas)
      const googleTaskLists = [];
      let tlPageToken = undefined;
      do {
      const taskListsResponse = await this.executeWithRetry(
          () => this.tasks.tasklists.list({ pageToken: tlPageToken }),
        'obtener todas las TaskLists',
        userId
      );
        const items = taskListsResponse.data.items || [];
        googleTaskLists.push(...items);
        tlPageToken = taskListsResponse.data.nextPageToken;
      } while (tlPageToken);
      const syncResults = {
        created: 0,
        updated: 0,
        errors: [],
        skipped: 0,
        // métricas de limpieza post-import
        deletedLocalNotInGoogle: 0,
        dedupLocalGroups: 0,
        dedupLocalRemoved: 0
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

          // Importar tareas de esta TaskList al proyecto (paginadas)
          const googleTasks = [];
          let tasksPageToken = undefined;
          do {
          const tasksResponse = await this.executeWithRetry(
            () => this.tasks.tasks.list({
              tasklist: taskList.id,
              showCompleted: true,
              showHidden: true,
              maxResults: 100,
                pageToken: tasksPageToken,
                fields: 'items(id,title,notes,status,updated,due,parent,position),nextPageToken'
            }),
            `obtener tareas de TaskList ${taskList.title}`,
            userId
          );
            const items = tasksResponse.data.items || [];
            googleTasks.push(...items);
            tasksPageToken = tasksResponse.data.nextPageToken;
          } while (tasksPageToken);
          
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
                // Forzar limpieza de título para evitar prefijos entre corchetes
                tarea.titulo = this.cleanTitle(tarea.titulo || googleTask.title);
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

          // Limpieza: eliminar en BD tareas que ya no existen en Google (huérfanas por borrado en Google)
          try {
            const googleMainIds = new Set(mainTasks.map(t => t.id));
            const tareasLocales = await Tareas.find({
              usuario: userId,
              proyecto: proyecto._id,
              'googleTasksSync.googleTaskListId': taskList.id,
              'googleTasksSync.googleTaskId': { $exists: true, $ne: null }
            });
            const toDelete = tareasLocales.filter(t => t.googleTasksSync?.googleTaskId && !googleMainIds.has(t.googleTasksSync.googleTaskId));
            if (toDelete.length > 0) {
              logger.sync(`🧹 Eliminando ${toDelete.length} tareas locales que no existen más en Google`);
              await Promise.allSettled(toDelete.map(t => Tareas.findByIdAndDelete(t._id)));
              syncResults.deletedLocalNotInGoogle += toDelete.length;
            }
          } catch (cleanupErr) {
            logger.warn?.(`No se pudo limpiar tareas locales inexistentes en Google para "${taskList.title}": ${cleanupErr.message}`);
          }

          // Limpieza: deduplicar en BD por título normalizado dentro del proyecto cuando NO tienen googleTaskId
          try {
            const tareasSinId = await Tareas.find({
              usuario: userId,
              proyecto: proyecto._id,
              $or: [
                { 'googleTasksSync.googleTaskId': { $exists: false } },
                { 'googleTasksSync.googleTaskId': null }
              ]
            });
            const norm = (s) => this.normalizeTitleStrong(s || '');
            const buckets = new Map();
            for (const t of tareasSinId) {
              const key = norm(t.titulo);
              if (!buckets.has(key)) buckets.set(key, []);
              buckets.get(key).push(t);
            }
            const groups = Array.from(buckets.values()).filter(g => g.length > 1);
            for (const group of groups) {
              // Mantener el que tenga más subtareas; en empate, el más reciente
              group.sort((a, b) => {
                const sa = a.subtareas?.length || 0;
                const sb = b.subtareas?.length || 0;
                if (sa !== sb) return sb - sa;
                const ua = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
                const ub = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
                return ub - ua;
              });
              const keep = group[0];
              const remove = group.slice(1);
              if (remove.length > 0) {
                logger.sync(`🧹 Dedupe local por título: mantener "${keep.titulo}", eliminar ${remove.length}`);
                await Promise.allSettled(remove.map(r => Tareas.findByIdAndDelete(r._id)));
                syncResults.dedupLocalGroups += 1;
                syncResults.dedupLocalRemoved += remove.length;
              }
            }
          } catch (dedupeErr) {
            logger.warn?.(`No se pudo deduplicar tareas locales sin id en "${taskList.title}": ${dedupeErr.message}`);
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
      let subtareasExistentes = tareaPadre.subtareas || [];
      const normalizeTitle = (t) => this.normalizeTitleStrong(t || '');

      // Procesar cada subtarea de Google
      for (const googleSubtask of googleSubtasks) {
        const tituloLimpio = this.cleanTitle(googleSubtask.title);
        // Buscar subtarea existente por googleTaskId
        let subtareaExistente = subtareasExistentes.find(st => st.googleTaskId === googleSubtask.id);

        // Fallback: enlazar por título normalizado si no hay id
        if (!subtareaExistente) {
          const normTitle = normalizeTitle(tituloLimpio);
          subtareaExistente = subtareasExistentes.find(st => !st.googleTaskId && normalizeTitle(st.titulo) === normTitle);
          if (subtareaExistente) {
            logger.sync(`🔎 Vinculada subtarea local por título: "${subtareaExistente.titulo}" → ${googleSubtask.id}`);
            subtareaExistente.googleTaskId = googleSubtask.id;
          }
        }

        if (subtareaExistente) {
          // Actualizar subtarea existente
          subtareaExistente.titulo = tituloLimpio;
          subtareaExistente.completada = googleSubtask.status === 'completed';
          subtareaExistente.lastSyncDate = new Date();
          
          logger.sync(`📝 Actualizada subtarea: "${googleSubtask.title}"`);
        } else {
          // Crear nueva subtarea
          const nuevaSubtarea = {
            titulo: tituloLimpio,
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
      // Deduplicar localmente por título normalizado (preferir con googleTaskId y más reciente)
      const buckets = new Map();
      for (const st of tareaPadre.subtareas) {
        const key = normalizeTitle(this.cleanTitle(st.titulo));
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key).push(st);
      }
      const deduped = [];
      for (const [key, group] of buckets.entries()) {
        if (group.length === 1) {
          deduped.push(group[0]);
          continue;
        }
        group.sort((a, b) => {
          if (!!a.googleTaskId !== !!b.googleTaskId) return b.googleTaskId ? 1 : -1;
          const aSync = a.lastSyncDate ? new Date(a.lastSyncDate).getTime() : 0;
          const bSync = b.lastSyncDate ? new Date(b.lastSyncDate).getTime() : 0;
          return bSync - aSync;
        });
        const keep = group[0];
        // fusionar estado completada
        keep.completada = group.some(s => !!s.completada);
        // normalizar título
        keep.titulo = this.cleanTitle(keep.titulo);
        deduped.push(keep);
      }
      tareaPadre.subtareas = deduped.filter(st => 
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
              `crear TaskList para proyecto ${proyecto.nombre}`,
              userId
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
              `obtener TaskList ${proyecto.googleTasksSync.googleTaskListId}`,
              userId
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
                `actualizar TaskList ${proyecto.nombre}`,
                userId
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
    const runId = randomUUID();
    const startedAt = new Date();

    const results = {
      proyectos: { created: 0, updated: 0, errors: [] },
      tareas: { toGoogle: { success: 0, errors: [] }, fromGoogle: null },
      quotaHit: false,
      metrics: {
        timings: {
          proyectosMs: 0,
          importFromGoogleMs: 0,
          exportToGoogleMs: 0,
          totalMs: 0
        },
        errorsByReason: {},
        batches: {
          concurrency: 0,
          totalBatches: 0,
          processedBatches: 0
        }
      },
      meta: {
        runId,
        startedAt,
        finishedAt: null
      }
    };

    try {
      logger.sync(`🔄 Iniciando sincronización completa runId=${runId} para usuario ${userId}`);

      // PASO 1: Sincronizar Proyectos ↔ TaskLists (bidireccional)
      logger.sync(`📁 Paso 1: Sincronizando proyectos con TaskLists`);
      let stepT0 = Date.now();
      results.proyectos = await this.syncProyectosWithTaskLists(userId);
      results.metrics.timings.proyectosMs = Date.now() - stepT0;

      // PASO 2: Importar desde Google Tasks hacia Attadia
      logger.sync(`📥 Paso 2: Importando desde Google Tasks`);
      stepT0 = Date.now();
      results.tareas.fromGoogle = await this.syncTasksFromGoogle(userId);
      results.metrics.timings.importFromGoogleMs = Date.now() - stepT0;

      // PASO 3: Sincronizar tareas locales pendientes hacia Google
      logger.sync(`📤 Paso 3: Sincronizando tareas locales hacia Google`);
      
      // Obtener tareas que necesitan sincronización hacia Google (paginado y limitado)
      const maxTasksPerSync = parseInt(process.env.GTASKS_MAX_TASKS_PER_SYNC || '25', 10);
      const concurrency = parseInt(process.env.GTASKS_CONCURRENCY || '3', 10);
      results.metrics.batches.concurrency = concurrency;

      const tareasQuery = {
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
      };

      const tareasLocales = await Tareas.find(tareasQuery)
        .populate('proyecto')
        .limit(maxTasksPerSync);
      
      logger.sync(`🔄 Procesando hasta ${maxTasksPerSync} tareas (encontradas=${tareasLocales.length}), concurrencia=${concurrency}`);

      // Procesar en lotes con concurrencia limitada
      results.quotaHit = false;
      stepT0 = Date.now();
      const totalBatches = Math.ceil(tareasLocales.length / Math.max(1, concurrency));
      results.metrics.batches.totalBatches = totalBatches;
      for (let i = 0; i < tareasLocales.length; i += concurrency) {
        const batch = tareasLocales.slice(i, i + concurrency);
        logger.sync(`▶️ Lote ${Math.floor(i / concurrency) + 1}: ${batch.length} tareas`);

        const promises = batch.map(async (tarea) => {
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
          const errText = this.formatErrorForLog(error);
          results.tareas.toGoogle.errors.push(`${tarea.titulo}: ${errText}`);
          logger.error(`Error al sincronizar tarea "${tarea.titulo}":`, error);
            if (this.isQuotaError(error)) {
              results.quotaHit = true;
            }
            const reason = this.categorizeError(error);
            results.metrics.errorsByReason[reason] = (results.metrics.errorsByReason[reason] || 0) + 1;
          }
        });

        await Promise.allSettled(promises);
        results.metrics.batches.processedBatches++;
        logger.sync(`✅ Lote ${Math.floor(i / concurrency) + 1} completado. Progreso: ${Math.min(i + concurrency, tareasLocales.length)}/${tareasLocales.length}`);
        if (results.quotaHit) {
          logger.warn('⛔️ Cuota alcanzada. Deteniendo la sincronización del lote actual.');
          break;
        }
      }
      results.metrics.timings.exportToGoogleMs = Date.now() - stepT0;

      // Actualizar última sincronización del usuario
      await Users.findByIdAndUpdate(userId, {
        'googleTasksConfig.lastSync': new Date()
      });

      results.meta.finishedAt = new Date();
      results.metrics.timings.totalMs = results.meta.finishedAt.getTime() - results.meta.startedAt.getTime();

      logger.sync(`✅ Sincronización completa finalizada:`);
      logger.sync(`   📁 Proyectos: ${results.proyectos.created} creados, ${results.proyectos.updated} actualizados`);
      logger.sync(`   📤 Tareas a Google: ${results.tareas.toGoogle.success} sincronizadas`);
      logger.sync(`   📥 Tareas desde Google: ${results.tareas.fromGoogle.created} creadas, ${results.tareas.fromGoogle.updated} actualizadas`);
      logger.sync(`   ⏱️ Tiempos(ms): proyectos=${results.metrics.timings.proyectosMs}, import=${results.metrics.timings.importFromGoogleMs}, export=${results.metrics.timings.exportToGoogleMs}, total=${results.metrics.timings.totalMs}`);
      if (results.quotaHit) logger.sync(`   ⛔️ Quota hit durante export; batches procesados=${results.metrics.batches.processedBatches}/${results.metrics.batches.totalBatches}`);

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
    // Limpiar descripción previa para evitar duplicar bloques "Subtareas:"
    let baseDescription = this.extractDescriptionFromNotes(tarea.descripcion || '');
    let notes = baseDescription || '';
    
    if (tarea.subtareas && tarea.subtareas.length > 0) {
      notes += '\n\nSubtareas:\n';
      tarea.subtareas.forEach(subtarea => {
        const status = subtarea.completada ? '✓' : '○';
        notes += `${status} ${subtarea.titulo}\n`;
      });
    }

    // Truncar notas para evitar exceder límites de Google (aprox 8-10KB). Usamos 7000 chars como umbral seguro
    if (notes.length > 7000) {
      notes = notes.slice(0, 7000);
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
   * Compara campos relevantes para evitar PATCH innecesario
   */
  equalsForPatch(remote, local) {
    const pick = (o) => ({
      title: o?.title || '',
      status: o?.status || '',
      notes: o?.notes || ''
    });
    const a = pick(remote);
    const b = pick(local);
    return a.title === b.title && a.status === b.status && a.notes === b.notes;
  }

  /**
   * Elimina una tarea en Google Tasks
   */
  async deleteGoogleTask(userId, taskListId, taskId) {
    await this.setUserCredentials(userId);
    const taskList = taskListId || (await this.getOrCreateDefaultTaskList(userId)).id;
    await this.executeWithRetry(
      () => this.tasks.tasks.delete({ tasklist: taskList, task: taskId }),
      `eliminar tarea ${taskId}`,
      userId
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
      `actualizar título de tarea ${taskId}`,
      userId
    );
  }

  /**
   * Limpia tokens inválidos de todos los usuarios
   */
  async cleanupInvalidTokens() {
    try {
      logger.sync('🧹 Iniciando limpieza de tokens inválidos...');
      
      const users = await Users.find({
        'googleTasksConfig.enabled': true,
        'googleTasksConfig.accessToken': { $exists: true, $ne: null }
      });

      let cleanedCount = 0;
      let validCount = 0;

      for (const user of users) {
        try {
          // Intentar configurar credenciales y hacer una prueba
          this.oauth2Client.setCredentials({
            access_token: user.googleTasksConfig.accessToken,
            refresh_token: user.googleTasksConfig.refreshToken
          });

          // Hacer una llamada de prueba
          await this.tasks.tasklists.list();
          validCount++;
          
        } catch (error) {
          if (error.message?.includes('invalid_grant') || 
              error.response?.data?.error === 'invalid_grant') {
            
            logger.warn(`🔑 Limpiando tokens inválidos para usuario ${user.email}`);
            
            await Users.findByIdAndUpdate(user._id, {
              'googleTasksConfig.enabled': false,
              'googleTasksConfig.accessToken': null,
              'googleTasksConfig.refreshToken': null,
              'googleTasksConfig.lastSync': null,
              'googleTasksConfig.tokenError': 'invalid_grant',
              'googleTasksConfig.tokenErrorDate': new Date()
            });
            
            cleanedCount++;
          }
        }
      }

      logger.sync(`✅ Limpieza completada: ${validCount} tokens válidos, ${cleanedCount} tokens limpiados`);
      return { validCount, cleanedCount };
      
    } catch (error) {
      logger.error('Error en limpieza de tokens:', error);
      throw error;
    }
  }

  /**
   * Limpia un título básicamente - solo espacios y caracteres extraños
   */
  cleanTitle(rawTitle) {
    if (!rawTitle) return 'Tarea importada';
    let title = String(rawTitle).trim();
    
    // Remover prefijos entre corchetes (p.ej. [Proyecto], [Mis tareas])
    title = title.replace(/^\s*(\[[^\]]+\]\s*)+/g, '').trim();
    // Remover ocurrencias intermedias redundantes de corchetes aislados
    title = title.replace(/\s+(\[[^\]]+\])\s+/g, ' ').trim();
    
    // Limpiar espacios múltiples
    title = title.replace(/\s{2,}/g, ' ').trim();
    
    // Si queda vacío después de limpiar, usar título genérico
    if (!title || title.length < 2) {
      return 'Tarea importada';
    }
    
    return title;
  }

  /**
   * Normaliza un título de forma fuerte para comparaciones (no para mostrar)
   */
  normalizeTitleStrong(raw) {
    if (!raw) return '';
    let s = String(raw).toLowerCase().trim();
    // quitar prefijos entre corchetes, p.ej [Salud]
    s = s.replace(/\[[^\]]+\]\s*/g, '');
    // remover diacríticos
    s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    // colapsar espacios
    s = s.replace(/\s{2,}/g, ' ').trim();
    return s;
  }
}

export default new GoogleTasksService();
