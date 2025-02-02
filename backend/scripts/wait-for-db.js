#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES || '10');
const RETRY_DELAY = parseInt(process.env.RETRY_DELAY || '5000');

async function waitForDatabase() {
  console.log('Esperando a que la base de datos esté lista...');
  let retries = MAX_RETRIES;

  while (retries > 0) {
    try {
      console.log('Intentando conectar a la base de datos...');
      await prisma.$connect();
      console.log('✅ Conexión a la base de datos exitosa');
      return true;
    } catch (error) {
      console.log(`❌ Conexión fallida. ${retries} intentos restantes...`);
      console.error('Error:', error);
      retries--;
      
      if (retries === 0) {
        console.error('No se pudo conectar a la base de datos después de varios intentos');
        process.exit(1);
      }
      
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }
  return false;
}

waitForDatabase().catch(console.error); 