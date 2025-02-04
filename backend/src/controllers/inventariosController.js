import { Inventarios } from '../models/index.js';

export const inventariosController = {
  getAll: async (req, res) => {
    try {
      const inventarios = await Inventarios.find({ usuario: req.user.id })
        .populate('propiedad')
        .sort({ nombre: 'asc' });
      res.json(inventarios);
    } catch (error) {
      console.error('Error al obtener inventarios:', error);
      res.status(500).json({ error: 'Error al obtener inventarios' });
    }
  },

  create: async (req, res) => {
    try {
      const { 
        nombre, 
        descripcion, 
        cantidad, 
        categoria, 
        ubicacion,
        estado,
        propiedadId 
      } = req.body;

      const inventario = await Inventarios.create({
        nombre,
        descripcion,
        cantidad: parseInt(cantidad),
        categoria,
        ubicacion,
        estado,
        usuario: req.user.id,
        propiedad: propiedadId
      });

      const inventarioPopulado = await inventario.populate('propiedad');
      res.status(201).json(inventarioPopulado);
    } catch (error) {
      console.error('Error al crear item de inventario:', error);
      res.status(500).json({ error: 'Error al crear item de inventario' });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const inventario = await Inventarios.findById(id).populate('propiedad');
      
      if (!inventario) {
        return res.status(404).json({ error: 'Item de inventario no encontrado' });
      }

      res.json(inventario);
    } catch (error) {
      console.error('Error al obtener item de inventario:', error);
      res.status(500).json({ error: 'Error al obtener item de inventario' });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };
      
      if (updateData.cantidad) updateData.cantidad = parseInt(updateData.cantidad);

      const inventario = await Inventarios.findOneAndUpdate(
        { _id: id, usuario: req.user.id },
        updateData,
        { new: true }
      ).populate('propiedad');

      if (!inventario) {
        return res.status(404).json({ error: 'Item de inventario no encontrado' });
      }

      res.json(inventario);
    } catch (error) {
      console.error('Error al actualizar item de inventario:', error);
      res.status(500).json({ error: 'Error al actualizar item de inventario' });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const inventario = await Inventarios.findOneAndDelete({
        _id: id,
        usuario: req.user.id
      });

      if (!inventario) {
        return res.status(404).json({ error: 'Item de inventario no encontrado' });
      }

      res.json({ message: 'Item de inventario eliminado correctamente' });
    } catch (error) {
      console.error('Error al eliminar item de inventario:', error);
      res.status(500).json({ error: 'Error al eliminar item de inventario' });
    }
  },

  getAllAdmin: async (req, res) => {
    try {
      const inventarios = await Inventarios.find()
        .populate([
          { path: 'propiedad', select: 'nombre direccion' },
          { path: 'usuario', select: 'nombre email' }
        ])
        .sort({ createdAt: 'desc' });
      res.json(inventarios);
    } catch (error) {
      console.error('Error al obtener inventarios:', error);
      res.status(500).json({ error: 'Error al obtener inventarios' });
    }
  },

  getAdminStats: async (req, res) => {
    try {
      const stats = await Inventarios.aggregate([
        {
          $group: {
            _id: '$estado',
            count: { $sum: 1 },
            valorTotal: { $sum: '$valorEstimado' }
          }
        }
      ]);

      const formattedStats = stats.reduce((acc, stat) => {
        acc[stat._id.toLowerCase()] = {
          cantidad: stat.count,
          valorTotal: stat.valorTotal
        };
        return acc;
      }, {});

      res.json(formattedStats);
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
  }
}; 