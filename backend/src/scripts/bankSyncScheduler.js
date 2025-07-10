import cron from 'node-cron';
import bankSyncService from '../services/bankSyncService.js';
import { BankConnection } from '../models/BankConnection.js';

class BankSyncScheduler {
  constructor() {
    this.isRunning = false;
    this.scheduledJobs = new Map();
  }

  // Iniciar el scheduler
  start() {
    console.log('Iniciando scheduler de sincronización bancaria...');
    
    // Programar sincronización diaria a las 6:00 AM
    this.scheduleDailySync();
    
    // Programar sincronización semanal los domingos a las 2:00 AM
    this.scheduleWeeklySync();
    
    // Programar sincronización mensual el primer día del mes a las 3:00 AM
    this.scheduleMonthlySync();
    
    console.log('Scheduler de sincronización bancaria iniciado');
  }

  // Detener el scheduler
  stop() {
    console.log('Deteniendo scheduler de sincronización bancaria...');
    
    this.scheduledJobs.forEach((job, name) => {
      job.stop();
      console.log(`Job detenido: ${name}`);
    });
    
    this.scheduledJobs.clear();
    this.isRunning = false;
    console.log('Scheduler de sincronización bancaria detenido');
  }

  // Programar sincronización diaria
  scheduleDailySync() {
    const job = cron.schedule('0 6 * * *', async () => {
      console.log('Ejecutando sincronización diaria...');
      await this.syncConnectionsByFrequency('DIARIA');
    }, {
      scheduled: true,
      timezone: 'America/Santiago'
    });

    this.scheduledJobs.set('daily', job);
    console.log('Sincronización diaria programada para las 6:00 AM');
  }

  // Programar sincronización semanal
  scheduleWeeklySync() {
    const job = cron.schedule('0 2 * * 0', async () => {
      console.log('Ejecutando sincronización semanal...');
      await this.syncConnectionsByFrequency('SEMANAL');
    }, {
      scheduled: true,
      timezone: 'America/Santiago'
    });

    this.scheduledJobs.set('weekly', job);
    console.log('Sincronización semanal programada para los domingos a las 2:00 AM');
  }

  // Programar sincronización mensual
  scheduleMonthlySync() {
    const job = cron.schedule('0 3 1 * *', async () => {
      console.log('Ejecutando sincronización mensual...');
      await this.syncConnectionsByFrequency('MENSUAL');
    }, {
      scheduled: true,
      timezone: 'America/Santiago'
    });

    this.scheduledJobs.set('monthly', job);
    console.log('Sincronización mensual programada para el primer día del mes a las 3:00 AM');
  }

  // Sincronizar conexiones por frecuencia
  async syncConnectionsByFrequency(frecuencia) {
    try {
      console.log(`Sincronizando conexiones con frecuencia: ${frecuencia}`);
      
      const conexiones = await BankConnection.find({
        estado: 'ACTIVA',
        'configuracion.sincronizacionAutomatica': true,
        'configuracion.frecuenciaSincronizacion': frecuencia
      }).populate(['cuenta', 'usuario']);

      console.log(`Encontradas ${conexiones.length} conexiones para sincronizar`);

      const resultados = [];
      for (const conexion of conexiones) {
        try {
          console.log(`Sincronizando conexión: ${conexion.nombre}`);
          const resultado = await bankSyncService.sincronizarConexion(conexion);
          resultados.push({
            conexionId: conexion._id,
            nombre: conexion.nombre,
            ...resultado
          });
        } catch (error) {
          console.error(`Error sincronizando conexión ${conexion.nombre}:`, error);
          resultados.push({
            conexionId: conexion._id,
            nombre: conexion.nombre,
            exito: false,
            error: error.message
          });
        }
      }

      const resumen = {
        fecha: new Date(),
        frecuencia,
        totalConexiones: resultados.length,
        exitosas: resultados.filter(r => r.exito).length,
        fallidas: resultados.filter(r => !r.exito).length,
        transaccionesNuevas: resultados.reduce((sum, r) => sum + (r.transaccionesNuevas || 0), 0),
        transaccionesActualizadas: resultados.reduce((sum, r) => sum + (r.transaccionesActualizadas || 0), 0),
        resultados
      };

      console.log('Resumen de sincronización:', resumen);

      // Aquí podrías enviar notificaciones o guardar logs
      await this.logSyncResults(resumen);

    } catch (error) {
      console.error('Error en sincronización programada:', error);
    }
  }

  // Sincronizar todas las conexiones pendientes
  async syncPendingConnections() {
    try {
      console.log('Sincronizando conexiones pendientes...');
      
      const conexiones = await BankConnection.getConexionesParaSincronizar();
      console.log(`Encontradas ${conexiones.length} conexiones pendientes`);

      if (conexiones.length === 0) {
        console.log('No hay conexiones pendientes de sincronización');
        return;
      }

      const resultados = await bankSyncService.sincronizarTodasLasConexiones();
      
      const resumen = {
        fecha: new Date(),
        tipo: 'PENDIENTES',
        totalConexiones: resultados.length,
        exitosas: resultados.filter(r => r.exito).length,
        fallidas: resultados.filter(r => !r.exito).length,
        transaccionesNuevas: resultados.reduce((sum, r) => sum + (r.transaccionesNuevas || 0), 0),
        transaccionesActualizadas: resultados.reduce((sum, r) => sum + (r.transaccionesActualizadas || 0), 0),
        resultados
      };

      console.log('Resumen de sincronización de pendientes:', resumen);
      await this.logSyncResults(resumen);

    } catch (error) {
      console.error('Error en sincronización de pendientes:', error);
    }
  }

  // Registrar resultados de sincronización
  async logSyncResults(resumen) {
    try {
      // Aquí podrías guardar los resultados en una colección de logs
      // Por ahora solo los mostramos en consola
      console.log('=== RESUMEN DE SINCRONIZACIÓN ===');
      console.log(`Fecha: ${resumen.fecha}`);
      console.log(`Tipo: ${resumen.tipo || resumen.frecuencia}`);
      console.log(`Total conexiones: ${resumen.totalConexiones}`);
      console.log(`Exitosas: ${resumen.exitosas}`);
      console.log(`Fallidas: ${resumen.fallidas}`);
      console.log(`Transacciones nuevas: ${resumen.transaccionesNuevas}`);
      console.log(`Transacciones actualizadas: ${resumen.transaccionesActualizadas}`);
      console.log('================================');
    } catch (error) {
      console.error('Error al registrar resultados:', error);
    }
  }

  // Ejecutar sincronización manual
  async runManualSync() {
    if (this.isRunning) {
      console.log('Sincronización ya en progreso...');
      return;
    }

    this.isRunning = true;
    try {
      console.log('Iniciando sincronización manual...');
      await this.syncPendingConnections();
      console.log('Sincronización manual completada');
    } catch (error) {
      console.error('Error en sincronización manual:', error);
    } finally {
      this.isRunning = false;
    }
  }

  // Obtener estado del scheduler
  getStatus() {
    return {
      isRunning: this.isRunning,
      scheduledJobs: Array.from(this.scheduledJobs.keys()),
      activeJobs: this.scheduledJobs.size
    };
  }
}

export default new BankSyncScheduler(); 