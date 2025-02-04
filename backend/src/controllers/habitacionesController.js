import { Habitaciones } from '../models/index.js';

export const habitacionesController = {
  getAll: async (req, res) => {
    try {
      const habitaciones = await Habitaciones.find()
        .populate('propiedad')
        .sort({ numero: 'asc' });
      res.json(habitaciones);
    } catch (error) {
      console.error('Error al obtener habitaciones:', error);
      res.status(500).json({ error: 'Error al obtener habitaciones' });
    }
  },

  create: async (req, res) => {
    try {
      const { 
        numero, 
        tipo, 
        estado, 
        descripcion, 
        propiedadId,
        metrosCuadrados,
        precio 
      } = req.body;

      const habitacion = await Habitaciones.create({
        numero,
        tipo,
        estado,
        descripcion,
        metrosCuadrados: parseFloat(metrosCuadrados),
        precio: parseFloat(precio),
        propiedad: propiedadId
      });

      const habitacionPopulada = await habitacion.populate('propiedad');
      res.status(201).json(habitacionPopulada);
    } catch (error) {
      console.error('Error al crear habitación:', error);
      res.status(500).json({ error: 'Error al crear habitación' });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };
      
      if (updateData.metrosCuadrados) updateData.metrosCuadrados = parseFloat(updateData.metrosCuadrados);
      if (updateData.precio) updateData.precio = parseFloat(updateData.precio);

      const habitacion = await Habitaciones.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      ).populate('propiedad');

      if (!habitacion) {
        return res.status(404).json({ error: 'Habitación no encontrada' });
      }

      res.json(habitacion);
    } catch (error) {
      console.error('Error al actualizar habitación:', error);
      res.status(500).json({ error: 'Error al actualizar habitación' });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const habitacion = await Habitaciones.findByIdAndDelete(id);

      if (!habitacion) {
        return res.status(404).json({ error: 'Habitación no encontrada' });
      }

      res.json({ message: 'Habitación eliminada correctamente' });
    } catch (error) {
      console.error('Error al eliminar habitación:', error);
      res.status(500).json({ error: 'Error al eliminar habitación' });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const habitacion = await Habitaciones.findById(id)
        .populate('propiedad');

      if (!habitacion) {
        return res.status(404).json({ error: 'Habitación no encontrada' });
      }

      res.json(habitacion);
    } catch (error) {
      console.error('Error al obtener habitación:', error);
      res.status(500).json({ error: 'Error al obtener habitación' });
    }
  },

  getAllAdmin: async (req, res) => {
    try {
      const habitaciones = await Habitaciones.find()
        .populate([
          { path: 'propiedad', select: 'nombre direccion' },
          { path: 'usuario', select: 'nombre email' }
        ])
        .sort({ createdAt: 'desc' });
      res.json(habitaciones);
    } catch (error) {
      console.error('Error al obtener habitaciones:', error);
      res.status(500).json({ error: 'Error al obtener habitaciones' });
    }
  },

  updateStatus: async (req, res) => {
    try {
      const { estado } = req.body;
      const habitacion = await Habitaciones.findByIdAndUpdate(
        req.params.id,
        { estado },
        { new: true }
      ).populate('propiedad', 'nombre direccion');

      if (!habitacion) {
        return res.status(404).json({ error: 'Habitación no encontrada' });
      }

      res.json(habitacion);
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      res.status(500).json({ error: 'Error al actualizar estado' });
    }
  },

  getAllByPropiedad: async (req, res) => {
    try {
      const { propiedadId } = req.params;
      const habitaciones = await Habitaciones.find({ propiedad: propiedadId })
        .populate('propiedad')
        .sort({ numero: 'asc' });
      res.json(habitaciones);
    } catch (error) {
      console.error('Error al obtener habitaciones:', error);
      res.status(500).json({ error: 'Error al obtener habitaciones' });
    }
  }
}; 