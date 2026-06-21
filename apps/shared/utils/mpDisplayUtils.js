/** Mirror de MP_TRANSACTION_TYPE_LABELS (backend mercadoPagoUtils.js) para display-time. */
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
  DISPUTE_SHIPPING: 'Reclamo de envío',
};

const MP_ORIGEN_TIPOS = ['MERCADOPAGO_PAGO', 'MERCADOPAGO_MOVIMIENTO'];

export function isMercadoPagoOrigen(origen) {
  if (!origen?.tipo) return false;
  return MP_ORIGEN_TIPOS.includes(origen.tipo);
}

export function mapearTipoTransaccionMpDisplay(type) {
  if (!type) return null;
  const key = String(type).toUpperCase();
  return MP_TRANSACTION_TYPE_LABELS[key] || null;
}

/**
 * Reemplaza códigos crudos MP (SETTLEMENT, etc.) en descripciones legacy.
 */
export function formatMpTransactionDescription(descripcion, origen) {
  if (!descripcion) return descripcion || '';

  let result = descripcion;

  Object.entries(MP_TRANSACTION_TYPE_LABELS).forEach(([code, label]) => {
    const pattern = new RegExp(`\\b${code}\\b`, 'gi');
    result = result.replace(pattern, label);
  });

  if (isMercadoPagoOrigen(origen) && result.startsWith('MercadoPago - ')) {
    return result;
  }

  return result;
}

export function formatRelativeSyncTime(dateValue) {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;

  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'hace un momento';
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `hace ${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return 'ayer';
  if (diffD < 7) return `hace ${diffD} días`;
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}
