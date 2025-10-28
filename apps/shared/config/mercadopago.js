// Configuración centralizada para MercadoPago
export const MERCADOPAGO_CONFIG = {
  // URLs de redirección por ambiente
  redirectURIs: {
    development: 'http://localhost:5173/mercadopago/callback',
    production: 'https://atta.attadia.com/mercadopago/callback'
  },
  
  // Colores de marca
  colors: {
    primary: '#009ee3',
    secondary: '#ff6b35',
    success: '#00a650',
    error: '#ff4444'
  },
  
  // Configuración de sincronización
  sync: {
    defaultFrequency: 'DIARIA',
    maxRetries: 3,
    retryDelay: 5000, // 5 segundos
    timeout: 30000 // 30 segundos
  },
  
  // Estados de transacciones
  transactionStates: {
    approved: 'COMPLETADA',
    pending: 'PENDIENTE',
    in_process: 'PENDIENTE',
    rejected: 'CANCELADA',
    cancelled: 'CANCELADA',
    refunded: 'CANCELADA'
  },
  
  // Tipos de pago
  paymentTypes: {
    credit_card: 'Tarjeta de crédito',
    debit_card: 'Tarjeta de débito',
    bank_transfer: 'Transferencia bancaria',
    cash: 'Efectivo',
    atm: 'Cajero automático'
  }
};

// Función para obtener la URL de redirección según el ambiente
export const getRedirectURI = () => {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname.includes('127.0.0.1')) {
    return MERCADOPAGO_CONFIG.redirectURIs.development;
  } else if (hostname === 'atta.attadia.com' || 
             hostname === 'foco.attadia.com' || 
             hostname === 'pulso.attadia.com') {
    return MERCADOPAGO_CONFIG.redirectURIs.production;
  } else {
    return MERCADOPAGO_CONFIG.redirectURIs.development; // fallback
  }
};

// Habilitar MercadoPago (producción o modo desarrollo forzado)
export const isMercadoPagoEnabled = () => {
  const devFlag = import.meta?.env?.VITE_MP_DEV;
  return Boolean(import.meta.env.PROD || devFlag === '1' || devFlag === 'true');
};

// Función para mapear estado de MercadoPago a estado interno
export const mapTransactionState = (mpState) => {
  return MERCADOPAGO_CONFIG.transactionStates[mpState] || 'PENDIENTE';
};

// Función para formatear descripción de transacción
export const formatTransactionDescription = (payment) => {
  let description = `MercadoPago - ${MERCADOPAGO_CONFIG.paymentTypes[payment.payment_method?.type] || 'Pago'}`;
  
  if (payment.description) {
    description += ` - ${payment.description}`;
  }
  
  if (payment.external_reference) {
    description += ` (Ref: ${payment.external_reference})`;
  }
  
  return description;
}; 