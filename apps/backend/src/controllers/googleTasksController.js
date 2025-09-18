import { Users } from '../models/index.js';
import config from '../config/config.js';
import autoSyncService from '../services/autoSyncService.js';

// Intentar importar googleapis de forma condicional
let google = null;
let oauth2Client = null;
let googleTasksService = null;

try {
  console.log('🔄 Intentando cargar googleapis...');
  const googleModule = await import('googleapis');
  google = googleModule.google;
  console.log('✅ googleapis cargado exitosamente');
  
  console.log('🔄 Configurando OAuth2 client...');
  console.log('🔑 Config disponible:', {
    hasClientId: !!config.google?.clientId,
    hasClientSecret: !!config.google?.clientSecret,
    backendUrl: config.backendUrl,
    clientIdStart: config.google?.clientId?.substring(0, 10) + '...'
  });
  
  // Configurar OAuth2 client para Google Tasks
  oauth2Client = new google.auth.OAuth2(
    config.google.clientId,
    config.google.clientSecret,
    `${config.backendUrl}/api/google-tasks/callback`
  );
  console.log('✅ OAuth2 client configurado');
  
  // Importar servicio de Google Tasks
  try {
    const serviceModule = await import('../services/googleTasksService.js');
    googleTasksService = serviceModule.default;
    console.log('✅ Google Tasks service cargado');
  } catch (serviceError) {
    console.warn('⚠️ Google Tasks service no disponible:', serviceError.message);
  }
  
  console.log('✅ Google Tasks API habilitado con googleapis');
} catch (error) {
  console.error('❌ Error cargando googleapis:', error);
  console.warn('⚠️ googleapis no disponible, usando modo simulado para Google Tasks');
}

const isGoogleTasksEnabled = () => {
  const hasGoogle = google !== null && oauth2Client !== null;
  const hasConfig = config.google?.clientId && config.google?.clientSecret;
  console.log('🔍 Verificando Google Tasks habilitado:', { hasGoogle, hasConfig, clientId: config.google?.clientId ? 'PRESENTE' : 'AUSENTE' });
  return hasGoogle && hasConfig;
};

/**
 * Intenta habilitar Google Tasks para un usuario que ya tiene sesión de Google
 */
async function enableGoogleTasksForExistingUser(userId) {
  const user = await Users.findById(userId);
  if (!user?.googleId) {
    throw new Error('Usuario no tiene sesión de Google');
  }

  console.log('🔄 Intentando habilitar Tasks con sesión existente para:', user.email);

  // Si ya tiene token de Google Tasks, intentar usarlo
  if (user.googleTasksConfig?.accessToken) {
    console.log('✅ Usuario ya tiene token de Google Tasks, verificando validez');
    
    try {
      // Configurar cliente con token existente
      oauth2Client.setCredentials({
        access_token: user.googleTasksConfig.accessToken,
        refresh_token: user.googleTasksConfig.refreshToken
      });

      // Probar acceso a Google Tasks
      const tasks = google.tasks({ version: 'v1', auth: oauth2Client });
      await tasks.tasklists.list(); // Test call
      
      console.log('✅ Token existente válido, habilitando Google Tasks');
      
      await Users.findByIdAndUpdate(userId, {
        'googleTasksConfig.enabled': true,
        'googleTasksConfig.lastSync': new Date()
      });

      return { success: true, message: 'Google Tasks habilitado con token existente' };
    } catch (error) {
      console.log('⚠️ Token existente inválido:', error.message);
      // Continuar para solicitar nuevos permisos
    }
  }

  // Si no tiene token o es inválido, necesita nuevos permisos
  throw new Error('Requiere nuevos permisos para Google Tasks');
}

/**
 * Obtiene la URL de autorización para Google Tasks
 */
export const getAuthUrl = async (req, res) => {
  try {
    console.log('🚀 getAuthUrl llamado - req.user:', req.user);
    
    // Evitar cache
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    if (!isGoogleTasksEnabled()) {
      console.log('❌ Google Tasks no habilitado');
      const errorMessage = !google 
        ? 'Google Tasks no está disponible. Instala googleapis: npm install googleapis'
        : !config.google?.clientId || !config.google?.clientSecret
        ? 'Configuración de Google OAuth incompleta. Verifica GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en .env'
        : 'Google Tasks no está disponible';
      
      return res.status(503).json({ 
        success: false, 
        error: errorMessage
      });
    }

    // Obtener userId correctamente
    const userId = req.user?.userId || req.user?.id;
    console.log('🔑 userId extraído:', userId, 'de req.user:', req.user);
    
    if (!userId) {
      console.log('❌ Usuario no autenticado');
      return res.status(401).json({ 
        success: false, 
        error: 'Usuario no autenticado' 
      });
    }

    // Verificar si el usuario ya tiene una sesión de Google activa
    const user = await Users.findById(userId);
    console.log('👤 Usuario encontrado:', { googleId: user?.googleId, hasGoogleTasksToken: !!user?.googleTasksConfig?.accessToken });

    if (user?.googleId) {
      console.log('✅ Usuario ya logueado con Google, intentando habilitar Tasks directamente');
      
      try {
        // Intentar habilitar Google Tasks usando el token existente o solicitando permisos adicionales
        await enableGoogleTasksForExistingUser(userId);
        
        return res.json({
          success: true,
          message: 'Google Tasks habilitado usando sesión existente',
          directEnable: true
        });
      } catch (error) {
        console.log('⚠️ No se pudo usar sesión existente, generando nueva URL:', error.message);
        // Si falla, continuar con el flujo OAuth normal
      }
    }

    console.log('🔑 Generando URL OAuth para nuevos permisos');

    const scopes = [
      'https://www.googleapis.com/auth/tasks',
      'https://www.googleapis.com/auth/tasks.readonly'
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: String(userId),
      prompt: 'consent',
      login_hint: user?.email // Sugerir la cuenta ya logueada
    });

    console.log('🔗 URL generada con state:', String(userId));

    res.json({ 
      success: true, 
      authUrl,
      message: 'URL de autorización generada correctamente'
    });
  } catch (error) {
    console.error('❌ Error en getAuthUrl:', error);
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
      const html = `<!DOCTYPE html><html><body><script>
        try { window.opener && window.opener.postMessage({ type: 'google_tasks_auth', status: 'error', message: 'Autorización denegada' }, '*'); } catch (e) {}
        window.close();
      </script>
      <p>Autorización denegada. Puedes cerrar esta ventana.</p></body></html>`;
      return res.send(html);
    }

    if (!code) {
      const html = `<!DOCTYPE html><html><body><script>
        try { window.opener && window.opener.postMessage({ type: 'google_tasks_auth', status: 'error', message: 'Código de autorización no proporcionado' }, '*'); } catch (e) {}
        window.close();
      </script>
      <p>Error: No se recibió código de autorización. Puedes cerrar esta ventana.</p></body></html>`;
      return res.send(html);
    }

    console.log('🔄 Google Tasks Callback recibido:');
    console.log('  - code:', !!code ? 'PRESENTE' : 'AUSENTE');
    console.log('  - state:', state);
    console.log('  - authError:', authError);
    console.log('  - req.user:', req.user);
    
    const userId = state;
    console.log('🔍 userId final extraído:', userId);
    
    if (!userId || userId === 'undefined') {
      console.error('❌ UserId inválido en callback:', userId);
      const html = `<!DOCTYPE html><html><body><script>
        try { window.opener && window.opener.postMessage({ type: 'google_tasks_auth', status: 'error', message: 'Usuario no identificado' }, '*'); } catch (e) {}
        window.close();
      </script>
      <p>Error: Usuario no identificado. Puedes cerrar esta ventana.</p></body></html>`;
      return res.send(html);
    }

    if (!isGoogleTasksEnabled()) {
      const html = `<!DOCTYPE html><html><body><script>
        try { window.opener && window.opener.postMessage({ type: 'google_tasks_auth', status: 'error', message: 'Google Tasks no disponible' }, '*'); } catch (e) {}
        window.close();
      </script>
      <p>Error: Google Tasks no está disponible. Puedes cerrar esta ventana.</p></body></html>`;
      return res.send(html);
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
        syncResults = await googleTasksService.fullSync(userId);
      } catch (syncError) {
        console.warn('Error en sincronización inicial:', syncError);
      }
    }

    const message = syncResults 
      ? `Google Tasks conectado y sincronizado. ${syncResults.toGoogle?.success || 0} enviadas, ${syncResults.fromGoogle?.created || 0} importadas`
      : 'Google Tasks conectado correctamente';

    console.log('🎉 Conexión exitosa:', message);

    const html = `<!DOCTYPE html><html><body><script>
      try { window.opener && window.opener.postMessage({ type: 'google_tasks_auth', status: 'success', message: ${JSON.stringify(message)} }, '*'); } catch (e) {}
      window.close();
    </script>
    <p>¡Google Tasks conectado exitosamente! Puedes cerrar esta ventana.</p></body></html>`;
    return res.send(html);

  } catch (error) {
    console.error('❌ Error en callback de Google Tasks:', error);
    const html = `<!DOCTYPE html><html><body><script>
      try { window.opener && window.opener.postMessage({ type: 'google_tasks_auth', status: 'error', message: 'Error al procesar autorización' }, '*'); } catch (e) {}
      window.close();
    </script>
    <p>Ocurrió un error al procesar la autorización. Puedes cerrar esta ventana.</p></body></html>`;
    return res.send(html);
  }
};

/**
 * Obtiene el estado de configuración de Google Tasks del usuario
 */
export const getStatus = async (req, res) => {
  try {
    console.log('📊 req.user en getStatus:', req.user);
    console.log('📊 req.user.userId:', req.user.userId);
    console.log('📊 req.user.id:', req.user.id);
    console.log('📊 req.user._id:', req.user._id);
    
    // El middleware de Passport devuelve el usuario completo en req.user
    // No necesitamos hacer otra consulta a la BD
    const googleTasksConfig = req.user?.googleTasksConfig || {};
    console.log('📊 Google Tasks Config desde req.user:', googleTasksConfig);

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

    console.log('📊 Status que se enviará al frontend:', status);
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
        results: {
          toGoogle: { success: 0, errors: [] },
          fromGoogle: { created: 0, updated: 0, errors: [] },
          mode: 'simulation'
        }
      });
    }

    // Verificar que el usuario tenga Google Tasks habilitado
    if (!req.user.googleTasksConfig?.enabled) {
      return res.status(400).json({
        success: false,
        error: 'Google Tasks no está habilitado para este usuario. Conecta tu cuenta de Google primero.'
      });
    }

    // Modo real - sincronización real
    // Pasar el usuario completo en lugar de solo el ID para evitar consultas adicionales
    const syncResults = await googleTasksService.fullSyncWithUser(req.user);
    
    // Actualizar fecha de última sincronización
    const userId = req.user._id || req.user.id;
    await Users.findByIdAndUpdate(userId, {
      'googleTasksConfig.lastSync': new Date()
    });

    // Preparar mensaje informativo
    let message = 'Sincronización completada correctamente';
    if (syncResults.toGoogle?.success > 0 || syncResults.fromGoogle?.created > 0) {
      message += '. Los proyectos de Attadia se sincronizan como tareas en Google Tasks.';
    }

    res.json({ 
      success: true, 
      message,
      results: syncResults
    });
  } catch (error) {
    console.error('Error en sincronización manual:', error);
    
    let errorMessage = 'Error en sincronización manual';
    if (error.message.includes('Google Tasks no está habilitado')) {
      errorMessage = 'Google Tasks no está habilitado para este usuario';
    } else if (error.message.includes('token') || error.message.includes('credentials')) {
      errorMessage = 'Error de autenticación con Google. Intenta reconectar tu cuenta.';
    } else if (error.message.includes('No se pudo acceder a Google Tasks')) {
      errorMessage = 'No se pudo acceder a Google Tasks. Verifica tu conexión y permisos.';
    }
    
    res.status(500).json({ 
      success: false, 
      error: errorMessage 
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

// Endpoints para sincronización automática
export const getAutoSyncStatus = async (req, res) => {
  try {
    const status = autoSyncService.getStatus();
    
    res.json({
      success: true,
      autoSync: status
    });
  } catch (error) {
    console.error('Error al obtener estado de sincronización automática:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estado de sincronización automática'
    });
  }
};

export const startAutoSync = async (req, res) => {
  try {
    autoSyncService.start();
    
    res.json({
      success: true,
      message: 'Sincronización automática iniciada'
    });
  } catch (error) {
    console.error('Error al iniciar sincronización automática:', error);
    res.status(500).json({
      success: false,
      error: 'Error al iniciar sincronización automática'
    });
  }
};

export const stopAutoSync = async (req, res) => {
  try {
    autoSyncService.stop();
    
    res.json({
      success: true,
      message: 'Sincronización automática detenida'
    });
  } catch (error) {
    console.error('Error al detener sincronización automática:', error);
    res.status(500).json({
      success: false,
      error: 'Error al detener sincronización automática'
    });
  }
};

export const setAutoSyncInterval = async (req, res) => {
  try {
    const { interval } = req.body;
    
    if (!interval) {
      return res.status(400).json({
        success: false,
        error: 'Intervalo requerido'
      });
    }

    autoSyncService.setInterval(interval);
    
    res.json({
      success: true,
      message: 'Intervalo de sincronización actualizado',
      interval
    });
  } catch (error) {
    console.error('Error al actualizar intervalo de sincronización:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar intervalo de sincronización'
    });
  }
};

export const forceAutoSync = async (req, res) => {
  try {
    await autoSyncService.forceSync();
    
    res.json({
      success: true,
      message: 'Sincronización forzada completada'
    });
  } catch (error) {
    console.error('Error al forzar sincronización:', error);
    res.status(500).json({
      success: false,
      error: 'Error al forzar sincronización'
    });
  }
};