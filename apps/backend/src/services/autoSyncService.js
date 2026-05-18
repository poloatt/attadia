import cron from 'node-cron';
import { Users } from '../models/index.js';
import googleTasksService from './googleTasksService.js';

/**
 * Cron global del servidor: start/stop desde la UI afecta a todos los usuarios
 * en esta instancia, pero cada usuario se sincroniza en serie con credenciales aisladas.
 */
class AutoSyncService {
  constructor() {
    this.isRunning = false;
    this.syncInterval = '*/15 * * * *'; // Cada 15 minutos por defecto (reducido de 5)
    this.job = null;
    this.lastSyncTimes = new Map(); // Track last sync time per user
  }

  /**
   * Inicia el servicio de sincronización automática
   */
  start() {
    if (this.isRunning) {
      console.log('🔄 AutoSync ya está ejecutándose');
      return;
    }

    console.log(`🔄 Iniciando sincronización automática cada 15 minutos`);
    
    this.job = cron.schedule(this.syncInterval, () => {
      // Ejecutar sincronización de forma no bloqueante para no afectar health checks
      // Usar setImmediate para asegurar que el event loop no se bloquee
      setImmediate(async () => {
        await this.performAutoSync();
      });
    }, {
      scheduled: true,
      timezone: 'America/Santiago'
    });

    this.isRunning = true;
    console.log('✅ AutoSync iniciado correctamente');
  }

  /**
   * Detiene el servicio de sincronización automática
   */
  stop() {
    if (!this.isRunning) {
      console.log('🔄 AutoSync no está ejecutándose');
      return;
    }

    if (this.job) {
      this.job.stop();
      this.job = null;
    }

    this.isRunning = false;
    console.log('⏹️ AutoSync detenido');
  }

  /**
   * Cambia el intervalo de sincronización
   * @param {string} interval - Intervalo en formato cron
   */
  setInterval(interval) {
    const wasRunning = this.isRunning;
    
    if (wasRunning) {
      this.stop();
    }

    this.syncInterval = interval;
    console.log(`🔄 Intervalo de sincronización cambiado a: ${interval}`);

    if (wasRunning) {
      this.start();
    }
  }

  /**
   * Obtiene el estado del servicio
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      interval: this.syncInterval,
      nextRun: this.nextRun
    };
  }

  /**
   * Realiza la sincronización automática para todos los usuarios con Google Tasks habilitado
   */
  async performAutoSync() {
    const syncStartTime = Date.now();
    try {
      console.log('🔄 Iniciando sincronización automática...');
      
      // Buscar usuarios con Google Tasks habilitado
      const users = await Users.find({
        'googleTasksConfig.enabled': true,
        'googleTasksConfig.accessToken': { $exists: true, $ne: null }
      });

      if (users.length === 0) {
        console.log('📝 No hay usuarios con Google Tasks habilitado');
        return;
      }

      console.log(`👥 Encontrados ${users.length} usuarios para sincronizar`);

      // Sincronizar usuarios en serie (evita mezclar credenciales OAuth entre usuarios)
      const results = [];
      for (const user of users) {
        try {
          const userId = user._id.toString();
          const lastSyncTime = this.lastSyncTimes.get(userId);
          const now = new Date();

          if (lastSyncTime && (now - lastSyncTime) < 10 * 60 * 1000) {
            console.log(`⏭️ Saltando usuario ${user.email} - sincronizado hace menos de 10 minutos`);
            results.push({ status: 'fulfilled', value: { userId: user._id, email: user.email, success: true, skipped: true } });
            continue;
          }

          console.log(`🔄 Sincronizando usuario: ${user.email}`);
          const result = await googleTasksService.fullSyncWithUser(user);
          this.lastSyncTimes.set(userId, now);
          console.log(`✅ Usuario ${user.email} sincronizado exitosamente`);
          results.push({ status: 'fulfilled', value: { userId: user._id, email: user.email, success: true, result } });
        } catch (error) {
          console.error(`❌ Error sincronizando usuario ${user.email}:`, error.message);
          results.push({ status: 'fulfilled', value: { userId: user._id, email: user.email, success: false, error: error.message } });
        }
      }

      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failed = results.length - successful;
      const syncDuration = Date.now() - syncStartTime;

      console.log(`📊 Sincronización automática completada: ${successful} exitosas, ${failed} fallidas (duración: ${syncDuration}ms)`);

      // Log de errores si los hay
      const errors = results
        .filter(r => r.status === 'fulfilled' && !r.value.success)
        .map(r => r.value.error);

      if (errors.length > 0) {
        console.error('❌ Errores en sincronización automática:', errors);
      }

    } catch (error) {
      // Loggear error pero NO lanzarlo - evitar que cause reinicios
      const syncDuration = Date.now() - syncStartTime;
      console.error(`❌ Error crítico en sincronización automática (duración: ${syncDuration}ms):`, error);
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
      // NO re-lanzar el error para evitar que cause reinicios del proceso
    }
  }

  /**
   * Fuerza una sincronización inmediata
   */
  async forceSync() {
    console.log('🔄 Forzando sincronización inmediata...');
    await this.performAutoSync();
  }
}

// Crear instancia singleton
const autoSyncService = new AutoSyncService();

export default autoSyncService;
