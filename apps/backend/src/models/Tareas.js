import mongoose from 'mongoose';
import { createSchema, commonFields } from './BaseSchema.js';

const subtareaSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: true,
    trim: true
  },
  completada: {
    type: Boolean,
    default: false
  },
  // Campos para sincronización con Google Tasks
  googleTaskId: {
    type: String,
    default: null
  },
  lastSyncDate: {
    type: Date,
    default: null
  },
  ...commonFields
});

const tareaSchema = createSchema({
  titulo: {
    type: String,
    required: true,
    trim: true
  },
  descripcion: {
    type: String,
    trim: true
  },
  estado: {
    type: String,
    enum: ['PENDIENTE', 'EN_PROGRESO', 'COMPLETADA'],
    default: 'PENDIENTE'
  },
  fechaInicio: {
    type: Date,
    required: true,
    default: Date.now,
    validate: {
      validator: function(value) {
        return value instanceof Date && !isNaN(value);
      },
      message: 'La fecha de inicio debe ser una fecha válida'
    }
  },
  fechaFin: {
    type: Date,
    validate: {
      validator: function(value) {
        return !value || (value instanceof Date && !isNaN(value));
      },
      message: 'La fecha de fin debe ser una fecha válida'
    }
  },
  fechaVencimiento: {
    type: Date,
    validate: {
      validator: function(value) {
        return !value || (value instanceof Date && !isNaN(value));
      },
      message: 'La fecha de vencimiento debe ser una fecha válida'
    }
  },
  subtareas: [subtareaSchema],
  proyecto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Proyectos',
    required: false
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true
  },
  prioridad: {
    type: String,
    enum: ['BAJA', 'ALTA'],
    default: 'BAJA'
  },
  completada: {
    type: Boolean,
    default: false
  },
  archivos: [{
    nombre: String,
    url: String,
    tipo: String
  }],
  orden: {
    type: Number,
    default: 0
  },
  // Campos para integración completa con Google Tasks API
  googleTasksSync: {
    enabled: {
      type: Boolean,
      default: false
    },
    // Campos principales de Google Tasks
    googleTaskId: String, // ID único de la tarea en Google Tasks
    googleTaskListId: String, // ID de la lista en Google Tasks donde está la tarea
    
    // Campos de posición y jerarquía (para subtareas)
    position: String, // Posición de la tarea en la lista (para ordenamiento)
    parent: String, // ID de la tarea padre (si es subtarea)
    
    // Campos de fechas según Google Tasks
    completed: Date, // Fecha y hora de finalización (cuando se marca como completada)
    updated: Date, // Fecha de última modificación en Google Tasks
    
    // Campos de sincronización
    lastSyncDate: Date,
    syncStatus: {
      type: String,
      enum: ['pending', 'syncing', 'synced', 'error'],
      default: 'pending'
    },
    syncingStartedAt: Date, // Timestamp cuando comenzó la sincronización
    syncErrors: [String], // Array de errores de sincronización
    
    // Metadatos adicionales
    etag: String, // ETag de Google Tasks para control de versiones
    kind: {
      type: String,
      default: 'tasks#task'
    }, // Tipo de recurso de Google Tasks
    selfLink: String, // URL de la tarea en Google Tasks
    
    // Campos para manejo de conflictos
    localVersion: {
      type: Number,
      default: 1
    }, // Versión local para detectar conflictos
    needsSync: {
      type: Boolean,
      default: false
    } // Flag para marcar tareas que necesitan sincronización
  },
  ...commonFields
});

// Middleware para inicializar Google Tasks sync en tareas nuevas
tareaSchema.pre('save', function(next) {
  // Solo para tareas nuevas que no tienen googleTasksSync configurado
  if (this.isNew && !this.googleTasksSync) {
    this.googleTasksSync = {
      enabled: false, // Se habilitará cuando el usuario active Google Tasks
      syncStatus: 'pending',
      needsSync: false,
      localVersion: 1
    };
  }
  
  // Marcar para sincronización si la tarea fue modificada y tiene Google Tasks habilitado
  if (!this.isNew && this.isModified() && this.googleTasksSync?.enabled) {
    this.googleTasksSync.needsSync = true;
    this.googleTasksSync.localVersion = (this.googleTasksSync.localVersion || 0) + 1;
    this.googleTasksSync.syncStatus = 'pending';
  }
  
  next();
});

// Middleware para mapear estados entre Google Tasks y nuestra app
tareaSchema.methods.toGoogleTaskFormat = function() {
  return {
    id: this.googleTasksSync?.googleTaskId,
    title: this.titulo,
    notes: this.descripcion || '',
    status: this.completada ? 'completed' : 'needsAction',
    due: this.fechaVencimiento ? this.fechaVencimiento.toISOString() : null,
    completed: this.completada && this.googleTasksSync?.completed ? this.googleTasksSync.completed.toISOString() : null,
    parent: this.googleTasksSync?.parent || null,
    position: this.googleTasksSync?.position || null,
    updated: this.googleTasksSync?.updated || this.updatedAt
  };
};

// Método para convertir subtareas a formato Google Tasks
tareaSchema.methods.getSubtareasForGoogle = function() {
  return this.subtareas.map((subtarea, index) => ({
    title: subtarea.titulo,
    status: subtarea.completada ? 'completed' : 'needsAction',
    parent: this.googleTasksSync?.googleTaskId, // La tarea principal es el parent
    position: String(index).padStart(20, '0') // Posición para ordenamiento
  }));
};

// Método para verificar si la sincronización está bloqueada por timeout
tareaSchema.methods.isSyncTimedOut = function() {
  if (this.googleTasksSync?.syncStatus !== 'syncing') return false;
  
  const syncingStartedAt = this.googleTasksSync?.syncingStartedAt;
  if (!syncingStartedAt) return true; // Si no hay timestamp, considerar timeout
  
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return syncingStartedAt < fiveMinutesAgo;
};

// Método para limpiar estado de sincronización bloqueado
tareaSchema.methods.clearSyncTimeout = function() {
  if (this.isSyncTimedOut()) {
    this.googleTasksSync.syncStatus = 'pending';
    this.googleTasksSync.syncingStartedAt = null;
    this.googleTasksSync.syncErrors = [];
  }
};

// Método para actualizar desde Google Tasks
tareaSchema.methods.updateFromGoogleTask = function(googleTask) {
  // Limpiar título: remover prefijos entre corchetes y espacios extra
  const cleanedTitle = String(googleTask.title || this.titulo || 'Tarea importada')
    .replace(/^\s*(\[[^\]]+\]\s*)+/g, '')
    .replace(/\s+(\[[^\]]+\])\s+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  this.titulo = cleanedTitle || 'Tarea importada';
  this.descripcion = googleTask.notes || this.descripcion;
  this.completada = googleTask.status === 'completed';
  this.estado = googleTask.status === 'completed' ? 'COMPLETADA' : 'PENDIENTE';
  
  if (googleTask.due) {
    this.fechaVencimiento = new Date(googleTask.due);
  }
  
  // Actualizar campos de Google Tasks
  if (!this.googleTasksSync) this.googleTasksSync = {};
  
  this.googleTasksSync.googleTaskId = googleTask.id;
  this.googleTasksSync.updated = googleTask.updated ? new Date(googleTask.updated) : new Date();
  this.googleTasksSync.completed = googleTask.completed ? new Date(googleTask.completed) : null;
  this.googleTasksSync.parent = googleTask.parent || null;
  this.googleTasksSync.position = googleTask.position || null;
  this.googleTasksSync.etag = googleTask.etag || null;
  this.googleTasksSync.selfLink = googleTask.selfLink || null;
  this.googleTasksSync.lastSyncDate = new Date();
  this.googleTasksSync.syncStatus = 'synced';
  this.googleTasksSync.needsSync = false;
  this.googleTasksSync.enabled = true;
  this.googleTasksSync.syncingStartedAt = null; // Limpiar timestamp de sincronización
};

// Middleware para validar fechas
tareaSchema.pre('save', function(next) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Si no hay fecha de inicio, establecer a hoy
  if (!this.fechaInicio) {
    this.fechaInicio = today;
  }

  // Validar que la fecha de inicio no sea anterior a hoy si es nueva tarea
  if (this.isNew && this.fechaInicio < today) {
    this.fechaInicio = today;
  }

  // Validar que la fecha de fin sea posterior a la fecha de inicio
  if (this.fechaFin && this.fechaInicio > this.fechaFin) {
    next(new Error('La fecha de fin debe ser posterior a la fecha de inicio'));
  }

  // Validar que la fecha de vencimiento sea posterior a la fecha de inicio
  // Solo validar si ambas fechas existen y no estamos en modo de sincronización
  if (this.fechaVencimiento && this.fechaInicio && 
      this.fechaInicio > this.fechaVencimiento && 
      !this.isModified('googleTasksSync')) {
    next(new Error('La fecha de vencimiento debe ser posterior a la fecha de inicio'));
  }

  next();
});

// Middleware para poblar subtareas con validación de usuario
tareaSchema.pre(['find', 'findOne'], function() {
  if (this._conditions.usuario) {
    const userId = this._conditions.usuario;
    this.populate({
      path: 'subtareas',
      match: { usuario: userId }
    });
  }
});

// Middleware para validar actualizaciones parciales
tareaSchema.pre('findOneAndUpdate', async function() {
  const docToUpdate = await this.model.findOne(this.getQuery());
  if (!docToUpdate) return;

  const update = this.getUpdate();
  
  // Si hay subtareas en la actualización, manejar correctamente
  if (update.subtareas) {
    // Si las subtareas vienen como un array completo, usarlas tal como están
    if (Array.isArray(update.subtareas)) {
      // No modificar, usar las subtareas tal como vienen
      console.log('Actualizando subtareas completas:', update.subtareas.length);
    } else {
      // Si es una actualización parcial de subtareas, preservar las existentes
      update.subtareas = [
        ...docToUpdate.subtareas,
        ...update.subtareas.filter(st => 
          !docToUpdate.subtareas.some(existing => 
            existing._id.toString() === st._id?.toString()
          )
        )
      ];
    }
  }

  // Asegurar que el estado se actualice correctamente
  // Solo actualizar automáticamente si hay subtareas o si completada fue explícitamente establecido
  if (update.subtareas !== undefined || update.completada !== undefined) {
    const allSubtareas = update.subtareas !== undefined ? update.subtareas : docToUpdate.subtareas;
    
    // Solo calcular estado basado en subtareas si hay subtareas
    if (allSubtareas && allSubtareas.length > 0) {
      const todasCompletadas = allSubtareas.every(st => st.completada);
      const algunaCompletada = allSubtareas.some(st => st.completada);

      // Solo sobrescribir estado si no fue establecido explícitamente
      if (update.estado === undefined) {
        update.estado = todasCompletadas ? 'COMPLETADA' : 
                        algunaCompletada ? 'EN_PROGRESO' : 
                        'PENDIENTE';
      }
      // Solo sobrescribir completada si no fue establecido explícitamente
      if (update.completada === undefined) {
        update.completada = todasCompletadas;
      }
    } else if (update.completada !== undefined) {
      // Si no hay subtareas pero se establece completada explícitamente, respetar el estado enviado
      // No sobrescribir estado si ya fue establecido
      if (update.estado === undefined) {
        update.estado = update.completada ? 'COMPLETADA' : 'PENDIENTE';
      }
    } else if (update.subtareas !== undefined && (!allSubtareas || allSubtareas.length === 0)) {
      // Si se envía un array vacío de subtareas, no marcar como completada
      // Solo actualizar estado si no fue establecido explícitamente
      if (update.estado === undefined) {
        update.estado = 'PENDIENTE';
      }
      if (update.completada === undefined) {
        update.completada = false;
      }
    }
  }
});

// Middleware para validar que el proyecto pertenezca al usuario
tareaSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('proyecto')) {
    try {
      const Proyectos = mongoose.model('Proyectos');
      const proyecto = await Proyectos.findById(this.proyecto);
      
      if (!proyecto) {
        throw new Error('El proyecto especificado no existe');
      }
      
      if (proyecto.usuario.toString() !== this.usuario.toString()) {
        throw new Error('La tarea debe pertenecer al mismo usuario que el proyecto');
      }
    } catch (error) {
      next(error);
    }
  }
  next();
});

// Middleware para actualizar el estado basado en subtareas
tareaSchema.pre('save', function(next) {
  // Solo actualizar automáticamente si las subtareas fueron modificadas o es nueva
  // Y solo si el estado no fue establecido explícitamente
  if (this.isModified('subtareas') || this.isNew) {
    if (this.subtareas && this.subtareas.length > 0) {
      const todasCompletadas = this.subtareas.every(st => st.completada);
      const algunaCompletada = this.subtareas.some(st => st.completada);

      // Solo actualizar estado si no fue modificado explícitamente
      if (!this.isModified('estado')) {
        if (todasCompletadas) {
          this.estado = 'COMPLETADA';
          this.completada = true;
        } else if (algunaCompletada) {
          this.estado = 'EN_PROGRESO';
          this.completada = false;
        } else {
          this.estado = 'PENDIENTE';
          this.completada = false;
        }
      } else {
        // Si el estado fue modificado explícitamente, solo actualizar completada basándose en subtareas
        // pero respetar el estado establecido
        if (!this.isModified('completada')) {
          this.completada = todasCompletadas;
        }
      }
    } else {
      // Si no hay subtareas, solo actualizar si no fue establecido explícitamente
      if (!this.isModified('estado')) {
        this.estado = 'PENDIENTE';
      }
      if (!this.isModified('completada')) {
        this.completada = false;
      }
    }
  }
  next();
});

// Middleware para actualizar el estado del proyecto cuando cambia el estado de la tarea
tareaSchema.post('save', async function() {
  try {
    const Proyectos = mongoose.model('Proyectos');
    const tareas = await mongoose.model('Tareas').find({ proyecto: this.proyecto });
    
    const todasCompletadas = tareas.every(tarea => tarea.estado === 'COMPLETADA');
    const algunaEnProgreso = tareas.some(tarea => tarea.estado === 'EN_PROGRESO' || tarea.estado === 'COMPLETADA');
    
    let nuevoEstado = 'PENDIENTE';
    if (todasCompletadas) {
      nuevoEstado = 'COMPLETADO';
    } else if (algunaEnProgreso) {
      nuevoEstado = 'EN_PROGRESO';
    }
    
    await Proyectos.findByIdAndUpdate(this.proyecto, { estado: nuevoEstado });
  } catch (error) {
    console.error('Error al actualizar estado del proyecto:', error);
  }
});

export const Tareas = mongoose.model('Tareas', tareaSchema); 