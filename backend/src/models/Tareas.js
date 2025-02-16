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
    default: Date.now
  },
  fechaFin: {
    type: Date
  },
  subtareas: [subtareaSchema],
  proyecto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Proyectos',
    required: true
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true
  },
  prioridad: {
    type: String,
    enum: ['BAJA', 'MEDIA', 'ALTA'],
    default: 'MEDIA'
  },
  fechaVencimiento: Date,
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
  if (this.fechaFin && this.fechaInicio > this.fechaFin) {
    next(new Error('La fecha de fin debe ser posterior a la fecha de inicio'));
  }
  next();
});

// Middleware para poblar subtareas
tareaSchema.pre(['find', 'findOne'], function() {
  this.populate('subtareas');
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

// Middleware para actualizar el estado del proyecto cuando cambia el estado de la tarea
tareaSchema.post('save', async function() {
  if (this.isModified('estado')) {
    try {
      const Proyectos = mongoose.model('Proyectos');
      const tareas = await mongoose.model('Tareas').find({ proyecto: this.proyecto });
      
      const todasCompletadas = tareas.every(tarea => tarea.estado === 'COMPLETADA');
      const algunaEnProgreso = tareas.some(tarea => tarea.estado === 'EN_PROGRESO');
      
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
  }
});

export const Tareas = mongoose.model('Tareas', tareaSchema); 