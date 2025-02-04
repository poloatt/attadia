import { Users } from '../models/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config/config.js';

const generateTokens = (userId) => {
  const token = jwt.sign({ user: { id: userId } }, config.jwtSecret, { expiresIn: '24h' });
  const refreshToken = jwt.sign({ user: { id: userId } }, config.refreshTokenSecret, { expiresIn: '7d' });
  return { token, refreshToken };
};

export const authController = {
  register: async (req, res) => {
    try {
      const { nombre, email, password } = req.body;

      // Validación de campos
      if (!nombre || !email || !password) {
        return res.status(400).json({ 
          error: 'Todos los campos son requeridos',
          details: {
            nombre: !nombre ? 'El nombre es requerido' : null,
            email: !email ? 'El email es requerido' : null,
            password: !password ? 'La contraseña es requerida' : null
          }
        });
      }

      // Verificar si el usuario ya existe
      let user = await Users.findOne({ email });
      if (user) {
        return res.status(400).json({ error: 'El usuario ya existe' });
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Formato de email inválido' });
      }

      // Validar contraseña
      if (password.length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
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

      // Generar tokens
      const { token, refreshToken } = generateTokens(user._id);

      res.json({ token, refreshToken });
    } catch (error) {
      console.error('Error en registro:', error);
      res.status(500).json({ error: 'Error en el registro' });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Validación de campos
      if (!email || !password) {
        return res.status(400).json({ 
          error: 'Todos los campos son requeridos',
          details: {
            email: !email ? 'El email es requerido' : null,
            password: !password ? 'La contraseña es requerida' : null
          }
        });
      }

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

      // Generar tokens
      const { token, refreshToken } = generateTokens(user._id);

      res.json({ token, refreshToken });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({ error: 'Error en el login' });
    }
  },

  refreshToken: async (req, res) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token no proporcionado' });
      }

      // Verificar refresh token
      const decoded = jwt.verify(refreshToken, config.refreshTokenSecret);
      const user = await Users.findById(decoded.user.id);

      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Generar nuevos tokens
      const tokens = generateTokens(user._id);
      res.json(tokens);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Refresh token expirado' });
      }
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Refresh token inválido' });
      }
      console.error('Error en refresh token:', error);
      res.status(500).json({ error: 'Error al refrescar el token' });
    }
  },

  logout: async (req, res) => {
    try {
      // Aquí podrías implementar una lista negra de tokens si lo deseas
      res.clearCookie('token');
      res.json({ message: 'Sesión cerrada correctamente' });
    } catch (error) {
      console.error('Error en logout:', error);
      res.status(500).json({ error: 'Error al cerrar sesión' });
    }
  },

  check: async (req, res) => {
    try {
      const user = await Users.findById(req.user.id).select('-password');
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      res.json(user);
    } catch (error) {
      console.error('Error en check:', error);
      res.status(500).json({ error: 'Error al verificar la autenticación' });
    }
  },

  googleCallback: async (req, res) => {
    try {
      console.log('Iniciando callback de Google');
      
      // El usuario ya viene autenticado por Passport
      if (!req.user) {
        console.error('No se recibió información del usuario de Google');
        return res.redirect(`${config.frontendUrl}/auth/error?message=google_auth_failed`);
      }

      // Generar tokens JWT
      const { token, refreshToken } = generateTokens(req.user._id);

      // URL del frontend
      console.log('URL del frontend:', config.frontendUrl);

      // Redirigir al frontend con el token
      const redirectUrl = `${config.frontendUrl}/auth/callback?token=${token}`;
      console.log('Redirigiendo a:', redirectUrl);
      
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Error en Google callback:', error);
      res.redirect(`${config.frontendUrl}/auth/error?message=server_error`);
    }
  }
};