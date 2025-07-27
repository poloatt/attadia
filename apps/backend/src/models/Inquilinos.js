import mongoose from 'mongoose';
import { createSchema, excludeCommonFields } from './BaseSchema.js';

const inquilinoSchema = createSchema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true
  },
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  apellido: {
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
    required: false,
    default: ''
  },
  dni: {
    type: String,
    required: false,
    unique: true,
    sparse: true
  },
  nacionalidad: {
    type: String,
    required: false,
    default: ''
  },
  ocupacion: String,
  documentos: [{
    tipo: String,
    numero: String,
    archivo: String
  }],
  estado: {
    type: String,
    enum: ['ACTIVO', 'INACTIVO', 'PENDIENTE', 'RESERVADO', 'SIN_CONTRATO'],
    default: 'SIN_CONTRATO'
  },
  propiedad: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Propiedades',
    default: null
  },
  fechaCheckIn: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Middleware para validar que la propiedad coincida con la del contrato
inquilinoSchema.pre('save', async function(next) {
  // Solo validar si hay un contrato y una propiedad asignada
  if (this.contrato && this.propiedad) {
    try {
      const Contratos = mongoose.model('Contratos');
      const contrato = await Contratos.findById(this.contrato);
      
      if (!contrato) {
        throw new Error('El contrato especificado no existe');
      }
      
      if (contrato.propiedad.toString() !== this.propiedad.toString()) {
        throw new Error('La propiedad del inquilino debe coincidir con la propiedad del contrato');
      }
    } catch (error) {
      next(error);
    }
  }
  next();
});

// Agregar relación virtual con propiedades a través de contratos
inquilinoSchema.virtual('propiedadesActivas').get(async function() {
  const Contratos = mongoose.model('Contratos');
  const contratos = await Contratos.find({
    inquilino: this._id,
    estado: 'ACTIVO',
    fechaInicio: { $lte: new Date() },
    fechaFin: { $gt: new Date() }
  }).populate('propiedad');

  return contratos.map(c => c.propiedad);
});

// Método para realizar el check-in de un inquilino
inquilinoSchema.methods.checkIn = async function(propiedadId) {
  const Propiedades = mongoose.model('Propiedades');
  const propiedad = await Propiedades.findById(propiedadId);
  
  if (!propiedad) {
    throw new Error('La propiedad especificada no existe');
  }

  this.propiedad = propiedadId;
  this.fechaCheckIn = new Date();
  this.estado = 'PENDIENTE';
  
  await this.save();
  
  // Notificar a la propiedad del nuevo inquilino
  await propiedad.actualizarInquilinos();
  
  return this;
};

// Método para obtener información completa del inquilino
inquilinoSchema.methods.getFullInfo = async function() {
  await this.populate('propiedad contratos');
  // Log de depuración para ver los contratos poblados
  if (process.env.NODE_ENV !== 'production') {
    console.log('[getFullInfo] Inquilino:', this._id?.toString());
    console.log('  Contratos poblados:', Array.isArray(this.contratos) ? this.contratos.map(c => c._id?.toString()) : this.contratos);
  }
  const inquilinoObj = this.toObject();
  return {
    ...inquilinoObj,
    contratos: inquilinoObj.contratos || []
  };
};

// Virtual para obtener todos los contratos asociados a este inquilino
inquilinoSchema.virtual('contratos', {
  ref: 'Contratos',
  localField: '_id',
  foreignField: 'inquilino',
  justOne: false,
  options: { strictPopulate: false }
});

// Método para obtener contratos clasificados
inquilinoSchema.methods.getContratosClasificados = async function() {
  const Contratos = mongoose.model('Contratos');
  const contratos = await Contratos.find({
    inquilino: this._id
  }).populate('propiedad');

  const clasificados = {
    activos: [],
    futuros: [],
    vencidos: []
  };

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  contratos.forEach(contrato => {
    if (!contrato.fechaInicio || !contrato.fechaFin) return;
    
    const inicio = new Date(contrato.fechaInicio);
    const fin = new Date(contrato.fechaFin);
    inicio.setHours(0, 0, 0, 0);
    fin.setHours(0, 0, 0, 0);

    if (inicio <= now && fin > now) {
      clasificados.activos.push(contrato);
    } else if (inicio > now) {
      clasificados.futuros.push(contrato);
    } else {
      clasificados.vencidos.push(contrato);
    }
  });

  return clasificados;
};

// Virtual para calcular el estado actual del inquilino según sus contratos
inquilinoSchema.virtual('estadoActual').get(function() {
  if (!this.contratos || this.contratos.length === 0) {
    return 'SIN_CONTRATO';
  }
  // Buscar contrato activo
  const now = new Date();
  now.setHours(0,0,0,0);
  const contratoActivo = this.contratos.find(c => {
    if (!c.fechaInicio || !c.fechaFin) return false;
    const inicio = new Date(c.fechaInicio); inicio.setHours(0,0,0,0);
    const fin = new Date(c.fechaFin); fin.setHours(0,0,0,0);
    return inicio <= now && fin > now;
  });
  if (contratoActivo) return 'ACTIVO';
  // Buscar contrato futuro
  const contratoFuturo = this.contratos.find(c => {
    if (!c.fechaInicio) return false;
    const inicio = new Date(c.fechaInicio); inicio.setHours(0,0,0,0);
    return inicio > now;
  });
  if (contratoFuturo) return 'RESERVADO';
  // Si tiene contratos pero ninguno activo o futuro, está inactivo
  return 'INACTIVO';
});

export const Inquilinos = mongoose.model('Inquilinos', inquilinoSchema);