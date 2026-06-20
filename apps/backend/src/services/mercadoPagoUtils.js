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

export function formatearDescripcionMovimiento(row) {
  const tipo = row.TRANSACTION_TYPE || row.transaction_type || row.type || 'Movimiento';
  const metodo = row.PAYMENT_METHOD || row.payment_method || '';
  let descripcion = `MercadoPago - ${tipo}`;
  if (metodo) {
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
