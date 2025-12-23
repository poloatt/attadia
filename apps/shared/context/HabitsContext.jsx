import React, { createContext, useContext, useState, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import clienteAxios from '../config/axios';

// Crear el contexto
const HabitsContext = createContext();

/**
 * Hook personalizado para usar el contexto de hábitos
 */
export const useHabits = () => {
  const context = useContext(HabitsContext);
  if (!context) {
    throw new Error('useHabits debe usarse dentro de un HabitsProvider');
  }
  return context;
};

// Provider del contexto
export const HabitsProvider = ({ children }) => {
  const [habits, setHabits] = useState({
    bodyCare: [],
    nutricion: [],
    ejercicio: [],
    cleaning: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { enqueueSnackbar } = useSnackbar();

  /**
   * Obtener hábitos personalizados del usuario
   */
  const fetchHabits = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await clienteAxios.get('/api/users/habits');
      setHabits(response.data || {
        bodyCare: [],
        nutricion: [],
        ejercicio: [],
        cleaning: []
      });
      
      return response.data;
    } catch (error) {
      console.error('[HabitsContext] Error al obtener hábitos:', error);
      setError(error.response?.data?.error || 'Error al obtener hábitos');
      enqueueSnackbar('Error al cargar hábitos', { variant: 'error' });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  /**
   * Agregar nuevo hábito
   */
  const addHabit = useCallback(async (section, habit) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await clienteAxios.post('/api/users/habits', {
        section,
        habit
      });
      
      // Actualizar estado local
      setHabits(prev => ({
        ...prev,
        [section]: [...(prev[section] || []), response.data.habit]
      }));
      
      enqueueSnackbar('Hábito agregado correctamente', { variant: 'success' });
      return response.data.habit;
    } catch (error) {
      console.error('[HabitsContext] Error al agregar hábito:', error);
      const errorMsg = error.response?.data?.error || 'Error al agregar hábito';
      setError(errorMsg);
      enqueueSnackbar(errorMsg, { variant: 'error' });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  /**
   * Actualizar hábito existente
   */
  const updateHabit = useCallback(async (habitId, section, updates) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await clienteAxios.put(`/api/users/habits/${habitId}`, {
        section,
        habit: updates
      });
      
      // Actualizar estado local
      setHabits(prev => ({
        ...prev,
        [section]: (prev[section] || []).map(h => 
          h.id === habitId ? response.data.habit : h
        )
      }));
      
      enqueueSnackbar('Hábito actualizado correctamente', { variant: 'success' });
      return response.data.habit;
    } catch (error) {
      console.error('[HabitsContext] Error al actualizar hábito:', error);
      const errorMsg = error.response?.data?.error || 'Error al actualizar hábito';
      setError(errorMsg);
      enqueueSnackbar(errorMsg, { variant: 'error' });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  /**
   * Eliminar hábito
   */
  const deleteHabit = useCallback(async (habitId, section) => {
    try {
      setLoading(true);
      setError(null);
      
      await clienteAxios.delete(`/api/users/habits/${habitId}`, {
        data: { section }
      });
      
      // Actualizar estado local
      setHabits(prev => ({
        ...prev,
        [section]: (prev[section] || []).filter(h => h.id !== habitId)
      }));
      
      enqueueSnackbar('Hábito eliminado correctamente', { variant: 'success' });
    } catch (error) {
      console.error('[HabitsContext] Error al eliminar hábito:', error);
      const errorMsg = error.response?.data?.error || 'Error al eliminar hábito';
      setError(errorMsg);
      enqueueSnackbar(errorMsg, { variant: 'error' });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  /**
   * Reordenar hábitos en una sección
   */
  const reorderHabits = useCallback(async (section, habitIds) => {
    try {
      setLoading(true);
      setError(null);
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'HabitsContext.jsx:158',message:'reorderHabits called',data:{section,habitIds,habitIdsType:Array.isArray(habitIds),habitIdsLength:habitIds?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'reorder'})}).catch(()=>{});
      // #endregion
      
      const response = await clienteAxios.put('/api/users/habits/reorder', {
        section,
        habitIds
      });
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'HabitsContext.jsx:168',message:'reorderHabits success',data:{section,habitsCount:response.data.habits?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'reorder'})}).catch(()=>{});
      // #endregion
      
      // Actualizar estado local
      setHabits(prev => ({
        ...prev,
        [section]: response.data.habits
      }));
      
      enqueueSnackbar('Hábitos reordenados correctamente', { variant: 'success' });
      return response.data.habits;
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'HabitsContext.jsx:181',message:'reorderHabits error',data:{section,habitIds,errorMessage:error.message,errorResponse:error.response?.data,status:error.response?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'reorder'})}).catch(()=>{});
      // #endregion
      console.error('[HabitsContext] Error al reordenar hábitos:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Error al reordenar hábitos';
      const errorDetails = error.response?.data;
      console.error('[HabitsContext] Detalles del error:', errorDetails);
      setError(errorMsg);
      enqueueSnackbar(`${errorMsg}${errorDetails?.invalidIds ? ` (IDs inválidos: ${errorDetails.invalidIds.join(', ')})` : ''}`, { variant: 'error' });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  /**
   * Restablecer hábitos a defaults
   */
  const resetHabits = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await clienteAxios.post('/api/users/habits/reset');
      
      // Actualizar estado local
      setHabits(response.data.habits);
      
      enqueueSnackbar('Hábitos restablecidos a valores por defecto', { variant: 'success' });
      return response.data.habits;
    } catch (error) {
      console.error('[HabitsContext] Error al restablecer hábitos:', error);
      const errorMsg = error.response?.data?.error || 'Error al restablecer hábitos';
      setError(errorMsg);
      enqueueSnackbar(errorMsg, { variant: 'error' });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  const value = {
    habits,
    loading,
    error,
    fetchHabits,
    addHabit,
    updateHabit,
    deleteHabit,
    reorderHabits,
    resetHabits
  };

  return (
    <HabitsContext.Provider value={value}>
      {children}
    </HabitsContext.Provider>
  );
};

