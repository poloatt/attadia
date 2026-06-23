import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useResponsive, useScopedPageHistory } from '@shared/hooks';
import { useRutinas, useHabits } from '@shared/context';
import { getMainBottomPadding } from '@shared/config/uiConstants';
import {
  getRutinaCompletionStats,
  getRutinaDayMode,
  isRutinaHistorical,
  isRutinaToday,
  resolveRutinaNavigateTarget,
} from '@shared/utils/rutinasPageUtils';

/**
 * Estado, eventos toolbar y helpers compartidos para la página Rutinas.
 */
export function useRutinasPageController() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { isMobile } = useResponsive();
  const {
    rutina,
    rutinas,
    loading,
    error,
    fetchRutinas,
    getRutinaById,
    markItemComplete,
    patchRutinaSection,
    updateItemConfiguration,
  } = useRutinas();
  const { habits, fetchHabits } = useHabits();

  const fetchRutinasStable = useCallback(async () => {
    await Promise.all([
      fetchRutinas(true).catch(() => {}),
      fetchHabits().catch(() => {}),
    ]);
  }, [fetchRutinas, fetchHabits]);

  const undoDeps = useMemo(() => ({
    markItemComplete,
    patchRutinaSection,
    updateItemConfiguration,
  }), [markItemComplete, patchRutinaSection, updateItemConfiguration]);

  useScopedPageHistory(
    fetchRutinasStable,
    (err) => {
      console.error('Error al revertir acción en rutinas:', err);
      enqueueSnackbar('Error al revertir la acción', { variant: 'error' });
    },
    { scope: 'rutinas', deps: undoDeps },
  );

  const [editMode, setEditMode] = useState(false);
  const [rutinaToEdit, setRutinaToEdit] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [habitsManagerOpen, setHabitsManagerOpen] = useState(false);
  const initialFetchDone = useRef(false);

  useEffect(() => {
    if (rutina?._id && rutinas.length > 0) {
      const index = rutinas.findIndex((r) => r._id === rutina._id);
      if (index !== -1) {
        setCurrentPage(index + 1);
        setTotalPages(rutinas.length);
      }
    }
  }, [rutina?._id, rutinas.length]);

  useEffect(() => {
    if (!initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchRutinas().catch(() => {});
      fetchHabits().catch(() => {});
    }
  }, [fetchRutinas, fetchHabits]);

  const handleAddRutina = useCallback(() => {
    setRutinaToEdit(null);
    setEditMode(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setEditMode(false);
    setRutinaToEdit(null);
  }, []);

  const handleEditRutina = useCallback(() => {
    if (!rutina) return;
    setRutinaToEdit(rutina);
    setEditMode(true);
  }, [rutina]);

  const handleNavigateEvent = useCallback(async (event) => {
    const { direction, date } = event.detail || {};
    const target = resolveRutinaNavigateTarget({
      direction,
      date,
      rutinas,
      activeRutinaId: rutina?._id,
    });

    if (target.type === 'noop') return;

    try {
      if (target.type === 'select') {
        await getRutinaById(target.rutinaId);
      } else if (target.type === 'create') {
        setRutinaToEdit(null);
        setEditMode(true);
      }
      if (direction === 'today') {
        navigate('/rutinas', { replace: false });
      }
    } catch {
      // navegación silenciosa
    }
  }, [getRutinaById, navigate, rutina?._id, rutinas]);

  useEffect(() => {
    const onAddRutina = () => handleAddRutina();
    const onOpenHabitsManager = () => setHabitsManagerOpen(true);
    const onEditRutina = () => handleEditRutina();

    window.addEventListener('addRutina', onAddRutina);
    window.addEventListener('openHabitTemplates', onOpenHabitsManager);
    window.addEventListener('editRutina', onEditRutina);
    window.addEventListener('navigate', handleNavigateEvent);

    return () => {
      window.removeEventListener('addRutina', onAddRutina);
      window.removeEventListener('openHabitTemplates', onOpenHabitsManager);
      window.removeEventListener('editRutina', onEditRutina);
      window.removeEventListener('navigate', handleNavigateEvent);
    };
  }, [handleAddRutina, handleEditRutina, handleNavigateEvent]);

  const completionStats = useMemo(
    () => getRutinaCompletionStats(rutina, habits),
    [rutina, habits],
  );

  const dayMode = useMemo(
    () => getRutinaDayMode(rutina?.fecha),
    [rutina?.fecha],
  );

  const scrollBottomPadding = getMainBottomPadding(isMobile);

  return {
    rutina,
    rutinas,
    loading,
    error,
    editMode,
    rutinaToEdit,
    currentPage,
    totalPages,
    habitsManagerOpen,
    setHabitsManagerOpen,
    handleAddRutina,
    handleCloseForm,
    handleEditRutina,
    completionStats,
    dayMode,
    isToday: isRutinaToday(rutina?.fecha),
    isHistorical: isRutinaHistorical(rutina?.fecha),
    isMobile,
    scrollBottomPadding,
  };
}
