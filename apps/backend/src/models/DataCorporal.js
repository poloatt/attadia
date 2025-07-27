import mongoose from 'mongoose';
import { createSchema, commonFields } from './BaseSchema.js';

const dataCorporalSchema = createSchema({
  fecha: {
    type: Date,
    default: Date.now,
    unique: true
  },
  weight: {
    type: Number,
    required: true,
    min: 0
  },
  muscle: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  fatPercent: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  stress: {
    type: Number,
    required: true,
    min: 0,
    max: 10
  },
  sleep: {
    type: Number,
    required: true,
    min: 0,
    max: 24
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true
  },
  ...commonFields
});

export const DataCorporal = mongoose.model('DataCorporal', dataCorporalSchema); 