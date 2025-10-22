/**
 * Utilidad de logging optimizada para reducir ruido en producción
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

class Logger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info');
  }

  /**
   * Log solo en desarrollo
   */
  dev(message, ...args) {
    if (isDevelopment) {
      console.log(`[DEV] ${message}`, ...args);
    }
  }

  /**
   * Log de información (siempre visible)
   */
  info(message, ...args) {
    console.log(`[INFO] ${message}`, ...args);
  }

  /**
   * Log de advertencias (siempre visible)
   */
  warn(message, ...args) {
    console.warn(`[WARN] ${message}`, ...args);
  }

  /**
   * Log de errores (siempre visible)
   */
  error(message, ...args) {
    console.error(`[ERROR] ${message}`, ...args);
  }

  /**
   * Log de debug (solo en desarrollo)
   */
  debug(message, ...args) {
    if (isDevelopment) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }

  /**
   * Log de datos grandes truncados (para evitar logs masivos)
   */
  data(label, data, maxLength = 200) {
    if (isDevelopment) {
      const dataStr = JSON.stringify(data);
      const truncated = dataStr.length > maxLength 
        ? dataStr.substring(0, maxLength) + '...' 
        : dataStr;
      console.log(`[DATA] ${label}:`, truncated);
    }
  }

  /**
   * Log de performance (solo en desarrollo)
   */
  perf(label, startTime) {
    if (isDevelopment) {
      const duration = Date.now() - startTime;
      console.log(`[PERF] ${label}: ${duration}ms`);
    }
  }

  /**
   * Log de sincronización (reducido en producción)
   */
  sync(message, ...args) {
    if (isDevelopment) {
      console.log(`[SYNC] ${message}`, ...args);
    } else {
      // En producción solo log errores importantes
      if (message.includes('Error') || message.includes('Failed')) {
        console.log(`[SYNC] ${message}`, ...args);
      }
    }
  }
}

export default new Logger();