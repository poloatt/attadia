import { Users } from '../models/index.js';
import bcrypt from 'bcryptjs';

export const usersController = {
  getProfile: async (req, res) => {
    try {
      const user = await Users.findById(req.user.id).select('-password');
      res.json(user);
    } catch (error) {
      console.error('Error al obtener perfil:', error);
      res.status(500).json({ error: 'Error al obtener perfil' });
    }
  },

  updateProfile: async (req, res) => {
    try {
      const { nombre, email, telefono } = req.body;
      
      const user = await Users.findByIdAndUpdate(
        req.user.id,
        { nombre, email, telefono },
        { new: true }
      ).select('-password');

      res.json(user);
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      res.status(500).json({ error: 'Error al actualizar perfil' });
    }
  },

  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      // Verificar contraseña actual
      const user = await Users.findById(req.user.id);
      const isMatch = await bcrypt.compare(currentPassword, user.password);

      if (!isMatch) {
        return res.status(400).json({ error: 'Contraseña actual incorrecta' });
      }

      // Encriptar nueva contraseña
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Actualizar contraseña
      await Users.findByIdAndUpdate(req.user.id, { password: hashedPassword });

      res.json({ message: 'Contraseña actualizada correctamente' });
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      res.status(500).json({ error: 'Error al cambiar contraseña' });
    }
  },

  updatePreferences: async (req, res) => {
    try {
      const { preferences } = req.body;

      const user = await Users.findByIdAndUpdate(
        req.user.id,
        { preferences },
        { new: true }
      ).select('-password');

      res.json(user);
    } catch (error) {
      console.error('Error al actualizar preferencias:', error);
      res.status(500).json({ error: 'Error al actualizar preferencias' });
    }
  },

  deleteAccount: async (req, res) => {
    try {
      await Users.findByIdAndDelete(req.user.id);
      res.json({ message: 'Cuenta eliminada correctamente' });
    } catch (error) {
      console.error('Error al eliminar cuenta:', error);
      res.status(500).json({ error: 'Error al eliminar cuenta' });
    }
  },

  getAllUsers: async (req, res) => {
    try {
      const users = await Users.find()
        .select('-password')
        .sort({ createdAt: 'desc' });
      res.json(users);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      res.status(500).json({ error: 'Error al obtener usuarios' });
    }
  },

  updateUserRole: async (req, res) => {
    try {
      const { role } = req.body;
      const user = await Users.findByIdAndUpdate(
        req.params.id,
        { role },
        { new: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.json(user);
    } catch (error) {
      console.error('Error al actualizar rol:', error);
      res.status(500).json({ error: 'Error al actualizar rol' });
    }
  },

  updateUserStatus: async (req, res) => {
    try {
      const { active } = req.body;
      const user = await Users.findByIdAndUpdate(
        req.params.id,
        { active },
        { new: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.json(user);
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      res.status(500).json({ error: 'Error al actualizar estado' });
    }
  }
}; 