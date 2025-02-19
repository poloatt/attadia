@const mongoose = require('mongoose');
const { createSchema, commonFields } = require('./BaseSchema');

const transaccionRecurrenteSchema = createSchema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  descripcion: {
    type: String,
    required: true,
    trim: true
  },
  monto: {
    type: Number,
    required: true
  },
  cuenta: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cuenta',
    required: true
  },
  tipo: {
    type: String,
    enum: ['INGRESO', 'EGRESO'],
    required: true
  },
  categoria: {
    type: String,
    required: true
  },
  estado: {
    type: String,
    enum: ['ACTIVO', 'PAUSADO', 'FINALIZADO'],
    default: 'ACTIVO'
  },
  frecuencia: {
    type: String,
    enum: ['MENSUAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL'],
    required: true
  },
  diaDelMes: {
    type: Number,
    min: 1,
    max: 31,
    required: true
  },
  fechaInicio: {
    type: Date,
    required: true
  },
  fechaFin: {
    type: Date
  },
  origen: {
    tipo: {
      type: String,
      enum: ['CONTRATO', 'SERVICIO', 'MANUAL'],
      required: true
    },
    referencia: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'origen.tipo'
    }
  },
  propiedad: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Propiedad'
  },
  ultimaGeneracion: {
    type: Date
  },
  proximaGeneracion: {
    type: Date
  },
  transaccionesGeneradas: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaccion'
  }],
  ...commonFields
});

// Índices para mejorar el rendimiento de las consultas
transaccionRecurrenteSchema.index({ estado: 1, proximaGeneracion: 1 });
transaccionRecurrenteSchema.index({ 'origen.tipo': 1, 'origen.referencia': 1 });
transaccionRecurrenteSchema.index({ propiedad: 1 });

// Método para obtener la etiqueta personalizada
transaccionRecurrenteSchema.methods.getLabel = function() {
  return `${this.descripcion} (${this.frecuencia.toLowerCase()})`;
};

// Método para obtener el valor de visualización
transaccionRecurrenteSchema.methods.getDisplayValue = function() {
  return `${this.monto} - ${this.descripcion}`;
};

module.exports = mongoose.model('TransaccionRecurrente', transaccionRecurrenteSchema); 