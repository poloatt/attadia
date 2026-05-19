export const FINANZAS_STATS_ENDPOINTS = {
  transacciones: '/api/transacciones',
  cuentas: '/api/cuentas',
  monedas: '/api/monedas',
  recurrente: '/api/transaccionesrecurrentes',
};

/** Textos y acentos para tarjetas del hub Finanzas. */
export const FINANZAS_SECTION_META = {
  transacciones: {
    description: 'Ingresos, gastos y movimientos del día a día',
    accent: '#4CAF50',
  },
  recurrente: {
    description: 'Pagos e ingresos automáticos periódicos',
    accent: '#607D8B',
  },
  cuentas: {
    description: 'Bancos, efectivo y billeteras conectadas',
    accent: '#2196F3',
  },
  monedas: {
    description: 'Divisas y símbolos para tus cuentas',
    accent: '#FF9800',
  },
  inversiones: {
    description: 'Portafolios y rendimiento de inversiones',
    accent: '#9C27B0',
  },
  deudores: {
    description: 'Préstamos, deudas y cobros pendientes',
    accent: '#F44336',
  },
};
