import React, { createContext, useContext, useState, useCallback, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import clienteAxios from '../config/axios';
import { resolveUndoScope } from '../config/undoScopeConfig';
import { useScopedActionHistory } from '../hooks/useScopedUndo';
import { ACTION_TYPES } from './ActionHistoryContext';
import { recordHabitCrudAction } from '../undo/undoRecordingUtils';

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
  const location = useLocation();
  const undoScope = resolveUndoScope(location.pathname);
  const undoRecorder = useScopedActionHistory(undoScope);

  const [habits, setHabits] = useState({
    bodyCare: [],
    nutricion: [],
    ejercicio: [],
    cleaning: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Deduplica llamadas concurrentes a fetchHabits (varios componentes la disparan al montar)
  const fetchHabitsInFlightRef = useRef(null);

  const { enqueueSnackbar } = useSnackbar();

  /**
   * Obtener hábitos personalizados del usuario
   */
  const fetchHabits = useCallback(async () => {
    if (fetchHabitsInFlightRef.current) {
      return fetchHabitsInFlightRef.current;
    }

    const run = (async () => {
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
        const isOffline =
          !error.response
          || error.message?.includes('conexión')
          || error.message?.includes('servidor');
        setError(error.response?.data?.error || error.message || 'Error al obtener hábitos');
        if (!isOffline) {
          enqueueSnackbar('Error al cargar hábitos', { variant: 'error' });
        }
        return null;
      } finally {
        setLoading(false);
      }
    })();

    fetchHabitsInFlightRef.current = run;
    try {
      return await run;
    } finally {
      fetchHabitsInFlightRef.current = null;
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
      if (undoScope === 'rutinas') {
        recordHabitCrudAction(undoRecorder, ACTION_TYPES.CREATE, response.data.habit, null, section);
      }
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
  }, [enqueueSnackbar, undoScope, undoRecorder]);

  /**
   * Actualizar hábito existente
   */
  const updateHabit = useCallback(async (habitId, section, updates) => {
    try {
      setLoading(true);
      setError(null);

      const originalHabit = (habits[section] || []).find((h) => h.id === habitId);
      
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
      if (undoScope === 'rutinas' && originalHabit) {
        recordHabitCrudAction(
          undoRecorder,
          ACTION_TYPES.UPDATE,
          response.data.habit,
          originalHabit,
          section,
        );
      }
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
  }, [enqueueSnackbar, undoScope, undoRecorder, habits]);

  /**
   * Eliminar hábito
   */
  const deleteHabit = useCallback(async (habitId, section) => {
    try {
      setLoading(true);
      setError(null);

      const originalHabit = (habits[section] || []).find((h) => h.id === habitId);
      
      await clienteAxios.delete(`/api/users/habits/${habitId}`, {
        data: { section }
      });
      
      // Actualizar estado local
      setHabits(prev => ({
        ...prev,
        [section]: (prev[section] || []).filter(h => h.id !== habitId)
      }));
      
      enqueueSnackbar('Hábito eliminado correctamente', { variant: 'success' });
      if (undoScope === 'rutinas' && originalHabit) {
        recordHabitCrudAction(undoRecorder, ACTION_TYPES.DELETE, null, originalHabit, section);
      }
    } catch (error) {
      console.error('[HabitsContext] Error al eliminar hábito:', error);
      const errorMsg = error.response?.data?.error || 'Error al eliminar hábito';
      setError(errorMsg);
      enqueueSnackbar(errorMsg, { variant: 'error' });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar, undoScope, undoRecorder, habits]);

  /**
   * Reordenar hábitos en una sección
   */
  const reorderHabits = useCallback(async (section, habitIds) => {
    try {
      setLoading(true);
      setError(null);

      const response = await clienteAxios.put('/api/users/habits/reorder', {
        section,
        habitIds
      });

      setHabits(prev => ({
        ...prev,
        [section]: response.data.habits
      }));
      
      enqueueSnackbar('Hábitos reordenados correctamente', { variant: 'success' });
      return response.data.habits;
    } catch (error) {
      // #region agent log
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

  const value = useMemo(() => ({
    habits,
    loading,
    error,
    fetchHabits,
    addHabit,
    updateHabit,
    deleteHabit,
    reorderHabits,
  }), [habits, loading, error, fetchHabits, addHabit, updateHabit, deleteHabit, reorderHabits]);

  return (
    <HabitsContext.Provider value={value}>
      {children}
    </HabitsContext.Provider>
  );
};

