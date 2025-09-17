// Sistema de cache para estados - Evita recálculos repetitivos
class StatusCache {
  constructor() {
    this.cache = new Map();
    this.now = new Date();
    this.now.setHours(0, 0, 0, 0);
    
    // Limpiar cache cada hora
    setInterval(() => {
      this.clearCache();
      this.now = new Date();
      this.now.setHours(0, 0, 0, 0);
    }, 60 * 60 * 1000);
  }

  // Generar clave única para el cache
  generateKey(contrato) {
    const fechaInicio = contrato.fechaInicio ? new Date(contrato.fechaInicio).toISOString().split('T')[0] : 'null';
    const fechaFin = contrato.fechaFin ? new Date(contrato.fechaFin).toISOString().split('T')[0] : 'null';
    const tipoContrato = contrato.tipoContrato || 'ALQUILER';
    const esMantenimiento = contrato.esMantenimiento || false;
    
    return `${fechaInicio}_${fechaFin}_${tipoContrato}_${esMantenimiento}`;
  }

  // Calcular estado con cache
  getEstadoContrato(contrato) {
    const key = this.generateKey(contrato);
    
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    const estado = this.calcularEstadoContrato(contrato);
    this.cache.set(key, estado);
    
    return estado;
  }

  // Calcular estado sin cache (lógica optimizada)
  calcularEstadoContrato(contrato) {
    if (!contrato.fechaInicio) {
      return contrato.estado || 'PLANEADO';
    }

    const inicio = new Date(contrato.fechaInicio);
    inicio.setHours(0, 0, 0, 0);
    
    if (!contrato.fechaFin) {
      if (inicio <= this.now) {
        return contrato.esMantenimiento || contrato.tipoContrato === 'MANTENIMIENTO' ? 'MANTENIMIENTO' : 'ACTIVO';
      } else {
        return 'PLANEADO';
      }
    }
    
    const fin = new Date(contrato.fechaFin);
    fin.setHours(0, 0, 0, 0);
    
    if (contrato.esMantenimiento || contrato.tipoContrato === 'MANTENIMIENTO') {
      if (inicio <= this.now && fin > this.now) {
        return 'MANTENIMIENTO';
      } else if (inicio > this.now) {
        return 'PLANEADO';
      } else {
        return 'FINALIZADO';
      }
    }
    
    if (inicio <= this.now && fin > this.now) {
      return 'ACTIVO';
    } else if (inicio > this.now) {
      return 'PLANEADO';
    } else {
      return 'FINALIZADO';
    }
  }

  // Procesar múltiples contratos de una vez
  procesarContratos(contratos) {
    return contratos.map(contrato => ({
      ...contrato,
      estadoActual: this.getEstadoContrato(contrato)
    }));
  }

  // Limpiar cache
  clearCache() {
    this.cache.clear();
  }

  // Obtener estadísticas del cache
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Instancia singleton
const statusCache = new StatusCache();

export default statusCache; 