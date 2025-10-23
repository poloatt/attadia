#!/usr/bin/env node

/**
 * Script para limpiar googleTaskId inválidos de la base de datos
 * 
 * Este script identifica y limpia subtareas que tienen googleTaskId
 * que ya no existen en Google Tasks, causando errores 404.
 */

import mongoose from 'mongoose';
import { Tareas } from '../src/models/index.js';
import config from '../src/config/config.js';

async function cleanupInvalidGoogleTaskIds() {
  try {
    console.log('🔗 Conectando a MongoDB...');
    await mongoose.connect(config.mongoUrl);
    console.log('✅ Conectado a MongoDB');

    console.log('🔍 Buscando subtareas con googleTaskId...');
    
    // Buscar todas las tareas que tienen subtareas con googleTaskId
    const tareasConSubtareas = await Tareas.find({
      'subtareas.googleTaskId': { $exists: true, $ne: null }
    });

    console.log(`📊 Encontradas ${tareasConSubtareas.length} tareas con subtareas que tienen googleTaskId`);

    let totalSubtareas = 0;
    let subtareasConGoogleId = 0;
    let subtareasLimpiadas = 0;

    for (const tarea of tareasConSubtareas) {
      let tareaModificada = false;
      
      for (const subtarea of tarea.subtareas) {
        totalSubtareas++;
        
        if (subtarea.googleTaskId) {
          subtareasConGoogleId++;
          
          // Verificar si el googleTaskId parece válido (formato básico de Google Tasks)
          // Los IDs de Google Tasks suelen ser strings alfanuméricos de cierta longitud
          const googleTaskIdPattern = /^[a-zA-Z0-9_-]{10,}$/;
          
          if (!googleTaskIdPattern.test(subtarea.googleTaskId)) {
            console.log(`🧹 Limpiando googleTaskId inválido en subtarea "${subtarea.titulo}": ${subtarea.googleTaskId}`);
            subtarea.googleTaskId = null;
            subtarea.lastSyncDate = null;
            subtareasLimpiadas++;
            tareaModificada = true;
          }
        }
      }
      
      if (tareaModificada) {
        await tarea.save();
        console.log(`💾 Guardada tarea: "${tarea.titulo}"`);
      }
    }

    console.log('\n📊 Resumen de limpieza:');
    console.log(`   Total subtareas procesadas: ${totalSubtareas}`);
    console.log(`   Subtareas con googleTaskId: ${subtareasConGoogleId}`);
    console.log(`   Subtareas limpiadas: ${subtareasLimpiadas}`);
    
    if (subtareasLimpiadas > 0) {
      console.log('\n✅ Limpieza completada exitosamente');
      console.log('💡 Los googleTaskId inválidos han sido eliminados');
      console.log('🔄 La próxima sincronización creará nuevas tareas en Google Tasks');
    } else {
      console.log('\n✅ No se encontraron googleTaskId inválidos');
    }

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
    process.exit(0);
  }
}

// Ejecutar el script
cleanupInvalidGoogleTaskIds();
