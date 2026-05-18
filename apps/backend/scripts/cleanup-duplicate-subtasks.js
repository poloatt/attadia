#!/usr/bin/env node

/**
 * Limpia subtareas duplicadas por título (normalizado) en la BD
 * y opcionalmente en Google Tasks.
 *
 * - Dedupe local por (título normalizado):
 *   - Se prioriza la subtarea con googleTaskId válido.
 *   - Luego por lastSyncDate más reciente.
 *   - Se fusiona el estado completada (true si alguna lo está).
 * - Normaliza descripción removiendo repeticiones de "Subtareas:" en la tarea.
 * - Con --google también deduplica en Google (elimina duplicados por título bajo el mismo parent).
 * - Flags:
 *   --user=<email|id>     Limitar a un usuario
 *   --google              Aplicar limpieza también en Google
 *   --dry-run             No guarda cambios ni borra (por defecto true)
 */

import mongoose from 'mongoose';
import { google } from 'googleapis';
import { Users, Tareas, Objetivos } from '../src/models/index.js';
import config from '../src/config/config.js';

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const [key, val] = arg.split('=');
      const name = key.replace(/^--/, '');
      if (typeof val !== 'undefined') {
        out[name] = val;
      } else {
        // flags tipo --google o --dry-run
        if (name === 'dry-run') out[name] = true;
        else out[name] = true;
      }
    } else if (arg === '-u' || arg === '--user') {
      const val = argv[i + 1];
      if (val && !val.startsWith('-')) {
        out.user = val;
        i++;
      }
    }
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const DRY_RUN = args['dry-run'] !== false && args['dry-run'] !== 'false'; // default true
const INCLUDE_GOOGLE = !!args.google;
const USER_FILTER = args.user || null;
const OBJETIVO_ID = args.project || null;
const PROJECT_NAME = args['project-name'] || null; // puede ser "Salud,Trámites"

function normalizeTitle(title) {
  return String(title || '')
    .replace(/^\s*(\[[^\]]+\]\s*)+/g, '') // quitar prefijos [xxx]
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quitar tildes
    .trim()
    .replace(/\s{2,}/g, ' ')
    .toLowerCase();
}

function normalizeDescripcion(descripcion) {
  if (!descripcion) return '';
  const lines = String(descripcion).split('\n');
  const endMarkers = ['Subtareas:', 'Objetivo:', '---'];
  let result = '';
  for (const line of lines) {
    if (endMarkers.some(marker => line.trim().startsWith(marker))) break;
    result += line + '\n';
  }
  return result.trim();
}

async function getGoogleClientsForUser(user) {
  const oauth2Client = new google.auth.OAuth2(
    config.google.clientId,
    config.google.clientSecret,
    `${config.backendUrl}/api/google-tasks/callback`
  );
  oauth2Client.setCredentials({
    access_token: user.googleTasksConfig.accessToken,
    refresh_token: user.googleTasksConfig.refreshToken
  });
  const tasks = google.tasks({
    version: 'v1',
    auth: oauth2Client,
    params: { quotaUser: 'attadia-app' }
  });
  return { oauth2Client, tasks };
}

async function dedupeInGoogle(tasksClient, taskListId, parentTaskId) {
  // Lista todas las tareas y filtra por parent
  const resp = await tasksClient.tasks.list({
    tasklist: taskListId,
    showCompleted: true,
    showHidden: true,
    maxResults: 1000,
    fields: 'items(id,title,status,parent,position)'
  });
  const items = resp.data.items || [];
  const children = items.filter(t => t.parent === parentTaskId);

  // Agrupa por título normalizado
  const byNorm = new Map();
  for (const t of children) {
    const key = normalizeTitle(t.title);
    if (!byNorm.has(key)) byNorm.set(key, []);
    byNorm.get(key).push(t);
  }

  let deleted = 0;
  for (const [key, arr] of byNorm.entries()) {
    if (arr.length <= 1) continue;
    // Mantener el primero (preferimos el que esté 'needsAction', luego por position asc)
    arr.sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === 'needsAction' ? -1 : 1;
      }
      return String(a.position || '').localeCompare(String(b.position || ''));
    });
    const keep = arr[0];
    const toDelete = arr.slice(1);
    for (const d of toDelete) {
      if (DRY_RUN) {
        console.log(`DRY-RUN: Eliminar duplicado en Google "${d.title}" (${d.id}) parent=${parentTaskId}`);
      } else {
        try {
          await tasksClient.tasks.delete({ tasklist: taskListId, task: d.id });
          console.log(`🗑️ Eliminado duplicado en Google "${d.title}" (${d.id})`);
          deleted++;
        } catch (e) {
          console.warn(`No se pudo eliminar duplicado en Google "${d.title}" (${d.id}): ${e.message}`);
        }
      }
    }
    console.log(`Manteniendo en Google "${keep.title}" (${keep.id}), eliminados=${toDelete.length}`);
  }
  return { deleted };
}

async function cleanupDuplicateSubtasks() {
  try {
    console.log('🔗 Conectando a MongoDB...');
    await mongoose.connect(config.mongoUrl);
    console.log('✅ Conectado a MongoDB');

    // Usuarios target
    const userQuery = { 'googleTasksConfig.enabled': true };
    if (USER_FILTER) {
      userQuery.$or = [
        { _id: USER_FILTER },
        { id: USER_FILTER },
        { email: USER_FILTER }
      ];
    }
    // Construir filtro robusto para _id o email
    if (USER_FILTER) {
      const or = [];
      // _id si parece ObjectId
      try {
        const asObjectId = new mongoose.Types.ObjectId(USER_FILTER);
        if (String(asObjectId) === USER_FILTER) {
          or.push({ _id: asObjectId });
        }
      } catch {}
      // email o id plano
      or.push({ email: USER_FILTER });
      or.push({ id: USER_FILTER });
      userQuery.$or = or;
    }

    const users = await Users.find(userQuery);
    if (users.length === 0) {
      console.log('❌ No hay usuarios con Google Tasks habilitado que coincidan con el filtro');
      return;
    }
    console.log(`👥 Usuarios a procesar: ${users.length}`);

    for (const user of users) {
      console.log(`\n👤 Procesando usuario: ${user.email || user._id}`);
      let tasksClient = null;
      if (INCLUDE_GOOGLE) {
        try {
          const { tasks } = await getGoogleClientsForUser(user);
          tasksClient = tasks;
        } catch (e) {
          console.warn(`No se pudo inicializar Google Tasks para ${user.email}: ${e.message}`);
        }
      }

      // Obtener Objetivos objetivo si se pidió filtro
      let objetivoIds = null;
      if (OBJETIVO_ID || PROJECT_NAME) {
        const pjQuery = { usuario: user._id };
        if (OBJETIVO_ID) {
          pjQuery._id = OBJETIVO_ID;
        }
        if (PROJECT_NAME) {
          const names = PROJECT_NAME.split(',').map(s => s.trim()).filter(Boolean);
          // búsqueda case-insensitive
          pjQuery.nombre = { $in: names.map(n => new RegExp(`^${n}$`, 'i')) };
        }
        const Objetivos = await Objetivos.find(pjQuery).select('_id nombre');
        objetivoIds = Objetivos.map(p => p._id);
        console.log(`🎯 Objetivos objetivo: ${Objetivos.map(p => p.nombre).join(', ') || '(ninguno encontrado)'}`);
      }

      // Buscar tareas del usuario con subtareas (y opcionalmente por Objetivo)
      const tareasQuery = { usuario: user._id, 'subtareas.0': { $exists: true } };
      if (objetivoIds && objetivoIds.length > 0) {
        tareasQuery.Objetivo = { $in: objetivoIds };
      }
      const tareas = await Tareas.find(tareasQuery);
      console.log(`📋 Tareas con subtareas: ${tareas.length}`);

      let totalRemovedLocal = 0;
      let totalMerged = 0;
      let totalDescriptionsFixed = 0;
      let totalGoogleDeleted = 0;

      for (const tarea of tareas) {
        const beforeCount = (tarea.subtareas || []).length;
        if (!beforeCount) continue;

        // Normalizar y agrupar por título
        const buckets = new Map();
        for (const st of tarea.subtareas) {
          const key = normalizeTitle(st.titulo);
          if (!buckets.has(key)) buckets.set(key, []);
          buckets.get(key).push(st);
        }

        const newSubtareas = [];
        for (const [key, group] of buckets.entries()) {
          if (group.length === 1) {
            newSubtareas.push(group[0]);
            continue;
          }
          // Preferir con googleTaskId válido; si varios, por lastSyncDate desc
          group.sort((a, b) => {
            if (!!a.googleTaskId !== !!b.googleTaskId) {
              return b.googleTaskId ? 1 : -1; // primero el que tiene id
            }
            const aSync = a.lastSyncDate ? new Date(a.lastSyncDate).getTime() : 0;
            const bSync = b.lastSyncDate ? new Date(b.lastSyncDate).getTime() : 0;
            return bSync - aSync;
          });
          const keep = group[0];
          // Fusionar estado completada si alguna lo está
          keep.completada = group.some(s => !!s.completada);
          // Mantener el título más largo (más informativo) si difiere
          const bestTitle = group.map(s => s.titulo).sort((a, b) => String(b).length - String(a).length)[0];
          keep.titulo = bestTitle || keep.titulo;
          newSubtareas.push(keep);
          totalMerged += (group.length - 1);
        }

        // Si cambió el número de subtareas, guardar
        if (newSubtareas.length !== beforeCount) {
          const removed = beforeCount - newSubtareas.length;
          totalRemovedLocal += removed;
          if (DRY_RUN) {
            console.log(`DRY-RUN: "${tarea.titulo}": ${removed} duplicado(s) local(es) serían eliminados`);
          } else {
            tarea.subtareas = newSubtareas;
          }
        }

        // Normalizar descripción (limpiar repeticiones Subtareas:)
        const normalizedDesc = normalizeDescripcion(tarea.descripcion || '');
        if (normalizedDesc !== (tarea.descripcion || '')) {
          totalDescriptionsFixed++;
          if (DRY_RUN) {
            console.log(`DRY-RUN: Normalizar descripción de "${tarea.titulo}"`);
          } else {
            tarea.descripcion = normalizedDesc;
          }
        }

        if (!DRY_RUN && (newSubtareas.length !== beforeCount || normalizedDesc !== (tarea.descripcion || ''))) {
          await tarea.save();
          console.log(`💾 Guardada tarea deduplicada: "${tarea.titulo}"`);
        }

        // Dedupe en Google si se solicita y si la tarea tiene googleTaskId + taskListId
        if (INCLUDE_GOOGLE && tasksClient && tarea.googleTasksSync?.googleTaskId && tarea.googleTasksSync?.googleTaskListId) {
          try {
            const { deleted } = await dedupeInGoogle(
              tasksClient,
              tarea.googleTasksSync.googleTaskListId,
              tarea.googleTasksSync.googleTaskId
            );
            totalGoogleDeleted += deleted;
          } catch (e) {
            console.warn(`No se pudo deduplicar en Google para "${tarea.titulo}": ${e.message}`);
          }
        }
      }

      console.log('\n📊 Resumen usuario:');
      console.log(`   Local - duplicados eliminados: ${totalRemovedLocal}, grupos fusionados: ${totalMerged}`);
      console.log(`   Descripciones normalizadas: ${totalDescriptionsFixed}`);
      if (INCLUDE_GOOGLE) {
        console.log(`   Google - duplicados eliminados: ${totalGoogleDeleted}`);
      }
    }

    console.log('\n✅ Finalizado.');
    if (DRY_RUN) {
      console.log('ℹ️ Se ejecutó en modo DRY-RUN. Usa --dry-run=false para aplicar cambios.');
    }
  } catch (error) {
    console.error('❌ Error durante la limpieza de duplicados:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
    process.exit(0);
  }
}

cleanupDuplicateSubtasks();


