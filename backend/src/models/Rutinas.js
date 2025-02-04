import mongoose from 'mongoose';

const rutinaSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  descripcion: String,
  tipo: {
    type: String,
    enum: ['DIARIA', 'SEMANAL', 'MENSUAL', 'PERSONALIZADA'],
    required: true
  },
  frecuencia: {
    dias: [Number], // 0-6 para días de la semana
    hora: String,
    intervalo: Number // Para rutinas personalizadas
  },
  activa: {
    type: Boolean,
    default: true
  },
  ultimaEjecucion: Date,
  proximaEjecucion: Date,
  acciones: [{
    tipo: String,
    parametros: mongoose.Schema.Types.Mixed
  }]
}, {
  timestamps: true
});

export const Rutinas = mongoose.model('Rutina', rutinaSchema); 