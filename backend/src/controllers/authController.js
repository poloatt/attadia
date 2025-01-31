import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import passport from 'passport';

const prisma = new PrismaClient();

export const authController = {
  register: async (req, res) => {
    try {
      const { email, password, name } = req.body;
      
      // Verificar si el usuario ya existe
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({
          error: 'Email already registered'
        });
      }

      // Hashear la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Crear usuario
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name
        }
      });

      // Generar token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Enviar token en cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
      });

      res.status(201).json({
        id: user.id,
        email: user.email,
        name: user.name
      });
    } catch (error) {
      console.error('Error en registro:', error);
      res.status(500).json({
        error: 'Error al registrar usuario'
      });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Validar que email existe
      if (!email) {
        return res.status(400).json({ 
          error: 'El email es requerido' 
        });
      }

      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generar token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Enviar token en cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
      });

      res.json({
        id: user.id,
        email: user.email,
        name: user.name
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Error en el servidor' });
    }
  },

  googleCallback: async (req, res, next) => {
    try {
      passport.authenticate('google', { session: false }, async (err, user) => {
        if (err) {
          console.error('Error en callback de Google:', err);
          return res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed`);
        }

        if (!user) {
          return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_user`);
        }

        const token = jwt.sign(
          { id: user.id, email: user.email },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );

        res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 24 * 60 * 60 * 1000
        });

        res.redirect(process.env.FRONTEND_URL);
      })(req, res, next);
    } catch (error) {
      console.error('Error en Google callback:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed`);
    }
  },

  getCurrentUser: async (req, res) => {
    try {
      console.log('getCurrentUser - Request recibido'); // Debug log
      
      if (!req.user) {
        console.log('No hay usuario en el request'); // Debug log
        return res.status(401).json({ error: 'No autenticado' });
      }

      // Eliminar la contraseña antes de enviar
      const { password, ...userWithoutPassword } = req.user;
      
      console.log('Enviando usuario:', userWithoutPassword); // Debug log
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error('Error al obtener usuario actual:', error);
      res.status(500).json({ 
        error: 'Error al obtener usuario',
        details: error.message 
      });
    }
  },

  logout: async (req, res) => {
    try {
      // Limpiar la cookie del token
      res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });

      res.json({ message: 'Logout exitoso' });
    } catch (error) {
      console.error('Error en logout:', error);
      res.status(500).json({ error: 'Error al cerrar sesión' });
    }
  },

  googleAuth: async (req, res, next) => {
    try {
      console.log('Iniciando autenticación Google');
      passport.authenticate('google', {
        scope: ['profile', 'email'],
        prompt: 'select_account'
      })(req, res, next);
    } catch (error) {
      console.error('Error en autenticación Google:', error);
      res.status(500).json({ error: 'Error en autenticación con Google' });
    }
  },

  me: async (req, res) => {
    try {
      // El usuario ya está en req.user gracias al middleware
      res.json(req.user);
    } catch (error) {
      console.error('Error in me controller:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}; 