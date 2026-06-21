/**
 * Repara series fantasma y estados completados desincronizados.
 *
 * Uso: node apps/backend/scripts/repair-calendar-series.js [--dry-run] [--userId=...]
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Tareas, TareaSeries } from '../src/models/index.js';
import { isTaskCompleted } from '../src/utils/agendaListRules.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const dryRun = process.argv.includes('--dry-run');
const userArg = process.argv.find((a) => a.startsWith('--userId='));
const userFilter = userArg ? userArg.split('=')[1] : null;

async function main() {
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
  console.log(`repair-calendar-series ${dryRun ? '(dry-run)' : ''}`);

  const taskQuery = {
    'googleTasksSync.googleTaskId': { $exists: true, $ne: null },
    ...(userFilter ? { usuario: userFilter } : {}),
  };

  const tasks = await Tareas.find(taskQuery);
  let completedFixed = 0;
  let noonNormalized = 0;

  for (const t of tasks) {
    let changed = false;
    const gCompleted = t.googleTasksSync?.completed;
    if (gCompleted && !isTaskCompleted(t)) {
      t.completada = true;
      t.estado = 'COMPLETADA';
      changed = true;
      completedFixed += 1;
    }

    for (const field of ['fechaInicio', 'fechaVencimiento']) {
      const d = t[field];
      if (!d) continue;
      const date = d instanceof Date ? d : new Date(d);
      if (Number.isNaN(date.getTime())) continue;
      const h = date.getHours();
      if ((h === 9 || h === 14 || h === 21 || h === 0) && date.getMinutes() === 0) {
        const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
        if (normalized.getTime() !== date.getTime()) {
          t[field] = normalized;
          changed = true;
          noonNormalized += 1;
        }
      }
    }

    if (changed && !dryRun) await t.save();
  }

  const seriesQuery = {
    activa: true,
    googleSerieKey: { $exists: true, $ne: null },
    ...(userFilter ? { usuario: userFilter } : {}),
  };
  const series = await TareaSeries.find(seriesQuery);
  let seriesDeactivated = 0;

  for (const serie of series) {
    const anchor = await Tareas.findOne({
      usuario: serie.usuario,
      serieId: serie._id,
      'googleTasksSync.googleTaskId': { $exists: true, $ne: null },
    }).sort({ updatedAt: -1 });

    if (!anchor || isTaskCompleted(anchor)) {
      if (!dryRun) {
        serie.activa = false;
        await serie.save();
      }
      seriesDeactivated += 1;
    }
  }

  console.log(JSON.stringify({
    tasksScanned: tasks.length,
    completedFixed,
    noonNormalized,
    seriesScanned: series.length,
    seriesDeactivated,
  }, null, 2));

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
