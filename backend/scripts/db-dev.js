#!/usr/bin/env node

import { execSync } from 'child_process';

/**
 * Ejecuta las migraciones de la base de datos
 * @returns {Promise<void>}
 */
async function runMigrations() {
  try {
    console.log('Aplicando migraciones...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    
    console.log('Generando cliente Prisma...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    console.log('Ejecutando seed...');
    execSync('npx prisma db seed', { stdio: 'inherit' });
    
    console.log('✅ Base de datos inicializada correctamente');
  } catch (error) {
    console.error('Error en migraciones:', error);
    process.exit(1);
  }
}

runMigrations().catch(console.error);