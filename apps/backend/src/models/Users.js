import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

// Definir el esquema de configuración de cadencia global por usuario
const cadenciaConfigSchema = {
  tipo: {
    type: String,
    enum: ['DIARIO', 'SEMANAL', 'MENSUAL', 'PERSONALIZADO'],
    default: 'DIARIO'
  },
  periodo: {
    type: String,
    enum: ['CADA_DIA', 'CADA_SEMANA', 'CADA_MES'],
    default: 'CADA_DIA'
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
    default: 1
  },
  activo: {
    type: Boolean,
    default: true
  }
};

// Estructura para configurar las rutinas globalmente
// IMPORTANTE: Usar Schema.Types.Mixed para permitir hábitos personalizados dinámicos
// Las secciones deben ser objetos flexibles que permitan cualquier campo adicional
const rutinasConfigSchema = {
  bodyCare: {
    type: Schema.Types.Mixed,
    default: () => ({})
  },
  nutricion: {
    type: Schema.Types.Mixed,
    default: () => ({})
  },
  ejercicio: {
    type: Schema.Types.Mixed,
    default: () => ({})
  },
  cleaning: {
    type: Schema.Types.Mixed,
    default: () => ({})
  },
  // Añadir metadatos para mejor control de versiones
  _metadata: {
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    version: {
      type: Number,
      default: 1
    }
  }
};

const userSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId;
    }
  },
  telefono: String,
  googleId: String,
  // Configuración de Google Tasks
  googleTasksConfig: {
    enabled: {
      type: Boolean,
      default: false
    },
    accessToken: String,
    refreshToken: String,
    lastSync: Date,
    lastTokenRefresh: Date, // Última vez que se refrescaron los tokens
    defaultTaskList: String, // ID de la lista de tareas por defecto en Google
    syncDirection: {
      type: String,
      enum: ['bidirectional', 'to_google', 'from_google'],
      default: 'bidirectional'
    },
    tokenError: String, // Tipo de error de token (ej: 'invalid_grant')
    tokenErrorDate: Date // Fecha del último error de token
  },
  // --- NUEVO: país del usuario (código ISO 2 letras, ej: 'AR', 'BR', 'US') ---
  pais: {
    type: String,
    uppercase: true,
    minlength: 2,
    maxlength: 2,
    default: 'AR', // Puedes cambiar el default según tu público
    description: 'Código de país ISO 3166-1 alfa-2 (ej: AR, BR, US)'
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    language: {
      type: String,
      enum: ['es', 'en'],
      default: 'es'
    },
    timezone: {
      type: String,
      default: 'America/Santiago', // Timezone por defecto para Chile
      validate: {
        validator: function(v) {
          // Validar que el timezone sea válido usando Intl.DateTimeFormat
          try {
            Intl.DateTimeFormat('en', { timeZone: v });
            return true;
          } catch (e) {
            return false;
          }
        },
        message: 'El timezone proporcionado no es válido'
      }
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      }
    },
    // Añadimos la configuración global de rutinas para el usuario
    // Usa Schema.Types.Mixed para permitir hábitos personalizados dinámicos
    rutinasConfig: {
      type: Schema.Types.Mixed,
      default: () => {
        const defaultConfig = {
          bodyCare: {},
          nutricion: {},
          ejercicio: {},
          cleaning: {},
          _metadata: {
            version: 1,
            lastUpdated: new Date()
          }
        };
        return defaultConfig;
      }
    }
  },
  // Hábitos personalizados del usuario
  customHabits: {
    type: {
      bodyCare: [{
        id: { type: String, required: true },
        label: { type: String, required: true },
        icon: { type: String, required: true },
        activo: { type: Boolean, default: true },
        orden: { type: Number, default: 0 }
      }],
      nutricion: [{
        id: { type: String, required: true },
        label: { type: String, required: true },
        icon: { type: String, required: true },
        activo: { type: Boolean, default: true },
        orden: { type: Number, default: 0 }
      }],
      ejercicio: [{
        id: { type: String, required: true },
        label: { type: String, required: true },
        icon: { type: String, required: true },
        activo: { type: Boolean, default: true },
        orden: { type: Number, default: 0 }
      }],
      cleaning: [{
        id: { type: String, required: true },
        label: { type: String, required: true },
        icon: { type: String, required: true },
        activo: { type: Boolean, default: true },
        orden: { type: Number, default: 0 }
      }]
    },
    default: () => {
      // Hábitos por defecto que se pre-cargan para nuevos usuarios
      return {
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
    }
  },
  role: {
    type: String,
    enum: ['USER', 'ADMIN'],
    default: 'USER'
  },
  lastLogin: Date,
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  strict: false, // IMPORTANTE: Permitir campos dinámicos en rutinasConfig para hábitos personalizados
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
});

// Método para comparar contraseñas
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.password);
};

// Middleware para hashear la contraseña antes de guardar
userSchema.pre('save', async function(next) {
  if (this.isModified('password') && this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// Middleware para normalizar la configuración de rutinas antes de guardar
userSchema.pre('save', function(next) {
  if (this.preferences && this.preferences.rutinasConfig) {
    const { rutinasConfig } = this.preferences;
    
    // Recorrer cada sección e ítem para normalizar sus valores
    Object.keys(rutinasConfig).forEach(section => {
      if (rutinasConfig[section] && typeof rutinasConfig[section] === 'object') {
        Object.keys(rutinasConfig[section]).forEach(itemId => {
          if (rutinasConfig[section][itemId]) {
            // Asegurar que la frecuencia siempre sea un número
            if (rutinasConfig[section][itemId].frecuencia !== undefined) {
              const frecuencia = rutinasConfig[section][itemId].frecuencia;
              // Convertir a número si es cadena
              if (typeof frecuencia === 'string') {
                const parsedFrec = Number(frecuencia);
                rutinasConfig[section][itemId].frecuencia = isNaN(parsedFrec) ? 1 : Math.max(1, parsedFrec);
              } else if (typeof frecuencia === 'number') {
                rutinasConfig[section][itemId].frecuencia = Math.max(1, frecuencia);
              } else {
                rutinasConfig[section][itemId].frecuencia = 1;
              }
            }
            
            // Normalizar el tipo a mayúsculas
            if (rutinasConfig[section][itemId].tipo) {
              rutinasConfig[section][itemId].tipo = rutinasConfig[section][itemId].tipo.toUpperCase();
            }
          }
        });
      }
    });
  }
  next();
});

// Middleware para inicializar customHabits si no existe
userSchema.pre('save', function(next) {
  if (!this.customHabits || !this.customHabits.bodyCare || this.customHabits.bodyCare.length === 0) {
    // Inicializar con hábitos por defecto
    this.customHabits = {
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
  }
  next();
});

// Sobrescribir getLabel para usuarios
userSchema.methods.getLabel = function() {
  return this.nombre || this.email;
};

export const Users = mongoose.model('Users', userSchema); 