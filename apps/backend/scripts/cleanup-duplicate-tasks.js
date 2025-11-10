#!/usr/bin/env node

/**
 * Limpia tareas duplicadas (padres) en la BD y opcionalmente en Google.
 *
 * Estrategia BD:
 * 1) Agrupar por googleTaskId (cuando existe). Conservar 1, fusionar subtareas y estado, eliminar el resto.
 * 2) Agrupar por título normalizado dentro del mismo googleTaskListId cuando no hay googleTaskId.
 *    Conservar 1 y fusionar subtareas/estado.
 *
 * Opcional Google:
 * - Con --google-parents deduplica tareas principales (sin parent) en Google por título normalizado en la misma TaskList.
 *
 * Flags:
 *   --user=<email|id>         Limitar a un usuario
 *   --google-parents          Deduplica también tareas padres en Google
 *   --dry-run                 No guarda cambios ni borra (por defecto true)
 */

import mongoose from 'mongoose';
import { google } from 'googleapis';
import { Users, Tareas } from '../src/models/index.js';
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
        out[name] = true;
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
const GOOGLE_PARENTS = !!args['google-parents'];
const USER_FILTER = args.user || null;

function normalizeTitle(title) {
  return String(title || '')
    .trim()
    .replace(/\s{2,}/g, ' ')
    .toLowerCase();
}

function dedupeSubtareas(subtareas) {
  if (!Array.isArray(subtareas)) return [];
  const buckets = new Map();
  for (const st of subtareas) {
    const key = normalizeTitle(st.titulo);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(st);
  }
  const result = [];
  for (const [key, group] of buckets.entries()) {
    if (group.length === 1) {
      result.push(group[0]);
      continue;
    }
    // Preferir con googleTaskId, luego por lastSyncDate desc
    group.sort((a, b) => {
      if (!!a.googleTaskId !== !!b.googleTaskId) {
        return b.googleTaskId ? 1 : -1;
      }
      const aSync = a.lastSyncDate ? new Date(a.lastSyncDate).getTime() : 0;
      const bSync = b.lastSyncDate ? new Date(b.lastSyncDate).getTime() : 0;
      return bSync - aSync;
    });
    const keep = { ...group[0] };
    // Fusionar estado completada
    keep.completada = group.some(s => !!s.completada);
    // Título más largo
    const bestTitle = group.map(s => s.titulo).sort((a, b) => String(b).length - String(a).length)[0];
    keep.titulo = bestTitle || keep.titulo;
    result.push(keep);
  }
  return result;
}

async function getGoogleTasksClient(user) {
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
  return tasks;
}

async function dedupeParentsInGoogle(tasksClient, taskListId) {
  const resp = await tasksClient.tasks.list({
    tasklist: taskListId,
    showCompleted: true,
    showHidden: true,
    maxResults: 1000,
    fields: 'items(id,title,status,parent,position)'
  });
  const items = resp.data.items || [];
  const parents = items.filter(t => !t.parent);
  const byNorm = new Map();
  for (const t of parents) {
    const key = normalizeTitle(t.title);
    if (!byNorm.has(key)) byNorm.set(key, []);
    byNorm.get(key).push(t);
  }
  let deleted = 0;
  for (const [key, arr] of byNorm.entries()) {
    if (arr.length <= 1) continue;
    // Orden: mantener needsAction preferentemente, luego por position
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
        console.log(`DRY-RUN: Eliminar duplicado de tarea padre en Google "${d.title}" (${d.id})`);
      } else {
        try {
          await tasksClient.tasks.delete({ tasklist: taskListId, task: d.id });
          console.log(`🗑️ Eliminada tarea padre duplicada en Google "${d.title}" (${d.id})`);
          deleted++;
        } catch (e) {
          console.warn(`No se pudo eliminar tarea padre duplicada "${d.title}" (${d.id}): ${e.message}`);
        }
      }
    }
    console.log(`Manteniendo en Google "${keep.title}" (${keep.id}), eliminados=${toDelete.length}`);
  }
  return { deleted };
}

async function cleanupDuplicateTasks() {
  try {
    console.log('🔗 Conectando a MongoDB...');
    await mongoose.connect(config.mongoUrl);
    console.log('✅ Conectado a MongoDB');

    // Usuarios target
    const userQuery = { 'googleTasksConfig.enabled': true };
    if (USER_FILTER) {
      const or = [];
      try {
        const asObjectId = new mongoose.Types.ObjectId(USER_FILTER);
        if (String(asObjectId) === USER_FILTER) or.push({ _id: asObjectId });
      } catch {}
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
      if (GOOGLE_PARENTS) {
        try {
          tasksClient = await getGoogleTasksClient(user);
        } catch (e) {
          console.warn(`No se pudo inicializar Google Tasks para ${user.email}: ${e.message}`);
        }
      }

      // Todas las tareas del usuario
      const tareas = await Tareas.find({ usuario: user._id }).lean(false);
      console.log(`📋 Tareas totales: ${tareas.length}`);

      // 1) Dedupe por googleTaskId
      const byGoogleId = new Map();
      for (const t of tareas) {
        const id = t.googleTasksSync?.googleTaskId;
        if (!id) continue;
        if (!byGoogleId.has(id)) byGoogleId.set(id, []);
        byGoogleId.get(id).push(t);
      }
      let removedById = 0;
      for (const [gid, group] of byGoogleId.entries()) {
        if (group.length <= 1) continue;
        // Mantener el que tenga más subtareas y luego updatedAt más reciente
        group.sort((a, b) => {
          const sa = a.subtareas?.length || 0;
          const sb = b.subtareas?.length || 0;
          if (sa !== sb) return sb - sa;
          const ua = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const ub = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          return ub - ua;
        });
        const keep = group[0];
        const toRemove = group.slice(1);
        // Fusionar subtareas y estado
        const mergedSubtareas = dedupeSubtareas(
          (keep.subtareas || []).concat(...toRemove.map(t => t.subtareas || []))
        );
        const completada = mergedSubtareas.length > 0
          ? mergedSubtareas.every(st => st.completada)
          : keep.completada;
        keep.subtareas = mergedSubtareas;
        keep.completada = !!completada;
        keep.estado = keep.completada ? 'COMPLETADA' : (keep.subtareas.some(st => st.completada) ? 'EN_PROGRESO' : 'PENDIENTE');

        if (DRY_RUN) {
          console.log(`DRY-RUN: Mantener "${keep.titulo}" (${gid}), eliminar ${toRemove.length} duplicado(s) por googleTaskId`);
        } else {
          await keep.save();
          for (const d of toRemove) {
            await Tareas.findByIdAndDelete(d._id);
          }
        }
        removedById += toRemove.length;
      }

      // 2) Dedupe por título normalizado dentro del mismo googleTaskListId para tareas sin googleTaskId
      const candidates = tareas.filter(t => !t.googleTasksSync?.googleTaskId);
      const byListAndTitle = new Map();
      for (const t of candidates) {
        const listId = t.googleTasksSync?.googleTaskListId || 'no-list';
        const key = `${listId}::${normalizeTitle(t.titulo)}`;
        if (!byListAndTitle.has(key)) byListAndTitle.set(key, []);
        byListAndTitle.get(key).push(t);
      }
      let removedByTitle = 0;
      for (const [key, group] of byListAndTitle.entries()) {
        if (group.length <= 1) continue;
        group.sort((a, b) => {
          const sa = a.subtareas?.length || 0;
          const sb = b.subtareas?.length || 0;
          if (sa !== sb) return sb - sa;
          const ua = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const ub = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          return ub - ua;
        });
        const keep = group[0];
        const toRemove = group.slice(1);
        const mergedSubtareas = dedupeSubtareas(
          (keep.subtareas || []).concat(...toRemove.map(t => t.subtareas || []))
        );
        const completada = mergedSubtareas.length > 0
          ? mergedSubtareas.every(st => st.completada)
          : keep.completada;
        keep.subtareas = mergedSubtareas;
        keep.completada = !!completada;
        keep.estado = keep.completada ? 'COMPLETADA' : (keep.subtareas.some(st => st.completada) ? 'EN_PROGRESO' : 'PENDIENTE');

        if (DRY_RUN) {
          console.log(`DRY-RUN: Mantener "${keep.titulo}" [${key}], eliminar ${toRemove.length} duplicado(s) por título/lista`);
        } else {
          await keep.save();
          for (const d of toRemove) {
            await Tareas.findByIdAndDelete(d._id);
          }
        }
        removedByTitle += toRemove.length;
      }

      // 3) Google: dedupe padres por título normalizado (opcional)
      let googleDeleted = 0;
      if (GOOGLE_PARENTS && tasksClient) {
        // Recoger TaskLists usadas por el usuario en sus tareas
        const taskListIds = Array.from(new Set(
          tareas
            .map(t => t.googleTasksSync?.googleTaskListId)
            .filter(Boolean)
        ));
        for (const listId of taskListIds) {
          try {
            const { deleted } = await dedupeParentsInGoogle(tasksClient, listId);
            googleDeleted += deleted;
          } catch (e) {
            console.warn(`No se pudo deduplicar tareas padres en Google para list ${listId}: ${e.message}`);
          }
        }
      }

      console.log('\n📊 Resumen usuario:');
      console.log(`   BD - eliminados por googleTaskId: ${removedById}, por título/lista: ${removedByTitle}`);
      if (GOOGLE_PARENTS) {
        console.log(`   Google - tareas padres eliminadas: ${googleDeleted}`);
      }
    }

    console.log('\n✅ Finalizado.');
    if (DRY_RUN) {
      console.log('ℹ️ Se ejecutó en modo DRY-RUN. Usa --dry-run=false para aplicar cambios.');
    }
  } catch (error) {
    console.error('❌ Error durante la limpieza de tareas duplicadas:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
    process.exit(0);
  }
}

cleanupDuplicateTasks();


