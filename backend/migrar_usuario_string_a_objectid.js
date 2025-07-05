// Script para migrar el campo 'usuario' de string a ObjectId en la colección 'contratos'
// Uso: node migrar_usuario_string_a_objectid.js

import mongoose from 'mongoose';

// === CONFIGURACIÓN PARA DOCKER ===
// Usando la misma configuración que el backend en Docker
const MONGO_URI = 'mongodb://admin:MiContraseñaSegura123@mongodb:27017/present?authSource=admin';

async function main() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const db = mongoose.connection;

  const contratos = db.collection('contratos');

  const docs = await contratos.find({ usuario: { $type: 'string' } }).toArray();
  console.log(`Contratos a migrar: ${docs.length}`);

  let count = 0;
  for (const doc of docs) {
    if (doc.usuario && typeof doc.usuario === 'string' && doc.usuario.length === 24) {
      await contratos.updateOne(
        { _id: doc._id },
        { $set: { usuario: new mongoose.Types.ObjectId(doc.usuario) } }
      );
      count++;
      console.log(`Migrado contrato _id: ${doc._id}`);
    } else {
      console.log(`Saltado contrato _id: ${doc._id} (usuario no es string de 24 chars)`);
    }
  }

  console.log(`Migración completada. Total migrados: ${count}`);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error en la migración:', err);
  process.exit(1);
}); 