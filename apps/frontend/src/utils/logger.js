// Sistema de logs condicional para optimizar performance
class Logger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isDebugMode = localStorage.getItem('debugMode') === 'true';
    this.disabledLogs = new Set();
  }

  // Habilitar/deshabilitar logs específicos
  disableLog(category) {
    this.disabledLogs.add(category);
  }

  enableLog(category) {
    this.disabledLogs.delete(category);
  }

  // Log condicional
  log(category, message, data) {
    if (!this.isDevelopment || this.disabledLogs.has(category)) {
      return;
    }
    
    if (data) {
      console.log(`[${category}]`, message, data);
    } else {
      console.log(`[${category}]`, message);
    }
  }

  // Log de performance
  perf(category, message, data) {
    if (!this.isDevelopment || !this.isDebugMode) {
      return;
    }
    
    if (data) {
      console.log(`⚡ [${category}]`, message, data);
    } else {
      console.log(`⚡ [${category}]`, message);
    }
  }

  // Log de errores (siempre activo)
  error(category, message, error) {
    if (error) {
      console.error(`❌ [${category}]`, message, error);
    } else {
      console.error(`❌ [${category}]`, message);
    }
  }

  // Log de warnings
  warn(category, message, data) {
    if (!this.isDevelopment) {
      return;
    }
    
    if (data) {
      console.warn(`⚠️ [${category}]`, message, data);
    } else {
      console.warn(`⚠️ [${category}]`, message);
    }
  }

  // Log de debug (solo en modo debug)
  debug(category, message, data) {
    if (!this.isDevelopment || !this.isDebugMode) {
      return;
    }
    
    if (data) {
      console.log(`🐛 [${category}]`, message, data);
    } else {
      console.log(`🐛 [${category}]`, message);
    }
  }
}

// Instancia singleton
const logger = new Logger();

// Deshabilitar logs problemáticos por defecto
logger.disableLog('isRouteActive');
logger.disableLog('PropiedadCard');
logger.disableLog('findParentPath');

export default logger; 