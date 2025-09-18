import { google } from 'googleapis';
import { Users, Tareas } from '../models/index.js';
import config from '../config/config.js';

class GoogleTasksService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      config.google.clientId,
      config.google.clientSecret,
      config.google.callbackUrl
    );
    
    this.tasks = google.tasks({ version: 'v1', auth: this.oauth2Client });
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
   * Obtiene o crea la lista de tareas por defecto en Google Tasks
   */
  async getOrCreateDefaultTaskList(userId) {
    await this.setUserCredentials(userId);

    try {
      // Primero intentar obtener las listas existentes
      const response = await this.tasks.tasklists.list();
      const taskLists = response.data.items || [];

      // Buscar una lista llamada "Attadia Tasks" o usar la primera disponible
      let targetList = taskLists.find(list => list.title === 'Attadia Tasks');
      
      if (!targetList && taskLists.length > 0) {
        // Si no existe "Attadia Tasks", usar la lista por defecto (primera)
        targetList = taskLists[0];
      }

      if (!targetList) {
        // Si no hay listas, crear una nueva
        const createResponse = await this.tasks.tasklists.insert({
          requestBody: {
            title: 'Attadia Tasks'
          }
        });
        targetList = createResponse.data;
      }

      // Actualizar la configuración del usuario
      await Users.findByIdAndUpdate(userId, {
        'googleTasksConfig.defaultTaskList': targetList.id
      });

      return targetList;
    } catch (error) {
      console.error('Error al obtener/crear lista de tareas:', error);
      throw new Error('No se pudo acceder a Google Tasks');
    }
  }

  /**
   * Sincroniza una tarea de Attadia hacia Google Tasks
   */
  async syncTaskToGoogle(tareaId, userId) {
    const tarea = await Tareas.findById(tareaId);
    if (!tarea) {
      throw new Error('Tarea no encontrada');
    }

    await this.setUserCredentials(userId);
    const taskList = await this.getOrCreateDefaultTaskList(userId);

    try {
      const googleTaskData = {
        title: tarea.titulo,
        notes: this.buildTaskNotes(tarea),
        due: tarea.fechaVencimiento ? tarea.fechaVencimiento.toISOString() : null,
        status: this.mapEstadoToGoogleStatus(tarea.estado)
      };

      let googleTask;
      
      if (tarea.googleTasksSync.googleTaskId) {
        // Actualizar tarea existente
        googleTask = await this.tasks.tasks.update({
          tasklist: taskList.id,
          task: tarea.googleTasksSync.googleTaskId,
          requestBody: googleTaskData
        });
      } else {
        // Crear nueva tarea
        googleTask = await this.tasks.tasks.insert({
          tasklist: taskList.id,
          requestBody: googleTaskData
        });

        // Actualizar el documento local con el ID de Google
        await Tareas.findByIdAndUpdate(tareaId, {
          'googleTasksSync.googleTaskId': googleTask.data.id,
          'googleTasksSync.googleTaskListId': taskList.id
        });
      }

      // Sincronizar subtareas como tareas hijas
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
    for (const subtarea of subtareas) {
      try {
        const subtaskData = {
          title: `└ ${subtarea.titulo}`, // Prefijo visual para identificar subtareas
          status: subtarea.completada ? 'completed' : 'needsAction',
          parent: parentTaskId
        };

        if (subtarea.googleTaskId) {
          // Actualizar subtarea existente
          await this.tasks.tasks.update({
            tasklist: taskListId,
            task: subtarea.googleTaskId,
            requestBody: subtaskData
          });
        } else {
          // Crear nueva subtarea
          const googleSubtask = await this.tasks.tasks.insert({
            tasklist: taskListId,
            requestBody: subtaskData
          });

          // Actualizar subtarea con ID de Google (esto requeriría modificar el esquema)
          subtarea.googleTaskId = googleSubtask.data.id;
        }
      } catch (error) {
        console.error(`Error al sincronizar subtarea "${subtarea.titulo}":`, error);
      }
    }
  }

  /**
   * Sincroniza desde Google Tasks hacia Attadia
   */
  async syncTasksFromGoogle(userId) {
    const user = await this.setUserCredentials(userId);
    const taskList = await this.getOrCreateDefaultTaskList(userId);

    try {
      const response = await this.tasks.tasks.list({
        tasklist: taskList.id,
        showCompleted: true,
        showHidden: true
      });

      const googleTasks = response.data.items || [];
      const syncResults = {
        created: 0,
        updated: 0,
        errors: []
      };

      for (const googleTask of googleTasks) {
        try {
          // Buscar tarea existente por Google Task ID
          let tarea = await Tareas.findOne({
            'googleTasksSync.googleTaskId': googleTask.id,
            usuario: userId
          });

          const tareaData = {
            titulo: googleTask.title,
            descripcion: this.extractDescriptionFromNotes(googleTask.notes),
            estado: this.mapGoogleStatusToEstado(googleTask.status),
            fechaVencimiento: googleTask.due ? new Date(googleTask.due) : null,
            completada: googleTask.status === 'completed',
            googleTasksSync: {
              enabled: true,
              googleTaskId: googleTask.id,
              googleTaskListId: taskList.id,
              lastSyncDate: new Date(),
              syncStatus: 'synced'
            }
          };

          if (tarea) {
            // Actualizar tarea existente
            await Tareas.findByIdAndUpdate(tarea._id, tareaData);
            syncResults.updated++;
          } else {
            // Crear nueva tarea
            const nuevaTarea = new Tareas({
              ...tareaData,
              usuario: userId,
              fechaInicio: new Date(),
              prioridad: 'BAJA'
            });
            await nuevaTarea.save();
            syncResults.created++;
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

    const results = {
      toGoogle: { success: 0, errors: [] },
      fromGoogle: null
    };

    try {
      // 1. Sincronizar tareas locales pendientes hacia Google
      const tareasLocales = await Tareas.find({
        usuario: userId,
        $or: [
          { 'googleTasksSync.syncStatus': 'pending' },
          { 'googleTasksSync.enabled': true, 'googleTasksSync.syncStatus': { $ne: 'synced' } }
        ]
      });

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

    return notes;
  }

  extractDescriptionFromNotes(notes) {
    if (!notes) return '';
    
    // Extraer solo la descripción, antes de "Subtareas:" o "Proyecto:"
    const lines = notes.split('\n');
    const endMarkers = ['Subtareas:', 'Proyecto:'];
    
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
