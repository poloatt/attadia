import mongoose from 'mongoose';

const inventarioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  descripcion: String,
  cantidad: {
    type: Number,
    required: true,
    default: 0
  },
  categoria: String,
  estado: {
    type: String,
    enum: ['DISPONIBLE', 'EN_USO', 'MANTENIMIENTO', 'BAJA'],
    default: 'DISPONIBLE'
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true
  },
  habitacion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Habitaciones',
    required: true
  },
  propiedad: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Propiedades',
    required: true
  }
}, {
  timestamps: true
});

// Middleware para validar que la habitación pertenezca a la propiedad
inventarioSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('habitacion') || this.isModified('propiedad')) {
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