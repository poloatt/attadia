import { Users } from '../models/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const authController = {
  register: async (req, res) => {
    try {
      const { nombre, email, password } = req.body;

      // Verificar si el usuario ya existe
      let user = await Users.findOne({ email });
      if (user) {
        return res.status(400).json({ error: 'El usuario ya existe' });
      }

      // Encriptar contraseña
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Crear usuario
      user = await Users.create({
        nombre,
        email,
        password: hashedPassword
      });

      // Generar JWT
      const payload = {
        user: {
          id: user._id
        }
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '24h'
      });

      res.json({ token });
    } catch (error) {
      console.error('Error en registro:', error);
      res.status(500).json({ error: 'Error en el registro' });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Verificar si el usuario existe
      const user = await Users.findOne({ email });
      if (!user) {
        return res.status(400).json({ error: 'Credenciales inválidas' });
      }

      // Verificar contraseña
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Credenciales inválidas' });
      }

      // Generar JWT
      const payload = {
        user: {
          id: user._id
        }
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '24h'
      });

      res.json({ token });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({ error: 'Error en el login' });
    }
  },

  logout: (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Sesión cerrada correctamente' });
  }
};