import mongoose from 'mongoose';
import { createSchema, commonFields } from './BaseSchema.js';

const propiedadSchema = createSchema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true
  },
  titulo: {
    type: String,
    required: true,
    trim: true
  },
  descripcion: {
    type: String,
    required: true
  },
  direccion: {
    type: String,
    required: true
  },
  ciudad: {
    type: String,
    required: true
  },
  estado: {
    type: [{
      type: String,
      enum: ['DISPONIBLE', 'OCUPADA', 'MANTENIMIENTO', 'RESERVADA']
    }],
    default: ['DISPONIBLE'],
    required: true
  },
  tipo: {
    type: String,
    enum: ['CASA', 'DEPARTAMENTO', 'OFICINA', 'LOCAL', 'TERRENO'],
    required: true
  },
  metrosCuadrados: {
    type: Number,
    required: true
  },
  precio: {
    type: Number,
    required: true
  },
  moneda: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Monedas',
    required: true
  },
  cuenta: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cuentas',
    required: true
  },
  imagen: String,
  ...commonFields
});

// Agregar relación virtual con habitaciones
propiedadSchema.virtual('habitaciones', {
  ref: 'Habitaciones',
  localField: '_id',
  foreignField: 'propiedad'
});

// Virtual para calcular número de dormitorios simples
propiedadSchema.virtual('dormitoriosSimples').get(async function() {
  const habitaciones = await mongoose.model('Habitaciones').find({
    propiedad: this._id,
    tipo: 'DORMITORIO_SIMPLE'
  });
  return habitaciones.length;
});

// Virtual para calcular número de dormitorios dobles
propiedadSchema.virtual('dormitoriosDobles').get(async function() {
  const habitaciones = await mongoose.model('Habitaciones').find({
    propiedad: this._id,
    tipo: 'DORMITORIO_DOBLE'
  });
  return habitaciones.length;
});

// Virtual para calcular número total de dormitorios
propiedadSchema.virtual('totalDormitorios').get(async function() {
  const [simples, dobles] = await Promise.all([
    this.dormitoriosSimples,
    this.dormitoriosDobles
  ]);
  return simples + dobles;
});

// Virtual para calcular número de baños
propiedadSchema.virtual('totalBanos').get(async function() {
  const banos = await mongoose.model('Habitaciones').find({
    propiedad: this._id,
    tipo: { $in: ['BAÑO', 'TOILETTE'] }
  });
  return banos.length;
});

// Método para obtener resumen de habitaciones
propiedadSchema.methods.getResumenHabitaciones = async function() {
  const [dormitoriosSimples, dormitoriosDobles, banos] = await Promise.all([
    this.dormitoriosSimples,
    this.dormitoriosDobles,
    this.totalBanos
  ]);

  return {
    dormitoriosSimples,
    dormitoriosDobles,
    totalDormitorios: dormitoriosSimples + dormitoriosDobles,
    banos
  };
};

// Método para calcular estados basado en contratos
propiedadSchema.methods.calcularEstados = async function() {
  const Contratos = mongoose.model('Contratos');
  const contratos = await Contratos.getContratosPropiedad(this._id);
  
  const estados = new Set();
  const now = new Date();
  
  // Por defecto, la propiedad está disponible
  estados.add('DISPONIBLE');
  
  for (const contrato of contratos) {
    if (contrato.esMantenimiento && contrato.fechaInicio <= now && contrato.fechaFin > now) {
      // Si hay un contrato de mantenimiento activo
      estados.clear(); // Limpiar otros estados
      estados.add('MANTENIMIENTO');
      break; // El mantenimiento tiene prioridad sobre otros estados
    }
    
    if (!contrato.esMantenimiento) {
      if (contrato.fechaInicio <= now && contrato.fechaFin > now) {
        // Contrato activo actual
        estados.delete('DISPONIBLE');
        estados.add('OCUPADA');
      } else if (contrato.fechaInicio > now) {
        // Contrato futuro
        estados.add('RESERVADA');
      }
    }
  }
  
  return Array.from(estados);
};

// Middleware para actualizar estados antes de guardar
propiedadSchema.pre('save', async function(next) {
  if (!this.isModified('estado')) {
    this.estado = await this.calcularEstados();
  }
  next();
});

// Método estático para actualizar estados de todas las propiedades
propiedadSchema.statics.actualizarEstados = async function() {
  const propiedades = await this.find({});
  for (const propiedad of propiedades) {
    propiedad.estado = await propiedad.calcularEstados();
    await propiedad.save();
  }
};

// Asegurar que los virtuals se incluyan cuando se convierte a JSON/Object
propiedadSchema.set('toJSON', { virtuals: true });
propiedadSchema.set('toObject', { virtuals: true });

export const Propiedades = mongoose.model('Propiedades', propiedadSchema); 