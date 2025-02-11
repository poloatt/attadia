import mongoose from 'mongoose';
import { createSchema, commonFields } from './BaseSchema.js';

const inventarioSchema = createSchema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  descripcion: {
    type: String,
    trim: true
  },
  cantidad: {
    type: Number,
    required: true,
    min: 0,
    default: 1
  },
  categoria: {
    type: String,
    trim: true
  },
  estado: {
    type: String,
    enum: ['NUEVO', 'BUEN_ESTADO', 'REGULAR', 'MALO', 'REPARACION'],
    default: 'NUEVO'
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users'
  },
  habitacion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Habitaciones'
  },
  propiedad: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Propiedades'
  },
  valorEstimado: {
    type: Number,
    min: 0
  },
  fechaAdquisicion: {
    type: Date,
    default: Date.now
  },
  notas: String,
  ...commonFields
}, {
  timestamps: true
});

// Middleware para validar que la habitación pertenezca a la propiedad
inventarioSchema.pre('save', async function(next) {
  if ((this.isNew || this.isModified('habitacion') || this.isModified('propiedad')) && this.habitacion && this.propiedad) {
    try {
      const Habitaciones = mongoose.model('Habitaciones');
      const habitacion = await Habitaciones.findById(this.habitacion);
      
      if (!habitacion) {
        throw new Error('La habitación especificada no existe');
      }
      
      if (habitacion.propiedad.toString() !== this.propiedad.toString()) {
        throw new Error('La habitación debe pertenecer a la propiedad especificada');
      }
    } catch (error) {
      next(error);
    }
  }
  next();
});

export const Inventarios = mongoose.model('Inventarios', inventarioSchema); 