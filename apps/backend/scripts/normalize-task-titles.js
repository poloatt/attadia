#!/usr/bin/env node

/**
 * Normaliza títulos de tareas y subtareas en la BD (opcionalmente también en Google).
 * - Remueve prefijos entre corchetes al inicio (p.ej. [Proyecto], [Mis tareas])
 * - Colapsa espacios
 *
 * Flags:
 *   --user=<email|id>     Limitar a un usuario
 *   --google              También actualiza los títulos en Google (patch por id)
 *   --dry-run=false       Aplica cambios (por defecto es dry-run)
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
      if (typeof val !== 'undefined') {
        out[name] = val;
      } else {
        out[name] = true;
      }
    }
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const DRY_RUN = args['dry-run'] !== false && args['dry-run'] !== 'false'; // default true
const INCLUDE_GOOGLE = !!args.google;
const USER_FILTER = args.user || null;
const PROJECT_ID = args.project || null;
const PROJECT_NAME = args['project-name'] || null; // "Salud,Trámites"

function cleanTitle(raw) {
  return String(raw || '')
    .replace(/^\s*(\[[^\]]+\]\s*)+/g, '')
    .replace(/\s+(\[[^\]]+\])\s+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
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
  return google.tasks({ version: 'v1', auth: oauth2Client, params: { quotaUser: 'attadia-app' } });
}

async function normalizeTitles() {
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

    for (const user of users) {
      console.log(`\n👤 Usuario: ${user.email || user._id}`);
      const tasksClient = INCLUDE_GOOGLE ? await getGoogleTasksClient(user) : null;

      // Proyectos objetivo (opcional)
      let proyectoIds = null;
      if (PROJECT_ID || PROJECT_NAME) {
        const pjQuery = { usuario: user._id };
        if (PROJECT_ID) pjQuery._id = PROJECT_ID;
        if (PROJECT_NAME) {
          const names = PROJECT_NAME.split(',').map(s => s.trim()).filter(Boolean);
          pjQuery.nombre = { $in: names.map(n => new RegExp(`^${n}$`, 'i')) };
        }
        const proyectos = await Proyectos.find(pjQuery).select('_id nombre');
        proyectoIds = proyectos.map(p => p._id);
        console.log(`🎯 Proyectos objetivo: ${proyectos.map(p => p.nombre).join(', ') || '(ninguno encontrado)'}`);
      }

      const tareasQuery = { usuario: user._id };
      if (proyectoIds && proyectoIds.length > 0) tareasQuery.proyecto = { $in: proyectoIds };
      const tareas = await Tareas.find(tareasQuery);
      let updatedLocal = 0;
      let patchedGoogle = 0;

      for (const tarea of tareas) {
        const originalTitle = tarea.titulo;
        const newTitle = cleanTitle(originalTitle);
        let changed = false;
        if (newTitle && newTitle !== originalTitle) {
          if (DRY_RUN) {
            console.log(`DRY-RUN: "${originalTitle}" -> "${newTitle}"`);
          } else {
            tarea.titulo = newTitle;
            changed = true;
          }
        }

        // Subtareas
        if (Array.isArray(tarea.subtareas) && tarea.subtareas.length > 0) {
          for (const st of tarea.subtareas) {
            const stOriginal = st.titulo;
            const stNew = cleanTitle(stOriginal);
            if (stNew && stNew !== stOriginal) {
              if (DRY_RUN) {
                console.log(`DRY-RUN:   - Subtarea "${stOriginal}" -> "${stNew}"`);
              } else {
                st.titulo = stNew;
                changed = true;
              }
            }
          }
        }

        if (!DRY_RUN && changed) {
          await tarea.save();
          updatedLocal++;
        }

        // Google (opcional)
        if (INCLUDE_GOOGLE && tasksClient && tarea.googleTasksSync?.googleTaskId && newTitle && newTitle !== originalTitle) {
          try {
            if (!DRY_RUN) {
              await tasksClient.tasks.patch({
                tasklist: tarea.googleTasksSync.googleTaskListId,
                task: tarea.googleTasksSync.googleTaskId,
                requestBody: { title: newTitle },
                fields: 'id,title'
              });
            } else {
              console.log(`DRY-RUN: PATCH Google title "${originalTitle}" -> "${newTitle}"`);
            }
            patchedGoogle++;
          } catch (e) {
            console.warn(`No se pudo actualizar título en Google "${originalTitle}": ${e.message}`);
          }
        }
      }

      console.log(`📊 Usuario ${user.email}: local actualizados=${updatedLocal}, google patch=${patchedGoogle}`);
    }

    console.log('\n✅ Normalización de títulos finalizada.');
    if (DRY_RUN) console.log('ℹ️ Modo DRY-RUN: use --dry-run=false para aplicar cambios.');
  } catch (err) {
    console.error('❌ Error normalizando títulos:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
    process.exit(0);
  }
}

normalizeTitles();


