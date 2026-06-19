/**
 * Calcula balance a partir de transacciones (INGRESO suma, EGRESO resta).
 */
export function balanceFromTransactions(transacciones = []) {
  return transacciones.reduce((acc, trans) => {
    const monto = parseFloat(trans.monto) || 0;
    return trans.tipo === 'INGRESO' ? acc + monto : acc - monto;
  }, 0);
}

/**
 * Saldo visible de una cuenta.
 * MercadoPago: prioriza saldo sincronizado desde la API (disponible para retiro).
 * Otras cuentas: suma de transacciones pagadas/completadas.
 */
export function resolveCuentaDisplayBalance(cuenta, balanceFromTransactions) {
  if (cuenta?.tipo === 'MERCADO_PAGO' && cuenta?.mercadopago?.userId != null) {
    const mpSaldo = cuenta.mercadopago?.disponibleRetiro ?? cuenta.saldo;
    if (mpSaldo != null && !Number.isNaN(Number(mpSaldo))) {
      return Number(mpSaldo);
    }
  }
  return balanceFromTransactions;
}
