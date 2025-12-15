#!/usr/bin/env node

/**
 * Elimina tareas padres duplicadas cuyo título coincide con subtareas existentes
 * dentro del mismo proyecto. Mantiene la subtarea y borra el padre duplicado
 * (en BD y opcionalmente en Google).
 *
 * Flags:
 *   --user=<email|id>
 *   --project=<projectId>
 *   --project-name="Salud,Tràmites"
 *   --google                 También elimina en Google
 *   --dry-run=false          Aplica cambios (por defecto dry-run)
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
const INCLUDE_GOOGLE = !!args.google;
const DRY_RUN = args['dry-run'] !== false && args['dry-run'] !== 'false';

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
      console.log('❌ Usuario no encontrado / sin Google habilitado');
      return;
    }

    for (const user of users) {
      console.log(`\n👤 Usuario: ${user.email || user._id}`);
      const tasksClient = INCLUDE_GOOGLE ? await getTasksClient(user) : null;

      // Obtener proyectos y filtrar por nombre de forma robusta (ignorando tildes y may/minus)
      const allProjects = await Proyectos.find({ usuario: user._id }).select('_id nombre');
      const norm = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
      let proyectos = allProjects;
      if (PROJECT_ID) {
        proyectos = proyectos.filter(p => String(p._id) === String(PROJECT_ID));
      }
      if (PROJECT_NAME) {
        const nameList = PROJECT_NAME.split(',').map(s => s.trim()).filter(Boolean).map(norm);
        proyectos = proyectos.filter(p => nameList.includes(norm(p.nombre)));
      }
      console.log(`🎯 Proyectos: ${proyectos.map(p => p.nombre).join(', ')}`);

      for (const proyecto of proyectos) {
        console.log(`\n📁 Proyecto: ${proyecto.nombre}`);
        const tareas = await Tareas.find({ usuario: user._id, proyecto: proyecto._id });

        // índice: título normalizado de subtareas → array de padres que la contienen
        const subToParents = new Map();
        for (const t of tareas) {
          for (const st of (t.subtareas || [])) {
            const k = normalizeTitle(st.titulo);
            if (!subToParents.has(k)) subToParents.set(k, []);
            subToParents.get(k).push(t);
          }
        }

        const parents = tareas.filter(t => !t.googleTasksSync?.parent);
        let removed = 0;
        for (const t of parents) {
          const k = normalizeTitle(t.titulo);
          if (!subToParents.has(k)) continue;
          // Si existe la misma subtarea en algún padre del proyecto, este padre t es duplicado
          // y se elimina (mantenemos la subtarea existente)
          if (DRY_RUN) {
            console.log(`DRY-RUN: Eliminar padre duplicado "${t.titulo}" (coincide con subtarea existente)`);
          } else {
            // Borrar en Google si corresponde
            if (INCLUDE_GOOGLE && t.googleTasksSync?.googleTaskId && t.googleTasksSync?.googleTaskListId && tasksClient) {
              try {
                await tasksClient.tasks.delete({
                  tasklist: t.googleTasksSync.googleTaskListId,
                  task: t.googleTasksSync.googleTaskId
                });
                console.log(`🗑️ Google: eliminado "${t.titulo}" (${t.googleTasksSync.googleTaskId})`);
              } catch (e) {
                console.warn(`No se pudo eliminar en Google "${t.titulo}": ${e.message}`);
              }
            }
            // Borrar en BD
            await Tareas.findByIdAndDelete(t._id);
            removed++;
          }
        }

        console.log(`📊 Proyecto ${proyecto.nombre}: padres eliminados=${removed}`);
      }
    }

    console.log('\n✅ Reparación finalizada.');
    if (DRY_RUN) console.log('ℹ️ Modo DRY-RUN: use --dry-run=false para aplicar cambios.');
  } catch (err) {
    console.error('❌ Error en reparación:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
    process.exit(0);
  }
}

main();


