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
  ...commonFields
});

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
  if (this.fechaVencimiento && this.fechaInicio > this.fechaVencimiento) {
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
  if (update.subtareas || update.completada !== undefined) {
    const allSubtareas = update.subtareas || docToUpdate.subtareas;
    const todasCompletadas = allSubtareas.every(st => st.completada);
    const algunaCompletada = allSubtareas.some(st => st.completada);

    update.estado = todasCompletadas ? 'COMPLETADA' : 
                    algunaCompletada ? 'EN_PROGRESO' : 
                    'PENDIENTE';
    update.completada = todasCompletadas;
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
  if (this.isModified('subtareas') || this.isNew) {
    if (this.subtareas && this.subtareas.length > 0) {
      const todasCompletadas = this.subtareas.every(st => st.completada);
      const algunaCompletada = this.subtareas.some(st => st.completada);

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
      this.estado = 'PENDIENTE';
      this.completada = false;
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