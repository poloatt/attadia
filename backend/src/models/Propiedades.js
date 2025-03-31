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
  foreignField: 'propiedad',
  options: { sort: { orden: 1 } }
});

// Agregar relación virtual con inquilinos
propiedadSchema.virtual('inquilinos', {
  ref: 'Inquilinos',
  localField: '_id',
  foreignField: 'propiedad',
  match: { estado: 'ACTIVO' }
});

// Agregar relación virtual con contratos
propiedadSchema.virtual('contratos', {
  ref: 'Contratos',
  localField: '_id',
  foreignField: 'propiedad',
  match: { 
    activo: true,
    $or: [
      { estado: 'ACTIVO' },
      { estado: 'PLANEADO' }
    ]
  },
  options: { sort: { fechaInicio: 1 } }
});

// Agregar relación virtual con inventarios
propiedadSchema.virtual('inventarios', {
  ref: 'Inventarios',
  localField: '_id',
  foreignField: 'propiedad',
  match: { activo: true },
  options: { sort: { nombre: 1 } }
});

// Virtual para calcular número de dormitorios simples
propiedadSchema.virtual('dormitoriosSimples').get(async function() {
  const habitaciones = await mongoose.model('Habitaciones').find({
    propiedad: this._id,
    tipo: 'DORMITORIO_SIMPLE',
    usuario: this.usuario
  });
  return habitaciones.length;
});

// Virtual para calcular número de dormitorios dobles
propiedadSchema.virtual('dormitoriosDobles').get(async function() {
  const habitaciones = await mongoose.model('Habitaciones').find({
    propiedad: this._id,
    tipo: 'DORMITORIO_DOBLE',
    usuario: this.usuario
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
    tipo: { $in: ['BAÑO', 'TOILETTE'] },
    usuario: this.usuario
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

// Método para actualizar la lista de inquilinos
propiedadSchema.methods.actualizarInquilinos = async function() {
  const Inquilinos = mongoose.model('Inquilinos');
  const inquilinos = await Inquilinos.find({
    propiedad: this._id,
    estado: 'ACTIVO'
  });
  
  // Actualizar estados de inquilinos basado en sus contratos
  for (const inquilino of inquilinos) {
    await inquilino.actualizarEstado();
  }

  return inquilinos;
};

// Método para calcular estados basado en contratos e inquilinos
propiedadSchema.methods.calcularEstados = async function() {
  const Contratos = mongoose.model('Contratos');
  const now = new Date();

  // Verificar si hay un contrato de mantenimiento activo
  const mantenimientoActivo = await Contratos.findOne({
    propiedad: this._id,
    esMantenimiento: true,
    fechaInicio: { $lte: now },
    fechaFin: { $gt: now },
    estado: 'MANTENIMIENTO'
  });

  if (mantenimientoActivo) {
    return ['MANTENIMIENTO'];
  }

  // Verificar si hay un contrato de alquiler activo
  const contratoActivo = await Contratos.findOne({
    propiedad: this._id,
    esMantenimiento: false,
    fechaInicio: { $lte: now },
    fechaFin: { $gt: now },
    estado: 'ACTIVO'
  });

  if (contratoActivo) {
    return ['OCUPADA'];
  }

  // Verificar si hay un contrato futuro
  const contratoFuturo = await Contratos.findOne({
    propiedad: this._id,
    esMantenimiento: false,
    fechaInicio: { $gt: now },
    estado: 'PLANEADO'
  });

  if (contratoFuturo) {
    return ['RESERVADA'];
  }

  // Si no hay contratos activos ni futuros
  return ['DISPONIBLE'];
};

// Middleware para actualizar estados antes de guardar
propiedadSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('estado')) {
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

// Middleware para filtrar por usuario en las consultas
propiedadSchema.pre(/^find/, function() {
  if (this._conditions.usuario) {
    const userId = this._conditions.usuario;
    this._conditions.$or = [
      { usuario: userId }
    ];
  }
});

// Asegurar que los virtuals se incluyan cuando se convierte a JSON/Object
propiedadSchema.set('toJSON', { virtuals: true });
propiedadSchema.set('toObject', { virtuals: true });

// Método para obtener días restantes de ocupación
propiedadSchema.methods.getDiasRestantes = async function() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  const contratoActivo = await mongoose.model('Contratos').findOne({
    propiedad: this._id,
    fechaInicio: { $lte: now },
    fechaFin: { $gt: now },
    estado: 'ACTIVO',
    esMantenimiento: false,
    activo: true
  });
  
  if (!contratoActivo) return null;
  
  const diferenciaTiempo = contratoActivo.fechaFin.getTime() - now.getTime();
  return Math.ceil(diferenciaTiempo / (1000 * 3600 * 24));
};

// Método para obtener información completa de la propiedad
propiedadSchema.methods.getFullInfo = async function() {
  const [resumenHabitaciones, estados, diasRestantes] = await Promise.all([
    this.getResumenHabitaciones(),
    this.calcularEstados(),
    this.getDiasRestantes()
  ]);

  const propiedadObj = this.toObject();
  
  return {
    ...propiedadObj,
    estado: estados[0] || 'DISPONIBLE',
    diasRestantes,
    ...resumenHabitaciones,
    inquilinos: propiedadObj.inquilinos || [],
    habitaciones: propiedadObj.habitaciones || [],
    contratos: propiedadObj.contratos || [],
    inventarios: propiedadObj.inventarios || []
  };
};

export const Propiedades = mongoose.model('Propiedades', propiedadSchema); 