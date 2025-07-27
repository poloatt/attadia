import mongoose from 'mongoose';
import { createSchema, commonFields } from './BaseSchema.js';

const subtareaSchema = createSchema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true
  },
  tarea: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tareas',
    required: true
  },
  titulo: {
    type: String,
    required: true,
    trim: true
  },
  descripcion: String,
  completada: {
    type: Boolean,
    default: false
  },
  orden: {
    type: Number,
    default: 0
  },
  ...commonFields
});

// Middleware para actualizar el estado de la tarea padre
subtareaSchema.post('save', async function() {
  try {
    const Tareas = mongoose.model('Tareas');
    const tarea = await Tareas.findById(this.tarea);
    
    if (tarea) {
      const subtareas = await mongoose.model('Subtareas').find({ tarea: this.tarea });
      const todasCompletadas = subtareas.every(subtarea => subtarea.completada);
      const algunaEnProgreso = subtareas.some(subtarea => !subtarea.completada);
      
      let nuevoEstado = 'PENDIENTE';
      if (todasCompletadas) {
        nuevoEstado = 'COMPLETADA';
      } else if (algunaEnProgreso) {
        nuevoEstado = 'EN_PROGRESO';
      }
      
      tarea.estado = nuevoEstado;
      await tarea.save();
    }
  } catch (error) {
    console.error('Error al actualizar estado de tarea:', error);
  }
});

// Middleware para validar que la tarea pertenezca al usuario
subtareaSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('tarea')) {
    try {
      const Tareas = mongoose.model('Tareas');
      const tarea = await Tareas.findById(this.tarea);
      
      if (!tarea) {
        throw new Error('La tarea especificada no existe');
      }
      
      if (tarea.usuario.toString() !== this.usuario.toString()) {
        throw new Error('La subtarea debe pertenecer al mismo usuario que la tarea');
      }
    } catch (error) {
      next(error);
    }
  }
  next();
});

export const Subtareas = mongoose.model('Subtareas', subtareaSchema); 