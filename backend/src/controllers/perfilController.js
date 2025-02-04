import { Users } from '../models/index.js';
import bcrypt from 'bcrypt';

export const perfilController = {
  getPerfil: async (req, res) => {
    try {
      const user = await Users.findById(req.user.id)
        .select('-password');
      res.json(user);
    } catch (error) {
      console.error('Error al obtener perfil:', error);
      res.status(500).json({ error: 'Error al obtener perfil' });
    }
  },

  updatePerfil: async (req, res) => {
    try {
      const { nombre, email } = req.body;
      const user = await Users.findByIdAndUpdate(
        req.user.id,
        { nombre, email },
        { new: true }
      ).select('-password');
      res.json(user);
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      res.status(500).json({ error: 'Error al actualizar perfil' });
    }
  },

  updatePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await Users.findById(req.user.id);

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Contraseña actual incorrecta' });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      await user.save();

      res.json({ message: 'Contraseña actualizada correctamente' });
    } catch (error) {
      console.error('Error al actualizar contraseña:', error);
      res.status(500).json({ error: 'Error al actualizar contraseña' });
    }
  },

  deletePerfil: async (req, res) => {
    try {
      await Users.findByIdAndDelete(req.user.id);
      res.json({ message: 'Perfil eliminado correctamente' });
    } catch (error) {
      console.error('Error al eliminar perfil:', error);
      res.status(500).json({ error: 'Error al eliminar perfil' });
    }
  },

  getPreferences: async (req, res) => {
    try {
      const user = await Users.findById(req.user.id)
        .select('preferences');
      res.json(user.preferences);
    } catch (error) {
      console.error('Error al obtener preferencias:', error);
      res.status(500).json({ error: 'Error al obtener preferencias' });
    }
  },

  updatePreferences: async (req, res) => {
    try {
      const user = await Users.findByIdAndUpdate(
        req.user.id,
        { preferences: req.body },
        { new: true }
      ).select('preferences');
      res.json(user.preferences);
    } catch (error) {
      console.error('Error al actualizar preferencias:', error);
      res.status(500).json({ error: 'Error al actualizar preferencias' });
    }
  }
}; 