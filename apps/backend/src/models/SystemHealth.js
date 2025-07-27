import mongoose from 'mongoose';

const systemHealthSchema = new mongoose.Schema({
  cpuUsage: {
    type: Number,
    required: true
  },
  memoryUsage: {
    type: Number,
    required: true
  },
  diskUsage: Number,
  activeConnections: Number,
  responseTime: Number,
  status: {
    type: String,
    enum: ['HEALTHY', 'WARNING', 'CRITICAL'],
    required: true
  },
  lastCheck: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export const SystemHealth = mongoose.model('SystemHealth', systemHealthSchema); 