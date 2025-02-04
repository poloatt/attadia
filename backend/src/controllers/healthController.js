import { SystemHealth, Logs } from '../models/index.js';
import os from 'os';

export const healthController = {
  getBasicHealth: async (req, res) => {
    try {
      res.json({ status: 'OK', timestamp: new Date() });
    } catch (error) {
      console.error('Error en health check:', error);
      res.status(500).json({ error: 'Error checking health' });
    }
  },

  getDetailedHealth: async (req, res) => {
    try {
      const health = {
        status: 'OK',
        timestamp: new Date(),
        system: {
          cpuUsage: process.cpuUsage(),
          memoryUsage: process.memoryUsage(),
          uptime: process.uptime(),
          nodeVersion: process.version,
          platform: process.platform
        },
        os: {
          totalMemory: os.totalmem(),
          freeMemory: os.freemem(),
          cpus: os.cpus(),
          loadAvg: os.loadavg()
        }
      };
      
      await SystemHealth.create({
        cpuUsage: health.system.cpuUsage.user,
        memoryUsage: health.system.memoryUsage.heapUsed,
        status: 'HEALTHY'
      });

      res.json(health);
    } catch (error) {
      console.error('Error en detailed health check:', error);
      res.status(500).json({ error: 'Error checking detailed health' });
    }
  },

  getMetrics: async (req, res) => {
    try {
      const metrics = await SystemHealth.find()
        .sort({ createdAt: -1 })
        .limit(100);
      res.json(metrics);
    } catch (error) {
      console.error('Error al obtener métricas:', error);
      res.status(500).json({ error: 'Error al obtener métricas' });
    }
  },

  getLogs: async (req, res) => {
    try {
      const logs = await Logs.find()
        .sort({ createdAt: -1 })
        .limit(100);
      res.json(logs);
    } catch (error) {
      console.error('Error al obtener logs:', error);
      res.status(500).json({ error: 'Error al obtener logs' });
    }
  }
}; 