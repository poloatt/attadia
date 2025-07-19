// Middleware para optimizar performance
import statusCache from '../utils/statusCache.js';

// Middleware para comprimir respuestas y optimizar
export const performanceMiddleware = (req, res, next) => {
  // Agregar headers de cache
  res.set({
    'Cache-Control': 'public, max-age=300', // 5 minutos
    'ETag': `"${Date.now()}"`,
    'Vary': 'Accept-Encoding'
  });
  
  // Monitorear tiempo de respuesta
  const start = Date.now();
  
  // Interceptar respuesta para optimizar
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - start;
    
    // Log de performance solo en desarrollo y si es lento
    if (process.env.NODE_ENV === 'development' && duration > 100) {
      console.log(`🚀 ${req.method} ${req.path} - ${duration}ms`);
    }
    
    // Optimizar datos si es necesario
    if (data && data.docs && Array.isArray(data.docs)) {
      // Comprimir datos eliminando campos innecesarios
      data.docs = data.docs.map(doc => {
        const { __v, ...cleanDoc } = doc;
        return cleanDoc;
      });
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

// Middleware específico para endpoints de estados
export const statusOptimizationMiddleware = (req, res, next) => {
  // Agregar headers específicos para estados
  res.set({
    'Cache-Control': 'public, max-age=600', // 10 minutos para estados
    'X-Status-Cache': 'enabled'
  });
  
  next();
};

// Middleware para limpiar cache periódicamente
export const cacheCleanupMiddleware = (req, res, next) => {
  // Limpiar cache cada 100 requests
  const requestCount = req.app.locals.requestCount || 0;
  req.app.locals.requestCount = requestCount + 1;
  
  if (requestCount % 100 === 0) {
    statusCache.clearCache();
    console.log('🧹 Cache limpiado automáticamente');
  }
  
  next();
};

// Función para obtener estadísticas de performance
export const getPerformanceStats = () => {
  return {
    cacheStats: statusCache.getCacheStats(),
    timestamp: new Date().toISOString()
  };
}; 