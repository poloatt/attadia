import clienteAxios from '../config/axios';

/**
 * Servicio para manejar operaciones relacionadas con rutinas
 */
class RutinasService {
  /**
   * Obtener todas las rutinas
   * @param {Object} options - Opciones de consulta
   * @returns {Promise} Respuesta con las rutinas
   */
  async getRutinas(options = {}) {
    const timestamp = Date.now();
    const params = { _t: timestamp, ...options };
    
    try {
      const response = await clienteAxios.get('/api/rutinas', { params });
      return response.data;
    } catch (error) {
      console.error('Error al obtener rutinas:', error);
      throw error;
    }
  }

  /**
   * Obtener una rutina específica por ID
   * @param {string} id - ID de la rutina
   * @returns {Promise} Respuesta con la rutina
   */
  async getRutinaById(id) {
    const timestamp = Date.now();
    
    try {
      const response = await clienteAxios.get(`/api/rutinas/${id}`, { 
        params: { _t: timestamp } 
      });
      return response.data;
    } catch (error) {
      console.error(`Error al obtener rutina ${id}:`, error);
      throw error;
    }
  }

  /**
   * Crear una nueva rutina
   * @param {Object} rutina - Datos de la rutina a crear
   * @returns {Promise} Respuesta con la rutina creada
   */
  async createRutina(rutina) {
    try {
      const response = await clienteAxios.post('/api/rutinas', rutina);
      return response.data;
    } catch (error) {
      console.error('Error al crear rutina:', error);
      throw error;
    }
  }

  /**
   * Actualizar una rutina existente
   * @param {string} id - ID de la rutina
   * @param {Object} rutina - Datos actualizados de la rutina
   * @returns {Promise} Respuesta con la rutina actualizada
   */
  async updateRutina(id, rutina) {
    try {
      const response = await clienteAxios.put(`/api/rutinas/${id}`, rutina);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar rutina ${id}:`, error);
      throw error;
    }
  }

  /**
   * Eliminar una rutina
   * @param {string} id - ID de la rutina a eliminar
   * @returns {Promise} Respuesta de la operación
   */
  async deleteRutina(id) {
    try {
      const response = await clienteAxios.delete(`/api/rutinas/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al eliminar rutina ${id}:`, error);
      throw error;
    }
  }

  /**
   * Marcar un ítem como completado/no completado
   * @param {string} id - ID de la rutina
   * @param {string} section - Sección del ítem (bodyCare, mental, etc.)
   * @param {Object} data - Datos del ítem (ejemplo: {meditate: true})
   * @returns {Promise} Respuesta con la rutina actualizada
   */
  async markComplete(id, section, data) {
    try {
      // Validación básica
      if (!id || typeof id !== 'string') throw new Error('ID de rutina inválido');
      if (!section || typeof section !== 'string') throw new Error('Sección inválida');
      if (!data || typeof data !== 'object') throw new Error('Datos inválidos');
      
      // Extraer el itemId y verificar que existe
      const itemId = Object.keys(data)[0];
      if (!itemId) throw new Error('No se proporcionó ID de ítem');
      
      // Obtener el valor booleano explícito
      const isCompleted = data[itemId] === true;
      
      // Estructura mínima para enviar - simplificada al máximo (sin anidación de objetos)
      const payload = {};
      payload[section] = {};
      payload[section][itemId] = isCompleted;
      
      console.log(`[rutinasService] 🔄 PUT /api/rutinas/${id}:`, JSON.stringify(payload));
      
      // Petición simple con manejo de errores
      try {
        const response = await clienteAxios.put(`/api/rutinas/${id}`, payload);
        console.log(`[rutinasService] ✅ Actualización exitosa de ${section}.${itemId}`);
        return response.data;
      } catch (error) {
        // Logging detallado del error
        console.error(`[rutinasService] ❌ Error HTTP (${error.response?.status || 'desconocido'}):`);
        if (error.response?.data) {
          console.error(`- Mensaje del servidor: ${error.response.data.error || 'No disponible'}`);
          console.error(`- Detalles: ${error.response.data.details || 'No disponible'}`);
        }
        throw error;
      }
    } catch (error) {
      // Propagar el error para manejo en componentes
      console.error(`[rutinasService] ⚠️ Error general: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene el historial de completaciones para un ítem específico
   * @param {string} section - Sección del ítem (bodyCare, nutricion, etc)
   * @param {string} itemId - Identificador del ítem
   * @param {Date|string} fechaInicio - Fecha de inicio para la consulta
   * @param {Date|string} fechaFin - Fecha de fin para la consulta
   * @returns {Promise} Promesa con el resultado de la consulta
   */
  async getHistorialCompletaciones(section, itemId, fechaInicio, fechaFin) {
    try {
      console.log(`[rutinasService] Obteniendo historial para ${section}.${itemId}`);
      
      // Usar una fecha de inicio muy anterior para asegurar capturar todas las completaciones
      // Si no se especifica fecha de inicio, usar 3 meses atrás 
      const defaultFechaInicio = new Date();
      defaultFechaInicio.setMonth(defaultFechaInicio.getMonth() - 3);
      
      // Convertir fechas a formato ISO si son objetos Date
      const inicio = fechaInicio instanceof Date 
        ? fechaInicio.toISOString() 
        : (fechaInicio || defaultFechaInicio.toISOString());
        
      const fin = fechaFin instanceof Date 
        ? fechaFin.toISOString() 
        : (fechaFin || new Date().toISOString());
      
      // Debugging: Mostrar fechas que estamos usando
      console.log(`[rutinasService] Rango de fechas para consulta:`, {
        inicio: new Date(inicio).toLocaleDateString(),
        fin: new Date(fin).toLocaleDateString()
      });
      
      // Construir URL con parámetros
      const url = `/api/rutinas/historial-completaciones/${section}/${itemId}?fechaInicio=${inicio}&fechaFin=${fin}`;
      
      console.log(`[rutinasService] URL de consulta: ${url}`);
      
      // Realizar la petición al backend
      const response = await clienteAxios.get(url);
      
      // Mostrar información de fechas para depuración
      if (response.data && response.data.completaciones) {
        console.log(`[rutinasService] Recibidas ${response.data.total} completaciones`);
        
        // Ordenar completaciones por fecha para mejor visualización
        const completacionesOrdenadas = [...response.data.completaciones].sort((a, b) => 
          new Date(a.fecha) - new Date(b.fecha)
        );
        
        console.log('[rutinasService] Fechas encontradas (ordenadas):');
        completacionesOrdenadas.forEach((comp, idx) => {
          const fecha = new Date(comp.fecha);
          const fechaStr = fecha.toISOString().split('T')[0];
          console.log(`  ${idx+1}. ${fechaStr} [${comp.rutinaId}]`);
        });
        
        // Mostrar completaciones agrupadas por semana
        if (response.data.completacionesPorSemana) {
          console.log('[rutinasService] Completaciones por semana:');
          Object.entries(response.data.completacionesPorSemana).forEach(([semana, comps]) => {
            const completacionesFechas = comps.map(c => 
              new Date(c.fecha).toISOString().split('T')[0]
            ).join(', ');
            console.log(`  - Semana ${semana}: ${comps.length} completaciones (${completacionesFechas})`);
          });
        }
        
        // Añadir las completaciones a la caché global para debugging
        if (!window.completacionesCache) {
          window.completacionesCache = {};
        }
        window.completacionesCache[`${section}_${itemId}`] = completacionesOrdenadas;
      }
      
      return response.data;
    } catch (error) {
      console.error('[rutinasService] Error al obtener historial de completaciones:', error);
      throw new Error(`Error al obtener historial: ${error.message}`);
    }
  }
}

export default new RutinasService(); 