import mongoose from 'mongoose';

const labSchema = new mongoose.Schema({
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
    enum: ['EXPERIMENTO', 'PROTOTIPO', 'PRUEBA'],
    required: true
  },
  estado: {
    type: String,
    enum: ['ACTIVO', 'PAUSADO', 'COMPLETADO', 'CANCELADO'],
    default: 'ACTIVO'
  },
  resultados: [{
    fecha: Date,
    datos: mongoose.Schema.Types.Mixed,
    notas: String
  }],
  configuracion: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  etiquetas: [String]
}, {
  timestamps: true
});

export const Labs = mongoose.model('Lab', labSchema); 