#!/usr/bin/env node

/**
 * Elimina instancias materializadas duplicadas de series recurrentes (sync / expand).
 *
 * Modelo Google (exportInstances: false): conserva solo la ancla (googleTaskId).
 * Modelo local (exportInstances: true): conserva ancla + una instancia por día calendario.
 *
 * Flags:
 *   --user=<email|id>     Limitar a un usuario
 *   --dry-run             No borra (por defecto true)
 *   --dry-run=false       Aplicar borrado en MongoDB
 *   --google              Borrar en Google Tasks las instancias con googleTaskId que no sean ancla
 */

import mongoose from 'mongoose';
import { google } from 'googleapis';
import { Users, Tareas, TareaSeries } from '../src/models/index.js';
import config from '../src/config/config.js';

function parseArgs(argv) {
  const out = {};
  for (const arg of argv) {
    if (!arg.startsWith('--')) continue;
    const [key, val] = arg.split('=');
    const name = key.replace(/^--/, '');
    out[name] = val !== undefined ? val : true;
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const DRY_RUN = args['dry-run'] !== false && args['dry-run'] !== 'false';
const WITH_GOOGLE = !!args.google;
const USER_FILTER = args.user || null;

function dayKey(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return 'invalid';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function pickBestTask(tasks) {
  const sorted = [...tasks].sort((a, b) => {
    const aAnchor = a.googleTasksSync?.googleTaskId ? 1 : 0;
    const bAnchor = b.googleTasksSync?.googleTaskId ? 1 : 0;
    if (aAnchor !== bAnchor) return bAnchor - aAnchor;
    if (a.completada !== b.completada) return a.completada ? 1 : -1;
    const ua = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const ub = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return ub - ua;
  });
  return sorted[0];
}

/**
 * @returns {{ keep: object[], remove: object[] }}
 */
export function planSerieInstanceCleanup(tasks, serie) {
  const list = (Array.isArray(tasks) ? tasks : []).filter((t) => !t.esExcepcionSerie);
  if (list.length <= 1) return { keep: list, remove: [] };

  const exportInstances = serie?.googleTasksSync?.exportInstances === true;
  const anchor = list.find((t) => t.googleTasksSync?.googleTaskId);

  if (!exportInstances) {
    const keepOne = anchor || pickBestTask(list);
    if (!keepOne) return { keep: [], remove: list };
    const keepId = String(keepOne._id);
    return {
      keep: [keepOne],
      remove: list.filter((t) => String(t._id) !== keepId),
    };
  }

  const keep = [];
  const remove = [];
  const keptDays = new Set();

  if (anchor) {
    keep.push(anchor);
    keptDays.add(dayKey(anchor.fechaVencimiento || anchor.fechaInicio));
  }

  for (const t of list) {
    if (anchor && String(t._id) === String(anchor._id)) continue;
    const dk = dayKey(t.fechaVencimiento || t.fechaInicio);
    if (keptDays.has(dk)) {
      remove.push(t);
    } else {
      keptDays.add(dk);
      keep.push(t);
    }
  }

  return { keep, remove };
}

async function getGoogleTasksClient(user) {
  const oauth2Client = new google.auth.OAuth2(
    config.google.clientId,
    config.google.clientSecret,
    `${config.backendUrl}/api/google-tasks/callback`,
  );
  oauth2Client.setCredentials({
    access_token: user.googleTasksConfig.accessToken,
    refresh_token: user.googleTasksConfig.refreshToken,
  });
  return google.tasks({
    version: 'v1',
    auth: oauth2Client,
    params: { quotaUser: 'attadia-app' },
  });
}

async function deleteGoogleTask(tasksClient, taskListId, googleTaskId, title) {
  if (!tasksClient || !taskListId || !googleTaskId) return false;
  if (DRY_RUN) {
    console.log(`  DRY-RUN Google: borrar "${title}" (${googleTaskId})`);
    return true;
  }
  try {
    await tasksClient.tasks.delete({ tasklist: taskListId, task: googleTaskId });
    console.log(`  🗑️ Google: "${title}" (${googleTaskId})`);
    return true;
  } catch (e) {
    console.warn(`  ⚠️ Google no borró "${title}" (${googleTaskId}): ${e.message}`);
    return false;
  }
}

async function resolveUsers() {
  if (USER_FILTER) {
    const or = [];
    try {
      const asId = new mongoose.Types.ObjectId(USER_FILTER);
      if (String(asId) === USER_FILTER) or.push({ _id: asId });
    } catch {
      /* noop */
    }
    or.push({ email: USER_FILTER });
    const user = await Users.findOne(or.length ? { $or: or } : { email: USER_FILTER });
    return user ? [user] : [];
  }

  const userIds = await Tareas.distinct('usuario', {
    serieId: { $exists: true, $ne: null },
  });
  if (userIds.length === 0) return [];
  return Users.find({ _id: { $in: userIds } });
}

async function cleanupSerieDuplicates() {
  console.log('🔗 Conectando a MongoDB...');
  await mongoose.connect(config.mongoUrl);
  console.log('✅ Conectado');
  console.log(`Modo: ${DRY_RUN ? 'DRY-RUN' : 'APLICAR'}, Google: ${WITH_GOOGLE ? 'sí' : 'no'}`);

  const users = await resolveUsers();
  if (users.length === 0) {
    console.log('❌ No se encontraron usuarios con tareas en serie');
    return;
  }

  let totalRemoved = 0;
  let totalGoogleRemoved = 0;

  for (const user of users) {
    console.log(`\n👤 ${user.email || user._id}`);

    let tasksClient = null;
    if (WITH_GOOGLE && user.googleTasksConfig?.enabled) {
      try {
        tasksClient = await getGoogleTasksClient(user);
      } catch (e) {
        console.warn(`  ⚠️ Sin cliente Google: ${e.message}`);
      }
    }

    const series = await TareaSeries.find({ usuario: user._id, activa: true }).lean();
    console.log(`  Series activas: ${series.length}`);

    for (const serie of series) {
      const instances = await Tareas.find({
        usuario: user._id,
        serieId: serie._id,
      }).lean();

      if (instances.length <= 1) continue;

      const { keep, remove } = planSerieInstanceCleanup(instances, serie);
      if (remove.length === 0) continue;

      console.log(
        `  📎 "${serie.titulo}" (${serie._id}): mantener ${keep.length}, eliminar ${remove.length}`,
      );

      for (const t of remove) {
        const gid = t.googleTasksSync?.googleTaskId;
        const listId = t.googleTasksSync?.googleTaskListId || serie.googleTasksSync?.googleTaskListId;

        if (WITH_GOOGLE && gid && tasksClient) {
          const ok = await deleteGoogleTask(tasksClient, listId, gid, t.titulo);
          if (ok) totalGoogleRemoved += 1;
        }

        if (DRY_RUN) {
          console.log(`  DRY-RUN BD: "${t.titulo}" (${t._id})`);
        } else {
          await Tareas.findByIdAndDelete(t._id);
          console.log(`  🗑️ BD: "${t.titulo}" (${t._id})`);
        }
        totalRemoved += 1;
      }
    }
  }

  console.log('\n📊 Resumen');
  console.log(`   Instancias a eliminar${DRY_RUN ? ' (DRY-RUN)' : ''}: ${totalRemoved}`);
  if (WITH_GOOGLE) {
    console.log(`   Google${DRY_RUN ? ' (DRY-RUN)' : ''}: ${totalGoogleRemoved}`);
  }
  if (DRY_RUN) {
    console.log('\nℹ️ Ejecuta con --dry-run=false para aplicar.');
  }
}

cleanupSerieDuplicates()
  .catch((err) => {
    console.error('❌', err);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect();
    console.log('🔌 Desconectado');
    process.exit(0);
  });
