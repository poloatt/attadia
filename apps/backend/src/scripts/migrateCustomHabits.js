/**
 * Script de migración para copiar hábitos actuales a customHabits en usuarios existentes
 * 
 * Este script migra los hábitos hardcodeados actuales al nuevo sistema de hábitos personalizados.
 * Se ejecuta una sola vez para usuarios existentes.
 * 
 * Uso:
 * node apps/backend/src/scripts/migrateCustomHabits.js
 */

import mongoose from 'mongoose';
import { Users } from '../models/index.js';
import { cloneDefaultCustomHabits } from '../constants/defaultCustomHabits.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../../.env') });

const defaultHabits = cloneDefaultCustomHabits();

async function migrateCustomHabits() {
  try {
    // Conectar a MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/attadia';
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');

    // Buscar usuarios que no tengan customHabits o tengan customHabits vacío
    const users = await Users.find({
      $or: [
        { customHabits: { $exists: false } },
        { 'customHabits.bodyCare': { $exists: false } },
        { 'customHabits.bodyCare': { $size: 0 } }
      ]
    });

    console.log(`📊 Encontrados ${users.length} usuarios para migrar`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const user of users) {
      try {
        // Verificar si ya tiene customHabits con datos
        if (user.customHabits && 
            user.customHabits.bodyCare && 
            user.customHabits.bodyCare.length > 0) {
          console.log(`⏭️  Usuario ${user.email} ya tiene hábitos personalizados, omitiendo...`);
          skipped++;
          continue;
        }

        // Asignar hábitos por defecto
        user.customHabits = JSON.parse(JSON.stringify(defaultHabits));
        await user.save();

        console.log(`✅ Usuario ${user.email} migrado correctamente`);
        migrated++;
      } catch (error) {
        console.error(`❌ Error al migrar usuario ${user.email}:`, error.message);
        errors++;
      }
    }

    console.log('\n📈 Resumen de migración:');
    console.log(`   ✅ Migrados: ${migrated}`);
    console.log(`   ⏭️  Omitidos: ${skipped}`);
    console.log(`   ❌ Errores: ${errors}`);
    console.log(`   📊 Total procesados: ${users.length}`);

    // Cerrar conexión
    await mongoose.connection.close();
    console.log('\n🔌 Conexión cerrada');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en la migración:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Ejecutar migración
migrateCustomHabits();

