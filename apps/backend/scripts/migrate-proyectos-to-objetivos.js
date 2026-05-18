/**
 * Migración: Proyecto (Foco) → Objetivo
 * - Renombra colección legacy Atta `objetivos` → `objetivos_atta_deprecated`
 * - Renombra `proyectos` → `objetivos`
 * - Renombra campo `proyecto` → `objetivo` en `tareas`
 * - Elimina campo denormalizado `tareas` en documentos objetivo
 * - Consolida subtareas de colección `subtareas` al array embebido en `tareas`
 *
 * Uso: node apps/backend/scripts/migrate-proyectos-to-objetivos.js [--dry-run]
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../src/config/config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const DRY_RUN = process.argv.includes('--dry-run');

async function run() {
  const uri = process.env.MONGO_PUBLIC_URL || process.env.MONGO_URL || process.env.MONGODB_URI || config.mongoUrl;
  if (!uri) {
    console.error('No hay URL de Mongo configurada (MONGO_URL / MONGO_PUBLIC_URL)');
    process.exit(1);
  }

  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const collections = await db.listCollections().toArray();
  const names = collections.map((c) => c.name);

  console.log(DRY_RUN ? '=== DRY RUN ===' : '=== MIGRACIÓN ===');
  console.log('Colecciones actuales:', names.filter((n) =>
    ['proyectos', 'objetivos', 'tareas', 'subtareas', 'objetivos_atta_deprecated'].includes(n)
  ));

  // 1. Preservar Objetivos Atta legacy si existe colección objetivos con schema Atta (titulo+tipo)
  if (names.includes('objetivos') && !names.includes('proyectos')) {
    console.log('Colección objetivos ya existe sin proyectos; asumiendo migración previa.');
  } else if (names.includes('objetivos') && names.includes('proyectos')) {
    const sample = await db.collection('objetivos').findOne({});
    const isAttaLegacy = sample && (sample.tipo || sample.titulo) && !sample.nombre;
    if (isAttaLegacy) {
      console.log('Renombrando objetivos (Atta legacy) → objetivos_atta_deprecated');
      if (!DRY_RUN) {
        await db.collection('objetivos').rename('objetivos_atta_deprecated');
      }
    }
  }

  const namesAfter = (await db.listCollections().toArray()).map((c) => c.name);

  // 2. proyectos → objetivos (colección)
  if (namesAfter.includes('proyectos')) {
    if (namesAfter.includes('objetivos')) {
      console.log('Ambas colecciones proyectos y objetivos existen; mapeando IDs por lista/nombre.');
      const proyectos = await db.collection('proyectos').find({}).toArray();
      const objetivos = await db.collection('objetivos').find({}).toArray();
      const idMap = new Map();

      for (const p of proyectos) {
        const match = objetivos.find((o) => {
          const pList = p.googleTasksSync?.googleTaskListId;
          const oList = o.googleTasksSync?.googleTaskListId;
          if (pList && oList && pList === oList) return true;
          return (p.nombre || p.titulo) === (o.nombre || o.titulo)
            && String(p.usuario) === String(o.usuario);
        });
        if (match) {
          idMap.set(String(p._id), match._id);
        }
      }
      console.log(`  Mapeos proyecto→objetivo: ${idMap.size} de ${proyectos.length}`);

      const tareasConProyecto = await db.collection('tareas').find({ proyecto: { $exists: true } }).toArray();
      console.log(`  Tareas a reenlazar: ${tareasConProyecto.length}`);
      if (!DRY_RUN) {
        for (const t of tareasConProyecto) {
          const nuevoId = idMap.get(String(t.proyecto)) || t.proyecto;
          await db.collection('tareas').updateOne(
            { _id: t._id },
            { $set: { objetivo: nuevoId }, $unset: { proyecto: '' } }
          );
        }
        await db.collection('proyectos').rename('proyectos_deprecated');
        console.log('  Colección proyectos renombrada → proyectos_deprecated');
      }
    } else {
      console.log('Renombrando proyectos → objetivos');
      if (!DRY_RUN) {
        await db.collection('proyectos').rename('objetivos');
      }
    }
  }

  // 3. tareas.proyecto → objetivo (si quedó algún proyecto sin mapear arriba)
  const tareasConProyecto = await db.collection('tareas').countDocuments({ proyecto: { $exists: true } });
  console.log(`Tareas con campo proyecto restante: ${tareasConProyecto}`);
  if (tareasConProyecto > 0 && !DRY_RUN) {
    await db.collection('tareas').updateMany(
      { proyecto: { $exists: true } },
      [{ $set: { objetivo: '$proyecto' } }, { $unset: 'proyecto' }]
    );
  }

  // 4. Quitar array denormalizado tareas en objetivos
  const conTareasArray = await db.collection('objetivos').countDocuments({ tareas: { $exists: true } });
  console.log(`Objetivos con campo tareas[]: ${conTareasArray}`);
  if (conTareasArray > 0 && !DRY_RUN) {
    await db.collection('objetivos').updateMany({}, { $unset: { tareas: '' } });
  }

  // 5. Consolidar subtareas collection → embebidas
  if (names.includes('subtareas') || namesAfter.includes('subtareas')) {
    const subtareas = await db.collection('subtareas').find({}).toArray();
    console.log(`Subtareas en colección standalone: ${subtareas.length}`);
    if (!DRY_RUN) {
      for (const st of subtareas) {
        if (!st.tarea) continue;
        const tarea = await db.collection('tareas').findOne({ _id: st.tarea });
        if (!tarea) continue;
        const embedded = tarea.subtareas || [];
        const exists = embedded.some((e) =>
          (e.titulo || '').trim().toLowerCase() === (st.titulo || '').trim().toLowerCase()
        );
        if (!exists) {
          await db.collection('tareas').updateOne(
            { _id: st.tarea },
            {
              $push: {
                subtareas: {
                  titulo: st.titulo,
                  completada: st.completada ?? false,
                  orden: st.orden ?? embedded.length
                }
              }
            }
          );
        }
      }
    }
  }

  console.log('Migración finalizada.');
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
