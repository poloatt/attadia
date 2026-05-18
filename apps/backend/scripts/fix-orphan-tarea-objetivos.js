import 'dotenv/config';
import mongoose from 'mongoose';
import config from '../src/config/config.js';

const uri = process.env.MONGO_PUBLIC_URL || process.env.MONGO_URL || config.mongoUrl;
await mongoose.connect(uri);
const db = mongoose.connection.db;

const email = process.argv.find(a => a.startsWith('--user='))?.split('=')[1] || 'polo@poloatt.com';
const user = await db.collection('users').findOne({ email });
if (!user) throw new Error('Usuario no encontrado');

const uid = user._id;
const objetivos = await db.collection('objetivos').find({ usuario: uid }).toArray();
const objetivoIds = new Set(objetivos.map((o) => String(o._id)));
const deprecated = await db.collection('proyectos_deprecated').find({ usuario: uid }).toArray();

const byList = new Map();
const byName = new Map();
for (const o of objetivos) {
  if (o.googleTasksSync?.googleTaskListId) byList.set(o.googleTasksSync.googleTaskListId, o._id);
  if (o.nombre) byName.set(`${o.nombre}::${o.usuario}`, o._id);
}

const tareas = await db.collection('tareas').find({ usuario: uid, objetivo: { $exists: true, $ne: null } }).toArray();
let fixed = 0;
let cleared = 0;

for (const t of tareas) {
  if (objetivoIds.has(String(t.objetivo))) continue;

  const dep = deprecated.find((p) => String(p._id) === String(t.objetivo));
  let nuevo = null;
  if (dep) {
    const listId = dep.googleTasksSync?.googleTaskListId;
    if (listId && byList.has(listId)) nuevo = byList.get(listId);
    else if (dep.nombre) nuevo = byName.get(`${dep.nombre}::${dep.usuario}`);
  }
  if (t.googleTasksSync?.googleTaskListId && byList.has(t.googleTasksSync.googleTaskListId)) {
    nuevo = byList.get(t.googleTasksSync.googleTaskListId);
  }

  if (nuevo) {
    await db.collection('tareas').updateOne({ _id: t._id }, { $set: { objetivo: nuevo } });
    fixed++;
    console.log(`✓ ${t.titulo} → objetivo ${nuevo}`);
  } else {
    await db.collection('tareas').updateOne({ _id: t._id }, { $unset: { objetivo: '' } });
    cleared++;
    console.log(`○ ${t.titulo} — objetivo eliminado (sin match)`);
  }
}

console.log(`\nReparadas: ${fixed}, sin objetivo: ${cleared}`);
await mongoose.disconnect();
