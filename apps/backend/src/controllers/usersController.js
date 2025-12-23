import { Users, Rutinas } from '../models/index.js';
import bcrypt from 'bcryptjs';
import { timezoneUtils } from '../models/BaseSchema.js';

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
      
      // Log para debug: ver qué se está devolviendo
      const configKeys = Object.keys(user.preferences.rutinasConfig).filter(k => k !== '_metadata');
      const totalHabits = configKeys.reduce((acc, section) => {
        const sectionConfig = user.preferences.rutinasConfig[section];
        return acc + (sectionConfig ? Object.keys(sectionConfig).length : 0);
      }, 0);
      console.log(`[usersController] getHabitPreferences: returning ${totalHabits} habit configs across ${configKeys.length} sections`);
      // Log detallado de cada sección
      configKeys.forEach(section => {
        const sectionConfig = user.preferences.rutinasConfig[section];
        const habitIds = sectionConfig ? Object.keys(sectionConfig) : [];
        console.log(`[usersController] getHabitPreferences - ${section}: ${habitIds.length} habits`, habitIds);
      });
      
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
          const tipoNorm = (config.tipo || 'DIARIO').toUpperCase();
          // Para DIARIO/SEMANAL/MENSUAL el periodo debe ser coherente con el tipo.
          // Para PERSONALIZADO respetamos el periodo enviado (con fallback).
          const periodoNorm = (() => {
            if (tipoNorm === 'DIARIO') return 'CADA_DIA';
            if (tipoNorm === 'SEMANAL') return 'CADA_SEMANA';
            if (tipoNorm === 'MENSUAL') return 'CADA_MES';
            return config.periodo || 'CADA_DIA';
          })();

          const normalizedConfig = {
            tipo: tipoNorm,
            frecuencia: Number(config.frecuencia || 1),
            periodo: periodoNorm,
            activo: config.activo !== undefined ? config.activo : true,
            diasSemana: config.diasSemana || [],
            diasMes: config.diasMes || [],
            esPreferenciaUsuario: true,
            ultimaActualizacion: new Date().toISOString()
          };
          
          // Actualizar la configuración del ítem
          // IMPORTANTE: Asegurar que la sección existe como objeto
          if (!user.preferences.rutinasConfig[section]) {
            user.preferences.rutinasConfig[section] = {};
          }
          user.preferences.rutinasConfig[section][itemId] = normalizedConfig;
          
          // CRÍTICO: Marcar como modificado para que Mongoose guarde campos dinámicos en Schema.Types.Mixed
          user.markModified(`preferences.rutinasConfig.${section}.${itemId}`);
          user.markModified(`preferences.rutinasConfig.${section}`);
          user.markModified('preferences.rutinasConfig');
          
          console.log(`[usersController] Config saved for ${section}.${itemId}:`, JSON.stringify(normalizedConfig));
          // Log para verificar que se guardó en el objeto
          console.log(`[usersController] Verificando guardado - ${section}.${itemId} exists:`, !!user.preferences.rutinasConfig[section][itemId]);
        });
      });
      
      // Actualizar metadata
      user.preferences.rutinasConfig._metadata = {
        ...(user.preferences.rutinasConfig._metadata || {}),
        lastUpdated: new Date(),
        version: ((user.preferences.rutinasConfig._metadata?.version || 0) + 1)
      };
      
      // CRÍTICO: Marcar rutinasConfig como modificado para que Mongoose guarde campos dinámicos
      // Esto es necesario porque Schema.Types.Mixed requiere markModified para campos anidados
      user.markModified('preferences.rutinasConfig');
      
      // Guardar los cambios
      await user.save();
      
      // Verificar que los cambios se guardaron correctamente
      const savedUser = await Users.findById(req.user.id)
        .select('preferences.rutinasConfig')
        .lean();
      Object.entries(habits).forEach(([section, items]) => {
        if (section === '_metadata') return;
        Object.keys(items).forEach(itemId => {
          const savedConfig = savedUser?.preferences?.rutinasConfig?.[section]?.[itemId];
          console.log(`[usersController] Post-save verification - ${section}.${itemId}:`, savedConfig ? 'EXISTS' : 'MISSING', savedConfig ? JSON.stringify(savedConfig).substring(0, 100) : '');
        });
      });

      // --- Aplicar cambios a rutinas existentes desde HOY (sin tocar el pasado) ---
      // Se activa vía query (?applyFrom=today) o body (applyFrom: 'today')
      const applyFrom = (req.query?.applyFrom || req.body?.applyFrom || '').toString().toLowerCase();
      let appliedToRutinas = null;

      if (applyFrom === 'today') {
        try {
          const timezone = timezoneUtils.getUserTimezone(user);
          const todayStart = timezoneUtils.normalizeToStartOfDay(new Date(), timezone);

          if (todayStart) {
            const setOps = {};
            // Setear solo campos de cadencia (preserva contadores/historial del item en Rutinas.config)
            Object.entries(habits).forEach(([section, items]) => {
              if (section === '_metadata' || !items || typeof items !== 'object') return;
              Object.entries(items).forEach(([itemId, config]) => {
                const normalizedConfig = user.preferences.rutinasConfig?.[section]?.[itemId];
                if (!normalizedConfig) return;

                setOps[`config.${section}.${itemId}.tipo`] = normalizedConfig.tipo;
                setOps[`config.${section}.${itemId}.frecuencia`] = normalizedConfig.frecuencia;
                setOps[`config.${section}.${itemId}.periodo`] = normalizedConfig.periodo;
                setOps[`config.${section}.${itemId}.activo`] = normalizedConfig.activo;
                setOps[`config.${section}.${itemId}.diasSemana`] = normalizedConfig.diasSemana || [];
                setOps[`config.${section}.${itemId}.diasMes`] = normalizedConfig.diasMes || [];
              });
            });

            if (Object.keys(setOps).length > 0) {
              const result = await Rutinas.updateMany(
                { usuario: req.user.id, fecha: { $gte: todayStart } },
                { $set: setOps }
              );
              appliedToRutinas = {
                from: todayStart.toISOString(),
                matched: result.matchedCount ?? result.n ?? 0,
                modified: result.modifiedCount ?? result.nModified ?? 0
              };
            } else {
              appliedToRutinas = { from: todayStart.toISOString(), matched: 0, modified: 0 };
            }
          }
        } catch (e) {
          // No romper la respuesta principal si falla la propagación; devolvemos indicador
          appliedToRutinas = { error: e?.message || 'Error aplicando cambios a rutinas desde hoy' };
        }
      }
      
      res.json({
        message: 'Preferencias de hábitos actualizadas correctamente',
        updated: true,
        appliedToRutinas,
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

  // ========== ENDPOINTS PARA GESTIÓN DE HÁBITOS PERSONALIZADOS ==========
  
  /**
   * Obtener hábitos personalizados del usuario
   * GET /api/users/habits
   */
  getHabits: async (req, res) => {
    try {
      const user = await Users.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Asegurar que customHabits existe
      if (!user.customHabits) {
        // Inicializar con defaults si no existe
        user.customHabits = {
          bodyCare: [
            { id: 'bath', label: 'Ducha', icon: 'Bathtub', activo: true, orden: 0 },
            { id: 'skinCareDay', label: 'Cuidado facial día', icon: 'PersonOutline', activo: true, orden: 1 },
            { id: 'skinCareNight', label: 'Cuidado facial noche', icon: 'Nightlight', activo: true, orden: 2 },
            { id: 'bodyCream', label: 'Crema corporal', icon: 'Spa', activo: true, orden: 3 }
          ],
          nutricion: [
            { id: 'cocinar', label: 'Cocinar', icon: 'Restaurant', activo: true, orden: 0 },
            { id: 'agua', label: 'Beber agua', icon: 'WaterDrop', activo: true, orden: 1 },
            { id: 'protein', label: 'Proteína', icon: 'SetMeal', activo: true, orden: 2 },
            { id: 'meds', label: 'Medicamentos', icon: 'Medication', activo: true, orden: 3 }
          ],
          ejercicio: [
            { id: 'meditate', label: 'Meditar', icon: 'SelfImprovement', activo: true, orden: 0 },
            { id: 'stretching', label: 'Correr', icon: 'DirectionsRun', activo: true, orden: 1 },
            { id: 'gym', label: 'Gimnasio', icon: 'FitnessCenter', activo: true, orden: 2 },
            { id: 'cardio', label: 'Bicicleta', icon: 'DirectionsBike', activo: true, orden: 3 }
          ],
          cleaning: [
            { id: 'bed', label: 'Hacer la cama', icon: 'Hotel', activo: true, orden: 0 },
            { id: 'platos', label: 'Lavar platos', icon: 'Dining', activo: true, orden: 1 },
            { id: 'piso', label: 'Limpiar piso', icon: 'CleaningServices', activo: true, orden: 2 },
            { id: 'ropa', label: 'Lavar ropa', icon: 'LocalLaundryService', activo: true, orden: 3 }
          ]
        };
        await user.save();
      }

      res.json(user.customHabits);
    } catch (error) {
      console.error('[usersController] Error al obtener hábitos:', error);
      res.status(500).json({ 
        error: 'Error al obtener hábitos',
        message: error.message
      });
    }
  },

  /**
   * Crear nuevo hábito personalizado
   * POST /api/users/habits
   * Body: { section, habit: { id, label, icon, activo, orden } }
   */
  addHabit: async (req, res) => {
    try {
      const { section, habit } = req.body;

      if (!section || !['bodyCare', 'nutricion', 'ejercicio', 'cleaning'].includes(section)) {
        return res.status(400).json({ error: 'Sección inválida' });
      }

      if (!habit || !habit.id || !habit.label || !habit.icon) {
        return res.status(400).json({ error: 'Datos de hábito incompletos (requiere: id, label, icon)' });
      }

      const user = await Users.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Inicializar customHabits si no existe
      if (!user.customHabits) {
        user.customHabits = {
          bodyCare: [],
          nutricion: [],
          ejercicio: [],
          cleaning: []
        };
      }

      // Verificar que el ID no exista ya en la sección
      if (user.customHabits[section].some(h => h.id === habit.id)) {
        return res.status(409).json({ error: 'Ya existe un hábito con ese ID en esta sección' });
      }

      // Agregar el nuevo hábito
      const newHabit = {
        id: habit.id,
        label: habit.label,
        icon: habit.icon,
        activo: habit.activo !== undefined ? habit.activo : true,
        orden: habit.orden !== undefined ? habit.orden : user.customHabits[section].length
      };

      user.customHabits[section].push(newHabit);
      await user.save();

      res.json({ message: 'Hábito creado correctamente', habit: newHabit });
    } catch (error) {
      console.error('[usersController] Error al crear hábito:', error);
      res.status(500).json({ 
        error: 'Error al crear hábito',
        message: error.message
      });
    }
  },

  /**
   * Actualizar hábito existente
   * PUT /api/users/habits/:habitId
   * Body: { section, habit: { label?, icon?, activo?, orden? } }
   */
  updateHabit: async (req, res) => {
    try {
      const { habitId } = req.params;
      const { section, habit } = req.body;

      if (!section || !['bodyCare', 'nutricion', 'ejercicio', 'cleaning'].includes(section)) {
        return res.status(400).json({ error: 'Sección inválida' });
      }

      if (!habit || Object.keys(habit).length === 0) {
        return res.status(400).json({ error: 'No se proporcionaron datos para actualizar' });
      }

      const user = await Users.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      if (!user.customHabits || !user.customHabits[section]) {
        return res.status(404).json({ error: 'Sección no encontrada' });
      }

      const habitIndex = user.customHabits[section].findIndex(h => h.id === habitId);
      if (habitIndex === -1) {
        return res.status(404).json({ error: 'Hábito no encontrado' });
      }

      // Actualizar solo los campos proporcionados
      if (habit.label !== undefined) user.customHabits[section][habitIndex].label = habit.label;
      if (habit.icon !== undefined) user.customHabits[section][habitIndex].icon = habit.icon;
      if (habit.activo !== undefined) user.customHabits[section][habitIndex].activo = habit.activo;
      if (habit.orden !== undefined) user.customHabits[section][habitIndex].orden = habit.orden;

      await user.save();

      res.json({ 
        message: 'Hábito actualizado correctamente', 
        habit: user.customHabits[section][habitIndex] 
      });
    } catch (error) {
      console.error('[usersController] Error al actualizar hábito:', error);
      res.status(500).json({ 
        error: 'Error al actualizar hábito',
        message: error.message
      });
    }
  },

  /**
   * Eliminar hábito
   * DELETE /api/users/habits/:habitId
   * Body: { section }
   */
  deleteHabit: async (req, res) => {
    try {
      const { habitId } = req.params;
      const { section } = req.body;

      if (!section || !['bodyCare', 'nutricion', 'ejercicio', 'cleaning'].includes(section)) {
        return res.status(400).json({ error: 'Sección inválida' });
      }

      const user = await Users.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      if (!user.customHabits || !user.customHabits[section]) {
        return res.status(404).json({ error: 'Sección no encontrada' });
      }

      // Validar que no se eliminen todos los hábitos de una sección
      if (user.customHabits[section].length <= 1) {
        return res.status(400).json({ error: 'No se puede eliminar el último hábito de la sección' });
      }

      const habitIndex = user.customHabits[section].findIndex(h => h.id === habitId);
      if (habitIndex === -1) {
        return res.status(404).json({ error: 'Hábito no encontrado' });
      }

      user.customHabits[section].splice(habitIndex, 1);
      await user.save();

      res.json({ message: 'Hábito eliminado correctamente' });
    } catch (error) {
      console.error('[usersController] Error al eliminar hábito:', error);
      res.status(500).json({ 
        error: 'Error al eliminar hábito',
        message: error.message
      });
    }
  },

  /**
   * Reordenar hábitos en una sección
   * PUT /api/users/habits/reorder
   * Body: { section, habitIds: [id1, id2, ...] }
   */
  reorderHabits: async (req, res) => {
    try {
      const { section, habitIds } = req.body;

      console.log('[usersController.reorderHabits] Recibido:', { section, habitIds, bodyKeys: Object.keys(req.body), bodyType: typeof req.body });

      // Validar sección
      if (!section) {
        console.error('[usersController.reorderHabits] Sección faltante');
        return res.status(400).json({ error: 'Sección inválida', received: section });
      }
      
      if (!['bodyCare', 'nutricion', 'ejercicio', 'cleaning'].includes(section)) {
        console.error('[usersController.reorderHabits] Sección no válida:', section);
        return res.status(400).json({ error: 'Sección inválida', received: section, validSections: ['bodyCare', 'nutricion', 'ejercicio', 'cleaning'] });
      }

      // Validar habitIds
      if (!habitIds) {
        console.error('[usersController.reorderHabits] habitIds faltante');
        return res.status(400).json({ error: 'Se requiere un array de IDs de hábitos', received: habitIds });
      }
      
      if (!Array.isArray(habitIds)) {
        console.error('[usersController.reorderHabits] habitIds no es un array:', typeof habitIds, habitIds);
        return res.status(400).json({ error: 'Se requiere un array de IDs de hábitos', received: { type: typeof habitIds, value: habitIds } });
      }
      
      if (habitIds.length === 0) {
        console.error('[usersController.reorderHabits] habitIds está vacío');
        return res.status(400).json({ error: 'Se requiere al menos un ID de hábito', received: habitIds });
      }

      const user = await Users.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Asegurar que customHabits existe y está inicializado
      if (!user.customHabits) {
        user.customHabits = {
          bodyCare: [],
          nutricion: [],
          ejercicio: [],
          cleaning: []
        };
      }

      // Asegurar que la sección existe y es un array
      if (!user.customHabits[section]) {
        user.customHabits[section] = [];
      }

      // Convertir a array si no lo es (por si acaso)
      if (!Array.isArray(user.customHabits[section])) {
        console.warn('[usersController.reorderHabits] customHabits[section] no es un array, convirtiendo...');
        user.customHabits[section] = Object.values(user.customHabits[section] || {});
      }

      // Verificar que todos los IDs existen
      const existingIds = user.customHabits[section].map(h => {
        const id = h.id || h._id?.toString() || h._id;
        return id ? id.toString() : null;
      }).filter(Boolean);
      
      // Normalizar habitIds a strings para comparación
      const normalizedHabitIds = habitIds.map(id => {
        if (id == null || id === '') return null;
        return id.toString();
      }).filter(Boolean);
      
      console.log('[usersController.reorderHabits] Comparando IDs:', {
        existingIds,
        receivedIds: normalizedHabitIds,
        existingCount: existingIds.length,
        receivedCount: normalizedHabitIds.length,
        sectionHabits: user.customHabits[section].map(h => ({ id: h.id, _id: h._id, label: h.label }))
      });
      
      // Verificar que todos los IDs recibidos existen en customHabits
      const invalidIds = normalizedHabitIds.filter(id => !existingIds.includes(id));
      
      if (invalidIds.length > 0) {
        const debugInfo = {
          invalidIds, 
          existingIds, 
          received: normalizedHabitIds,
          sectionHabits: user.customHabits[section].map(h => ({ 
            id: h.id, 
            _id: h._id?.toString(), 
            label: h.label,
            idType: typeof h.id,
            _idType: typeof h._id
          })),
          receivedCount: normalizedHabitIds.length,
          existingCount: existingIds.length
        };
        console.error('[usersController.reorderHabits] IDs inválidos:', debugInfo);
        return res.status(400).json({ 
          error: 'Algunos IDs no existen en customHabits', 
          message: `Los siguientes IDs no se encontraron en customHabits: ${invalidIds.join(', ')}`,
          invalidIds,
          existingIds,
          received: normalizedHabitIds,
          sectionHabits: user.customHabits[section].map(h => ({ id: h.id, _id: h._id?.toString(), label: h.label })),
          debug: debugInfo
        });
      }
      
      // Verificar que el número de IDs coincide (pero no fallar si hay diferencia, solo advertir)
      if (normalizedHabitIds.length !== existingIds.length) {
        console.warn('[usersController.reorderHabits] Número de IDs no coincide:', {
          received: normalizedHabitIds.length,
          existing: existingIds.length,
          receivedIds: normalizedHabitIds,
          existingIds: existingIds
        });
        // Si hay más IDs recibidos que existentes, puede ser un error
        if (normalizedHabitIds.length > existingIds.length) {
          return res.status(400).json({ 
            error: 'Se recibieron más IDs de los que existen en customHabits',
            received: normalizedHabitIds.length,
            existing: existingIds.length,
            receivedIds: normalizedHabitIds,
            existingIds: existingIds
          });
        }
      }

      // Verificar que el número de IDs coincide
      if (habitIds.length !== existingIds.length) {
        console.warn('[usersController.reorderHabits] Número de IDs no coincide:', {
          received: habitIds.length,
          existing: existingIds.length
        });
      }

      // Reordenar según el array proporcionado
      const reorderedHabits = normalizedHabitIds.map((id, index) => {
        const habit = user.customHabits[section].find(h => {
          const habitId = (h.id || h._id?.toString() || h._id)?.toString();
          return habitId === id;
        });
        if (!habit) {
          console.error('[usersController.reorderHabits] Hábito no encontrado durante reordenamiento:', { id, index, availableHabits: user.customHabits[section].map(h => ({ id: h.id, _id: h._id?.toString() })) });
          throw new Error(`Hábito con ID ${id} no encontrado`);
        }
        const habitObj = habit.toObject ? habit.toObject() : (typeof habit === 'object' ? { ...habit } : habit);
        return { 
          ...habitObj, 
          orden: index 
        };
      });

      user.customHabits[section] = reorderedHabits;
      await user.save();

      console.log('[usersController.reorderHabits] Hábitos reordenados correctamente');

      res.json({ 
        message: 'Hábitos reordenados correctamente', 
        habits: user.customHabits[section] 
      });
    } catch (error) {
      console.error('[usersController] Error al reordenar hábitos:', error);
      res.status(500).json({ 
        error: 'Error al reordenar hábitos',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  },

  /**
   * Restablecer hábitos a defaults
   * POST /api/users/habits/reset
   */
  resetHabits: async (req, res) => {
    try {
      const user = await Users.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Restablecer a defaults
      user.customHabits = {
        bodyCare: [
          { id: 'bath', label: 'Ducha', icon: 'Bathtub', activo: true, orden: 0 },
          { id: 'skinCareDay', label: 'Cuidado facial día', icon: 'PersonOutline', activo: true, orden: 1 },
          { id: 'skinCareNight', label: 'Cuidado facial noche', icon: 'Nightlight', activo: true, orden: 2 },
          { id: 'bodyCream', label: 'Crema corporal', icon: 'Spa', activo: true, orden: 3 }
        ],
        nutricion: [
          { id: 'cocinar', label: 'Cocinar', icon: 'Restaurant', activo: true, orden: 0 },
          { id: 'agua', label: 'Beber agua', icon: 'WaterDrop', activo: true, orden: 1 },
          { id: 'protein', label: 'Proteína', icon: 'SetMeal', activo: true, orden: 2 },
          { id: 'meds', label: 'Medicamentos', icon: 'Medication', activo: true, orden: 3 }
        ],
        ejercicio: [
          { id: 'meditate', label: 'Meditar', icon: 'SelfImprovement', activo: true, orden: 0 },
          { id: 'stretching', label: 'Correr', icon: 'DirectionsRun', activo: true, orden: 1 },
          { id: 'gym', label: 'Gimnasio', icon: 'FitnessCenter', activo: true, orden: 2 },
          { id: 'cardio', label: 'Bicicleta', icon: 'DirectionsBike', activo: true, orden: 3 }
        ],
        cleaning: [
          { id: 'bed', label: 'Hacer la cama', icon: 'Hotel', activo: true, orden: 0 },
          { id: 'platos', label: 'Lavar platos', icon: 'Dining', activo: true, orden: 1 },
          { id: 'piso', label: 'Limpiar piso', icon: 'CleaningServices', activo: true, orden: 2 },
          { id: 'ropa', label: 'Lavar ropa', icon: 'LocalLaundryService', activo: true, orden: 3 }
        ]
      };

      await user.save();

      res.json({ 
        message: 'Hábitos restablecidos a valores por defecto', 
        habits: user.customHabits 
      });
    } catch (error) {
      console.error('[usersController] Error al restablecer hábitos:', error);
      res.status(500).json({ 
        error: 'Error al restablecer hábitos',
        message: error.message
      });
    }
  },
}; 