/**
 * Formato unificado de montos en Finanzas (locale es-AR por defecto).
 */
export function formatFinanzasMonto(value, options = {}) {
  const {
    simbolo = '',
    locale = 'es-AR',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    prefixSymbol = true,
  } = options;

  const num = Number(value);
  if (Number.isNaN(num)) {
    return prefixSymbol && simbolo ? `${simbolo} —` : '—';
  }

  const formatted = num.toLocaleString(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
  });

  if (!simbolo) return formatted;
  return prefixSymbol ? `${simbolo} ${formatted}` : formatted;
}

export function formatFinanzasMontoCompact(value, options = {}) {
  return formatFinanzasMonto(value, {
    ...options,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}
