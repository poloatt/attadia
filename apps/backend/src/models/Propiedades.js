import mongoose from 'mongoose';
import { createSchema, commonFields } from './BaseSchema.js';

const propiedadSchema = createSchema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true
  },
  alias: { // antes 'titulo'
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
    required: false,
    default: 0
  },
  // Eliminamos montoMensual fijo - ahora se calcula dinámicamente
  moneda: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Monedas',
    required: false
  },
  cuenta: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cuentas',
    required: false
  },
  imagen: String,
  // Campo para documentos sincronizados con Google Drive
  documentos: [{
    nombre: {
      type: String,
      required: true,
      trim: true
    },
    categoria: {
      type: String,
      enum: ['GASTO_FIJO', 'GASTO_VARIABLE', 'MANTENIMIENTO', 'ALQUILER', 'CONTRATO', 'PAGO', 'COBRO'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    googleDriveId: {
      type: String,
      required: true
    },
    fechaCreacion: {
      type: Date,
      default: Date.now
    },
    fechaModificacion: {
      type: Date,
      default: Date.now
    },
    tamano: {
      type: Number,
      default: 0
    },
    tipoArchivo: {
      type: String,
      default: 'application/octet-stream'
    },
    sincronizado: {
      type: Boolean,
      default: true
    }
  }],
  // Configuración de Google Drive para esta propiedad
  googleDriveConfig: {
    carpetaId: {
      type: String,
      default: null
    },
    carpetaNombre: {
      type: String,
      default: null
    },
    ultimaSincronizacion: {
      type: Date,
      default: null
    },
    sincronizacionAutomatica: {
      type: Boolean,
      default: true
    }
  },
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
  foreignField: 'propiedad'
});

// Agregar relación virtual con contratos
propiedadSchema.virtual('contratos', {
  ref: 'Contratos',
  localField: '_id',
  foreignField: 'propiedad',
  match: { 
    $or: [
      { estado: 'ACTIVO' },
      { estado: 'PLANEADO' },
      { estado: 'MANTENIMIENTO' },
      { estado: 'FINALIZADO' }
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
  // Un inventario puede estar asociado solo a la propiedad o también a una habitación
});

// Virtual para calcular alquiler mensual promedio basado en contratos activos
propiedadSchema.virtual('alquilerMensualPromedio').get(async function() {
  try {
    const Contratos = mongoose.model('Contratos');
    const now = new Date();
    
    // Buscar contrato activo (no de mantenimiento)
    const contratoActivo = await Contratos.findOne({
      propiedad: this._id,
      estado: 'ACTIVO',
      esMantenimiento: false,
      tipoContrato: 'ALQUILER'
    }).populate('moneda');
    
    if (!contratoActivo) {
      return 0;
    }
    
    // Si el contrato tiene alquilerMensualPromedio calculado, usarlo
    if (contratoActivo.alquilerMensualPromedio) {
      return contratoActivo.alquilerMensualPromedio;
    }
    
    // Si no, calcularlo manualmente
    if (contratoActivo.precioTotal && contratoActivo.fechaInicio && contratoActivo.fechaFin) {
      const inicio = new Date(contratoActivo.fechaInicio);
      const fin = new Date(contratoActivo.fechaFin);
      const mesesTotales = (fin.getFullYear() - inicio.getFullYear()) * 12 + 
                          (fin.getMonth() - inicio.getMonth()) + 1;
      
      return Math.round((contratoActivo.precioTotal / mesesTotales) * 100) / 100;
    }
    
    return 0;
  } catch (error) {
    console.error('Error calculando alquiler mensual promedio:', error);
    return 0;
  }
});

// Virtual para obtener el contrato activo actual
propiedadSchema.virtual('contratoActivo').get(async function() {
  try {
    const Contratos = mongoose.model('Contratos');
    return await Contratos.findOne({
      propiedad: this._id,
      estado: 'ACTIVO'
    }).populate(['inquilino', 'moneda', 'cuenta']);
  } catch (error) {
    console.error('Error obteniendo contrato activo:', error);
    return null;
  }
});

// Virtual para obtener el próximo contrato planeado
propiedadSchema.virtual('proximoContrato').get(async function() {
  try {
    const Contratos = mongoose.model('Contratos');
    const now = new Date();
    
    return await Contratos.findOne({
      propiedad: this._id,
      estado: 'PLANEADO',
      fechaInicio: { $gt: now }
    }).populate(['inquilino', 'moneda', 'cuenta']).sort({ fechaInicio: 1 });
  } catch (error) {
    console.error('Error obteniendo próximo contrato:', error);
    return null;
  }
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
    propiedad: this._id
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
    estado: 'MANTENIMIENTO'
  });

  if (mantenimientoActivo) {
    return ['MANTENIMIENTO'];
  }

  // Verificar si hay un contrato de alquiler activo
  const contratoActivo = await Contratos.findOne({
    propiedad: this._id,
    estado: 'ACTIVO'
  });

  if (contratoActivo) {
    return ['OCUPADA'];
  }

  // Verificar si hay un contrato futuro
  const contratoFuturo = await Contratos.findOne({
    propiedad: this._id,
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
    estado: 'ACTIVO',
    esMantenimiento: false
  });
  
  if (!contratoActivo) return null;
  
  const diferenciaTiempo = contratoActivo.fechaFin.getTime() - now.getTime();
  return Math.ceil(diferenciaTiempo / (1000 * 3600 * 24));
};

// Método para obtener información completa de la propiedad
propiedadSchema.methods.getFullInfo = async function() {
  const [resumenHabitaciones, estados, diasRestantes, alquilerMensual] = await Promise.all([
    this.getResumenHabitaciones(),
    this.calcularEstados(),
    this.getDiasRestantes(),
    this.alquilerMensualPromedio
  ]);

  const propiedadObj = this.toObject();
  
  return {
    ...propiedadObj,
    estado: estados[0] || 'DISPONIBLE',
    diasRestantes,
    alquilerMensualPromedio: alquilerMensual,
    ...resumenHabitaciones,
    inquilinos: propiedadObj.inquilinos || [],
    habitaciones: propiedadObj.habitaciones || [],
    contratos: propiedadObj.contratos || [],
    inventarios: propiedadObj.inventarios || [],
    documentos: propiedadObj.documentos || []
  };
};

// Método para obtener estadísticas financieras de la propiedad
propiedadSchema.methods.getEstadisticasFinancieras = async function() {
  const Contratos = mongoose.model('Contratos');
  const now = new Date();
  
  // Contrato activo
  const contratoActivo = await Contratos.findOne({
    propiedad: this._id,
    estado: 'ACTIVO',
    esMantenimiento: false
  });
  
  // Próximo contrato
  const proximoContrato = await Contratos.findOne({
    propiedad: this._id,
    estado: 'PLANEADO',
    fechaInicio: { $gt: now }
  }).sort({ fechaInicio: 1 });
  
  // Historial de contratos (últimos 12 meses)
  const doceMesesAtras = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const historialContratos = await Contratos.find({
    propiedad: this._id,
    fechaFin: { $gte: doceMesesAtras },
    esMantenimiento: false
  }).sort({ fechaFin: -1 });
  
  const alquilerMensual = await this.alquilerMensualPromedio;
  
  return {
    alquilerMensualPromedio: alquilerMensual,
    contratoActivo,
    proximoContrato,
    historialContratos,
    ingresosAnuales: historialContratos.reduce((sum, c) => sum + (c.precioTotal || 0), 0),
    ingresosPromedioMensual: historialContratos.length > 0 ? 
      historialContratos.reduce((sum, c) => sum + (c.precioTotal || 0), 0) / 12 : 0
  };
};

// Métodos para gestión de documentos con Google Drive

// Método para crear carpeta en Google Drive para la propiedad
propiedadSchema.methods.crearCarpetaGoogleDrive = async function(accessToken) {
  try {
    // Aquí se implementaría la lógica para crear carpeta en Google Drive
    // usando la API de Google Drive con el accessToken del usuario
    const carpetaNombre = `Propiedad - ${this.alias}`;
    
    // Simulación de creación de carpeta (implementar con Google Drive API)
    const carpetaId = `carpeta_${this._id}_${Date.now()}`;
    
    this.googleDriveConfig.carpetaId = carpetaId;
    this.googleDriveConfig.carpetaNombre = carpetaNombre;
    this.googleDriveConfig.ultimaSincronizacion = new Date();
    
    await this.save();
    
    return {
      carpetaId,
      carpetaNombre,
      success: true
    };
  } catch (error) {
    console.error('Error al crear carpeta en Google Drive:', error);
    throw new Error('No se pudo crear la carpeta en Google Drive');
  }
};

// Método para sincronizar documentos desde Google Drive
propiedadSchema.methods.sincronizarDocumentos = async function(accessToken) {
  try {
    if (!this.googleDriveConfig.carpetaId) {
      await this.crearCarpetaGoogleDrive(accessToken);
    }
    
    // Aquí se implementaría la lógica para obtener archivos de Google Drive
    // usando la API de Google Drive con el accessToken del usuario
    
    // Simulación de sincronización (implementar con Google Drive API)
    const documentosGoogleDrive = [
      {
        nombre: 'Contrato de alquiler.pdf',
        categoria: 'CONTRATO',
        url: 'https://drive.google.com/file/d/ejemplo1/view',
        googleDriveId: 'ejemplo1',
        tamano: 1024000,
        tipoArchivo: 'application/pdf'
      },
      {
        nombre: 'Recibo de luz.pdf',
        categoria: 'GASTO_FIJO',
        url: 'https://drive.google.com/file/d/ejemplo2/view',
        googleDriveId: 'ejemplo2',
        tamano: 512000,
        tipoArchivo: 'application/pdf'
      }
    ];
    
    // Actualizar documentos existentes y agregar nuevos
    const documentosActualizados = [];
    
    for (const docGoogle of documentosGoogleDrive) {
      const docExistente = this.documentos.find(d => d.googleDriveId === docGoogle.googleDriveId);
      
      if (docExistente) {
        // Actualizar documento existente
        Object.assign(docExistente, {
          ...docGoogle,
          fechaModificacion: new Date(),
          sincronizado: true
        });
        documentosActualizados.push(docExistente);
      } else {
        // Agregar nuevo documento
        documentosActualizados.push({
          ...docGoogle,
          fechaCreacion: new Date(),
          fechaModificacion: new Date(),
          sincronizado: true
        });
      }
    }
    
    this.documentos = documentosActualizados;
    this.googleDriveConfig.ultimaSincronizacion = new Date();
    
    await this.save();
    
    return {
      documentosSincronizados: documentosActualizados.length,
      success: true
    };
  } catch (error) {
    console.error('Error al sincronizar documentos:', error);
    throw new Error('No se pudieron sincronizar los documentos');
  }
};

// Método para agregar documento manualmente
propiedadSchema.methods.agregarDocumento = async function(documentoData) {
  try {
    const nuevoDocumento = {
      nombre: documentoData.nombre,
      categoria: documentoData.categoria,
      url: documentoData.url,
      googleDriveId: documentoData.googleDriveId || `manual_${Date.now()}`,
      fechaCreacion: new Date(),
      fechaModificacion: new Date(),
      tamano: documentoData.tamano || 0,
      tipoArchivo: documentoData.tipoArchivo || 'application/octet-stream',
      sincronizado: false
    };
    
    this.documentos.push(nuevoDocumento);
    await this.save();
    
    return nuevoDocumento;
  } catch (error) {
    console.error('Error al agregar documento:', error);
    throw new Error('No se pudo agregar el documento');
  }
};

// Método para eliminar documento
propiedadSchema.methods.eliminarDocumento = async function(googleDriveId) {
  try {
    const indice = this.documentos.findIndex(d => d.googleDriveId === googleDriveId);
    
    if (indice === -1) {
      throw new Error('Documento no encontrado');
    }
    
    const documentoEliminado = this.documentos.splice(indice, 1)[0];
    await this.save();
    
    return documentoEliminado;
  } catch (error) {
    console.error('Error al eliminar documento:', error);
    throw new Error('No se pudo eliminar el documento');
  }
};

// Método para obtener documentos por categoría
propiedadSchema.methods.getDocumentosPorCategoria = function(categoria) {
  return this.documentos.filter(doc => doc.categoria === categoria);
};

// Método para obtener estadísticas de documentos
propiedadSchema.methods.getEstadisticasDocumentos = function() {
  const estadisticas = {
    total: this.documentos.length,
    porCategoria: {},
    tamanoTotal: 0,
    sincronizados: 0,
    manuales: 0
  };
  
  this.documentos.forEach(doc => {
    // Contar por categoría
    estadisticas.porCategoria[doc.categoria] = (estadisticas.porCategoria[doc.categoria] || 0) + 1;
    
    // Sumar tamaños
    estadisticas.tamanoTotal += doc.tamano || 0;
    
    // Contar sincronizados vs manuales
    if (doc.sincronizado) {
      estadisticas.sincronizados++;
    } else {
      estadisticas.manuales++;
    }
  });
  
  return estadisticas;
};

export const Propiedades = mongoose.model('Propiedades', propiedadSchema); 