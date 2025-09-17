import cron from 'node-cron';
import { BankSyncService } from './bankSyncService.js';

class BankSyncScheduler {
  constructor() {
    this.bankSyncService = new BankSyncService();
    this.jobs = new Map();
  }

  // Iniciar el scheduler
  start() {
    console.log('Iniciando scheduler de sincronización bancaria...');

    // Sincronización diaria a las 6:00 AM
    this.scheduleDailySync();
    
    // Sincronización semanal los domingos a las 2:00 AM
    this.scheduleWeeklySync();
    
    // Sincronización mensual el primer día del mes a las 3:00 AM
    this.scheduleMonthlySync();

    console.log('Scheduler de sincronización bancaria iniciado');
  }

  // Programar sincronización diaria
  scheduleDailySync() {
    const job = cron.schedule('0 6 * * *', async () => {
      console.log('Ejecutando sincronización diaria de conexiones bancarias...');
      try {
        await this.bankSyncService.sincronizarTodasLasConexiones();
        console.log('Sincronización diaria completada');
      } catch (error) {
        console.error('Error en sincronización diaria:', error);
      }
    }, {
      scheduled: true,
      timezone: 'America/Argentina/Buenos_Aires'
    });

    this.jobs.set('daily', job);
  }

  // Programar sincronización semanal
  scheduleWeeklySync() {
    const job = cron.schedule('0 2 * * 0', async () => {
      console.log('Ejecutando sincronización semanal de conexiones bancarias...');
      try {
        await this.bankSyncService.sincronizarTodasLasConexiones();
        console.log('Sincronización semanal completada');
      } catch (error) {
        console.error('Error en sincronización semanal:', error);
      }
    }, {
      scheduled: true,
      timezone: 'America/Argentina/Buenos_Aires'
    });

    this.jobs.set('weekly', job);
  }

  // Programar sincronización mensual
  scheduleMonthlySync() {
    const job = cron.schedule('0 3 1 * *', async () => {
      console.log('Ejecutando sincronización mensual de conexiones bancarias...');
      try {
        await this.bankSyncService.sincronizarTodasLasConexiones();
        console.log('Sincronización mensual completada');
      } catch (error) {
        console.error('Error en sincronización mensual:', error);
      }
    }, {
      scheduled: true,
      timezone: 'America/Argentina/Buenos_Aires'
    });

    this.jobs.set('monthly', job);
  }

  // Detener el scheduler
  stop() {
    console.log('Deteniendo scheduler de sincronización bancaria...');
    
    for (const [name, job] of this.jobs) {
      job.stop();
      console.log(`Job ${name} detenido`);
    }
    
    this.jobs.clear();
    console.log('Scheduler de sincronización bancaria detenido');
  }

  // Obtener estado de los jobs
  getStatus() {
    const status = {};
    for (const [name, job] of this.jobs) {
      status[name] = {
        running: job.running,
        nextDate: job.nextDate()
      };
    }
    return status;
  }
}

export default BankSyncScheduler; 