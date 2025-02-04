import { Monedas } from '../models/index.js';

export const monedasController = {
  getAll: async (req, res) => {
    try {
      const monedas = await Monedas.find().sort({ codigo: 'asc' });
      res.json(monedas);
    } catch (error) {
      console.error('Error al obtener monedas:', error);
      res.status(500).json({ error: 'Error al obtener monedas' });
    }
  },

  getById: async (req, res) => {
    try {
      const moneda = await Monedas.findById(req.params.id);
      if (!moneda) {
        return res.status(404).json({ error: 'Moneda no encontrada' });
      }
      res.json(moneda);
    } catch (error) {
      console.error('Error al obtener moneda:', error);
      res.status(500).json({ error: 'Error al obtener moneda' });
    }
  },

  create: async (req, res) => {
    try {
      const moneda = await Monedas.create(req.body);
      res.status(201).json(moneda);
    } catch (error) {
      console.error('Error al crear moneda:', error);
      res.status(500).json({ error: 'Error al crear moneda' });
    }
  },

  update: async (req, res) => {
    try {
      const moneda = await Monedas.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      if (!moneda) {
        return res.status(404).json({ error: 'Moneda no encontrada' });
      }
      res.json(moneda);
    } catch (error) {
      console.error('Error al actualizar moneda:', error);
      res.status(500).json({ error: 'Error al actualizar moneda' });
    }
  },

  delete: async (req, res) => {
    try {
      const moneda = await Monedas.findByIdAndDelete(req.params.id);
      if (!moneda) {
        return res.status(404).json({ error: 'Moneda no encontrada' });
      }
      res.json({ message: 'Moneda eliminada correctamente' });
    } catch (error) {
      console.error('Error al eliminar moneda:', error);
      res.status(500).json({ error: 'Error al eliminar moneda' });
    }
  },

  updateRates: async (req, res) => {
    try {
      // Aquí iría la lógica para actualizar tasas de cambio desde una API externa
      res.json({ message: 'Tasas actualizadas correctamente' });
    } catch (error) {
      console.error('Error al actualizar tasas:', error);
      res.status(500).json({ error: 'Error al actualizar tasas' });
    }
  }
}; 