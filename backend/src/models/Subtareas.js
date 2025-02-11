import mongoose from 'mongoose';

const subtareaSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tarea: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tarea',
    required: true
  },
  titulo: {
    type: String,
    required: true,
    trim: true
  },
  descripcion: String,
  estado: {
    type: String,
    enum: ['PENDIENTE', 'COMPLETADA'],
    default: 'PENDIENTE'
  },
  completada: {
    type: Boolean,
    default: false
  },
  orden: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

export const Subtareas = mongoose.model('Subtarea', subtareaSchema); 