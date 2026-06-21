import React, { useState, useEffect, useLayoutEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Box,
  Button,
  IconButton,
  CircularProgress,
  Chip,
  Typography,
} from '@mui/material';
import { useResponsive } from '@shared/hooks';
import {
  Add as AddIcon,
} from '@mui/icons-material';
import { Toolbar, SystemButtons } from '@shared/navigation';
import TareasTable from './TareasTable';
import { TareaForm, buildTareaPayload, syncTareaToGoogleInBackground } from '../form';
import GoogleTasksConfig from '../google/GoogleTasksConfig';
import { HabitsManagerHost } from '../../habits';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import { useNavigationBar } from '@shared/context';
import { useValuesVisibility } from '@shared/context';
import { usePageWithHistory } from '@shared/hooks';
import { useAgendaFilter } from '../../agenda/hooks/useAgendaFilter';
import { useObjetivosLight } from '../hooks/useObjetivosLight';
import { useTasksForList } from '../hooks/useTasksForList';
import { isInAhora, isInLuego, isTaskCompleted } from '@shared/utils/agendaRules';
import { useRutinas, useHabits } from '@shared/context';
import { getNormalizedToday } from '@shared/utils/dateUtils';
import { ensureRutinaForDate } from '../../habits/daily/ensureRutinaForDate';
import { HabitCarouselAhora, HabitCarouselLuego } from '../../habits';

export function TareasListPage() {
  const { fetchRutinas, getRutinaById } = useRutinas();
  const { fetchHabits } = useHabits();
  const { tasks: tareas, setTasks: setTareas, loading, refetch: refetchTareas } = useTasksForList();
  const { objetivos, refetch: refetchObjetivos } = useObjetivosLight();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTarea, setEditingTarea] = useState(null);
  const [isGoogleTasksConfigOpen, setIsGoogleTasksConfigOpen] = useState(false);
  const [selectedTareas, setSelectedTareas] = useState([]);
  const { enqueueSnackbar } = useSnackbar();
  const { isMobile } = useResponsive();
  const { setTitle, setActions } = useNavigationBar();
  const { showValues, toggleValuesVisibility } = useValuesVisibility();
  const navigate = useNavigate();

  // Filtrado unificado vía hook (para móvil)
  const { filteredTasks: tareasAgenda, showCompleted, agendaView } = useAgendaFilter(tareas);

  // Para desktop: filtrar tareas para AHORA y Luego por separado
  const tareasAhora = useMemo(() => {
    if (isMobile) return [];
    const tasksArray = Array.isArray(tareas) ? tareas : [];
    const now = new Date();
    return tasksArray.filter((t) => {
      const isCompleted = isTaskCompleted(t);
      if (!showCompleted && isCompleted) return false;
      return isInAhora(t, now);
    });
  }, [tareas, showCompleted, isMobile]);

  useEffect(() => {
    let cancelled = false;

    const bootRutinas = async () => {
      await Promise.all([
        typeof fetchHabits === 'function' ? fetchHabits().catch(() => {}) : Promise.resolve(),
        typeof fetchRutinas === 'function' ? fetchRutinas().catch(() => {}) : Promise.resolve(),
      ]);
      if (cancelled || typeof getRutinaById !== 'function') return;
      await ensureRutinaForDate(getNormalizedToday(), {
        rutinas: [],
        getRutinaById,
        fetchRutinas,
      }).catch(() => {});
    };

    bootRutinas();
    return () => { cancelled = true; };
  }, [fetchRutinas, fetchHabits, getRutinaById]);

  const habitCarouselSx = {
    flexShrink: 0,
    px: 1,
    py: 0.5,
    minHeight: 36,
  };

  const tareasLuego = useMemo(() => {
    if (isMobile) return [];
    const tasksArray = Array.isArray(tareas) ? tareas : [];
    const now = new Date();
    return tasksArray.filter((t) => {
      const isCompleted = isTaskCompleted(t);
      if (!showCompleted && isCompleted) return false;
      return isInLuego(t, now);
    });
  }, [tareas, showCompleted, isMobile]);

  // Funciones para selección múltiple
  const handleDeactivateMultiSelect = () => {
    setSelectedTareas([]);
    // Comunicar que no hay selecciones
    window.dispatchEvent(new CustomEvent('selectionChanged', { 
      detail: { hasSelections: false } 
    }));
  };

  const handleSelectTarea = (tareaId) => {
    setSelectedTareas(prev => {
      const newSelection = prev.includes(tareaId) 
        ? prev.filter(id => id !== tareaId)
        : [...prev, tareaId];
      
      // Comunicar el estado de selección al Toolbar
      window.dispatchEvent(new CustomEvent('selectionChanged', { 
        detail: { hasSelections: newSelection.length > 0 } 
      }));
      
      return newSelection;
    });
  };

  const handleSelectAll = () => {
    if (selectedTareas.length === tareas.length) {
      setSelectedTareas([]);
      // Comunicar que no hay selecciones
      window.dispatchEvent(new CustomEvent('selectionChanged', { 
        detail: { hasSelections: false } 
      }));
    } else {
      setSelectedTareas(tareas.map(tarea => tarea._id));
      // Comunicar que hay selecciones
      window.dispatchEvent(new CustomEvent('selectionChanged', { 
        detail: { hasSelections: true } 
      }));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedTareas.length === 0) return;
    
    try {
      // Eliminar todas las tareas seleccionadas usando el sistema de historial
      const results = await Promise.allSettled(
        selectedTareas.map(id => deleteWithHistory(id))
      );
      
      // Contar eliminaciones exitosas y fallidas
      const successful = results.filter(result => 
        result.status === 'fulfilled' && 
        (result.value?.success !== false)
      ).length;
      
      const failed = results.length - successful;
      
      // Mostrar mensaje apropiado
      if (successful > 0) {
        enqueueSnackbar(`${successful} tarea(s) eliminada(s) exitosamente`, { variant: 'success' });
      }
      
      if (failed > 0) {
        enqueueSnackbar(`${failed} tarea(s) ya fueron eliminadas`, { variant: 'warning' });
      }
      
      setSelectedTareas([]);
      
      // Comunicar que no hay selecciones
      window.dispatchEvent(new CustomEvent('selectionChanged', { 
        detail: { hasSelections: false } 
      }));
      
      // Recargar datos del servidor para mantener consistencia
      await fetchDataStable();
      
    } catch (error) {
      console.error('Error al eliminar tareas:', error);
      enqueueSnackbar('Error al eliminar las tareas', { variant: 'error' });
    }
  };

  useLayoutEffect(() => {
    setTitle('Agenda');
    
    // Solo mostrar iconos en desktop
    if (!isMobile) {
      const actions = [];
      
      // Botón "Nueva Tarea" siempre visible
      actions.push({
        component: (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingTarea(null);
              setIsFormOpen(true);
            }}
            sx={{ borderRadius: 0 }}
          >
            Nueva Tarea
          </Button>
        ),
        onClick: () => {}
      });
      
      // Si hay tareas seleccionadas, mostrar botones de selección múltiple
      if (selectedTareas.length > 0) {
        // Botón seleccionar todas/deseleccionar todas
        actions.push({
          component: (
            <Button
              variant="outlined"
              onClick={handleSelectAll}
              sx={{ borderRadius: 0 }}
            >
              {selectedTareas.length === tareas.length ? 'Deseleccionar Todas' : 'Seleccionar Todas'}
            </Button>
          ),
          onClick: handleSelectAll
        });
        
        // Botón de delete
        actions.push({
          component: (
            <SystemButtons.MultiSelectDeleteButton 
              onDelete={handleDeleteSelected}
              selectedCount={selectedTareas.length}
            />
          ),
          onClick: handleDeleteSelected
        });
        
        // Botón para limpiar selección
        actions.push({
          component: (
            <SystemButtons.MultiSelectCancelButton 
              onCancel={handleDeactivateMultiSelect}
            />
          ),
          onClick: handleDeactivateMultiSelect
        });
      }
      
      setActions(actions);
    } else {
      // En móvil, solo mostrar el botón "Nueva Tarea"
      setActions([
        {
          component: (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditingTarea(null);
                setIsFormOpen(true);
              }}
              sx={{ borderRadius: 0 }}
            >
              Nueva Tarea
            </Button>
          ),
          onClick: () => {}
        }
      ]);
    }
  }, [setTitle, setActions, isMobile, selectedTareas.length, tareas.length]);

  const fetchDataStable = useCallback(async () => {
    try {
      await Promise.all([refetchObjetivos(), refetchTareas()]);
    } catch (error) {
      console.error('Error al recargar datos:', error);
      enqueueSnackbar('Error al recargar datos', { variant: 'error' });
    }
  }, [refetchObjetivos, refetchTareas, enqueueSnackbar]);

  // Usar el sistema automático de historial
  const { 
    isSupported,
    createWithHistory, 
    updateWithHistory, 
    deleteWithHistory 
  } = usePageWithHistory(
    fetchDataStable,
    (error) => {
      console.error('Error al revertir acción:', error);
      enqueueSnackbar('Error al revertir la acción', { variant: 'error' });
    }
  );

  // Escuchar eventos del Header y navegación
  useEffect(() => {
    const handleHeaderAddButton = (event) => {
      if (event.detail.type === 'tarea') {
        setEditingTarea(null);
        setIsFormOpen(true);
      }
    };

    // Escuchar eventos de la navegación de Objetivos
    const handleAddTask = () => {
      setEditingTarea(null);
      setIsFormOpen(true);
    };

    // Escuchar eventos de deshacer específicos para tareas
    // Este handler se ejecuta después de que useAutoUndoHandler procesa el undo
    const handleUndoTareaAction = async (event) => {
      // El useAutoUndoHandler ya debería haber revertido la acción,
      // solo necesitamos recargar los datos para reflejar los cambios
      try {
        await fetchDataStable();
      } catch (error) {
        console.error('[TareasListPage] Error al recargar datos después del undo:', error);
      }
    };
    
    // También escuchar el evento undoAction directamente como fallback
    const handleUndoAction = async (event) => {
      const action = event.detail;
      // Solo procesar si es una acción de tarea
      if (action.entity === 'tarea') {
        // useAutoUndoHandler debería manejar esto, pero como fallback recargamos
        try {
      await fetchDataStable();
        } catch (error) {
          console.error('[TareasListPage] Error al recargar datos después del undo (fallback):', error);
        }
      }
    };

    const handleOpenGoogleTasksConfig = () => {
      setIsGoogleTasksConfigOpen(true);
    };

    // Manejar la sincronización completada de Google Tasks
    const handleGoogleTasksSyncCompleted = async (event) => {
      // Recargar tareas y objetivos después de la sincronización
      await fetchDataStable();
      
      // Mostrar notificación adicional
      const { results } = event.detail;
      if (results.fromGoogle?.created > 0 || results.fromGoogle?.updated > 0) {
        enqueueSnackbar(
          `Se han sincronizado ${results.fromGoogle.created + results.fromGoogle.updated} tareas desde Google Tasks`, 
          { variant: 'info' }
        );
      }
    };

    // Manejar eliminación de tareas seleccionadas desde el Toolbar
    const handleDeleteSelectedTasks = () => {
      handleDeleteSelected();
    };

    // Manejar seleccionar todas desde el Toolbar
    const handleSelectAllTasks = () => {
      handleSelectAll();
    };

    window.addEventListener('headerAddButtonClicked', handleHeaderAddButton);   
    window.addEventListener('addTask', handleAddTask);
    window.addEventListener('undoAction', handleUndoAction);
    window.addEventListener('undoAction_tarea', handleUndoTareaAction);
    window.addEventListener('openGoogleTasksConfig', handleOpenGoogleTasksConfig);
    window.addEventListener('googleTasksSyncCompleted', handleGoogleTasksSyncCompleted);
    window.addEventListener('deleteSelectedTasks', handleDeleteSelectedTasks);
    window.addEventListener('selectAllTasks', handleSelectAllTasks);

    return () => {
      window.removeEventListener('headerAddButtonClicked', handleHeaderAddButton);
      window.removeEventListener('addTask', handleAddTask);
      window.removeEventListener('undoAction', handleUndoAction);
      window.removeEventListener('undoAction_tarea', handleUndoTareaAction);    
      window.removeEventListener('openGoogleTasksConfig', handleOpenGoogleTasksConfig);
      window.removeEventListener('googleTasksSyncCompleted', handleGoogleTasksSyncCompleted);
      window.removeEventListener('deleteSelectedTasks', handleDeleteSelectedTasks);
      window.removeEventListener('selectAllTasks', handleSelectAllTasks);
    };
  }, [fetchDataStable, handleDeleteSelected]);

  const handleFormSubmit = async (formData) => {
    try {
      const datosAEnviar = buildTareaPayload(formData, { editingTarea, objetivos });
      let saved;

      if (editingTarea) {
        saved = await updateWithHistory(editingTarea._id, datosAEnviar, editingTarea);
        enqueueSnackbar('Tarea actualizada exitosamente', { variant: 'success' });
      } else {
        saved = await createWithHistory(datosAEnviar);
        enqueueSnackbar('Tarea creada exitosamente', { variant: 'success' });
      }

      syncTareaToGoogleInBackground(saved || datosAEnviar, {
        onSynced: () => enqueueSnackbar('Sincronizada con Google Tasks', { variant: 'info' }),
        onError: (syncErr) => {
          console.warn('Sync Google Tasks tras guardar:', syncErr);
          enqueueSnackbar(
            syncErr.response?.data?.error || 'Tarea guardada; no se pudo sincronizar con Google',
            { variant: 'warning' },
          );
        },
      });

      setIsFormOpen(false);
      setEditingTarea(null);
      await fetchDataStable();
    } catch (error) {
      console.error('Error al guardar tarea:', error.response?.data || error.message);
      enqueueSnackbar(
        error.response?.data?.error || 'Error al guardar la tarea',
        { variant: 'error' },
      );
    }
  };

  const handleEdit = useCallback((tarea) => {
    setEditingTarea(tarea);
    setIsFormOpen(true);
  }, []);

  const handleDelete = useCallback(async (id) => {
    try {
      // Usar la función con historial automático
      const result = await deleteWithHistory(id);
      
      // Si la tarea ya fue eliminada, mostrar mensaje apropiado
      if (result?.message === 'Ya eliminada') {
        enqueueSnackbar('La tarea ya fue eliminada', { variant: 'warning' });
        // Actualizar estado local removiendo la tarea
        setTareas(prevTareas => prevTareas.filter(tarea => tarea._id !== id));
      } else {
        enqueueSnackbar('Tarea eliminada exitosamente', { variant: 'success' });
        // Actualizar estado local removiendo la tarea
        setTareas(prevTareas => prevTareas.filter(tarea => tarea._id !== id));
      }
      
      // Los datos se recargan automáticamente después de la acción
    } catch (error) {
      console.error('Error al eliminar tarea:', error);
      enqueueSnackbar('Error al eliminar la tarea', { variant: 'error' });
    }
  }, [deleteWithHistory, enqueueSnackbar]);

  const handleUpdateEstado = (tareaActualizada) => {
    setTareas(prevTareas => 
      prevTareas.map(tarea => 
        tarea._id === tareaActualizada._id ? tareaActualizada : tarea
      )
    );
    if (editingTarea && editingTarea._id === tareaActualizada._id) {
      setEditingTarea(tareaActualizada);
    }
  };

  const handleBack = () => {
            navigate('/tiempo/rutinas');
  };

  return (
    <Box sx={{ px: { xs: 1, sm: 2, md: 3 }, width: '100%' }}>
      <Box sx={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Eliminar <Toolbar /> */}
        <Box 
          sx={{ 
            py: isMobile ? 1 : 2,
            px: isMobile ? 0 : 1,
            height: isMobile ? 'calc(100vh - 160px)' : 'calc(100vh - 170px)',
            overflowY: isMobile ? 'auto' : 'hidden',
            overflowX: 'hidden',
            pb: isMobile ? 8 : 12, // Padding bottom más extenso para mayor margen inferior
            '&::-webkit-scrollbar': {
              width: isMobile ? '4px' : '8px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'rgba(0,0,0,0.1)',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(0,0,0,0.2)',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              backgroundColor: 'rgba(0,0,0,0.3)',
            },
          }}
        >
          {/* El filtro de Agenda y el toggle de completadas viven en la Toolbar */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
              <CircularProgress />
            </Box>
          ) : isMobile ? (
            <>
              <Box sx={habitCarouselSx}>
                {agendaView === 'ahora' ? (
                  <HabitCarouselAhora variant="iconsRow" showDividers={false} />
                ) : (
                  <HabitCarouselLuego variant="iconsRow" showDividers={false} />
                )}
              </Box>
              <TareasTable
                tareas={tareasAgenda}
                agendaView={agendaView}
                showHabitCarousel={false}
              showCompleted={showCompleted}
              groupingEnabled={true}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onUpdateEstado={handleUpdateEstado}
              isArchive={false}
              showValues={showValues}
              updateWithHistory={updateWithHistory}
              isMultiSelectMode={selectedTareas.length > 0}
              selectedTareas={selectedTareas}
              onSelectTarea={handleSelectTarea}
              onActivateMultiSelect={() => {}} // Ya no necesitamos esta función
              onRefreshData={fetchDataStable}
              objetivos={objetivos}
            />
            </>
          ) : (
            // Vista desktop: dos columnas (AHORA y Luego)
            <Box sx={{ display: 'flex', gap: 2, height: '100%', overflow: 'hidden' }}>
              {/* Columna AHORA */}
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
                <Box sx={{ mb: 1, px: 1, flexShrink: 0, display: 'flex', justifyContent: 'flex-start' }}>
                  <Typography 
                    sx={{ 
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      textTransform: 'capitalize',
                      display: 'inline-block',
                      px: 1,
                      py: 0.5,
                      bgcolor: 'background.paper',
                      borderRadius: 1,
                      boxShadow: 1,
                      position: 'relative',
                      zIndex: 1
                    }}
                  >
                    Ahora
                  </Typography>
                </Box>
                <Box sx={habitCarouselSx}>
                  <HabitCarouselAhora variant="iconsRow" showDividers={false} />
                </Box>
                <Box 
                  sx={{ 
                    flex: 1, 
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    minHeight: 0,
                    pb: 10, // Padding bottom más extenso para mayor margen inferior
                    '&::-webkit-scrollbar': {
                      width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                      backgroundColor: 'rgba(0,0,0,0.1)',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: 'rgba(0,0,0,0.2)',
                      borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                      backgroundColor: 'rgba(0,0,0,0.3)',
                    },
                  }}
                >
                  <TareasTable
                    tareas={tareasAhora}
                    agendaView="ahora"
                    showHabitCarousel={false}
                    showCompleted={showCompleted}
                    groupingEnabled={true}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onUpdateEstado={handleUpdateEstado}
                    isArchive={false}
                    showValues={showValues}
                    updateWithHistory={updateWithHistory}
                    isMultiSelectMode={selectedTareas.length > 0}
                    selectedTareas={selectedTareas}
                    onSelectTarea={handleSelectTarea}
                    onActivateMultiSelect={() => {}}
                    onRefreshData={fetchDataStable}
                    objetivos={objetivos}
                  />
                </Box>
              </Box>

              {/* Divider vertical */}
              <Box
                sx={{
                  width: '1px',
                  bgcolor: 'divider',
                  flexShrink: 0
                }}
              />

              {/* Columna Luego */}
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
                <Box sx={{ mb: 1, px: 1, flexShrink: 0, display: 'flex', justifyContent: 'flex-start' }}>
                  <Typography 
                    sx={{ 
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      textTransform: 'capitalize',
                      display: 'inline-block',
                      px: 1,
                      py: 0.5,
                      bgcolor: 'background.paper',
                      borderRadius: 1,
                      boxShadow: 1,
                      position: 'relative',
                      zIndex: 1
                    }}
                  >
                    Luego
                  </Typography>
                </Box>
                <Box sx={habitCarouselSx}>
                  <HabitCarouselLuego variant="iconsRow" showDividers={false} />
                </Box>
                <Box 
                  sx={{ 
                    flex: 1, 
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    minHeight: 0,
                    pb: 10, // Padding bottom más extenso para mayor margen inferior
                    '&::-webkit-scrollbar': {
                      width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                      backgroundColor: 'rgba(0,0,0,0.1)',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: 'rgba(0,0,0,0.2)',
                      borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                      backgroundColor: 'rgba(0,0,0,0.3)',
                    },
                  }}
                >
                  <TareasTable
                    tareas={tareasLuego}
                    agendaView="luego"
                    showHabitCarousel={false}
                    showCompleted={showCompleted}
                    groupingEnabled={true}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onUpdateEstado={handleUpdateEstado}
                    isArchive={false}
                    showValues={showValues}
                    updateWithHistory={updateWithHistory}
                    isMultiSelectMode={selectedTareas.length > 0}
                    selectedTareas={selectedTareas}
                    onSelectTarea={handleSelectTarea}
                    onActivateMultiSelect={() => {}}
                    onRefreshData={fetchDataStable}
                    objetivos={objetivos}
                  />
                </Box>
              </Box>
            </Box>
          )}
        </Box>
        {isFormOpen && (
          <TareaForm
            open={isFormOpen}
            onClose={() => setIsFormOpen(false)}
            onSubmit={handleFormSubmit}
            isEditing={!!editingTarea}
            initialData={editingTarea}
            objetivos={objetivos}
            onObjetivosUpdate={refetchObjetivos}
            createWithHistory={createWithHistory}
            updateWithHistory={updateWithHistory}
            deleteWithHistory={deleteWithHistory}
          />
        )}
        
        {/* Modal de configuración de Google Tasks */}
        <HabitsManagerHost />
        <GoogleTasksConfig
          open={isGoogleTasksConfigOpen}
          onClose={() => setIsGoogleTasksConfigOpen(false)}
        />

        {/* Barra flotante minimalista para selección múltiple */}
        {selectedTareas.length > 0 && (
          <Box
            sx={{
              position: 'fixed',
              bottom: isMobile ? 100 : 20,
              left: '50%',
              transform: 'translateX(-50%)',
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: isMobile ? 3 : 2,
              px: isMobile ? 3 : 2,
              py: isMobile ? 1.5 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? 2 : 1,
              boxShadow: 3,
              zIndex: 1000,
              minWidth: isMobile ? 250 : 200,
              justifyContent: 'center',
              // En mobile, hacer la barra más grande y fácil de tocar
              ...(isMobile && {
                '& *': {
                  fontSize: '1rem !important'
                }
              })
            }}
          >
            <Chip
              label={`${selectedTareas.length} seleccionadas`}
              size={isMobile ? "medium" : "small"}
              color="primary"
              variant="outlined"
              sx={{
                fontSize: isMobile ? '0.9rem' : '0.75rem',
                height: isMobile ? 32 : 24
              }}
            />
            
            <IconButton
              size={isMobile ? "medium" : "small"}
              onClick={handleDeactivateMultiSelect}
              sx={{ 
                color: 'text.secondary',
                fontSize: isMobile ? '1.2rem' : '1rem',
                padding: isMobile ? 1 : 0.5,
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
            >
              ✕
            </IconButton>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default TareasListPage;