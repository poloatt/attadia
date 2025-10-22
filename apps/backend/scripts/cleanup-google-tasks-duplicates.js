#!/usr/bin/env node
import mongoose from 'mongoose';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import googleTasksService from '../src/services/googleTasksService.js';
import { Users, Tareas } from '../src/models/index.js';

const argv = yargs(hideBin(process.argv))
  .option('apply', { type: 'boolean', default: false, describe: 'Aplicar cambios (por defecto dry-run)' })
  .option('user', { type: 'string', describe: 'ID o email de usuario para limitar el alcance' })
  .option('since', { type: 'string', describe: 'ISO date para limitar por fecha de creación/actualización' })
  .option('limit', { type: 'number', default: 500, describe: 'Límite de tareas a procesar' })
  .strict()
  .help()
  .argv;

const logAction = (apply, message) => {
  const prefix = apply ? 'APPLY' : 'DRY-RUN';
  console.log(`[${prefix}] ${message}`);
};

async function connectMongo() {
  mongoose.set('strictQuery', false);
  
  // Usar la configuración del proyecto
  const config = await import('../src/config/config.js');
  const uri = config.default.mongoUrl;
  
  if (!uri) {
    throw new Error('No se encontró URI de MongoDB en la configuración');
  }
  
  console.log(`🔗 Conectando a MongoDB: ${uri.replace(/\/\/.*@/, '//***@')}`); // Ocultar credenciales
  
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
  });
}

function isSpamTitle(title) {
  if (!title) return false;
  const t = String(title);
  
  // Patrón 1: título con múltiples prefijos de proyecto duplicados consecutivos
  const matches = t.match(/\[[^\]]+\]/g) || [];
  if (matches.length >= 3) {
    // Verificar si son prefijos duplicados consecutivos
    const uniquePrefixes = [...new Set(matches)];
    if (uniquePrefixes.length < matches.length) {
      return true; // Hay prefijos duplicados consecutivos
    }
  }
  
  // Patrón 2: título que contiene solo números después del prefijo de proyecto
  const cleanOfPrefixes = t.replace(/^(\[[^\]]+\]\s*)/, '').trim(); // Solo el primer prefijo de proyecto
  if (/^(\d+\s*)+$/.test(cleanOfPrefixes)) return true;
  
  // Patrón 3: títulos muy cortos con patrones como "[Salud] 1", "[Salud] 2"
  const shortPatternMatch = t.match(/^\[[^\]]+\]\s*[12]\s*$/);
  if (shortPatternMatch) return true;
  
  return false;
}

async function main() {
  const apply = !!argv.apply;
  await connectMongo();

  let userFilter = { 'googleTasksConfig.enabled': true };
  if (argv.user) {
    if (String(argv.user).includes('@')) {
      userFilter = { email: argv.user };
    } else {
      userFilter = { _id: argv.user };
    }
  }
  const users = await Users.find(userFilter);
  console.log(`👥 Usuarios a procesar: ${users.length}`);

  const sinceDate = argv.since ? new Date(argv.since) : null;

  for (const user of users) {
    const userId = user._id.toString();
    console.log(`\n==== Usuario: ${user.email} (${userId}) ====`);

    // 1) Normalizar títulos locales con spam
    const tareaQuery = {
      usuario: userId,
      'googleTasksSync.enabled': true,
    };
    if (sinceDate) {
      tareaQuery.updatedAt = { $gte: sinceDate };
    }
    const tareas = await Tareas.find(tareaQuery).limit(argv.limit);

    let localFixed = 0;
    let localSpamDeleted = 0;
    for (const tarea of tareas) {
      const normalized = googleTasksService.normalizeTitle(tarea.titulo);
      if (normalized !== tarea.titulo || isSpamTitle(tarea.titulo)) {
        logAction(apply, `Normalizar título local: "${tarea.titulo}" -> "${normalized}"`);
        if (apply) {
          tarea.titulo = normalized;
          await tarea.save();
          localFixed++;
        }
      }

      // Eliminar locales "spam" más efectivamente
      if (isSpamTitle(tarea.titulo)) {
        logAction(apply, `Eliminar tarea local spam: "${tarea.titulo}" ${tarea.googleTasksSync?.googleTaskId ? '(con Google Task)' : ''}`);
        if (apply) {
          // Borrar en Google si está vinculada
          if (tarea.googleTasksSync?.googleTaskId) {
            try {
              await googleTasksService.deleteGoogleTask(userId, tarea.googleTasksSync.googleTaskListId, tarea.googleTasksSync.googleTaskId);
            } catch (e) {
              console.warn('No se pudo borrar en Google, continúo con borrado local:', e.message);
            }
          }
          await Tareas.deleteOne({ _id: tarea._id });
          localSpamDeleted++;
        }
      }
    }

    // 2) Consultar Google y limpiar duplicados por título y por ID duplicado
    const taskList = await googleTasksService.getOrCreateDefaultTaskList(userId);
    const response = await googleTasksService.executeWithRetry(
      () => googleTasksService.tasks.tasks.list({
        tasklist: taskList.id,
        showCompleted: true,
        showHidden: true,
        maxResults: 200,
        fields: 'items(id,title,updated,parent)'
      }),
      'listar tareas para limpieza'
    );
    const gTasks = response.data.items || [];

    // 2.a) Detectar subtareas/tareas "spam" cuyo título tras limpiar sea exactamente "1" o "2"
    let spamDeleted = 0;
    for (const gt of gTasks) {
      const normalized = googleTasksService.normalizeTitle(gt.title);
      // Remover prefijos [X] para obtener el resto del título
      const remainder = normalized.replace(/^((\[[^\]]+\]\s*)+)/, '').trim();
      if (remainder === '1' || remainder === '2') {
        logAction(apply, `Eliminar spam numérico en Google: "${gt.title}" (resto: "${remainder}") id: ${gt.id}`);
        if (apply) {
          await googleTasksService.deleteGoogleTask(userId, taskList.id, gt.id);
          spamDeleted++;
        }
      }
    }

    // Mapear por título normalizado
    const byTitle = new Map();
    for (const gt of gTasks) {
      const n = googleTasksService.normalizeTitle(gt.title);
      if (!byTitle.has(n)) byTitle.set(n, []);
      byTitle.get(n).push(gt);
    }

    let googleDeleted = 0;
    for (const [title, list] of byTitle.entries()) {
      if (list.length <= 1) continue;
      // Mantener el más reciente, eliminar el resto
      const sorted = list.sort((a, b) => new Date(b.updated || 0) - new Date(a.updated || 0));
      const keep = sorted[0];
      const remove = sorted.slice(1);
      for (const r of remove) {
        logAction(apply, `Eliminar duplicado en Google: "${r.title}" (id: ${r.id}) manteniendo "${keep.title}" (id: ${keep.id})`);
        if (apply) {
          await googleTasksService.deleteGoogleTask(userId, taskList.id, r.id);
          googleDeleted++;
        }
      }
      // Asegurar que el título mantenido esté normalizado
      if (keep.title !== title) {
        logAction(apply, `Normalizar título en Google: "${keep.title}" -> "${title}" (id: ${keep.id})`);
        if (apply) {
          await googleTasksService.updateGoogleTaskTitle(userId, taskList.id, keep.id, title);
        }
      }
    }

    console.log(`✅ Usuario ${user.email}: ${localFixed} locales normalizadas, ${localSpamDeleted} locales spam eliminadas, ${googleDeleted} duplicadas eliminadas en Google, ${spamDeleted} spam numérico eliminado`);
  }

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('❌ Error en limpieza de duplicados:', err);
  process.exit(1);
});


