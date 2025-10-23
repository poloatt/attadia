#!/usr/bin/env node

/**
 * Script para limpiar tokens inválidos de Google Tasks
 * 
 * Este script identifica y limpia tokens de Google Tasks que han expirado
 * o son inválidos, evitando errores de 'invalid_grant' en las sincronizaciones.
 * 
 * Uso:
 *   node scripts/cleanup-invalid-google-tokens.js
 *   npm run cleanup-google-tokens
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar configuración
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Importar modelos y servicios
import { Users } from '../src/models/index.js';
import googleTasksService from '../src/services/googleTasksService.js';

async function cleanupInvalidTokens() {
  try {
    console.log('🚀 Iniciando limpieza de tokens inválidos de Google Tasks...');
    
    // Conectar a MongoDB
    const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/present';
    await mongoose.connect(mongoUrl);
    console.log('✅ Conectado a MongoDB');

    // Ejecutar limpieza
    const results = await googleTasksService.cleanupInvalidTokens();
    
    console.log('\n📊 Resumen de limpieza:');
    console.log(`   ✅ Tokens válidos: ${results.validCount}`);
    console.log(`   🧹 Tokens limpiados: ${results.cleanedCount}`);
    
    if (results.cleanedCount > 0) {
      console.log('\n⚠️  Usuarios afectados necesitarán reconectar sus cuentas de Google Tasks');
    } else {
      console.log('\n🎉 Todos los tokens están válidos');
    }

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Desconectado de MongoDB');
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupInvalidTokens()
    .then(() => {
      console.log('✅ Limpieza completada exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}

export { cleanupInvalidTokens };
