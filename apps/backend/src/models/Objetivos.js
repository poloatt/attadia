import mongoose from 'mongoose';
import { createSchema, commonFields } from './BaseSchema.js';

const objetivoSchema = createSchema({
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
  descripcion: String,
  estado: {
    type: String,
    enum: ['PENDIENTE', 'EN_PROGRESO', 'COMPLETADO'],
    default: 'PENDIENTE'
  },
  fechaInicio: {
    type: Date,
    default: Date.now
  },
  fechaFin: Date,
  prioridad: {
    type: String,
    enum: ['BAJA', 'MEDIA', 'ALTA'],
    default: 'MEDIA'
  },
  presupuesto: {
    type: Number,
    default: 0
  },
  moneda: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Monedas'
  },
  archivos: [{
    nombre: String,
    url: String,
    tipo: String
  }],
  propiedad: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Propiedades'
  },
  // googleTasksSync.googleTaskListId = ID de la Lista en Google Tasks
  googleTasksSync: {
    enabled: {
      type: Boolean,
      default: false
    },
    googleTaskListId: String,
    lastSyncDate: Date,
    syncStatus: {
      type: String,
      enum: ['pending', 'synced', 'error'],
      default: 'pending'
    },
    syncErrors: [String],
    etag: String,
    kind: {
      type: String,
      default: 'tasks#taskList'
    },
    selfLink: String,
    localVersion: {
      type: Number,
      default: 1
    },
    needsSync: {
      type: Boolean,
      default: false
    }
  },
  ...commonFields
});

objetivoSchema.pre('save', function(next) {
  if (this.isNew && !this.googleTasksSync) {
    this.googleTasksSync = {
      enabled: false,
      syncStatus: 'pending',
      needsSync: false,
      localVersion: 1
    };
  }

  if (!this.isNew && this.isModified() && this.googleTasksSync?.enabled) {
    this.googleTasksSync.needsSync = true;
    this.googleTasksSync.localVersion = (this.googleTasksSync.localVersion || 0) + 1;
    this.googleTasksSync.syncStatus = 'pending';
  }

  next();
});

objetivoSchema.methods.toGoogleTaskListFormat = function() {
  return {
    id: this.googleTasksSync?.googleTaskListId,
    title: this.nombre,
    updated: this.googleTasksSync?.lastSyncDate || this.updatedAt,
    etag: this.googleTasksSync?.etag,
    selfLink: this.googleTasksSync?.selfLink
  };
};

objetivoSchema.methods.updateFromGoogleTaskList = function(googleTaskList) {
  if (googleTaskList.title && googleTaskList.title !== this.nombre) {
    this.nombre = googleTaskList.title;
  }

  if (!this.googleTasksSync) this.googleTasksSync = {};

  this.googleTasksSync.googleTaskListId = googleTaskList.id;
  this.googleTasksSync.updated = googleTaskList.updated ? new Date(googleTaskList.updated) : new Date();
  this.googleTasksSync.etag = googleTaskList.etag || null;
  this.googleTasksSync.selfLink = googleTaskList.selfLink || null;
  this.googleTasksSync.lastSyncDate = new Date();
  this.googleTasksSync.syncStatus = 'synced';
  this.googleTasksSync.needsSync = false;
  this.googleTasksSync.enabled = true;
};

objetivoSchema.pre('save', function(next) {
  if (this.fechaFin && this.fechaInicio > this.fechaFin) {
    next(new Error('La fecha de fin debe ser posterior a la fecha de inicio'));
  }
  next();
});

export const Objetivos = mongoose.model('Objetivos', objetivoSchema);
