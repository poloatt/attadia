import mongoose from 'mongoose';

const tareaSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  proyecto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Proyecto'
  },
  titulo: {
    type: String,
    required: true,
    trim: true
  },
  descripcion: String,
  estado: {
    type: String,
    enum: ['PENDIENTE', 'EN_PROGRESO', 'COMPLETADA', 'CANCELADA'],
    default: 'PENDIENTE'
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
  etiquetas: [String],
  archivos: [{
    nombre: String,
    url: String,
    tipo: String
  }],
  orden: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

export const Tareas = mongoose.model('Tarea', tareaSchema); 