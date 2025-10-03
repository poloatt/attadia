import cron from 'node-cron';
import { Users } from '../models/index.js';
import googleTasksService from './googleTasksService.js';

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
    
    this.job = cron.schedule(this.syncInterval, async () => {
      await this.performAutoSync();
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

      // Sincronizar cada usuario (con protección contra sincronizaciones muy frecuentes)
      const results = await Promise.allSettled(
        users.map(async (user) => {
          try {
            const userId = user._id.toString();
            const lastSyncTime = this.lastSyncTimes.get(userId);
            const now = new Date();
            
            // No sincronizar si la última sincronización fue hace menos de 10 minutos
            if (lastSyncTime && (now - lastSyncTime) < 10 * 60 * 1000) {
              console.log(`⏭️ Saltando usuario ${user.email} - sincronizado hace menos de 10 minutos`);
              return { userId: user._id, email: user.email, success: true, skipped: true };
            }

            console.log(`🔄 Sincronizando usuario: ${user.email}`);
            const result = await googleTasksService.fullSyncWithUser(user);
            
            // Actualizar tiempo de última sincronización
            this.lastSyncTimes.set(userId, now);
            
            console.log(`✅ Usuario ${user.email} sincronizado exitosamente`);
            return { userId: user._id, email: user.email, success: true, result };
          } catch (error) {
            console.error(`❌ Error sincronizando usuario ${user.email}:`, error.message);
            return { userId: user._id, email: user.email, success: false, error: error.message };
          }
        })
      );

      // Resumen de resultados
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failed = results.length - successful;

      console.log(`📊 Sincronización automática completada: ${successful} exitosas, ${failed} fallidas`);

      // Log de errores si los hay
      const errors = results
        .filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success))
        .map(r => r.status === 'rejected' ? r.reason : r.value.error);

      if (errors.length > 0) {
        console.error('❌ Errores en sincronización automática:', errors);
      }

    } catch (error) {
      console.error('❌ Error crítico en sincronización automática:', error);
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
