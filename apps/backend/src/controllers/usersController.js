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

  // Métodos CRUD para administración de usuarios
  getAll: async (req, res) => {
    try {
      const { page = 1, limit = 10, sort = '-createdAt', search } = req.query;
      
      const query = {};
      if (search) {
        query.$or = [
          { nombre: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }
      
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort,
        select: '-password'
      };
      
      const result = await Users.paginate(query, options);
      res.json(result);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      res.status(500).json({ error: 'Error al obtener usuarios' });
    }
  },

  getById: async (req, res) => {
    try {
      const user = await Users.findById(req.params.id).select('-password');
      
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      
      res.json(user);
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      res.status(500).json({ error: 'Error al obtener usuario' });
    }
  },

  update: async (req, res) => {
    try {
      const { nombre, email, telefono, role } = req.body;
      
      const user = await Users.findByIdAndUpdate(
        req.params.id,
        { nombre, email, telefono, role },
        { new: true }
      ).select('-password');
      
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      
      res.json(user);
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      res.status(500).json({ error: 'Error al actualizar usuario' });
    }
  },

  delete: async (req, res) => {
    try {
      const user = await Users.findByIdAndDelete(req.params.id);
      
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      
      res.json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      res.status(500).json({ error: 'Error al eliminar usuario' });
    }
  },

  toggleActive: async (req, res) => {
    try {
      const user = await Users.findById(req.params.id);
      
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      
      user.activo = !user.activo;
      await user.save();
      
      res.json({
        message: `Usuario ${user.activo ? 'activado' : 'desactivado'} correctamente`,
        activo: user.activo
      });
    } catch (error) {
      console.error('Error al cambiar estado de usuario:', error);
      res.status(500).json({ error: 'Error al cambiar estado de usuario' });
    }
  },

  updateRutinasConfig: async (req, res) => {
    try {
      const { section, item, config } = req.body;
      
      console.log(`Actualizando configuración global de rutina para ${section}.${item}:`, config);
      
      // Verificar que los campos requeridos están presentes
      if (!section || !item || !config) {
        return res.status(400).json({ 
          error: 'Datos incompletos', 
          message: 'Se requiere section, item y config para actualizar la configuración.' 
        });
      }
      
      // Normalizar los valores de configuración
      const normalizedConfig = {
        ...config,
        tipo: (config.tipo || 'DIARIO').toUpperCase(),
        frecuencia: Number(config.frecuencia || 1),
        activo: config.activo !== undefined ? config.activo : true,
        diasSemana: config.diasSemana || [],
        diasMes: config.diasMes || []
      };
      
      // Si tipo es PERSONALIZADO, asegurar que tiene un periodo válido
      if (normalizedConfig.tipo === 'PERSONALIZADO' && !normalizedConfig.periodo) {
        normalizedConfig.periodo = 'CADA_DIA';
      }
      
      console.log('Configuración normalizada:', normalizedConfig);
      console.log('Tipo de frecuencia:', typeof normalizedConfig.frecuencia, normalizedConfig.frecuencia);
      
      // Construir el path para la actualización
      const updatePath = `preferences.rutinasConfig.${section}.${item}`;
      
      // Crear el objeto de actualización
      const updateData = {
        $set: {
          [updatePath]: normalizedConfig
        }
      };
    
      // Actualizar el usuario
      const user = await Users.findByIdAndUpdate(
        req.user.id,
        updateData,
        { new: true }
      ).select('-password');
      
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      
      // Responder con la configuración actualizada
      res.json({
        message: 'Configuración de rutina actualizada correctamente',
        config: user.preferences.rutinasConfig[section][item]
      });
      
    } catch (error) {
      console.error('Error al actualizar configuración de rutina:', error);
      res.status(500).json({ 
        error: 'Error al actualizar configuración de rutina',
        message: error.message
      });
    }
  },
  
  getDefaultRutinaConfig: async (req, res) => {
    try {
      // Registrar para depuración
      console.log('Obteniendo configuración de rutinas para el usuario:', req.user.id);
      
      // Obtener las preferencias del usuario actual
      const user = await Users.findById(req.user.id)
        .select('preferences.rutinasConfig')
        .lean();
      
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      
      // Si no hay preferencias o configuración de rutinas, devolver una estructura básica
      if (!user.preferences || !user.preferences.rutinasConfig) {
        console.log('No se encontró configuración de rutinas para el usuario, devolviendo estructura básica');
        return res.json({
          bodyCare: {},
          nutricion: {},
          ejercicio: {},
          cleaning: {},
          _metadata: {
            version: 1,
            generated: true,
            createdAt: new Date()
          }
        });
      }
      
      // Crear una copia de la configuración para no modificar la original
      const config = JSON.parse(JSON.stringify(user.preferences.rutinasConfig || {}));
      
      // Asegurarse de que existan todas las secciones necesarias
      const requiredSections = ['bodyCare', 'nutricion', 'ejercicio', 'cleaning'];
      requiredSections.forEach(section => {
        if (!config[section] || typeof config[section] !== 'object') {
          config[section] = {};
        }
      });
      
      // Verificar metadata
      if (!config._metadata) {
        config._metadata = {
          version: 1,
          generated: true,
          createdAt: new Date()
        };
      }
      
      console.log('Config procesada:', JSON.stringify(config, null, 2));
      
      res.json(config);
    } catch (error) {
      console.error('Error al obtener configuración de rutinas:', error);
      // Devolver una estructura básica en caso de error
      return res.json({
        bodyCare: {},
        nutricion: {},
        ejercicio: {},
        cleaning: {},
        _metadata: {
          version: 1,
          generated: true,
          error: true,
          errorMessage: error.message,
          createdAt: new Date()
        }
      });
    }
  },
  
  /** 
   * Actualiza la configuración global de rutinas para el usuario
   */
  updateDefaultRutinaConfig: async (req, res) => {
    try {
      // Verificar que hay un usuario autenticado
      const userId = req.user.id;
      if (!userId) {
        return res.status(401).json({ msg: 'Usuario no autenticado' });
      }

      // Obtener el usuario actual
      const user = await Users.findById(userId);
      if (!user) {
        return res.status(404).json({ msg: 'Usuario no encontrado' });
      }

      console.log('[usersController] Actualizando configuración de rutinas:', JSON.stringify(req.body));

      // Inicializar configuración de rutinas si no existe
      if (!user.rutinasConfig) {
        user.rutinasConfig = {
          _metadata: {
            lastUpdated: new Date(),
            version: 1
          }
        };
      }

      // Para cada sección en el cuerpo de la solicitud
      for (const [seccionKey, seccionData] of Object.entries(req.body)) {
        // Secciones especiales que no son parte de la configuración
        if (seccionKey === '_metadata') continue;

        // Inicializar la sección si no existe
        if (!user.rutinasConfig[seccionKey]) {
          user.rutinasConfig[seccionKey] = {};
        }

        // Para cada ítem en la sección
        for (const [itemKey, itemConfig] of Object.entries(seccionData)) {
          // Normalizar la configuración para garantizar todos los campos necesarios
          const normalizedConfig = {
            activado: typeof itemConfig.activado === 'boolean' ? itemConfig.activado : true,
            frecuencia: {
              valor: parseInt(itemConfig.frecuencia?.valor) || 1,
              tipo: itemConfig.frecuencia?.tipo || 'dias',
              periodo: itemConfig.frecuencia?.periodo || 'cada'
            },
            recordatorio: {
              activado: typeof itemConfig.recordatorio?.activado === 'boolean' 
                ? itemConfig.recordatorio.activado 
                : false,
              hora: itemConfig.recordatorio?.hora || "08:00"
            }
          };

          // Actualizar la configuración del ítem
          user.rutinasConfig[seccionKey][itemKey] = normalizedConfig;
        }
      }

      // Actualizar metadata
      user.rutinasConfig._metadata = {
        lastUpdated: new Date(),
        version: (user.rutinasConfig._metadata?.version || 0) + 1
      };

      // Guardar los cambios
      await user.save();

      res.json({
        msg: 'Configuración de rutinas actualizada correctamente',
        rutinasConfig: user.rutinasConfig
      });
    } catch (error) {
      console.error('[usersController] Error al actualizar configuración de rutinas:', error);
      res.status(500).json({ 
        msg: 'Error al actualizar la configuración de rutinas',
        error: error.message 
      });
    }
  },
  
  deleteAccount: async (req, res) => {
    try {
      // Eliminar el usuario
      const user = await Users.findByIdAndDelete(req.user.id);
      
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      
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
  },

  create: async (req, res) => {
    try {
      const { nombre, email, password, telefono, role } = req.body;
      
      // Verificar si el usuario ya existe
      const usuarioExistente = await Users.findOne({ email });
      if (usuarioExistente) {
        return res.status(400).json({ error: 'El usuario ya existe' });
      }
      
      // Encriptar la contraseña
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Crear el nuevo usuario
      const nuevoUsuario = await Users.create({
        nombre,
        email,
        password: hashedPassword,
        telefono,
        role,
        createdBy: req.user.id
      });
      
      // Devolver el usuario sin la contraseña
      const usuario = nuevoUsuario.toObject();
      delete usuario.password;
      
      res.status(201).json(usuario);
    } catch (error) {
      console.error('Error al crear usuario:', error);
      res.status(500).json({ error: 'Error al crear usuario' });
    }
  },

  /**
   * Obtiene las preferencias de hábitos del usuario
   */
  getHabitPreferences: async (req, res) => {
    try {
      // Obtener el usuario actual
      const user = await Users.findById(req.user.id)
        .select('preferences.rutinasConfig')
        .lean();
      
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      
      // Si no hay preferencias de rutinas, devolver un objeto vacío
      if (!user.preferences || !user.preferences.rutinasConfig) {
        return res.json({
          habits: {},
          _metadata: {
            version: 1,
            createdAt: new Date()
          }
        });
      }
      
      // Devolver las preferencias de rutinas
      res.json({
        habits: user.preferences.rutinasConfig,
        _metadata: user.preferences.rutinasConfig._metadata || {
          version: 1,
          createdAt: new Date()
        }
      });
    } catch (error) {
      console.error('[usersController] Error al obtener preferencias de hábitos:', error);
      res.status(500).json({ 
        error: 'Error al obtener preferencias de hábitos',
        message: error.message
      });
    }
  },
  
  /**
   * Actualiza las preferencias de hábitos específicos
   * Permite actualizar solo los hábitos especificados en la petición,
   * sin sobrescribir otros hábitos
   */
  updateHabitPreferences: async (req, res) => {
    try {
      const { habits } = req.body;
      
      if (!habits || typeof habits !== 'object') {
        return res.status(400).json({ 
          error: 'Datos inválidos',
          message: 'Se requiere un objeto "habits" en el cuerpo de la petición'
        });
      }
      
      console.log('[usersController] Actualizando preferencias de hábitos:', JSON.stringify(habits));
      
      // Obtener el usuario actual
      const user = await Users.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      
      // Inicializar preferencias y rutinasConfig si no existen
      if (!user.preferences) {
        user.preferences = {};
      }
      
      if (!user.preferences.rutinasConfig) {
        user.preferences.rutinasConfig = {
          _metadata: {
            version: 1,
            lastUpdated: new Date()
          }
        };
      }
      
      // Inicializar secciones si no existen
      ['bodyCare', 'nutricion', 'ejercicio', 'cleaning'].forEach(section => {
        if (!user.preferences.rutinasConfig[section]) {
          user.preferences.rutinasConfig[section] = {};
        }
      });
      
      // Actualizar solo los hábitos específicos
      Object.entries(habits).forEach(([section, items]) => {
        if (section === '_metadata') {
          return; // Ignorar metadata
        }
        
        // Asegurarse de que la sección existe
        if (!user.preferences.rutinasConfig[section]) {
          user.preferences.rutinasConfig[section] = {};
        }
        
        // Actualizar cada ítem en la sección
        Object.entries(items).forEach(([itemId, config]) => {
          console.log(`[usersController] Actualizando configuración para ${section}.${itemId}:`, config);
          
          // Normalizar los valores de configuración
          const normalizedConfig = {
            tipo: (config.tipo || 'DIARIO').toUpperCase(),
            frecuencia: Number(config.frecuencia || 1),
            periodo: config.periodo || (
              config.tipo === 'SEMANAL' ? 'CADA_SEMANA' : 
              config.tipo === 'MENSUAL' ? 'CADA_MES' : 'CADA_DIA'
            ),
            activo: config.activo !== undefined ? config.activo : true,
            diasSemana: config.diasSemana || [],
            diasMes: config.diasMes || [],
            esPreferenciaUsuario: true,
            ultimaActualizacion: new Date().toISOString()
          };
          
          // Actualizar la configuración del ítem
          user.preferences.rutinasConfig[section][itemId] = normalizedConfig;
        });
      });
      
      // Actualizar metadata
      user.preferences.rutinasConfig._metadata = {
        ...(user.preferences.rutinasConfig._metadata || {}),
        lastUpdated: new Date(),
        version: ((user.preferences.rutinasConfig._metadata?.version || 0) + 1)
      };
      
      // Guardar los cambios
      await user.save();
      
      res.json({
        message: 'Preferencias de hábitos actualizadas correctamente',
        updated: true,
        // Devolver solo los hábitos actualizados
        updatedHabits: Object.entries(habits).reduce((acc, [section, items]) => {
          if (section === '_metadata') return acc;
          
          acc[section] = {};
          Object.keys(items).forEach(itemId => {
            acc[section][itemId] = user.preferences.rutinasConfig[section][itemId];
          });
          
          return acc;
        }, {})
      });
    } catch (error) {
      console.error('[usersController] Error al actualizar preferencias de hábitos:', error);
      res.status(500).json({ 
        error: 'Error al actualizar preferencias de hábitos',
        message: error.message
      });
    }
  },
}; 