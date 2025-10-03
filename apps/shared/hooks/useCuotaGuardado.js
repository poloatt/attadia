import { useCallback } from 'react';
import { useCuotasContext } from '../context/CuotasContext';

/**
 * Hook personalizado para manejar el guardado automático de cambios en cuotas
 * Proporciona una función que actualiza el estado local y guarda en el backend
 */
export const useCuotaGuardado = () => {
  const { updateCuota, guardarCuotasEnBackend, cuotas, isLoading } = useCuotasContext();

  /**
   * Función que actualiza una cuota específica y guarda automáticamente en el backend
   * @param {number} index - Índice de la cuota a actualizar
   * @param {Object} cambios - Cambios a aplicar a la cuota
   * @param {boolean} guardarInmediatamente - Si debe guardar inmediatamente en el backend (default: true)
   * @returns {Promise<boolean>} - True si se guardó exitosamente
   */
  const actualizarYGuardarCuota = useCallback(async (index, cambios, guardarInmediatamente = true) => {
    // 1. Actualizar el estado local inmediatamente
    updateCuota(index, cambios);
    
    if (!guardarInmediatamente) {
      return true; // Solo actualización local
    }
    
    // 2. Crear una copia actualizada de todas las cuotas
    const cuotasActualizadas = [...cuotas];
    cuotasActualizadas[index] = { ...cuotasActualizadas[index], ...cambios };
    
    // 3. Guardar en el backend
    return await guardarCuotasEnBackend(cuotasActualizadas);
  }, [updateCuota, guardarCuotasEnBackend, cuotas]);

  /**
   * Función para guardar múltiples cuotas a la vez
   * @param {Array} cuotasActualizadas - Array de cuotas actualizadas
   * @returns {Promise<boolean>} - True si se guardó exitosamente
   */
  const guardarMultiplesCuotas = useCallback(async (cuotasActualizadas) => {
    return await guardarCuotasEnBackend(cuotasActualizadas);
  }, [guardarCuotasEnBackend]);

  return {
    actualizarYGuardarCuota,
    guardarMultiplesCuotas,
    isLoading,
    cuotas
  };
}; 