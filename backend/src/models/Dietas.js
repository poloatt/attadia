import mongoose from 'mongoose';

const dietaSchema = new mongoose.Schema({
  tipo: {
    type: String,
    required: true
  },
  calorias: {
    type: Number,
    required: true
  },
  proteinas: {
    type: Number,
    required: true
  },
  carbohidratos: {
    type: Number,
    required: true
  },
  grasas: {
    type: Number,
    required: true
  },
  notas: {
    type: String
  },
  fecha: {
    type: Date,
    default: Date.now
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  }
}, {
  timestamps: true
});

export const Dietas = mongoose.model('Dietas', dietaSchema); 