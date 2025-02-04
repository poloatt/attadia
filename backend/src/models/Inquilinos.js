import mongoose from 'mongoose';

const inquilinoSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  telefono: {
    type: String,
    required: true
  },
  documentos: [{
    tipo: String,
    numero: String,
    archivo: String
  }],
  estado: {
    type: String,
    enum: ['ACTIVO', 'INACTIVO'],
    default: 'ACTIVO'
  }
}, {
  timestamps: true
});

export const Inquilinos = mongoose.model('Inquilino', inquilinoSchema); 