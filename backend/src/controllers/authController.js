import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

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
          error: 'El email ya está registrado'
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
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
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
      
      // Log para debugging
      console.log('Intento de login:', { email });

      const user = await prisma.user.findUnique({ 
        where: { email } 
      });

      // Log para debugging
      console.log('Usuario encontrado:', user ? 'sí' : 'no');

      if (!user || !await bcrypt.compare(password, user.password)) {
        console.log('Credenciales inválidas');
        return res.status(401).json({ 
          error: 'Credenciales inválidas' 
        });
      }

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

      // Log para debugging
      console.log('Login exitoso para:', email);

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({ 
        error: 'Error en el servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  googleCallback: async (req, res) => {
    try {
      const token = jwt.sign(
        { id: req.user.id, email: req.user.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
      });

      // Redirigir al frontend
      res.redirect(process.env.FRONTEND_URL);
    } catch (error) {
      console.error('Error en Google callback:', error);
      res.redirect('/login?error=google_auth_failed');
    }
  }
}; 