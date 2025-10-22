/**
 * Script para limpiar descripciones duplicadas en la base de datos
 * Ejecutar desde: node scripts/cleanup-duplicate-descriptions.js
 */

import mongoose from 'mongoose';
import { Tareas } from '../src/models/index.js';
import config from '../src/config/config.js';

const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('MongoDB conectado exitosamente');
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error);
    process.exit(1);
  }
};

const cleanDuplicatedNotes = (notes) => {
  if (!notes) return '';
  
  // Primero limpiar repeticiones masivas de "Proyecto: Salud"
  let cleanedNotes = notes.replace(/(Proyecto: Salud\n)+/g, 'Proyecto: Salud\n');
  
  // Limpiar múltiples saltos de línea
  cleanedNotes = cleanedNotes.replace(/\n{3,}/g, '\n\n');
  
  // Dividir por "---" para separar secciones
  const sections = cleanedNotes.split('---');
  
  if (sections.length < 2) return cleanedNotes.trim();
  
  // Tomar solo la primera sección (contenido útil) y limpiar espacios
  let result = sections[0].trim();
  
  // Si había contenido útil después de las secciones de sincronización,
  // también incluirlo
  const hasSubtareas = sections.some(section => section.includes('Subtareas:'));
  const hasProyecto = sections.some(section => section.includes('Proyecto:'));
  
  if (hasSubtareas || hasProyecto) {
    // Buscar la primera sección que contenga información útil (Subtareas o Proyecto)
    for (let i = 1; i < sections.length; i++) {
      if (sections[i].includes('Subtareas:') || sections[i].includes('Proyecto:')) {
        result += '\n---' + sections[i].trim();
        break;
      }
    }
  }
  
  return result;
};

const cleanupDuplicateDescriptions = async () => {
  try {
    console.log('🧹 Iniciando limpieza de descripciones duplicadas...');
    
    // Buscar tareas con descripciones que contengan repeticiones
    const tareasConDuplicados = await Tareas.find({
      descripcion: { $regex: /Proyecto: Salud\n.*Proyecto: Salud\n/, $options: 'm' }
    });
    
    console.log(`📊 Encontradas ${tareasConDuplicados.length} tareas con descripciones duplicadas`);
    
    let cleanedCount = 0;
    let totalSizeReduction = 0;
    
    for (const tarea of tareasConDuplicados) {
      const originalSize = tarea.descripcion?.length || 0;
      const cleanedDescription = cleanDuplicatedNotes(tarea.descripcion);
      const newSize = cleanedDescription.length;
      
      if (originalSize !== newSize) {
        tarea.descripcion = cleanedDescription;
        await tarea.save();
        
        cleanedCount++;
        totalSizeReduction += (originalSize - newSize);
        
        console.log(`✅ Limpiada tarea "${tarea.titulo}": ${originalSize} → ${newSize} caracteres (${originalSize - newSize} reducción)`);
      }
    }
    
    console.log(`\n📈 Resumen de limpieza:`);
    console.log(`   - Tareas procesadas: ${tareasConDuplicados.length}`);
    console.log(`   - Tareas limpiadas: ${cleanedCount}`);
    console.log(`   - Reducción total de caracteres: ${totalSizeReduction}`);
    console.log(`   - Promedio de reducción por tarea: ${cleanedCount > 0 ? Math.round(totalSizeReduction / cleanedCount) : 0} caracteres`);
    
    // Verificar si hay tareas con descripciones muy largas (>1000 caracteres)
    const tareasLargas = await Tareas.find({
      $expr: { $gt: [{ $strLenCP: { $ifNull: ['$descripcion', ''] } }, 1000] }
    });
    
    if (tareasLargas.length > 0) {
      console.log(`\n⚠️  Advertencia: ${tareasLargas.length} tareas aún tienen descripciones muy largas (>1000 caracteres)`);
      console.log('   Considera ejecutar el script nuevamente o revisar manualmente estas tareas.');
    }
    
    console.log('\n🎉 Limpieza completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  }
};

const main = async () => {
  await connectDB();
  await cleanupDuplicateDescriptions();
  await mongoose.disconnect();
  console.log('👋 Desconectado de MongoDB');
};

main().catch(console.error);
