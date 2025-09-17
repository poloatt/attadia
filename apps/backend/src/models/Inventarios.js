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
    ref: 'Users',
    required: true
  },
  habitacion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Habitaciones',
    required: false // Puede no estar presente
  },
  propiedad: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Propiedades',
    required: true // Ahora es obligatorio
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
  contenedor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventarios',
    required: false, // Un inventario puede o no estar dentro de un contenedor
    default: null
  },
  ...commonFields
}, {
  timestamps: true
});

// Virtual para obtener los items hijos de un contenedor
inventarioSchema.virtual('items', {
  ref: 'Inventarios',
  localField: '_id',
  foreignField: 'contenedor',
  justOne: false
});

// Middleware para validar que la habitación y la propiedad pertenezcan al usuario
inventarioSchema.pre('save', async function(next) {
  try {
    const Propiedades = mongoose.model('Propiedades');
    const Habitaciones = mongoose.model('Habitaciones');

    // Validar propiedad
    if (!this.propiedad) {
      throw new Error('El campo propiedad es obligatorio para el inventario');
    }
    if (this.propiedad) {
      const propiedad = await Propiedades.findOne({
        _id: this.propiedad,
        usuario: this.usuario
      });
      if (!propiedad) {
        throw new Error('La propiedad especificada no existe o no pertenece al usuario');
      }
    }

    // Validar habitación solo si existe
    if (this.habitacion) {
      const habitacion = await Habitaciones.findOne({
        _id: this.habitacion,
        usuario: this.usuario
      });
      if (!habitacion) {
        throw new Error('La habitación especificada no existe o no pertenece al usuario');
      }
      if (habitacion.propiedad && this.propiedad) {
        // Asegurar que comparamos siempre IDs puros, no objetos populados
        const habitacionPropId = String(habitacion.propiedad._id || habitacion.propiedad);
        const inventarioPropId = String(this.propiedad);
        if (habitacionPropId !== inventarioPropId) {
        throw new Error('La habitación debe pertenecer a la propiedad especificada');
        }
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Middleware para evitar ciclos directos (un inventario no puede ser su propio contenedor)
inventarioSchema.pre('save', function(next) {
  if (this.contenedor && String(this.contenedor) === String(this._id)) {
    return next(new Error('Un inventario no puede ser su propio contenedor.'));
  }
  next();
});

// Middleware para filtrar por usuario en las consultas
inventarioSchema.pre(/^find/, function() {
  if (this._conditions.usuario) {
    const userId = this._conditions.usuario;
    this._conditions.$or = [
      { usuario: userId }
    ];
  }
  this.populate(['propiedad', 'habitacion', 'contenedor', 'items']);
});

export const Inventarios = mongoose.model('Inventarios', inventarioSchema); 