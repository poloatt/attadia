import mongoose from 'mongoose';
import { createSchema, commonFields } from './BaseSchema.js';

const tareaSeriesSchema = createSchema({
  titulo: {
    type: String,
    required: true,
    trim: true,
  },
  descripcion: {
    type: String,
    trim: true,
    default: '',
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true,
  },
  objetivo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Objetivos',
    required: true,
  },
  rrule: {
    type: String,
    required: true,
    trim: true,
  },
  dtstart: {
    type: Date,
    required: true,
  },
  timezone: {
    type: String,
    default: 'America/Argentina/Buenos_Aires',
  },
  hasta: Date,
  count: Number,
  activa: {
    type: Boolean,
    default: true,
  },
  googleSerieKey: {
    type: String,
    index: true,
  },
  googleTasksSync: {
    enabled: { type: Boolean, default: true },
    googleTaskListId: String,
    lastSyncDate: Date,
    /** Si false: solo la tarea ancla en Google; ocurrencias locales para el calendario. */
    exportInstances: { type: Boolean, default: false },
  },
  ...commonFields,
});

tareaSeriesSchema.index({ usuario: 1, googleSerieKey: 1 });
tareaSeriesSchema.index({ usuario: 1, objetivo: 1, activa: 1 });
// Carga de series activas por rango (loadSeriesForAgenda: activa + dtstart <= to)
tareaSeriesSchema.index({ usuario: 1, activa: 1, dtstart: 1 });

export const TareaSeries = mongoose.model('TareaSeries', tareaSeriesSchema);
