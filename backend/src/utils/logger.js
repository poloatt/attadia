// Sistema de logging estructurado para la aplicación
class Logger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  // Log de información general
  info(message, data = {}) {
    this.log('INFO', message, data);
  }

  // Log de advertencias
  warn(message, data = {}) {
    this.log('WARN', message, data);
  }

  // Log de errores
  error(message, error = null, data = {}) {
    const logData = {
      ...data,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code
      } : null
    };
    this.log('ERROR', message, logData);
  }

  // Log de debug (solo en desarrollo)
  debug(message, data = {}) {
    if (this.isDevelopment) {
      this.log('DEBUG', message, data);
    }
  }

  // Log específico para MercadoPago
  mercadopago(action, message, data = {}) {
    this.log('MERCADOPAGO', message, {
      action,
      timestamp: new Date().toISOString(),
      ...data
    });
  }

  // Log específico para sincronización
  sync(connectionId, action, message, data = {}) {
    this.log('SYNC', message, {
      connectionId,
      action,
      timestamp: new Date().toISOString(),
      ...data
    });
  }

  // Método principal de logging
  log(level, message, data = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...data
    };

    // En desarrollo, mostrar logs más detallados
    if (this.isDevelopment) {
      console.log(`[${level}] ${message}`, data);
    } else {
      // En producción, usar formato JSON para mejor parsing
      console.log(JSON.stringify(logEntry));
    }
  }

  // Método para logging de performance
  performance(operation, duration, data = {}) {
    this.log('PERFORMANCE', `${operation} completado en ${duration}ms`, {
      operation,
      duration,
      ...data
    });
  }

  // Método para logging de seguridad
  security(event, data = {}) {
    this.log('SECURITY', event, {
      event,
      ip: data.ip,
      userId: data.userId,
      userAgent: data.userAgent,
      ...data
    });
  }
}

// Instancia singleton del logger
const logger = new Logger();

export default logger; 