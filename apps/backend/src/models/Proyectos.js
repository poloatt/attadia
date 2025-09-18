import mongoose from 'mongoose';
import { createSchema, commonFields } from './BaseSchema.js';

const proyectoSchema = createSchema({
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
  tareas: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tareas'
  }],
  // Campos para integración con Google TaskLists
  googleTasksSync: {
    enabled: {
      type: Boolean,
      default: false
    },
    googleTaskListId: String, // ID de la TaskList en Google Tasks
    
    // Campos de sincronización
    lastSyncDate: Date,
    syncStatus: {
      type: String,
      enum: ['pending', 'synced', 'error'],
      default: 'pending'
    },
    syncErrors: [String], // Array de errores de sincronización
    
    // Metadatos adicionales
    etag: String, // ETag de Google TaskList para control de versiones
    kind: {
      type: String,
      default: 'tasks#taskList'
    }, // Tipo de recurso de Google TaskLists
    selfLink: String, // URL de la TaskList en Google Tasks
    
    // Campos para manejo de conflictos
    localVersion: {
      type: Number,
      default: 1
    }, // Versión local para detectar conflictos
    needsSync: {
      type: Boolean,
      default: false
    } // Flag para marcar proyectos que necesitan sincronización
  },
  ...commonFields
});

// Middleware para inicializar Google Tasks sync en proyectos nuevos
proyectoSchema.pre('save', function(next) {
  // Solo para proyectos nuevos que no tienen googleTasksSync configurado
  if (this.isNew && !this.googleTasksSync) {
    this.googleTasksSync = {
      enabled: false, // Se habilitará cuando el usuario active Google Tasks
      syncStatus: 'pending',
      needsSync: false,
      localVersion: 1
    };
  }
  
  // Marcar para sincronización si el proyecto fue modificado y tiene Google Tasks habilitado
  if (!this.isNew && this.isModified() && this.googleTasksSync?.enabled) {
    this.googleTasksSync.needsSync = true;
    this.googleTasksSync.localVersion = (this.googleTasksSync.localVersion || 0) + 1;
    this.googleTasksSync.syncStatus = 'pending';
  }
  
  next();
});

// Método para convertir proyecto a formato Google TaskList
proyectoSchema.methods.toGoogleTaskListFormat = function() {
  return {
    id: this.googleTasksSync?.googleTaskListId,
    title: this.nombre,
    updated: this.googleTasksSync?.lastSyncDate || this.updatedAt
  };
};

// Método para actualizar desde Google TaskList
proyectoSchema.methods.updateFromGoogleTaskList = function(googleTaskList) {
  this.nombre = googleTaskList.title || this.nombre;
  
  // Actualizar campos de Google TaskLists
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

// Middleware para validar fechas
proyectoSchema.pre('save', function(next) {
  if (this.fechaFin && this.fechaInicio > this.fechaFin) {
    next(new Error('La fecha de fin debe ser posterior a la fecha de inicio'));
  }
  next();
});

export const Proyectos = mongoose.model('Proyectos', proyectoSchema); 