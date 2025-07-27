#!/usr/bin/env node

import mongoose from 'mongoose';

const MAX_RETRIES = process.env.MAX_RETRIES || 10;
const RETRY_DELAY = process.env.RETRY_DELAY || 5000;
let retries = 0;

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conexión a MongoDB establecida');
    process.exit(0);
  } catch (error) {
    console.error('Error conectando a MongoDB:', error.message);
    retries++;
    
    if (retries >= MAX_RETRIES) {
      console.error('Máximo número de intentos alcanzado');
      process.exit(1);
    }
    
    console.log(`Reintentando en ${RETRY_DELAY/1000} segundos...`);
    setTimeout(connectDB, RETRY_DELAY);
  }
}

connectDB();