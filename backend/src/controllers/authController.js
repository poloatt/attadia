import { Users } from '../models/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import { initializeSampleData } from '../config/initData.js';

const generateTokens = (user) => {
  const now = Math.floor(Date.now() / 1000);
  
  // Asegurarnos de que tenemos todos los campos necesarios del usuario
  const userInfo = {
    id: user._id.toString(),
    email: user.email,
    nombre: user.nombre,
    role: user.role,
    googleId: user.googleId,
    activo: user.activo
  };

  const payload = {
    user: userInfo,  // Incluir toda la información del usuario
    exp: now + (24 * 60 * 60), // 24 horas
    iat: now,
    type: 'access'
  };

  console.log('Generando token con payload:', {
    ...payload,
    jwtSecret: config.jwtSecret ? 'configurado' : 'no configurado'
  });

  const refreshPayload = {
    user: { id: userInfo.id },  // Solo incluir el ID para el refresh token
    exp: now + (7 * 24 * 60 * 60), // 7 días
    iat: now,
    type: 'refresh'
  };

  const token = jwt.sign(payload, config.jwtSecret);
  const refreshToken = jwt.sign(refreshPayload, config.refreshTokenSecret);

  console.log('Tokens generados:', {
    token: token.substring(0, 20) + '...',
    refreshToken: refreshToken.substring(0, 20) + '...',
    tokenLength: token.length,
    refreshTokenLength: refreshToken.length
  });
  
  return { token, refreshToken };
};

export const authController = {
  register: async (req, res) => {
    try {
      const { nombre, email, password, pais } = req.body;

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
        password: hashedPassword,
        role: 'USER',
        pais: pais || 'AR'
      });

      // Inicializar datos de ejemplo para el nuevo usuario
      console.log('Inicializando datos de ejemplo para nuevo usuario:', user._id);
      await initializeSampleData(user._id);

      // Generar tokens
      const { token, refreshToken } = generateTokens(user);

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
      const { token, refreshToken } = generateTokens(user);

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
      const tokens = generateTokens(user);
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
      console.log('Check de autenticación:', {
        user: req.user ? {
          id: req.user._id || req.user.id,
          email: req.user.email,
          role: req.user.role
        } : null,
        headers: {
          authorization: req.headers.authorization ? 'presente' : 'ausente'
        }
      });

      if (!req.user) {
        console.log('No hay usuario en la request');
        return res.json({ authenticated: false });
      }

      // Obtener el ID del usuario del token
      const userId = req.user.id || req.user._id;
      console.log('Buscando usuario con ID:', userId);
      
      const user = await Users.findById(userId)
        .select('-password')
        .lean();

      if (!user) {
        console.log('Usuario no encontrado en la base de datos');
        return res.json({ authenticated: false });
      }

      console.log('Usuario encontrado:', {
        id: user._id,
        email: user.email,
        role: user.role
      });

      // Asegurarnos de enviar todos los campos necesarios
      res.json({
        authenticated: true,
        user: {
          id: user._id.toString(),
          nombre: user.nombre,
          email: user.email,
          role: user.role,
          googleId: user.googleId,
          preferences: user.preferences || {},
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          telefono: user.telefono,
          activo: user.activo
        }
      });
    } catch (error) {
      console.error('Error en check:', error);
      res.status(500).json({ error: 'Error al verificar la autenticación' });
    }
  },

  googleCallback: async (req, res) => {
    try {
      console.log('Iniciando callback de Google con datos:', {
        user: req.user ? {
          id: req.user._id,
          email: req.user.email,
          nombre: req.user.nombre
        } : null
      });

      if (!req.user) {
        console.error('No se recibió información del usuario');
        return res.redirect(`${config.frontendUrl}/auth/callback?error=no_user_info`);
      }

      // Obtener país del perfil de Google, sesión o body (si está disponible)
      let pais = req.body?.pais || req.session?.pais || req.user.pais || 'AR';
      // Si el usuario ya existe, actualizar el país si es necesario
      if (req.user && req.user._id) {
        const userDoc = await Users.findById(req.user._id);
        if (userDoc && userDoc.pais !== pais) {
          userDoc.pais = pais;
          await userDoc.save();
        }
      }

      // Generar tokens
      const { token, refreshToken } = generateTokens(req.user);

      // Redirigir al frontend con los tokens
      const redirectUrl = new URL('/auth/callback', config.frontendUrl);
      redirectUrl.searchParams.append('token', token);
      redirectUrl.searchParams.append('refreshToken', refreshToken);

      console.log('Redirigiendo al frontend:', {
        url: redirectUrl.toString().replace(/token=[^&]+/, 'token=REDACTED')
      });

      res.redirect(redirectUrl.toString());
    } catch (error) {
      console.error('Error en callback de Google:', error);
      res.redirect(`${config.frontendUrl}/auth/callback?error=server_error`);
    }
  }
};