/**
 * Helper para telemetría de debugging
 * Solo ejecuta en desarrollo para evitar errores en producción
 */
export const debugTelemetry = {
  /**
   * Envía datos de telemetría solo en desarrollo
   * @param {string} location - Ubicación del código (ej: 'RutinaCard.jsx:397')
   * @param {string} message - Mensaje descriptivo
   * @param {object} data - Datos adicionales
   * @param {string} hypothesisId - ID de hipótesis (opcional)
   */
  log(location, message, data = {}, hypothesisId = 'default') {
    // Solo ejecutar en desarrollo
    if (import.meta.env.DEV || import.meta.env.MODE === 'development') {
      try {
        fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location,
            message,
            data,
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId
          })
        }).catch(() => {
          // Silenciar errores de conexión
        });
      } catch (error) {
        // Silenciar errores
      }
    }
  }
};

