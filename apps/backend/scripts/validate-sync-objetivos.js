#!/usr/bin/env node
/**
 * Valida consistencia Objetivo ↔ Google Task List ↔ Tareas en Mongo.
 * Uso: node apps/backend/scripts/validate-sync-objetivos.js [--user=email]
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../src/config/database/mongodb.js';
import { Users, Objetivos, Tareas } from '../src/models/index.js';

const userFilter = process.argv.find(a => a.startsWith('--user='))?.split('=')[1];

const main = async () => {
  await connectDB();

  const userQuery = userFilter
    ? (userFilter.includes('@') ? { email: userFilter } : { _id: userFilter })
    : {};
  const user = await Users.findOne(userQuery);
  if (!user) {
    console.error('Usuario no encontrado');
    process.exit(1);
  }

  const uid = user._id;
  console.log(`\n🔍 Validación sync — ${user.email} (${uid})\n`);

  const issues = [];
  const objetivos = await Objetivos.find({ usuario: uid }).lean();
  const tareas = await Tareas.find({ usuario: uid }).lean();

  const tareasConProyectoLegacy = await Tareas.countDocuments({ usuario: uid, proyecto: { $exists: true } });
  if (tareasConProyectoLegacy > 0) {
    issues.push(`${tareasConProyectoLegacy} tareas aún tienen campo legacy "proyecto" (ejecutar migrate-proyectos-to-objetivos.js)`);
  }

  console.log(`Objetivos: ${objetivos.length}`);
  console.log(`Tareas: ${tareas.length}`);

  const listIdToObjetivo = new Map();
  for (const o of objetivos) {
    const listId = o.googleTasksSync?.googleTaskListId;
    if (listId) {
      if (listIdToObjetivo.has(listId)) {
        issues.push(`googleTaskListId duplicado "${listId}" entre objetivos`);
      }
      listIdToObjetivo.set(listId, o);
    }
  }

  let sinLista = 0;
  let conLista = 0;
  for (const o of objetivos) {
    if (o.googleTasksSync?.googleTaskListId) conLista++;
    else sinLista++;
  }
  console.log(`  con lista Google: ${conLista}, sin lista: ${sinLista}`);

  let tareasSinObjetivo = 0;
  let tareasObjetivoInvalido = 0;
  let tareasConGoogleSinObjetivo = 0;
  const objetivoIds = new Set(objetivos.map(o => String(o._id)));

  for (const t of tareas) {
    if (!t.objetivo) {
      tareasSinObjetivo++;
      if (t.googleTasksSync?.googleTaskId) tareasConGoogleSinObjetivo++;
    } else if (!objetivoIds.has(String(t.objetivo))) {
      tareasObjetivoInvalido++;
    }
  }

  if (tareasSinObjetivo) {
    console.log(`  tareas sin objetivo: ${tareasSinObjetivo} (${tareasConGoogleSinObjetivo} con googleTaskId)`);
  }
  if (tareasObjetivoInvalido) {
    issues.push(`${tareasObjetivoInvalido} tareas referencian objetivo inexistente`);
  }

  if (user.googleTasksConfig?.enabled) {
    console.log(`Google Tasks: habilitado (lastSync: ${user.googleTasksConfig.lastSync || 'nunca'})`);
  } else {
    console.log('Google Tasks: no habilitado en este usuario');
  }

  if (issues.length === 0) {
    console.log('\n✅ Sin inconsistencias detectadas en Mongo.\n');
    process.exit(0);
  }

  console.log('\n⚠️ Problemas:\n');
  issues.forEach(i => console.log(`  - ${i}`));
  console.log('');
  process.exit(1);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(() => mongoose.disconnect());
