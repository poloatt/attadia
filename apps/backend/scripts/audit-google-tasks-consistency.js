#!/usr/bin/env node

/**
 * Auditoría de consistencia Google Tasks ↔ Attadia por usuario/proyecto.
 *
 * Reporta:
 * - Duplicados de tareas padre por título normalizado dentro de la misma TaskList
 * - Duplicados de subtareas por título normalizado bajo el mismo parent
 * - Tareas principales con mismo título que subtareas existentes en el proyecto (posibles órfanas)
 * - Tareas con googleTasksSync.parent definido (DB las tiene como padres, Google sugiere subtarea)
 * - (Opcional --google) Verificación en Google: parent/TaskList reales y discrepancias
 *
 * Flags:
 *   --user=<email|id>
 *   --project=<projectId>
 *   --project-name="Salud,Trámites"
 *   --google (consulta Google para validar parent/list real)
 */

import mongoose from 'mongoose';
import { google } from 'googleapis';
import { Users, Tareas, Proyectos } from '../src/models/index.js';
import config from '../src/config/config.js';

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const [key, val] = arg.split('=');
      const name = key.replace(/^--/, '');
      if (typeof val !== 'undefined') out[name] = val;
      else out[name] = true;
    }
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const USER_FILTER = args.user || null;
const PROJECT_ID = args.project || null;
const PROJECT_NAME = args['project-name'] || null;
const CHECK_GOOGLE = !!args.google;

function normalizeTitle(raw) {
  return String(raw || '')
    .replace(/^\s*(\[[^\]]+\]\s*)+/g, '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s{2,}/g, ' ')
    .toLowerCase();
}

async function getTasksClient(user) {
  const oauth2Client = new google.auth.OAuth2(
    config.google.clientId,
    config.google.clientSecret,
    `${config.backendUrl}/api/google-tasks/callback`
  );
  oauth2Client.setCredentials({
    access_token: user.googleTasksConfig.accessToken,
    refresh_token: user.googleTasksConfig.refreshToken
  });
  return google.tasks({ version: 'v1', auth: oauth2Client, params: { quotaUser: 'attadia-app' } });
}

async function main() {
  try {
    console.log('🔗 Conectando a MongoDB...');
    await mongoose.connect(config.mongoUrl);
    console.log('✅ Conectado a MongoDB');

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

    for (const user of users) {
      console.log(`\n👤 Usuario: ${user.email || user._id}`);
      const tasksClient = CHECK_GOOGLE ? await getTasksClient(user) : null;

      // Proyectos objetivo
      let pjIds = null;
      const pjQuery = { usuario: user._id };
      if (PROJECT_ID) pjQuery._id = PROJECT_ID;
      if (PROJECT_NAME) {
        const names = PROJECT_NAME.split(',').map(s => s.trim()).filter(Boolean);
        pjQuery.nombre = { $in: names.map(n => new RegExp(`^${n}$`, 'i')) };
      }
      const proyectos = await Proyectos.find(pjQuery).select('_id nombre googleTasksSync');
      pjIds = proyectos.map(p => p._id);
      console.log(`🎯 Proyectos: ${proyectos.map(p => p.nombre).join(', ') || '(todos)'}`);

      for (const proyecto of proyectos) {
        console.log(`\n📁 Proyecto: ${proyecto.nombre}`);
        const tQuery = { usuario: user._id, proyecto: proyecto._id };
        const tareas = await Tareas.find(tQuery).lean();
        console.log(`   Tareas: ${tareas.length}`);

        // Parents duplicados por (listId, normTitle)
        const parents = tareas.filter(t => !t.googleTasksSync?.parent);
        const byListTitle = new Map();
        for (const t of parents) {
          const listId = t.googleTasksSync?.googleTaskListId || 'no-list';
          const key = `${listId}::${normalizeTitle(t.titulo)}`;
          if (!byListTitle.has(key)) byListTitle.set(key, []);
          byListTitle.get(key).push(t);
        }
        const parentDupGroups = Array.from(byListTitle.values()).filter(g => g.length > 1);
        if (parentDupGroups.length > 0) {
          console.log(`   ⚠️ Duplicados de tareas padre: ${parentDupGroups.length} grupos`);
          for (const g of parentDupGroups.slice(0, 5)) {
            console.log(`     - "${g[0].titulo}" x${g.length}`);
          }
        } else {
          console.log('   ✅ Sin duplicados de tareas padre por título/lista');
        }

        // Subtareas duplicates por parent y normTitle
        let subtaskDupGroupsCount = 0;
        for (const t of tareas) {
          const subs = t.subtareas || [];
          const byTitle = new Map();
          for (const st of subs) {
            const k = normalizeTitle(st.titulo);
            if (!byTitle.has(k)) byTitle.set(k, []);
            byTitle.get(k).push(st);
          }
          const dup = Array.from(byTitle.values()).filter(a => a.length > 1);
          subtaskDupGroupsCount += dup.length;
        }
        if (subtaskDupGroupsCount > 0) {
          console.log(`   ⚠️ Duplicados de subtareas (por parent): ${subtaskDupGroupsCount} grupos`);
        } else {
          console.log('   ✅ Sin duplicados de subtareas por título');
        }

        // Main vs subtask duplicates en el proyecto
        const subTitles = new Map();
        for (const t of tareas) {
          for (const st of (t.subtareas || [])) {
            const k = normalizeTitle(st.titulo);
            subTitles.set(k, (subTitles.get(k) || 0) + 1);
          }
        }
        const mainVsSubDup = parents.filter(t => subTitles.has(normalizeTitle(t.titulo)));
        if (mainVsSubDup.length > 0) {
          console.log(`   ⚠️ Tareas padre con título igual a subtareas: ${mainVsSubDup.length}`);
          for (const t of mainVsSubDup.slice(0, 5)) {
            console.log(`     - "${t.titulo}"`);
          }
        } else {
          console.log('   ✅ No hay padres colisionando con títulos de subtareas');
        }

        // Orphans según DB: tareas con googleTasksSync.parent definido (deberían ser subtareas)
        const dbOrphans = tareas.filter(t => !!t.googleTasksSync?.parent);
        if (dbOrphans.length > 0) {
          console.log(`   ⚠️ Tareas con parent (DB) que no están como subtareas: ${dbOrphans.length}`);
          for (const t of dbOrphans.slice(0, 5)) {
            console.log(`     - "${t.titulo}" parent=${t.googleTasksSync.parent}`);
          }
        } else {
          console.log('   ✅ Sin tareas con parent definido fuera de subtareas');
        }

        // (Opcional) Verificación contra Google
        if (CHECK_GOOGLE) {
          try {
            const listId = proyecto.googleTasksSync?.googleTaskListId;
            if (!listId) {
              console.log('   ℹ️ Proyecto sin googleTaskListId, se omite validación Google.');
            } else {
              const allGTasks = [];
              let pageToken;
              do {
                const resp = await tasksClient.tasks.list({
                  tasklist: listId,
                  showCompleted: true,
                  showHidden: true,
                  maxResults: 100,
                  pageToken,
                  fields: 'items(id,title,parent,position),nextPageToken'
                });
                allGTasks.push(...(resp.data.items || []));
                pageToken = resp.data.nextPageToken;
              } while (pageToken);

              const gById = new Map(allGTasks.map(t => [t.id, t]));
              let mismatches = 0;
              for (const t of tareas) {
                const gid = t.googleTasksSync?.googleTaskId;
                if (!gid || !gById.has(gid)) continue;
                const g = gById.get(gid);
                const isSubInGoogle = !!g.parent;
                const isSubInDB = (t.subtareas && t.subtareas.length > 0) ? false : false; // t es padre si tiene subtareas; pero no define si t mismo es sub
                const dbThinksParent = !t.googleTasksSync?.parent; // si DB guarda parent en googleTasksSync.parent, indica que t debería ser sub
                if (isSubInGoogle && dbThinksParent) {
                  mismatches++;
                }
              }
              if (mismatches > 0) {
                console.log(`   ⚠️ Discrepancias Google(parent) vs DB: ${mismatches}`);
              } else {
                console.log('   ✅ Sin discrepancias relevantes Google(parent) vs DB para ids presentes');
              }
            }
          } catch (e) {
            console.warn('   ⚠️ Error validando contra Google:', e.message);
          }
        }
      }
    }

    console.log('\n✅ Auditoría finalizada.');
  } catch (err) {
    console.error('❌ Error en auditoría:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
    process.exit(0);
  }
}

main();


