/**
 * Re-etiqueta descripciones MP legacy (SETTLEMENT, WITHDRAWAL, etc.) en la DB.
 *
 * Uso: node apps/backend/scripts/relabel-mp-descriptions.js [--dry-run]
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Transacciones } from '../src/models/index.js';
import { formatearDescripcionMovimiento } from '../src/services/mercadoPagoUtils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MP_ORIGEN_TIPOS = ['MERCADOPAGO_PAGO', 'MERCADOPAGO_MOVIMIENTO'];
const RAW_PATTERN = /\b(SETTLEMENT|WITHDRAWAL|PAYOUT|REFUND|CHARGEBACK|DISPUTE)\b/i;
const dryRun = process.argv.includes('--dry-run');

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGODB_URI no configurada');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log(dryRun ? 'DRY RUN — sin escribir en DB' : 'Actualizando descripciones MP...');

  const cursor = Transacciones.find({
    'origen.tipo': { $in: MP_ORIGEN_TIPOS },
    descripcion: { $regex: RAW_PATTERN },
  }).cursor();

  let updated = 0;
  let skipped = 0;

  for await (const tx of cursor) {
    const meta = tx.origen?.metadata || tx.mercadopago || {};
    const row = {
      TRANSACTION_TYPE: meta.transactionType || meta.TRANSACTION_TYPE,
      DESCRIPTION: meta.description || meta.DESCRIPTION,
      PAYMENT_METHOD: meta.paymentMethod || meta.PAYMENT_METHOD,
      EXTERNAL_REFERENCE: meta.externalReference || meta.EXTERNAL_REFERENCE,
      ...meta,
    };

    const nueva = formatearDescripcionMovimiento(row);
    if (!nueva || nueva === tx.descripcion) {
      skipped += 1;
      continue;
    }

    if (!dryRun) {
      tx.descripcion = nueva;
      await tx.save();
    }
    updated += 1;
    console.log(`  ${tx._id}: "${tx.descripcion}" → "${nueva}"`);
  }

  console.log(`Listo. Actualizadas: ${updated}, omitidas: ${skipped}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
