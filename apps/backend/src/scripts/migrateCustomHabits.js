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
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Hábitos por defecto (mismo que en el modelo)
const defaultHabits = {
  bodyCare: [
    { id: 'bath', label: 'Ducha', icon: 'Bathtub', activo: true, orden: 0 },
    { id: 'skinCareDay', label: 'Cuidado facial día', icon: 'PersonOutline', activo: true, orden: 1 },
    { id: 'skinCareNight', label: 'Cuidado facial noche', icon: 'Nightlight', activo: true, orden: 2 },
    { id: 'bodyCream', label: 'Crema corporal', icon: 'Spa', activo: true, orden: 3 }
  ],
  nutricion: [
    { id: 'cocinar', label: 'Cocinar', icon: 'Restaurant', activo: true, orden: 0 },
    { id: 'agua', label: 'Beber agua', icon: 'WaterDrop', activo: true, orden: 1 },
    { id: 'protein', label: 'Proteína', icon: 'SetMeal', activo: true, orden: 2 },
    { id: 'meds', label: 'Medicamentos', icon: 'Medication', activo: true, orden: 3 }
  ],
  ejercicio: [
    { id: 'meditate', label: 'Meditar', icon: 'SelfImprovement', activo: true, orden: 0 },
    { id: 'stretching', label: 'Correr', icon: 'DirectionsRun', activo: true, orden: 1 },
    { id: 'gym', label: 'Gimnasio', icon: 'FitnessCenter', activo: true, orden: 2 },
    { id: 'cardio', label: 'Bicicleta', icon: 'DirectionsBike', activo: true, orden: 3 }
  ],
  cleaning: [
    { id: 'bed', label: 'Hacer la cama', icon: 'Hotel', activo: true, orden: 0 },
    { id: 'platos', label: 'Lavar platos', icon: 'Dining', activo: true, orden: 1 },
    { id: 'piso', label: 'Limpiar piso', icon: 'CleaningServices', activo: true, orden: 2 },
    { id: 'ropa', label: 'Lavar ropa', icon: 'LocalLaundryService', activo: true, orden: 3 }
  ]
};

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

