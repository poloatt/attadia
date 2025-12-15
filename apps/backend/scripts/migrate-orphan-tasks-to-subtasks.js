#!/usr/bin/env node

/**
 * Migra tareas huérfanas dentro de un Proyecto a subtareas de una tarea ancla.
 *
 * Uso típico (diagnóstico y luego aplicar):
 *   node apps/backend/scripts/migrate-orphan-tasks-to-subtasks.js --user="email@dominio" --project="Salud" --dry-run
 *   node apps/backend/scripts/migrate-orphan-tasks-to-subtasks.js --user="email@dominio" --project="Salud" --dry-run=false
 *
 * Opcionales:
 *   --parent-title="Salud] Turno procto"   Fuerza la tarea ancla por título (normalizado)
 *   --google                               También borra las tareas huérfanas en Google (si tienen googleTaskId)
 */

import mongoose from 'mongoose';
import { google } from 'googleapis';
import { Users, Tareas, Proyectos } from '../src/models/index.js';
import config from '../src/config/config.js';

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('-')) continue;
    if (a.startsWith('--')) {
      const [k, v] = a.split('=');
      out[k.replace(/^--/, '')] = v === undefined ? true : v;
    } else if (a === '-u' || a === '--user') {
      const v = argv[i + 1];
      if (v && !v.startsWith('-')) {
        out.user = v; i++;
      }
    }
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const DRY_RUN = args['dry-run'] !== false && args['dry-run'] !== 'false';
const USER_FILTER = args.user || null;
const PROJECT_FILTER = args.project || null;
const PARENT_TITLE = args['parent-title'] || null;
const DO_GOOGLE = !!args.google;
const AUTO_ALL = !!args['auto-all'];
const ALL_PROJECTS = !!args['all-projects'];
const INCLUDE_UNASSIGNED = !!args['include-unassigned'];

function normalizeTitle(t) {
  return String(t || '').trim().replace(/\s{2,}/g, ' ').toLowerCase();
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

async function run() {
  if (!USER_FILTER || (!PROJECT_FILTER && !ALL_PROJECTS)) {
    console.error('❌ Debes indicar --user y --project, o bien --all-projects');
    process.exit(1);
  }
  try {
    console.log('🔗 Conectando a MongoDB...');
    await mongoose.connect(config.mongoUrl);
    console.log('✅ Conectado');

    // Resolver usuario
    const userQuery = { $or: [{ email: USER_FILTER }] };
    try {
      const oid = new mongoose.Types.ObjectId(USER_FILTER);
      userQuery.$or.push({ _id: oid });
    } catch {}
    userQuery.$or.push({ id: USER_FILTER });
    const user = await Users.findOne(userQuery);
    if (!user) throw new Error('Usuario no encontrado');
    if (!user.googleTasksConfig?.enabled) {
      console.warn('⚠️ Google Tasks no está habilitado para el usuario; ejecutaré solo BD');
    }

    // Helper para procesar un proyecto con AUTO_ALL o con PARENT_TITLE
    async function migrateInProject(projectDoc, tareas) {
      console.log(`\n📁 Proyecto: ${projectDoc ? projectDoc.nombre : '(sin proyecto)'} (${projectDoc?._id || 'no-id'})`);
      console.log(`📋 Tareas en proyecto: ${tareas.length}`);

      if (AUTO_ALL) {
        const anchors = tareas
          .filter(t => Array.isArray(t.subtareas) && t.subtareas.length > 0)
          .sort((a, b) => (b.subtareas?.length || 0) - (a.subtareas?.length || 0));
        let totalMigrated = 0;
        const removedIds = new Set();

        let tasksClient = null;
        if (DO_GOOGLE && user.googleTasksConfig?.enabled) {
          try { tasksClient = await getGoogleTasksClient(user); } catch {}
        }

        for (const anchorTask of anchors) {
          if (removedIds.has(String(anchorTask._id))) continue;
          const titles = new Set(anchorTask.subtareas.map(st => normalizeTitle(st.titulo)));
          if (titles.size === 0) continue;

          const candidates = tareas.filter(t =>
            String(t._id) !== String(anchorTask._id) &&
            !removedIds.has(String(t._id)) &&
            titles.has(normalizeTitle(t.titulo))
          );
          if (candidates.length === 0) continue;

          console.log(`\n🔀 Anchor "${anchorTask.titulo}" ← ${candidates.length} huérfanas`);
          const existing = new Map();
          const anchorSubs = Array.isArray(anchorTask.subtareas) ? [...anchorTask.subtareas] : [];
          anchorSubs.forEach((st, i) => existing.set(normalizeTitle(st.titulo), i));

          let migratedHere = 0;
          for (const t of candidates) {
            const key = normalizeTitle(t.titulo);
            if (existing.has(key)) {
              const idx = existing.get(key);
              anchorSubs[idx].completada = !!(anchorSubs[idx].completada || t.completada);
            } else {
              anchorSubs.push({ titulo: t.titulo, completada: !!t.completada, googleTaskId: null, lastSyncDate: null });
              existing.set(key, anchorSubs.length - 1);
            }
            migratedHere++;
            totalMigrated++;
            removedIds.add(String(t._id));
            if (!DRY_RUN) {
              const gId = t.googleTasksSync?.googleTaskId;
              const gList = t.googleTasksSync?.googleTaskListId || projectDoc?.googleTasksSync?.googleTaskListId;
              if (DO_GOOGLE && tasksClient && gId && gList) {
                try { await tasksClient.tasks.delete({ tasklist: gList, task: gId }); } catch {}
              }
              await Tareas.findByIdAndDelete(t._id);
            } else {
              console.log(`DRY-RUN: Migrar "${t.titulo}" -> subtarea de "${anchorTask.titulo}"`);
            }
          }
          if (!DRY_RUN) {
            await Tareas.updateOne(
              { _id: anchorTask._id },
              { $set: { subtareas: anchorSubs } },
              { runValidators: false }
            );
          }
          console.log(`   ✓ Migradas en este anchor: ${migratedHere}`);
        }

        console.log('\n📊 Resultado (auto-all)');
        console.log(`   Migradas a subtareas: ${totalMigrated}`);
        if (DRY_RUN) console.log('   (Modo DRY-RUN: no se aplicaron cambios)');
        return;
      }

      // Modo por ancla única
      let anchor = null;
      if (PARENT_TITLE) {
        const norm = normalizeTitle(PARENT_TITLE);
        anchor = tareas.find(t => normalizeTitle(t.titulo) === norm);
        if (!anchor) console.warn('⚠️ No se encontró la tarea ancla por --parent-title, se elegirá automáticamente.');
      }
      if (!anchor) {
        tareas.sort((a, b) => {
          const sa = a.subtareas?.length || 0;
          const sb = b.subtareas?.length || 0;
          if (sa !== sb) return sb - sa;
          const ua = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const ub = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          return ub - ua;
        });
        anchor = tareas[0] || null;
      }
      if (!anchor) {
        console.log('❌ No hay tareas para usar como ancla.');
        return;
      }
      console.log(`🎯 Tarea ancla: "${anchor.titulo}" (${anchor._id}) subtareas=${anchor.subtareas?.length || 0}`);

      let candidateTitles = new Set();
      if (Array.isArray(anchor.subtareas) && anchor.subtareas.length > 0) {
        for (const st of anchor.subtareas) candidateTitles.add(normalizeTitle(st.titulo));
      } else {
        const freq = new Map();
        for (const t of tareas) {
          const k = normalizeTitle(t.titulo);
          freq.set(k, (freq.get(k) || 0) + 1);
        }
        for (const [k, n] of freq.entries()) if (n >= 2) candidateTitles.add(k);
      }
      if (candidateTitles.size === 0) {
        console.log('ℹ️ No se detectaron títulos candidatos. Nada para migrar.');
        return;
      }

      let tasksClient = null;
      if (DO_GOOGLE && user.googleTasksConfig?.enabled) {
        try { tasksClient = await getGoogleTasksClient(user); } catch {}
      }

      const toMigrate = tareas.filter(t => String(t._id) !== String(anchor._id))
        .filter(t => candidateTitles.has(normalizeTitle(t.titulo)));

      console.log(`🔀 Tareas huérfanas candidatas a subtarea: ${toMigrate.length}`);
      const existing = new Map();
      const anchorSubtareas = Array.isArray(anchor.subtareas) ? [...anchor.subtareas] : [];
      anchorSubtareas.forEach((st, i) => existing.set(normalizeTitle(st.titulo), i));

      let migrated = 0;
      for (const t of toMigrate) {
        const key = normalizeTitle(t.titulo);
        if (existing.has(key)) {
          const idx = existing.get(key);
          anchorSubtareas[idx].completada = !!(anchorSubtareas[idx].completada || t.completada);
        } else {
          anchorSubtareas.push({ titulo: t.titulo, completada: !!t.completada, googleTaskId: null, lastSyncDate: null });
          existing.set(key, anchorSubtareas.length - 1);
        }

        if (!DRY_RUN) {
          const gId = t.googleTasksSync?.googleTaskId;
          const gList = t.googleTasksSync?.googleTaskListId || projectDoc?.googleTasksSync?.googleTaskListId;
          if (DO_GOOGLE && tasksClient && gId && gList) {
            try { await tasksClient.tasks.delete({ tasklist: gList, task: gId }); } catch {}
          }
          await Tareas.findByIdAndDelete(t._id);
        } else {
          console.log(`DRY-RUN: Migrar "${t.titulo}" -> subtarea de "${anchor.titulo}"`);
        }
        migrated++;
      }

      if (!DRY_RUN) {
        await Tareas.updateOne(
          { _id: anchor._id },
          { $set: { subtareas: anchorSubtareas } },
          { runValidators: false }
        );
      }

      console.log('\n📊 Resultado');
      console.log(`   Migradas a subtareas: ${migrated}`);
      if (DRY_RUN) console.log('   (Modo DRY-RUN: no se aplicaron cambios)');
    }

    // ALL_PROJECTS: iterar por todos los proyectos del usuario y opcionalmente tareas sin proyecto
    if (ALL_PROJECTS) {
      const projects = await Proyectos.find({ usuario: user._id });
      console.log(`👥 Proyectos a procesar: ${projects.length}`);
      for (const p of projects) {
        const tareasP = await Tareas.find({ usuario: user._id, proyecto: p._id }).lean(false);
        await migrateInProject(p, tareasP);
      }
      if (INCLUDE_UNASSIGNED) {
        const unassigned = await Tareas.find({ usuario: user._id, proyecto: { $in: [null, undefined] } }).lean(false);
        if (unassigned.length > 0) {
          await migrateInProject(null, unassigned);
        }
      }
      return;
    }

    // Resolver proyecto (modo específico)
    const projQuery = { usuario: user._id };
    try {
      const oid = new mongoose.Types.ObjectId(PROJECT_FILTER);
      projQuery.$or = [{ _id: oid }];
    } catch {
      projQuery.$or = [{ nombre: PROJECT_FILTER }];
    }
    const proyecto = await Proyectos.findOne(projQuery);
    if (!proyecto) throw new Error('Proyecto no encontrado');
    console.log(`📁 Proyecto: ${proyecto.nombre} (${proyecto._id})`);

    // Tareas del proyecto
    const tareas = await Tareas.find({ usuario: user._id, proyecto: proyecto._id }).lean(false);
    console.log(`📋 Tareas en proyecto: ${tareas.length}`);

    // Si se solicita migración automática para todos los anchors del proyecto
    if (AUTO_ALL) {
      // Ordenar posibles anchors por cantidad de subtareas desc (procesar primero los más estructurados)
      const anchors = tareas
        .filter(t => Array.isArray(t.subtareas) && t.subtareas.length > 0)
        .sort((a, b) => (b.subtareas?.length || 0) - (a.subtareas?.length || 0));
      let totalMigrated = 0;
      const removedIds = new Set(); // tareas ya migradas/eliminadas

      let tasksClient = null;
      if (DO_GOOGLE && user.googleTasksConfig?.enabled) {
        try { tasksClient = await getGoogleTasksClient(user); } catch {}
      }

      for (const anchorTask of anchors) {
        if (removedIds.has(String(anchorTask._id))) continue;
        // construir set de títulos candidatos
        const titles = new Set(anchorTask.subtareas.map(st => normalizeTitle(st.titulo)));
        if (titles.size === 0) continue;

        const candidates = tareas.filter(t =>
          String(t._id) !== String(anchorTask._id) &&
          !removedIds.has(String(t._id)) &&
          titles.has(normalizeTitle(t.titulo))
        );
        if (candidates.length === 0) continue;

        console.log(`\n🔀 Anchor "${anchorTask.titulo}" ← ${candidates.length} huérfanas`);
        // mapa de existentes
        const existing = new Map();
        const anchorSubs = Array.isArray(anchorTask.subtareas) ? [...anchorTask.subtareas] : [];
        anchorSubs.forEach((st, i) => existing.set(normalizeTitle(st.titulo), i));

        let migratedHere = 0;
        for (const t of candidates) {
          const key = normalizeTitle(t.titulo);
          if (existing.has(key)) {
            const idx = existing.get(key);
            anchorSubs[idx].completada = !!(anchorSubs[idx].completada || t.completada);
          } else {
            anchorSubs.push({
              titulo: t.titulo,
              completada: !!t.completada,
              googleTaskId: null,
              lastSyncDate: null
            });
            existing.set(key, anchorSubs.length - 1);
          }
          migratedHere++;
          totalMigrated++;
          removedIds.add(String(t._id));
          if (!DRY_RUN) {
            const gId = t.googleTasksSync?.googleTaskId;
            const gList = t.googleTasksSync?.googleTaskListId || proyecto.googleTasksSync?.googleTaskListId;
            if (DO_GOOGLE && tasksClient && gId && gList) {
              try { await tasksClient.tasks.delete({ tasklist: gList, task: gId }); } catch {}
            }
            await Tareas.findByIdAndDelete(t._id);
          } else {
            console.log(`DRY-RUN: Migrar "${t.titulo}" -> subtarea de "${anchorTask.titulo}"`);
          }
        }
        if (!DRY_RUN) {
          await Tareas.updateOne(
            { _id: anchorTask._id },
            { $set: { subtareas: anchorSubs } },
            { runValidators: false }
          );
        }
        console.log(`   ✓ Migradas en este anchor: ${migratedHere}`);
      }

      console.log('\n📊 Resultado (auto-all)');
      console.log(`   Migradas a subtareas: ${totalMigrated}`);
      if (DRY_RUN) console.log('   (Modo DRY-RUN: no se aplicaron cambios)');
      return;
    }

    // Elegir ancla (modo específico)
    let anchor = null;
    if (PARENT_TITLE) {
      const norm = normalizeTitle(PARENT_TITLE);
      anchor = tareas.find(t => normalizeTitle(t.titulo) === norm);
      if (!anchor) {
        console.warn('⚠️ No se encontró la tarea ancla por --parent-title, se elegirá automáticamente.');
      }
    }
    if (!anchor) {
      // escoger la tarea con mayor número de subtareas; si empata, la más reciente
      tareas.sort((a, b) => {
        const sa = a.subtareas?.length || 0;
        const sb = b.subtareas?.length || 0;
        if (sa !== sb) return sb - sa;
        const ua = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const ub = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return ub - ua;
      });
      anchor = tareas[0] || null;
    }
    if (!anchor) {
      console.log('❌ No hay tareas para usar como ancla.');
      return;
    }
    console.log(`🎯 Tarea ancla: "${anchor.titulo}" (${anchor._id}) subtareas=${anchor.subtareas?.length || 0}`);

    // Conjunto de títulos candidatos (si la ancla no tiene subtareas, usar los más frecuentes)
    let candidateTitles = new Set();
    if (Array.isArray(anchor.subtareas) && anchor.subtareas.length > 0) {
      for (const st of anchor.subtareas) candidateTitles.add(normalizeTitle(st.titulo));
    } else {
      // Frecuencia de títulos en el proyecto (para detectar patrones de subtareas repetidas)
      const freq = new Map();
      for (const t of tareas) {
        const k = normalizeTitle(t.titulo);
        freq.set(k, (freq.get(k) || 0) + 1);
      }
      for (const [k, n] of freq.entries()) {
        if (n >= 2) candidateTitles.add(k);
      }
    }
    if (candidateTitles.size === 0) {
      console.log('ℹ️ No se detectaron títulos candidatos. Nada para migrar.');
      return;
    }

    // Preparar cliente Google opcional
    let tasksClient = null;
    if (DO_GOOGLE && user.googleTasksConfig?.enabled) {
      try {
        tasksClient = await getGoogleTasksClient(user);
      } catch (e) {
        console.warn(`No se pudo inicializar Google Tasks: ${e.message}`);
      }
    }

    // Migrar: tareas cuyo título coincide con una subtarea candidata (excluye ancla)
    const toMigrate = tareas.filter(t => String(t._id) !== String(anchor._id))
      .filter(t => candidateTitles.has(normalizeTitle(t.titulo)));

    console.log(`🔀 Tareas huérfanas candidatas a subtarea: ${toMigrate.length}`);
    const existing = new Map(); // título normalizado -> subtarea index en anchor
    const anchorSubtareas = Array.isArray(anchor.subtareas) ? [...anchor.subtareas] : [];
    anchorSubtareas.forEach((st, i) => existing.set(normalizeTitle(st.titulo), i));

    let migrated = 0;
    for (const t of toMigrate) {
      const key = normalizeTitle(t.titulo);
      if (existing.has(key)) {
        // fusionar estado
        const idx = existing.get(key);
        anchorSubtareas[idx].completada = !!(anchorSubtareas[idx].completada || t.completada);
      } else {
        anchorSubtareas.push({
          titulo: t.titulo,
          completada: !!t.completada,
          googleTaskId: null,
          lastSyncDate: null
        });
        existing.set(key, anchorSubtareas.length - 1);
      }

      if (!DRY_RUN) {
        // Borrar en Google si se solicita
        const gId = t.googleTasksSync?.googleTaskId;
        const gList = t.googleTasksSync?.googleTaskListId || proyecto.googleTasksSync?.googleTaskListId;
        if (DO_GOOGLE && tasksClient && gId && gList) {
          try {
            await tasksClient.tasks.delete({ tasklist: gList, task: gId });
            console.log(`🗑️ Google: eliminada "${t.titulo}" (${gId})`);
          } catch (e) {
            console.warn(`No se pudo eliminar en Google "${t.titulo}" (${gId}): ${e.message}`);
          }
        }
        await Tareas.findByIdAndDelete(t._id);
      } else {
        console.log(`DRY-RUN: Migrar "${t.titulo}" -> subtarea de "${anchor.titulo}"`);
      }
      migrated++;
    }

    if (!DRY_RUN) {
      // Actualizar sólo subtareas evitando validaciones de fechas ajenas
      await Tareas.updateOne(
        { _id: anchor._id },
        { $set: { subtareas: anchorSubtareas } },
        { runValidators: false }
      );
    }

    console.log('\n📊 Resultado');
    console.log(`   Migradas a subtareas: ${migrated}`);
    if (DRY_RUN) console.log('   (Modo DRY-RUN: no se aplicaron cambios)');
  } catch (e) {
    console.error('❌ Error en migración:', e);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();


