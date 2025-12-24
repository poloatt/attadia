import mongoose from 'mongoose';
import { createSchema, commonFields, timezoneUtils } from './BaseSchema.js';

// Definir el esquema de configuración de cadencia
const cadenciaSchema = {
  tipo: {
    type: String,
    enum: ['DIARIO', 'SEMANAL', 'MENSUAL', 'PERSONALIZADO'],
    default: 'DIARIO'
  },
  periodo: {
    type: String,
    enum: ['CADA_DIA', 'CADA_SEMANA', 'CADA_MES'],
    default: function() {
      // Asignar el periodo predeterminado según el tipo
      if (this.tipo === 'SEMANAL') return 'CADA_SEMANA';
      if (this.tipo === 'MENSUAL') return 'CADA_MES';
      return 'CADA_DIA';
    }
  },
  diasSemana: [{
    type: Number,
    min: 0,
    max: 6
  }],
  diasMes: [{
    type: Number,
    min: 1,
    max: 31
  }],
  frecuencia: {
    type: Number,
    min: 1,
    default: 1,
    get: v => Math.round(v),
    set: v => {
      // Asegurar que siempre se guarde como número
      if (typeof v === 'string') {
        const parsed = parseInt(v, 10);
        return isNaN(parsed) ? 1 : Math.max(1, parsed);
      }
      return typeof v === 'number' ? Math.max(1, v) : 1;
    }
  },
  progresoActual: {
    type: Number,
    default: 0,
    min: 0
  },
  ultimoPeriodo: {
    inicio: Date,
    fin: Date
  },
  completacionesPeriodo: [{
    fecha: Date,
    valor: Number
  }],
  ultimaCompletacion: {
    type: Date
  },
  activo: {
    type: Boolean,
    default: true
  }
};

// Crear esquemas de configuración para cada sección
// IMPORTANTE: Usar Schema.Types.Mixed para permitir hábitos personalizados dinámicos
// Esto permite que los usuarios agreguen nuevos hábitos sin modificar el esquema
const configSchema = {
  bodyCare: { type: mongoose.Schema.Types.Mixed, default: {} },
  nutricion: { type: mongoose.Schema.Types.Mixed, default: {} },
  ejercicio: { type: mongoose.Schema.Types.Mixed, default: {} },
  cleaning: { type: mongoose.Schema.Types.Mixed, default: {} }
};

const rutinaSchema = createSchema({
  fecha: {
    type: Date,
    default: Date.now,
    required: true
  },
  // IMPORTANTE: Usar Schema.Types.Mixed para permitir hábitos personalizados dinámicos
  // Esto permite que los usuarios agreguen nuevos hábitos sin modificar el esquema
  bodyCare: {
    type: mongoose.Schema.Types.Mixed,
    default: () => ({
      bath: false,
      skinCareDay: false,
      skinCareNight: false,
      bodyCream: false
    })
  },
  nutricion: {
    type: mongoose.Schema.Types.Mixed,
    default: () => ({
      cocinar: false,
      agua: false,
      protein: false,
      meds: false
    })
  },
  ejercicio: {
    type: mongoose.Schema.Types.Mixed,
    default: () => ({
      meditate: false,
      stretching: false,
      gym: false,
      cardio: false
    })
  },
  cleaning: {
    type: mongoose.Schema.Types.Mixed,
    default: () => ({
      bed: false,
      platos: false,
      piso: false,
      ropa: false
    })
  },
  config: {
    type: configSchema,
    default: () => ({
      bodyCare: {},
      nutricion: {},
      ejercicio: {},
      cleaning: {}
    }),
    strict: false // Permitir campos dinámicos (hábitos personalizados)
  },
  completitud: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
  },
  completitudPorSeccion: {
    bodyCare: { type: Number, default: 0, min: 0, max: 1 },
    nutricion: { type: Number, default: 0, min: 0, max: 1 },
    ejercicio: { type: Number, default: 0, min: 0, max: 1 },
    cleaning: { type: Number, default: 0, min: 0, max: 1 }
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true
  },
  ...commonFields
});

// Crear un índice compuesto único para fecha y usuario
rutinaSchema.index({ 
  usuario: 1, 
  fecha: 1 
}, { 
  unique: true,
  name: 'usuario_fecha_unique',
  partialFilterExpression: { fecha: { $exists: true } }
});

// Función auxiliar para verificar si un ítem debe mostrarse según su cadencia
rutinaSchema.methods.shouldShowItem = function(section, item) {
  const config = this.config?.[section]?.[item];
  // Si falta configuración para el ítem, por seguridad mostrarlo (evita romper el save/render)
  if (!config) return true;
  const now = new Date();
  const lastCompletion = config.ultimaCompletacion;

  switch (config.tipo) {
    case 'DIARIO':
      if (!lastCompletion) return true;
      const lastCompletionDate = new Date(lastCompletion);
      return lastCompletionDate.getDate() !== now.getDate() ||
             lastCompletionDate.getMonth() !== now.getMonth() ||
             lastCompletionDate.getFullYear() !== now.getFullYear();

    case 'SEMANAL':
      if (!lastCompletion) return true;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      return lastCompletion < weekStart;

    case 'MENSUAL':
      if (!lastCompletion) return true;
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return lastCompletion < monthStart;

    case 'PERSONALIZADO':
      if (!lastCompletion) return true;
      
      // Determinar el intervalo basado en el periodo
      const periodo = config.periodo || 'CADA_DIA';
      
      switch (periodo) {
        case 'CADA_DIA':
          const daysDiff = Math.floor((now - new Date(lastCompletion)) / (1000 * 60 * 60 * 24));
          return daysDiff >= config.frecuencia;
          
        case 'CADA_SEMANA':
          const weeksDiff = Math.floor((now - new Date(lastCompletion)) / (1000 * 60 * 60 * 24 * 7));
          return weeksDiff >= config.frecuencia;
          
        case 'CADA_MES':
          const lastDate = new Date(lastCompletion);
          let monthDiff = (now.getFullYear() - lastDate.getFullYear()) * 12 + (now.getMonth() - lastDate.getMonth());
          return monthDiff >= config.frecuencia;
          
        default:
          return true;
      }

    default:
      return true;
  }
};

// Middleware para normalizar la fecha antes de guardar
rutinaSchema.pre('save', async function(next) {
  if (this.isModified('fecha')) {
    try {
      // Si ya está en 00:00:00.000Z (UTC), asumir normalizada y no repetir
      if (this.fecha instanceof Date) {
        const d = this.fecha;
        if (
          d.getUTCHours() === 0 &&
          d.getUTCMinutes() === 0 &&
          d.getUTCSeconds() === 0 &&
          d.getUTCMilliseconds() === 0
        ) {
          return next();
        }
      }

      // Obtener el timezone del usuario
      const Users = mongoose.model('Users');
      const user = await Users.findById(this.usuario).select('preferences.timezone');
      const timezone = timezoneUtils.getUserTimezone(user);
      
      // Normalizar la fecha usando el timezone del usuario
      const fechaNormalizada = timezoneUtils.normalizeToStartOfDay(this.fecha, timezone);
      
      if (fechaNormalizada) {
        this.fecha = fechaNormalizada;
      } else {
        return next(new Error('Fecha inválida'));
      }
    } catch (error) {
      console.error('Error al normalizar fecha en rutina:', error);
      return next(error);
    }
  }
  next();
});

// Middleware para validar que no exista otra rutina en el mismo día
rutinaSchema.pre('save', async function(next) {
  if (this.isModified('fecha')) {
    try {
      // Obtener el timezone del usuario
      const Users = mongoose.model('Users');
      const user = await Users.findById(this.usuario).select('preferences.timezone');
      const timezone = timezoneUtils.getUserTimezone(user);
      
      // Si ya está en 00:00:00.000Z (UTC), asumir que representa el "día lógico"
      // y NO volver a normalizar con timezone (evita corrimientos de día y falsos duplicados).
      let fechaInicio = null;
      if (this.fecha instanceof Date && !isNaN(this.fecha.getTime())) {
        const d = this.fecha;
        if (
          d.getUTCHours() === 0 &&
          d.getUTCMinutes() === 0 &&
          d.getUTCSeconds() === 0 &&
          d.getUTCMilliseconds() === 0
        ) {
          fechaInicio = d;
        }
      }

      // En otros casos, normalizar usando el timezone del usuario
      if (!fechaInicio) {
        fechaInicio = timezoneUtils.normalizeToStartOfDay(this.fecha, timezone);
      }
      
  if (!fechaInicio) {
        return next(new Error('Fecha inválida para validación'));
      }

  // Simplificación: comparar por igualdad exacta de la fecha normalizada
  const existingRutina = await this.constructor.findOne({
    _id: { $ne: this._id },
    usuario: this.usuario,
    fecha: fechaInicio
  });

      if (existingRutina) {
        return next(new Error('Ya existe una rutina para esta fecha'));
      }
    } catch (error) {
      console.error('Error al validar rutina duplicada:', error);
      return next(error);
    }
  }
  next();
});

// Middleware para actualizar completitud
rutinaSchema.pre('save', function(next) {
  // CRÍTICO: Marcar secciones como modificadas para que Mongoose guarde campos dinámicos en Schema.Types.Mixed
  ['bodyCare', 'nutricion', 'ejercicio', 'cleaning'].forEach(section => {
    if (this.isModified(section) || (this[section] && typeof this[section] === 'object')) {
      this.markModified(section);
      // Marcar cada campo dentro de la sección
      if (this[section] && typeof this[section] === 'object') {
        Object.keys(this[section]).forEach(field => {
          this.markModified(`${section}.${field}`);
        });
      }
    }
  });

  let totalTasks = 0;
  let completedTasks = 0;

  ['bodyCare', 'nutricion', 'ejercicio', 'cleaning'].forEach(section => {
    // Convertir a objeto si es necesario (para Mixed types)
    const sectionData = this[section] && typeof this[section].toObject === 'function' 
      ? this[section].toObject() 
      : (this[section] || {});
    const sectionFields = Object.keys(sectionData);
    let sectionTotal = 0;
    let sectionCompleted = 0;
    
    sectionFields.forEach(field => {
      // Asegurar que existe estructura mínima en config para evitar TypeError
      if (!this.config) this.config = {};
      if (!this.config[section]) this.config[section] = {};
      if (!this.config[section][field]) {
        this.config[section][field] = {
          tipo: 'DIARIO',
          diasSemana: [],
          diasMes: [],
          frecuencia: 1,
          activo: true,
          periodo: 'CADA_DIA'
        };
      }
      // Solo contar los campos que deben mostrarse según su cadencia
      if (this.shouldShowItem(section, field)) {
        const fieldValue = sectionData[field];
        const isObjectFormat = typeof fieldValue === 'object' && fieldValue !== null && !Array.isArray(fieldValue);
        const isBooleanFormat = typeof fieldValue === 'boolean';
        
        if (isObjectFormat) {
          // Nuevo formato: objeto con horarios { MAÑANA: true, NOCHE: false }
          // Contar cada horario como una tarea separada
          const horariosCompletados = Object.values(fieldValue).filter(Boolean).length;
          const totalHorarios = Object.keys(fieldValue).length;
          sectionTotal += totalHorarios;
          sectionCompleted += horariosCompletados;
        } else if (isBooleanFormat) {
          // Formato legacy: boolean simple
          sectionTotal++;
          if (fieldValue === true) {
            sectionCompleted++;
          }
        } else {
          // Formato desconocido, tratar como no completado
          sectionTotal++;
        }
        
        // Actualizar última completación si se modificó
        if (this.isModified(`${section}.${field}`)) {
          if (isObjectFormat) {
            // Si hay algún horario completado, actualizar última completación
            const hasAnyCompleted = Object.values(fieldValue).some(Boolean);
            if (hasAnyCompleted) {
              this.config[section][field].ultimaCompletacion = new Date();
            }
          } else if (isBooleanFormat && fieldValue === true) {
            this.config[section][field].ultimaCompletacion = new Date();
          }
        }
      }
    });

    this.completitudPorSeccion[section] = sectionTotal > 0 ? sectionCompleted / sectionTotal : 0;
    totalTasks += sectionTotal;
    completedTasks += sectionCompleted;
  });

  this.completitud = totalTasks > 0 ? completedTasks / totalTasks : 0;
  next();
});

// Pre-save hook para garantizar que las frecuencias sean números
rutinaSchema.pre('save', function(next) {
  // CRÍTICO: Marcar config como modificado para que Mongoose guarde campos dinámicos en Schema.Types.Mixed
  if (this.isModified('config') || (this.config && typeof this.config === 'object')) {
    this.markModified('config');
    // Marcar cada sección también
    ['bodyCare', 'nutricion', 'ejercicio', 'cleaning'].forEach(section => {
      if (this.config[section]) {
        this.markModified(`config.${section}`);
        // Marcar cada item dentro de la sección
        Object.keys(this.config[section]).forEach(item => {
          this.markModified(`config.${section}.${item}`);
        });
      }
    });
  }
  
  if (this.config) {
    ['bodyCare', 'nutricion', 'ejercicio', 'cleaning'].forEach(section => {
      if (this.config[section]) {
        Object.keys(this.config[section]).forEach(item => {
          if (this.config[section][item]) {
            // Asegurar que la frecuencia es un número
            const frecuencia = this.config[section][item].frecuencia;
            const parsedFrec = parseInt(frecuencia, 10);
            if (isNaN(parsedFrec)) {
              this.config[section][item].frecuencia = 1;
            } else {
              this.config[section][item].frecuencia = Math.max(1, parsedFrec);
            }
            
            // Normalizar el tipo a mayúsculas pero no cambiar el valor
            if (this.config[section][item].tipo) {
              this.config[section][item].tipo = this.config[section][item].tipo.toUpperCase();
              
              // Solo asignar un periodo por defecto si no tiene uno ya definido
              if (!this.config[section][item].periodo) {
                const tipo = this.config[section][item].tipo;
                if (tipo === 'DIARIO') {
                  this.config[section][item].periodo = 'CADA_DIA';
                } else if (tipo === 'SEMANAL') {
                  this.config[section][item].periodo = 'CADA_SEMANA';
                } else if (tipo === 'MENSUAL') {
                  this.config[section][item].periodo = 'CADA_MES';
                } else {
                  this.config[section][item].periodo = 'CADA_DIA';
                }
              }
            }
          }
        });
      }
    });
  }
  next();
});

// Añadir métodos de utilidad al schema
rutinaSchema.methods.resetearProgresoPeriodo = function(section, item) {
  if (this.config[section]?.[item]) {
    this.config[section][item].progresoActual = 0;
    this.config[section][item].completacionesPeriodo = [];
  }
};

rutinaSchema.methods.actualizarProgreso = function(section, item, fecha = new Date()) {
  const config = this.config[section]?.[item];
  if (!config) return;

  const ahora = new Date(fecha);
  const ultimoPeriodo = config.ultimoPeriodo || {};
  
  // Determinar si necesitamos resetear el progreso
  const necesitaReset = this.necesitaResetearProgreso(config, ahora);
  
  if (necesitaReset) {
    this.resetearProgresoPeriodo(section, item);
    // Actualizar período
    config.ultimoPeriodo = {
      inicio: this.obtenerInicioPeriodo(config, ahora),
      fin: this.obtenerFinPeriodo(config, ahora)
    };
  }

  // Incrementar progreso
  config.progresoActual = (config.progresoActual || 0) + 1;
  config.completacionesPeriodo.push({
    fecha: ahora,
    valor: config.progresoActual
  });
};

rutinaSchema.methods.necesitaResetearProgreso = function(config, fecha) {
  if (!config.ultimoPeriodo?.inicio) return true;

  const inicioPeriodoActual = this.obtenerInicioPeriodo(config, fecha);
  return new Date(config.ultimoPeriodo.inicio) < inicioPeriodoActual;
};

rutinaSchema.methods.obtenerInicioPeriodo = function(config, fecha) {
  const fechaBase = new Date(fecha);
  
  switch (config.tipo) {
    case 'SEMANAL':
      fechaBase.setDate(fechaBase.getDate() - fechaBase.getDay());
      break;
    case 'MENSUAL':
      fechaBase.setDate(1);
      break;
    default:
      fechaBase.setHours(0, 0, 0, 0);
  }
  
  return fechaBase;
};

rutinaSchema.methods.obtenerFinPeriodo = function(config, fecha) {
  const fechaBase = new Date(fecha);
  
  switch (config.tipo) {
    case 'SEMANAL':
      fechaBase.setDate(fechaBase.getDate() - fechaBase.getDay() + 6);
      break;
    case 'MENSUAL':
      fechaBase.setMonth(fechaBase.getMonth() + 1);
      fechaBase.setDate(0);
      break;
    default:
      fechaBase.setHours(23, 59, 59, 999);
  }
  
  return fechaBase;
};

export const Rutinas = mongoose.model('Rutinas', rutinaSchema); 