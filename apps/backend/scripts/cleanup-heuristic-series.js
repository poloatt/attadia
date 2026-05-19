#!/usr/bin/env node
/**
 * Desactiva TareaSeries creadas por heurística semanal (sin RRULE en notes ni múltiples due).
 * Uso: node apps/backend/scripts/cleanup-heuristic-series.js --user="email" --dry-run=false
 */
import mongoose from 'mongoose';
import { config } from '../src/config/config.js';
import { Users, Tareas, TareaSeries } from '../src/models/index.js';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? 'true'];
  }),
);

const dryRun = args['dry-run'] !== 'false';
const userArg = args.user;

async function main() {
  await mongoose.connect(config.mongoUri);
  const user = await Users.findOne(
    userArg?.includes('@')
      ? { email: userArg }
      : { _id: userArg },
  );
  if (!user) {
    console.error('Usuario no encontrado');
    process.exit(1);
  }

  const series = await TareaSeries.find({
    usuario: user._id,
    activa: true,
    googleSerieKey: { $exists: true, $ne: null },
    'googleTasksSync.exportInstances': false,
  }).lean();

  let deactivated = 0;
  for (const s of series) {
    const tasks = await Tareas.find({ usuario: user._id, serieId: s._id }).lean();
    const hasRruleInNotes = tasks.some((t) =>
      /Recurrencia:|FREQ=/i.test(t.descripcion || ''),
    );
    const isWeeklyOnly =
      /^FREQ=WEEKLY;INTERVAL=1;BYDAY=[A-Z]{2}$/.test(s.rrule || '');
    if (hasRruleInNotes || !isWeeklyOnly || tasks.length > 3) continue;

    console.log(`[${dryRun ? 'dry' : 'apply'}] Desactivar serie: ${s.titulo} (${s._id})`);
    if (!dryRun) {
      await TareaSeries.updateOne({ _id: s._id }, { activa: false });
    }
    deactivated++;
  }

  console.log(`Series revisadas: ${series.length}, desactivadas: ${deactivated}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
