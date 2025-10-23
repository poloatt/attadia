#!/usr/bin/env node

/**
 * Script para diagnosticar googleTaskId problemáticos
 */

import mongoose from 'mongoose';
import { Tareas } from '../src/models/index.js';
import config from '../src/config/config.js';

async function diagnoseGoogleTaskIds() {
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

    for (const tarea of tareasConSubtareas) {
      console.log(`\n📋 Tarea: "${tarea.titulo}"`);
      
      for (const subtarea of tarea.subtareas) {
        if (subtarea.googleTaskId) {
          console.log(`  🔗 Subtarea: "${subtarea.titulo}"`);
          console.log(`     GoogleTaskId: ${subtarea.googleTaskId}`);
          console.log(`     Longitud: ${subtarea.googleTaskId.length}`);
          console.log(`     Tipo: ${typeof subtarea.googleTaskId}`);
          
          // Verificar si el ID parece válido
          const googleTaskIdPattern = /^[a-zA-Z0-9_-]{10,}$/;
          const isValid = googleTaskIdPattern.test(subtarea.googleTaskId);
          console.log(`     Válido: ${isValid ? '✅' : '❌'}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
    process.exit(0);
  }
}

// Ejecutar el script
diagnoseGoogleTaskIds();
