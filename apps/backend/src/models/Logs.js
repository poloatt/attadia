import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  accion: {
    type: String,
    required: true
  },
  entidad: {
    type: String,
    required: true
  },
  detalles: {
    type: mongoose.Schema.Types.Mixed
  },
  ip: String,
  userAgent: String
}, {
  timestamps: true
});

export const Logs = mongoose.model('Log', logSchema); 