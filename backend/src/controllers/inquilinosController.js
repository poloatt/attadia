import { Inquilinos } from '../models/index.js';

export const inquilinosController = {
  getAll: async (req, res) => {
    try {
      const inquilinos = await Inquilinos.find({ usuario: req.user.id })
        .populate('usuario')
        .sort({ nombre: 'asc' });
      res.json(inquilinos);
    } catch (error) {
      console.error('Error al obtener inquilinos:', error);
      res.status(500).json({ error: 'Error al obtener inquilinos' });
    }
  },

  create: async (req, res) => {
    try {
      const { nombre, apellido, dni, email, telefono } = req.body;
      const inquilino = await Inquilinos.create({
        nombre,
        apellido,
        dni,
        email,
        telefono,
        estado: 'ACTIVO',
        usuario: req.user.id
      });

      res.status(201).json(inquilino);
    } catch (error) {
      console.error('Error al crear inquilino:', error);
      res.status(500).json({ error: 'Error al crear inquilino' });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, apellido, dni, email, telefono } = req.body;
      
      const inquilino = await Inquilinos.findOneAndUpdate(
        { _id: id, usuario: req.user.id },
        { nombre, apellido, dni, email, telefono },
        { new: true }
      );

      if (!inquilino) {
        return res.status(404).json({ error: 'Inquilino no encontrado' });
      }

      res.json(inquilino);
    } catch (error) {
      console.error('Error al actualizar inquilino:', error);
      res.status(500).json({ error: 'Error al actualizar inquilino' });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const inquilino = await Inquilinos.findOneAndDelete({
        _id: id,
        usuario: req.user.id
      });

      if (!inquilino) {
        return res.status(404).json({ error: 'Inquilino no encontrado' });
      }

      res.json({ message: 'Inquilino eliminado correctamente' });
    } catch (error) {
      console.error('Error al eliminar inquilino:', error);
      res.status(500).json({ error: 'Error al eliminar inquilino' });
    }
  },

  getActivos: async (req, res) => {
    try {
      const inquilinos = await Inquilinos.find({
        usuario: req.user.id,
        estado: 'ACTIVO'
      }).populate({
        path: 'contratos',
        match: { estado: 'ACTIVO' },
        populate: { 
          path: 'propiedad habitacion moneda',
          select: 'nombre numero simbolo'
        }
      });
      
      res.json(inquilinos);
    } catch (error) {
      console.error('Error al obtener inquilinos activos:', error);
      res.status(500).json({ error: 'Error al obtener inquilinos activos' });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const inquilino = await Inquilinos.findOne({ 
        _id: id, 
        usuario: req.user.id 
      }).populate('usuario');
      
      if (!inquilino) {
        return res.status(404).json({ error: 'Inquilino no encontrado' });
      }
      
      res.json(inquilino);
    } catch (error) {
      console.error('Error al obtener inquilino:', error);
      res.status(500).json({ error: 'Error al obtener inquilino' });
    }
  },

  getAllAdmin: async (req, res) => {
    try {
      const inquilinos = await Inquilinos.find()
        .populate('usuario')
        .sort({ createdAt: 'desc' });
      res.json(inquilinos);
    } catch (error) {
      console.error('Error al obtener todos los inquilinos:', error);
      res.status(500).json({ error: 'Error al obtener todos los inquilinos' });
    }
  },

  getAdminStats: async (req, res) => {
    try {
      const totalInquilinos = await Inquilinos.countDocuments();
      const inquilinosActivos = await Inquilinos.countDocuments({ estado: 'ACTIVO' });
      const inquilinosInactivos = await Inquilinos.countDocuments({ estado: 'INACTIVO' });
      
      const inquilinosPorUsuario = await Inquilinos.aggregate([
        {
          $group: {
            _id: '$usuario',
            count: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'usuario'
          }
        },
        {
          $unwind: '$usuario'
        }
      ]);

      res.json({
        totalInquilinos,
        inquilinosActivos,
        inquilinosInactivos,
        inquilinosPorUsuario
      });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
  },

  updateStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { estado } = req.body;

      const inquilino = await Inquilinos.findByIdAndUpdate(
        id,
        { estado },
        { new: true }
      ).populate('usuario');

      if (!inquilino) {
        return res.status(404).json({ error: 'Inquilino no encontrado' });
      }

      res.json(inquilino);
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      res.status(500).json({ error: 'Error al actualizar estado' });
    }
  }
}; 