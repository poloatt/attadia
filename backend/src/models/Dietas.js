import mongoose from 'mongoose';

const dietaSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fecha: {
    type: Date,
    required: true,
    default: Date.now
  },
  tipo: {
    type: String,
    enum: ['DESAYUNO', 'ALMUERZO', 'CENA', 'SNACK'],
    required: true
  },
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  descripcion: String,
  calorias: {
    type: Number,
    required: true,
    min: 0
  },
  ingredientes: [{
    nombre: String,
    cantidad: Number,
    unidad: String
  }],
  notas: String
}, {
  timestamps: true
});

export const Dietas = mongoose.model('Dieta', dietaSchema); 