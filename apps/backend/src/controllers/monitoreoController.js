import { Users, Logs, SystemHealth } from '../models/index.js';

export const monitoreoController = {
  getStats: async (req, res) => {
    try {
      const stats = {
        usuarios: await Users.countDocuments(),
        usuariosActivos: await Users.countDocuments({ active: true }),
        logsUltimas24h: await Logs.countDocuments({
          createdAt: { $gte: new Date(Date.now() - 24*60*60*1000) }
        })
      };
      res.json(stats);
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
  },

  getLogs: async (req, res) => {
    try {
      const logs = await Logs.find()
        .sort({ createdAt: 'desc' })
        .limit(100);
      res.json(logs);
    } catch (error) {
      console.error('Error al obtener logs:', error);
      res.status(500).json({ error: 'Error al obtener logs' });
    }
  },

  getActiveUsers: async (req, res) => {
    try {
      const users = await Users.find({ active: true })
        .select('nombre email lastLogin')
        .sort({ lastLogin: 'desc' });
      res.json(users);
    } catch (error) {
      console.error('Error al obtener usuarios activos:', error);
      res.status(500).json({ error: 'Error al obtener usuarios activos' });
    }
  },

  getSystemHealth: async (req, res) => {
    try {
      const health = await SystemHealth.findOne()
        .sort({ createdAt: 'desc' });
      res.json(health);
    } catch (error) {
      console.error('Error al obtener estado del sistema:', error);
      res.status(500).json({ error: 'Error al obtener estado del sistema' });
    }
  }
}; 