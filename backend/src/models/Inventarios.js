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

// Middleware para validar que la habitación y la propiedad pertenezcan al usuario
inventarioSchema.pre('save', async function(next) {
  try {
    const Propiedades = mongoose.model('Propiedades');
    const Habitaciones = mongoose.model('Habitaciones');

    // Validar propiedad
    if (this.propiedad) {
      const propiedad = await Propiedades.findOne({
        _id: this.propiedad,
        usuario: this.usuario
      });
      
      if (!propiedad) {
        throw new Error('La propiedad especificada no existe o no pertenece al usuario');
      }
    }

    // Validar habitación
    if (this.habitacion) {
      const habitacion = await Habitaciones.findOne({
        _id: this.habitacion,
        usuario: this.usuario
      });
      
      if (!habitacion) {
        throw new Error('La habitación especificada no existe o no pertenece al usuario');
      }
      
      if (habitacion.propiedad.toString() !== this.propiedad.toString()) {
        throw new Error('La habitación debe pertenecer a la propiedad especificada');
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Middleware para filtrar por usuario en las consultas
inventarioSchema.pre(/^find/, function() {
  if (this._conditions.usuario) {
    const userId = this._conditions.usuario;
    this._conditions.$or = [
      { usuario: userId }
    ];
  }
  this.populate(['propiedad', 'habitacion']);
});

export const Inventarios = mongoose.model('Inventarios', inventarioSchema); 