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
    required: true
  },
  dni: {
    type: String,
    required: true,
    unique: true
  },
  nacionalidad: {
    type: String,
    required: true
  },
  ocupacion: String,
  documentos: [{
    tipo: String,
    numero: String,
    archivo: String
  }],
  estado: {
    type: String,
    enum: ['ACTIVO', 'INACTIVO', 'PENDIENTE', 'RESERVADO'],
    default: 'PENDIENTE'
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

// Middleware para actualizar el estado del inquilino basado en sus contratos
inquilinoSchema.pre('save', async function(next) {
  try {
    console.log('Ejecutando middleware de actualización de estado para inquilino:', this.nombre);
    
    // No permitir modificación manual del estado
    if (this.isModified('estado') && !this._forceStateUpdate) {
      console.log('Intento de modificación manual del estado, ignorando...');
      this.estado = this._original?.estado || 'PENDIENTE';
      return next();
    }

    const Contratos = mongoose.model('Contratos');
    const now = new Date();

    // Buscar contratos activos
    const contratoActivo = await Contratos.findOne({
      inquilino: { $in: [this._id] },
      estado: 'ACTIVO',
      fechaInicio: { $lte: now },
      fechaFin: { $gt: now },
      esMantenimiento: false
    });

    console.log('Contrato activo encontrado:', contratoActivo?._id);

    if (contratoActivo) {
      this._forceStateUpdate = true;
      this.estado = 'ACTIVO';
      console.log('Estableciendo estado a ACTIVO por contrato activo');
      return next();
    }

    // Buscar contratos futuros
    const contratoFuturo = await Contratos.findOne({
      inquilino: { $in: [this._id] },
      estado: 'PLANEADO',
      fechaInicio: { $gt: now },
      esMantenimiento: false
    });

    console.log('Contrato futuro encontrado:', contratoFuturo?._id);

    if (contratoFuturo) {
      this._forceStateUpdate = true;
      this.estado = 'RESERVADO';
      console.log('Estableciendo estado a RESERVADO por contrato futuro');
      return next();
    }

    // Si no hay contratos activos ni futuros, pero hay contratos finalizados
    const contratoFinalizado = await Contratos.findOne({
      inquilino: { $in: [this._id] },
      estado: 'FINALIZADO',
      esMantenimiento: false
    });

    console.log('Contrato finalizado encontrado:', contratoFinalizado?._id);

    if (contratoFinalizado) {
      this._forceStateUpdate = true;
      this.estado = 'INACTIVO';
      console.log('Estableciendo estado a INACTIVO por contrato finalizado');
    } else if (this.isNew) {
      this._forceStateUpdate = true;
      this.estado = 'PENDIENTE';
      console.log('Estableciendo estado a PENDIENTE por ser nuevo inquilino');
    }

    // Guardar el estado original para la próxima vez
    this._original = this.toObject();
    console.log('Estado final del inquilino:', this.estado);
    next();
  } catch (error) {
    console.error('Error en middleware de actualización de estado:', error);
    next(error);
  }
});

// Middleware para actualizar el estado cuando se modifica un contrato
inquilinoSchema.pre('findOneAndUpdate', async function(next) {
  try {
    const docToUpdate = await this.model.findOne(this.getQuery());
    if (!docToUpdate) return next();

    const Contratos = mongoose.model('Contratos');
    const now = new Date();

    // Buscar contratos activos
    const contratoActivo = await Contratos.findOne({
      inquilino: { $in: [docToUpdate._id] },
      estado: 'ACTIVO',
      fechaInicio: { $lte: now },
      fechaFin: { $gt: now },
      esMantenimiento: false
    });

    if (contratoActivo) {
      this.set({ estado: 'ACTIVO' });
      return next();
    }

    // Buscar contratos futuros
    const contratoFuturo = await Contratos.findOne({
      inquilino: { $in: [docToUpdate._id] },
      estado: 'PLANEADO',
      fechaInicio: { $gt: now },
      esMantenimiento: false
    });

    if (contratoFuturo) {
      this.set({ estado: 'RESERVADO' });
      return next();
    }

    // Si no hay contratos activos ni futuros, pero hay contratos finalizados
    const contratoFinalizado = await Contratos.findOne({
      inquilino: { $in: [docToUpdate._id] },
      estado: 'FINALIZADO',
      esMantenimiento: false
    });

    if (contratoFinalizado) {
      this.set({ estado: 'INACTIVO' });
    } else {
      this.set({ estado: 'PENDIENTE' });
    }

    next();
  } catch (error) {
    console.error('Error en middleware de actualización de estado:', error);
    next(error);
  }
});

// Agregar relación virtual con contratos
inquilinoSchema.virtual('contratos', {
  ref: 'Contratos',
  localField: '_id',
  foreignField: 'inquilino',
  match: { estado: { $ne: 'FINALIZADO' } }
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
  const inquilinoObj = this.toObject();
  
  return {
    ...inquilinoObj,
    contratos: inquilinoObj.contratos || []
  };
};

export const Inquilinos = mongoose.model('Inquilinos', inquilinoSchema);