/**
 * Utilidades para manejar cambios locales en rutinas
 * Permiten preservar cambios realizados por el usuario aunque lleguen actualizaciones del servidor
 */

/**
 * Aplica cambios locales guardados a una rutina
 * @param {Object} rutina - Rutina a la que aplicar cambios
 * @param {Object} localChanges - Objeto con cambios locales
 * @returns {Object} Rutina con cambios aplicados
 */
export const applyLocalChanges = (rutina, localChanges = {}) => {
  if (!rutina || !rutina._id) return rutina;
  
  const rutinaId = rutina._id;
  const changes = localChanges[rutinaId];
  
  if (!changes) return rutina;
  
  // Crear una copia profunda para no mutar el objeto original
  const rutinaCopy = JSON.parse(JSON.stringify(rutina));
  
  // Aplicar cambios a la configuración
  if (changes.config) {
    if (!rutinaCopy.config) rutinaCopy.config = {};
    
    Object.entries(changes.config).forEach(([seccion, items]) => {
      if (!rutinaCopy.config[seccion]) rutinaCopy.config[seccion] = {};
      
      Object.entries(items).forEach(([itemId, config]) => {
        if (!rutinaCopy.config[seccion][itemId]) rutinaCopy.config[seccion][itemId] = {};
        
        // Aplicar cada campo del cambio local, preservando tipos correctos
        Object.entries(config).forEach(([field, value]) => {
          // Para valores numéricos, asegurar que se aplican como Number
          if (field === 'frecuencia') {
            rutinaCopy.config[seccion][itemId][field] = Number(value);
          } else {
            rutinaCopy.config[seccion][itemId][field] = value;
          }
        });
      });
    });
  }
  
  return rutinaCopy;
};

/**
 * Guarda cambios locales en localStorage
 * @param {Object} changes - Objeto con cambios a guardar
 */
export const saveLocalChanges = (changes) => {
  try {
    localStorage.setItem('rutina_cambios_locales', JSON.stringify(changes));
  } catch (error) {
    console.error('Error al guardar cambios locales:', error);
  }
};

/**
 * Carga cambios locales desde localStorage
 * @returns {Object} Objeto con cambios guardados o objeto vacío si no hay cambios
 */
export const loadLocalChanges = () => {
  try {
    const savedChanges = localStorage.getItem('rutina_cambios_locales');
    return savedChanges ? JSON.parse(savedChanges) : {};
  } catch (error) {
    console.error('Error al cargar cambios locales:', error);
    return {};
  }
};

/**
 * Limpia todos los cambios locales guardados
 */
export const clearLocalChanges = () => {
  try {
    localStorage.removeItem('rutina_cambios_locales');
  } catch (error) {
    console.error('Error al limpiar cambios locales:', error);
  }
};

/**
 * Registra un cambio local para un item específico
 * @param {Object} localChangesRef - Referencia a los cambios locales
 * @param {String} rutinaId - ID de la rutina
 * @param {String} section - Sección del item
 * @param {String} itemId - ID del item
 * @param {Object} values - Valores a guardar
 * @returns {Object} Nuevos cambios locales
 */
export const registerItemLocalChange = (localChangesRef, rutinaId, section, itemId, values) => {
  console.log(`[localChanges] 📝 Registrando cambio local para ${rutinaId}.${section}.${itemId}:`, JSON.stringify(values));
  
  if (!localChangesRef[rutinaId]) {
    localChangesRef[rutinaId] = { config: {} };
  }
  
  if (!localChangesRef[rutinaId].config[section]) {
    localChangesRef[rutinaId].config[section] = {};
  }
  
  // Guardar TODOS los campos relevantes, asegurando tipos correctos
  localChangesRef[rutinaId].config[section][itemId] = {
    ...values,
    // Normalizar explícitamente algunos campos críticos
    frecuencia: values.frecuencia !== undefined ? Number(values.frecuencia) : 1,
    activo: values.activo !== undefined ? Boolean(values.activo) : true
  };
  
  // Guardar cambios en localStorage
  saveLocalChanges(localChangesRef);
  console.log(`[localChanges] ✅ Cambios guardados en localStorage con éxito`);
  
  return localChangesRef;
};

/**
 * Fuerza la eliminación de todos los cambios locales y reinicia el estado
 * Útil para depuración y resolución de problemas
 */
export const forceResetLocalChanges = () => {
  try {
    console.log('[localChanges] 🧹 Forzando eliminación de TODOS los cambios locales');
    
    // Eliminar todo lo relacionado con rutinas del localStorage
    localStorage.removeItem('rutina_cambios_locales');
    localStorage.removeItem('rutina_config_changes');
    
    // Buscar y eliminar cualquier otra clave relacionada con rutinas
    Object.keys(localStorage).forEach(key => {
      if (key.includes('rutina') || key.includes('config')) {
        console.log(`[localChanges] Eliminando clave de localStorage: ${key}`);
        localStorage.removeItem(key);
      }
    });
    
    console.log('[localChanges] ✅ Todos los cambios locales han sido eliminados');
    
    // Devolver true para indicar éxito
    return true;
  } catch (error) {
    console.error('[localChanges] ❌ Error al forzar eliminación de cambios locales:', error);
    return false;
  }
}; 