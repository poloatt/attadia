import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    unique: true,
    enum: ['USER', 'ADMIN']
  },
  descripcion: String,
  permisos: [{
    type: String
  }]
}, {
  timestamps: true
});

export const Roles = mongoose.model('Role', roleSchema); 