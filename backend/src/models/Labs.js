import mongoose from 'mongoose';

const labSchema = new mongoose.Schema({
  tipo: {
    type: String,
    required: true
  },
  valor: {
    type: Number,
    required: true
  },
  unidad: {
    type: String,
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

export const Labs = mongoose.model('Labs', labSchema);