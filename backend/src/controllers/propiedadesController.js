import { Propiedades } from '../models/index.js';

export const propiedadesController = {
  getAll: async (req, res) => {
    try {
      const propiedades = await Propiedades.find({ usuario: req.user.id })
        .populate(['moneda', 'cuenta'])
        .sort({ titulo: 'asc' });
      res.json(propiedades);
    } catch (error) {
      console.error('Error al obtener propiedades:', error);
      res.status(500).json({ error: 'Error al obtener propiedades' });
    }
  },

  create: async (req, res) => {
    try {
      const { 
        titulo, 
        descripcion, 
        precio, 
        direccion, 
        ciudad, 
        estado, 
        tipo,
        numHabitaciones,
        banos,
        metrosCuadrados,
        imagen,
        monedaId,
        cuentaId
      } = req.body;

      const propiedad = await Propiedades.create({
        titulo,
        descripcion,
        precio: parseFloat(precio),
        direccion,
        ciudad,
        estado,
        tipo,
        numHabitaciones: parseInt(numHabitaciones),
        banos: parseInt(banos),
        metrosCuadrados: parseFloat(metrosCuadrados),
        imagen,
        usuario: req.user.id,
        moneda: monedaId,
        cuenta: cuentaId
      });

      const propiedadPopulada = await propiedad
        .populate(['moneda', 'cuenta']);

      res.status(201).json(propiedadPopulada);
    } catch (error) {
      console.error('Error al crear propiedad:', error);
      res.status(500).json({ error: 'Error al crear propiedad' });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const propiedad = await Propiedades.findOne({ 
        _id: id, 
        usuario: req.user.id 
      }).populate(['moneda', 'cuenta']);
      
      if (!propiedad) {
        return res.status(404).json({ error: 'Propiedad no encontrada' });
      }

      res.json(propiedad);
    } catch (error) {
      console.error('Error al obtener propiedad:', error);
      res.status(500).json({ error: 'Error al obtener propiedad' });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };
      
      if (updateData.precio) updateData.precio = parseFloat(updateData.precio);
      if (updateData.numHabitaciones) updateData.numHabitaciones = parseInt(updateData.numHabitaciones);
      if (updateData.banos) updateData.banos = parseInt(updateData.banos);
      if (updateData.metrosCuadrados) updateData.metrosCuadrados = parseFloat(updateData.metrosCuadrados);

      const propiedad = await Propiedades.findOneAndUpdate(
        { _id: id, usuario: req.user.id },
        updateData,
        { new: true }
      ).populate(['moneda', 'cuenta']);

      if (!propiedad) {
        return res.status(404).json({ error: 'Propiedad no encontrada' });
      }

      res.json(propiedad);
    } catch (error) {
      console.error('Error al actualizar propiedad:', error);
      res.status(500).json({ error: 'Error al actualizar propiedad' });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const propiedad = await Propiedades.findOneAndDelete({
        _id: id,
        usuario: req.user.id
      });

      if (!propiedad) {
        return res.status(404).json({ error: 'Propiedad no encontrada' });
      }

      res.json({ message: 'Propiedad eliminada correctamente' });
    } catch (error) {
      console.error('Error al eliminar propiedad:', error);
      res.status(500).json({ error: 'Error al eliminar propiedad' });
    }
  },

  getStats: async (req, res) => {
    try {
      const total = await Propiedades.countDocuments({ usuario: req.user.id });
      const ocupadas = await Propiedades.countDocuments({ 
        usuario: req.user.id,
        estado: 'OCUPADA'
      });

      res.json({
        total,
        ocupadas,
        disponibles: total - ocupadas
      });
    } catch (error) {
      console.error('Error en getStats propiedades:', error);
      res.status(500).json({ message: error.message });
    }
  },

  getAllAdmin: async (req, res) => {
    try {
      const propiedades = await Propiedades.find()
        .populate('usuario', 'nombre email')
        .sort({ createdAt: 'desc' });
      res.json(propiedades);
    } catch (error) {
      console.error('Error al obtener propiedades:', error);
      res.status(500).json({ error: 'Error al obtener propiedades' });
    }
  },

  updateStatus: async (req, res) => {
    try {
      const { status } = req.body;
      const propiedad = await Propiedades.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      ).populate('usuario', 'nombre email');

      if (!propiedad) {
        return res.status(404).json({ error: 'Propiedad no encontrada' });
      }

      res.json(propiedad);
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      res.status(500).json({ error: 'Error al actualizar estado' });
    }
  }
}; 