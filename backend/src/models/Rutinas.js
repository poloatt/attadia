import mongoose from 'mongoose';
import { createSchema, commonFields } from './BaseSchema.js';

const rutinaSchema = createSchema({
  weight: {
    type: Number,
    required: true
  },
  muscle: {
    type: Number,
    required: true
  },
  fatPercent: {
    type: Number,
    required: true
  },
  stress: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  sleep: {
    type: Number,
    required: true
  },
  fecha: {
    type: Date,
    default: Date.now,
    unique: true
  },
  morning: {
    wakeUp: { type: Boolean, default: false },
    bed: { type: Boolean, default: false },
    meds: { type: Boolean, default: false }
  },
  bodyCare: {
    teeth: { type: Boolean, default: false },
    bath: { type: Boolean, default: false },
    skinCareDay: { type: Boolean, default: false },
    skinCareNight: { type: Boolean, default: false }
  },
  nutricion: {
    cocinar: { type: Boolean, default: false },
    food: { type: Boolean, default: false },
    agua: { type: Boolean, default: false },
    protein: { type: Boolean, default: false }
  },
  ejercicio: {
    meditate: { type: Boolean, default: false },
    stretching: { type: Boolean, default: false },
    gym: { type: Boolean, default: false },
    cardio: { type: Boolean, default: false }
  },
  cleaning: {
    platos: { type: Boolean, default: false },
    piso: { type: Boolean, default: false },
    ropa: { type: Boolean, default: false }
  },
  completitud: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true
  },
  ...commonFields
});

rutinaSchema.pre('save', function(next) {
  let totalTasks = 0;
  let completedTasks = 0;

  ['morning', 'bodyCare', 'nutricion', 'ejercicio', 'cleaning'].forEach(section => {
    const sectionFields = Object.keys(this[section].toObject());
    totalTasks += sectionFields.length;
    
    Object.values(this[section].toObject()).forEach(value => {
      if (value === true) completedTasks++;
    });
  });

  this.completitud = totalTasks > 0 ? completedTasks / totalTasks : 0;
  next();
});

export const Rutinas = mongoose.model('Rutinas', rutinaSchema); 