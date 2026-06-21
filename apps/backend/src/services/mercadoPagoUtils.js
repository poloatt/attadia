/**
 * Utilidades compartidas para integración wallet Mercado Pago (Argentina).
 */

export function calcularComisiones(pago) {
  const comisiones = {
    mercadopago: 0,
    financieras: 0,
    envio: 0,
    total: 0
  };

  if (pago.fee_details && Array.isArray(pago.fee_details)) {
    for (const fee of pago.fee_details) {
      const amount = Math.abs(fee.amount || 0);
      switch (fee.type) {
        case 'mercadopago_fee':
          comisiones.mercadopago += amount;
          break;
        case 'financing_fee':
          comisiones.financieras += amount;
          break;
        case 'shipping_fee':
          comisiones.envio += amount;
          break;
        default:
          comisiones.mercadopago += amount;
      }
    }
  }

  comisiones.total = comisiones.mercadopago + comisiones.financieras + comisiones.envio;
  return comisiones;
}

export function determinarTipoPago(pago, userId) {
  const mpUserId = Number(userId);
  const collectorId = Number(pago.collector_id);
  const payerId = Number(pago.payer?.id);

  if (collectorId === mpUserId && payerId !== mpUserId) {
    return 'INGRESO';
  }
  if (payerId === mpUserId && collectorId !== mpUserId) {
    return 'EGRESO';
  }
  if (collectorId === mpUserId) {
    return 'INGRESO';
  }
  return 'EGRESO';
}

export function determinarTipoMovimiento(amount) {
  return Number(amount) >= 0 ? 'INGRESO' : 'EGRESO';
}

export function formatearDescripcionPago(pago) {
  let descripcion = `MercadoPago - ${pago.payment_method?.type || pago.payment_method_id || 'Pago'}`;
  if (pago.description) {
    descripcion += ` - ${pago.description}`;
  }
  if (pago.external_reference) {
    descripcion += ` (Ref: ${pago.external_reference})`;
  }
  return descripcion;
}

export const MP_TRANSACTION_TYPE_LABELS = {
  SETTLEMENT: 'Pago aprobado',
  REFUND: 'Devolución',
  CHARGEBACK: 'Contracargo',
  DISPUTE: 'Reclamo',
  WITHDRAWAL: 'Transferencia bancaria',
  WITHDRAWAL_CANCEL: 'Transferencia cancelada',
  PAYOUT: 'Retiro de efectivo',
  CASHBACK: 'Cashback',
  SETTLEMENT_SHIPPING: 'Envío aprobado',
  REFUND_SHIPPING: 'Devolución de envío',
  CHARGEBACK_SHIPPING: 'Contracargo de envío',
  DISPUTE_SHIPPING: 'Reclamo de envío'
};

export function mapearTipoTransaccionMp(type) {
  if (!type) return 'Movimiento';
  const key = String(type).toUpperCase();
  return MP_TRANSACTION_TYPE_LABELS[key] || type;
}

export function getMpSyncDays() {
  return parseInt(process.env.MP_SYNC_DAYS || '90', 10);
}

export function formatearDescripcionMovimiento(row) {
  const tipoRaw =
    row.TRANSACTION_TYPE || row.transaction_type || row.transactionType || row.type || 'Movimiento';
  const tipoLabel = mapearTipoTransaccionMp(tipoRaw);
  const metodo = row.PAYMENT_METHOD || row.payment_method || row.paymentMethod || '';
  const description = row.DESCRIPTION || row.description || '';
  let descripcion = `MercadoPago - ${tipoLabel}`;
  if (description && description !== tipoRaw && description !== tipoLabel) {
    descripcion += ` - ${description}`;
  } else if (metodo) {
    descripcion += ` (${metodo})`;
  }
  if (row.EXTERNAL_REFERENCE || row.external_reference) {
    descripcion += ` (Ref: ${row.EXTERNAL_REFERENCE || row.external_reference})`;
  }
  return descripcion;
}

export function mapearEstadoPago(status) {
  const estados = {
    approved: 'COMPLETADA',
    pending: 'PENDIENTE',
    in_process: 'PENDIENTE',
    rejected: 'CANCELADA',
    cancelled: 'CANCELADA',
    refunded: 'CANCELADA'
  };
  return estados[status] || 'PENDIENTE';
}

export function deduplicarPagos(pagos) {
  const map = new Map();
  for (const pago of pagos) {
    if (pago?.id != null) {
      map.set(String(pago.id), pago);
    }
  }
  return Array.from(map.values());
}

export function mpAuthHeaders(accessToken) {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'User-Agent': 'Attadia/1.0'
  };
}
