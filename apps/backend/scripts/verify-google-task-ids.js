#!/usr/bin/env node

/**
 * Script para verificar si los googleTaskId realmente existen en Google Tasks
 */

import mongoose from 'mongoose';
import { google } from 'googleapis';
import { Tareas, Users } from '../src/models/index.js';
import config from '../src/config/config.js';

async function verifyGoogleTaskIds() {
  try {
    console.log('🔗 Conectando a MongoDB...');
    await mongoose.connect(config.mongoUrl);
    console.log('✅ Conectado a MongoDB');

    // Configurar OAuth2
    const oauth2Client = new google.auth.OAuth2(
      config.google.clientId,
      config.google.clientSecret,
      `${config.backendUrl}/api/google-tasks/callback`
    );
    
    const tasks = google.tasks({ 
      version: 'v1', 
      auth: oauth2Client,
      params: { quotaUser: 'attadia-app' }
    });

    // Obtener un usuario con Google Tasks configurado
    const user = await Users.findOne({ 'googleTasksConfig.enabled': true });
    if (!user) {
      console.log('❌ No se encontró usuario con Google Tasks habilitado');
      return;
    }

    console.log(`👤 Usuario: ${user.nombre} (${user.email})`);

    // Configurar credenciales
    oauth2Client.setCredentials({
      access_token: user.googleTasksConfig.accessToken,
      refresh_token: user.googleTasksConfig.refreshToken
    });

    // Obtener todas las TaskLists
    const taskListsResponse = await tasks.tasklists.list();
    const taskLists = taskListsResponse.data.items || [];
    console.log(`📁 TaskLists encontradas: ${taskLists.length}`);

    // Crear mapa de todas las tareas existentes en Google
    const existingTaskIds = new Set();
    
    for (const taskList of taskLists) {
      console.log(`\n📋 Verificando TaskList: "${taskList.title}"`);
      
      try {
        const tasksResponse = await tasks.tasks.list({
          tasklist: taskList.id,
          showCompleted: true,
          showHidden: true,
          maxResults: 100
        });
        
        const googleTasks = tasksResponse.data.items || [];
        console.log(`   📊 Tareas encontradas: ${googleTasks.length}`);
        
        for (const task of googleTasks) {
          existingTaskIds.add(task.id);
          if (task.parent) {
            console.log(`   🔗 Subtarea: "${task.title}" (ID: ${task.id})`);
          } else {
            console.log(`   📝 Tarea: "${task.title}" (ID: ${task.id})`);
          }
        }
      } catch (error) {
        console.log(`   ❌ Error al obtener tareas: ${error.message}`);
      }
    }

    console.log(`\n📊 Total de tareas/subtareas en Google: ${existingTaskIds.size}`);

    // Verificar subtareas de Attadia
    console.log('\n🔍 Verificando subtareas de Attadia...');
    
    const tareasConSubtareas = await Tareas.find({
      'subtareas.googleTaskId': { $exists: true, $ne: null }
    });

    let subtareasExistentes = 0;
    let subtareasInexistentes = 0;

    for (const tarea of tareasConSubtareas) {
      console.log(`\n📋 Tarea: "${tarea.titulo}"`);
      
      for (const subtarea of tarea.subtareas) {
        if (subtarea.googleTaskId) {
          const existe = existingTaskIds.has(subtarea.googleTaskId);
          console.log(`   ${existe ? '✅' : '❌'} "${subtarea.titulo}" (${subtarea.googleTaskId})`);
          
          if (existe) {
            subtareasExistentes++;
          } else {
            subtareasInexistentes++;
          }
        }
      }
    }

    console.log(`\n📊 Resumen:`);
    console.log(`   ✅ Subtareas existentes en Google: ${subtareasExistentes}`);
    console.log(`   ❌ Subtareas NO existentes en Google: ${subtareasInexistentes}`);

    if (subtareasInexistentes > 0) {
      console.log('\n💡 Recomendación: Ejecutar script de limpieza para eliminar referencias a tareas inexistentes');
    }

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
    process.exit(0);
  }
}

// Ejecutar el script
verifyGoogleTaskIds();
