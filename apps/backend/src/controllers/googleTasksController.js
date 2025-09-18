import { Users } from '../models/index.js';
import config from '../config/config.js';

// Intentar importar googleapis de forma condicional
let google = null;
let oauth2Client = null;
let googleTasksService = null;

try {
  const googleModule = await import('googleapis');
  google = googleModule.google;
  
  // Configurar OAuth2 client para Google Tasks
  oauth2Client = new google.auth.OAuth2(
    config.google.clientId,
    config.google.clientSecret,
    `${config.backendUrl}/api/google-tasks/callback`
  );
  
  // Importar servicio de Google Tasks
  const serviceModule = await import('../services/googleTasksService.js');
  googleTasksService = serviceModule.default;
  
  console.log('✅ Google Tasks API habilitado con googleapis');
} catch (error) {
  console.warn('⚠️ googleapis no disponible, usando modo simulado para Google Tasks');
}

const isGoogleTasksEnabled = () => google !== null && oauth2Client !== null;

/**
 * Obtiene la URL de autorización para Google Tasks
 */
export const getAuthUrl = async (req, res) => {
  try {
    if (!isGoogleTasksEnabled()) {
      // Modo simulado - generar URL mock
      const mockAuthUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${config.google.clientId}&redirect_uri=${encodeURIComponent(`${config.backendUrl}/api/google-tasks/callback`)}&scope=${encodeURIComponent('https://www.googleapis.com/auth/tasks')}&response_type=code&access_type=offline&state=${req.user.userId}`;
      
      return res.json({ 
        success: true, 
        authUrl: mockAuthUrl,
        message: 'URL de autorización generada (modo simulado)'
      });
    }

    // Modo real con googleapis
    const scopes = [
      'https://www.googleapis.com/auth/tasks',
      'https://www.googleapis.com/auth/tasks.readonly'
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: (req.user?.userId || req.user?.id),
      prompt: 'consent'
    });

    res.json({ 
      success: true, 
      authUrl,
      message: 'URL de autorización generada correctamente'
    });
  } catch (error) {
    console.error('Error en getAuthUrl:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
};

/**
 * Maneja el callback de autorización de Google Tasks
 */
export const handleCallback = async (req, res) => {
  try {
    const { code, state, error: authError } = req.query;
    
    if (authError) {
      console.error('Error de autorización:', authError);
      return res.redirect(`${config.frontendUrl}/tiempo/tareas?google_tasks_auth=error&message=${encodeURIComponent('Autorización denegada')}`);
    }

    if (!code) {
      return res.redirect(`${config.frontendUrl}/tiempo/tareas?google_tasks_auth=error&message=${encodeURIComponent('Código de autorización no proporcionado')}`);
    }

    const userId = state || req.user?.userId || req.user?.id;
    if (!userId) {
      return res.redirect(`${config.frontendUrl}/tiempo/tareas?google_tasks_auth=error&message=${encodeURIComponent('Usuario no identificado')}`);
    }

    if (!isGoogleTasksEnabled()) {
      // Modo simulado
      await Users.findByIdAndUpdate(userId, {
        'googleTasksConfig.enabled': true,
        'googleTasksConfig.lastSync': new Date(),
        'googleTasksConfig.syncDirection': 'bidirectional'
      });
      
      return res.redirect(`${config.frontendUrl}/tiempo/tareas?google_tasks_auth=success&message=${encodeURIComponent('Google Tasks conectado (modo simulado)')}`);
    }

    // Modo real - intercambiar código por tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Guardar tokens en la base de datos
    await Users.findByIdAndUpdate(userId, {
      'googleTasksConfig.enabled': true,
      'googleTasksConfig.accessToken': tokens.access_token,
      'googleTasksConfig.refreshToken': tokens.refresh_token,
      'googleTasksConfig.lastSync': new Date(),
      'googleTasksConfig.syncDirection': 'bidirectional'
    });

    // Realizar sincronización inicial si el servicio está disponible
    let syncResults = null;
    if (googleTasksService) {
      try {
        syncResults = await googleTasksService.performBidirectionalSync(userId);
      } catch (syncError) {
        console.warn('Error en sincronización inicial:', syncError);
      }
    }

    const message = syncResults 
      ? `Google Tasks conectado y sincronizado. ${syncResults.created} creadas, ${syncResults.updated} actualizadas`
      : 'Google Tasks conectado correctamente';

    res.redirect(`${config.frontendUrl}/tiempo/tareas?google_tasks_auth=success&message=${encodeURIComponent(message)}`);

  } catch (error) {
    console.error('Error en callback de Google Tasks:', error);
    res.redirect(`${config.frontendUrl}/tiempo/tareas?google_tasks_auth=error&message=${encodeURIComponent('Error al procesar autorización')}`);
  }
};

/**
 * Obtiene el estado de configuración de Google Tasks del usuario
 */
export const getStatus = async (req, res) => {
  try {
    const user = await Users.findById(req.user.userId);
    const googleTasksConfig = user?.googleTasksConfig || {};

    const status = {
      enabled: googleTasksConfig.enabled || false,
      lastSync: googleTasksConfig.lastSync || null,
      defaultTaskList: googleTasksConfig.defaultTaskList || null,
      syncDirection: googleTasksConfig.syncDirection || 'bidirectional',
      available: isGoogleTasksEnabled(),
      mode: isGoogleTasksEnabled() ? 'production' : 'simulation',
      message: googleTasksConfig.enabled 
        ? `Google Tasks conectado${!isGoogleTasksEnabled() ? ' (modo simulado)' : ''}` 
        : 'Google Tasks no conectado'
    };

    res.json({ success: true, status });
  } catch (error) {
    console.error('Error al obtener estado:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener estado de Google Tasks' 
    });
  }
};

/**
 * Actualiza la configuración de Google Tasks
 */
export const updateConfig = async (req, res) => {
  try {
    const { syncDirection, defaultTaskList } = req.body;
    
    const updateData = {};
    if (syncDirection) updateData['googleTasksConfig.syncDirection'] = syncDirection;
    if (defaultTaskList) updateData['googleTasksConfig.defaultTaskList'] = defaultTaskList;
    
    await Users.findByIdAndUpdate(req.user.userId, updateData);
    
    res.json({ 
      success: true, 
      message: 'Configuración actualizada correctamente' 
    });
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al actualizar configuración' 
    });
  }
};

/**
 * Desconecta Google Tasks
 */
export const disconnect = async (req, res) => {
  try {
    await Users.findByIdAndUpdate(req.user.userId, {
      'googleTasksConfig.enabled': false,
      'googleTasksConfig.accessToken': null,
      'googleTasksConfig.refreshToken': null,
      'googleTasksConfig.lastSync': null
    });
    
    res.json({ 
      success: true, 
      message: 'Google Tasks desconectado correctamente' 
    });
  } catch (error) {
    console.error('Error al desconectar Google Tasks:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al desconectar Google Tasks' 
    });
  }
};

/**
 * Obtiene estadísticas de sincronización
 */
export const getStats = async (req, res) => {
  try {
    if (!isGoogleTasksEnabled() || !googleTasksService) {
      // Modo simulado - estadísticas mock
      const stats = {
        totalTasks: 0,
        syncedTasks: 0,
        lastSyncDate: null,
        pendingSync: 0,
        errors: 0,
        mode: 'simulation'
      };
      return res.json({ success: true, stats });
    }

    // Modo real - obtener estadísticas reales
    const stats = await googleTasksService.getStats(req.user.userId);
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener estadísticas' 
    });
  }
};

/**
 * Sincronización manual
 */
export const manualSync = async (req, res) => {
  try {
    if (!isGoogleTasksEnabled() || !googleTasksService) {
      // Modo simulado
      return res.json({ 
        success: true, 
        message: 'Sincronización completada (modo simulado)',
        syncResults: {
          created: 0,
          updated: 0,
          deleted: 0,
          errors: [],
          mode: 'simulation'
        }
      });
    }

    // Modo real - sincronización real
    const syncResults = await googleTasksService.performBidirectionalSync(req.user.userId);
    
    // Actualizar fecha de última sincronización
    await Users.findByIdAndUpdate(req.user.userId, {
      'googleTasksConfig.lastSync': new Date()
    });

    res.json({ 
      success: true, 
      message: 'Sincronización completada correctamente',
      syncResults
    });
  } catch (error) {
    console.error('Error en sincronización manual:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error en sincronización manual' 
    });
  }
};

/**
 * Sincronizar tarea específica
 */
export const syncTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    
    if (!isGoogleTasksEnabled() || !googleTasksService) {
      // Modo simulado
      return res.json({ 
        success: true, 
        message: `Tarea ${taskId} sincronizada correctamente (modo simulado)` 
      });
    }

    // Modo real - sincronizar tarea específica
    await googleTasksService.syncSpecificTask(req.user.userId, taskId);
    
    res.json({ 
      success: true, 
      message: `Tarea ${taskId} sincronizada correctamente` 
    });
  } catch (error) {
    console.error('Error al sincronizar tarea:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al sincronizar tarea' 
    });
  }
};

/**
 * Obtener listas de tareas de Google
 */
export const getTaskLists = async (req, res) => {
  try {
    if (!isGoogleTasksEnabled() || !googleTasksService) {
      // Modo simulado
      return res.json({ 
        success: true, 
        taskLists: [
          { id: 'default', title: 'My Tasks (Simulado)' }
        ]
      });
    }

    // Modo real
    const taskLists = await googleTasksService.getTaskLists(req.user.userId);
    res.json({ success: true, taskLists });
  } catch (error) {
    console.error('Error al obtener listas de tareas:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener listas de tareas' 
    });
  }
};