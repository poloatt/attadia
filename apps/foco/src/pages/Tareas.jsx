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
import TareasTable from '../proyectos/TareasTable';
import TareaForm from '../proyectos/TareaForm';
import GoogleTasksConfig from '../proyectos/GoogleTasksConfig';
import clienteAxios from '@shared/config/axios';
import { useSnackbar } from 'notistack';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNavigationBar } from '@shared/context';
import { useValuesVisibility } from '@shared/context';
import { usePageWithHistory } from '@shared/hooks';
import { useAgendaFilter } from '../proyectos/useAgendaFilter';
import { isInAhora, isInLuego, isTaskCompleted } from '@shared/utils';

export function Tareas() {
  const [tareas, setTareas] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTarea, setEditingTarea] = useState(null);
  const [isGoogleTasksConfigOpen, setIsGoogleTasksConfigOpen] = useState(false);
  const [selectedTareas, setSelectedTareas] = useState([]);
  const { enqueueSnackbar } = useSnackbar();
  const { isMobile } = useResponsive();
  const location = useLocation();
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
      await fetchTareas();
      await fetchProyectos();
      
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

  const fetchProyectosRef = useRef(null);
  const fetchProyectos = useCallback(async () => {
    // Cancelar llamada anterior si existe
    if (fetchProyectosRef.current) {
      clearTimeout(fetchProyectosRef.current);
    }
    
    return new Promise((resolve, reject) => {
      fetchProyectosRef.current = setTimeout(async () => {
        try {
          // Obtener proyectos con sus tareas incluidas
          const response = await clienteAxios.get(`/api/proyectos?populate=tareas&_t=${Date.now()}`);
          setProyectos(response.data.docs || []);
          resolve(response.data);
        } catch (error) {
          console.error('Error:', error);
          enqueueSnackbar('Error al cargar proyectos', { variant: 'error' });
          setProyectos([]);
          reject(error);
        }
      }, 100); // Debounce de 100ms
    });
  }, [enqueueSnackbar]);

  const fetchTareasRef = useRef(null);
  const fetchTareas = useCallback(async () => {
    // Cancelar llamada anterior si existe
    if (fetchTareasRef.current) {
      clearTimeout(fetchTareasRef.current);
    }

    return new Promise((resolve, reject) => {
      fetchTareasRef.current = setTimeout(async () => {
        try {
          // Agregar timestamp para evitar cache y pedir gran cantidad por página
          const ts = Date.now();
          const first = await clienteAxios.get(`/api/tareas?limit=1000&sort=fechaInicio&_t=${ts}`);
          let allDocs = first.data.docs || [];
          const totalPages = first.data.totalPages || 1;

          // Si hay más páginas, traerlas y concatenar
          if (totalPages > 1) {
            for (let p = 2; p <= totalPages; p++) {
              const resp = await clienteAxios.get(`/api/tareas?page=${p}&limit=1000&sort=fechaInicio&_t=${ts}`);
              allDocs = allDocs.concat(resp.data.docs || []);
            }
          }

          setTareas(allDocs);
          setLoading(false);
          resolve({ docs: allDocs, totalPages });
        } catch (error) {
          console.error('Error:', error);
          enqueueSnackbar('Error al cargar tareas', { variant: 'error' });  
          setTareas([]);
          setLoading(false);
          reject(error);
        }
      }, 100); // Debounce de 100ms
    });
  }, [enqueueSnackbar]);

  // Función estable para el historial
  const fetchDataStable = useCallback(async () => {
    try {
      await fetchProyectos();
      await fetchTareas();
    } catch (error) {
      console.error('Error al recargar datos:', error);
      enqueueSnackbar('Error al recargar datos', { variant: 'error' });
    }
  }, [fetchProyectos, fetchTareas, enqueueSnackbar]);

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

  useEffect(() => {
    fetchTareas();
    fetchProyectos();
  }, []);

  // Escuchar eventos del Header y navegación
  useEffect(() => {
    const handleHeaderAddButton = (event) => {
      if (event.detail.type === 'tarea') {
        setEditingTarea(null);
        setIsFormOpen(true);
      }
    };

    // Escuchar eventos de la navegación de proyectos
    const handleAddTask = () => {
      setEditingTarea(null);
      setIsFormOpen(true);
    };

    // Escuchar eventos de deshacer específicos para tareas
    // Este handler se ejecuta después de que useAutoUndoHandler procesa el undo
    const handleUndoTareaAction = async (event) => {
      const action = event.detail;
      console.log('🔄 Undo de tarea detectado en página de Tareas:', action);
      // El useAutoUndoHandler ya debería haber revertido la acción,
      // solo necesitamos recargar los datos para reflejar los cambios
      try {
        await fetchTareas();
        await fetchProyectos();
        console.log('✅ Datos recargados después del undo');
      } catch (error) {
        console.error('❌ Error al recargar datos después del undo:', error);
      }
    };
    
    // También escuchar el evento undoAction directamente como fallback
    const handleUndoAction = async (event) => {
      const action = event.detail;
      // Solo procesar si es una acción de tarea
      if (action.entity === 'tarea') {
        console.log('🔄 UndoAction directo detectado para tarea:', action);
        // useAutoUndoHandler debería manejar esto, pero como fallback recargamos
        try {
          await fetchTareas();
          await fetchProyectos();
        } catch (error) {
          console.error('❌ Error al recargar datos después del undo (fallback):', error);
        }
      }
    };

    const handleOpenGoogleTasksConfig = () => {
      setIsGoogleTasksConfigOpen(true);
    };

    // Manejar la sincronización completada de Google Tasks
    const handleGoogleTasksSyncCompleted = async (event) => {
      console.log('🔄 Sincronización de Google Tasks completada, recargando tareas...', event.detail);
      
      // Recargar tareas y proyectos después de la sincronización
      await fetchTareas();
      await fetchProyectos();
      
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
  }, [fetchTareas, fetchProyectos, handleDeleteSelected]);

  const handleFormSubmit = async (formData) => {
    try {
      // Función helper para convertir fecha a ISO string de forma segura
      const toISOString = (dateValue, fallback = null) => {
        if (!dateValue) return fallback;
        try {
          // Si ya es un string ISO válido, verificar que sea válido
          if (typeof dateValue === 'string') {
            const date = new Date(dateValue);
            if (!isNaN(date.getTime())) {
              return date.toISOString();
            }
          }
          // Si es un objeto Date
          if (dateValue instanceof Date) {
            if (!isNaN(dateValue.getTime())) {
              return dateValue.toISOString();
            }
          }
          return fallback;
        } catch (e) {
          return fallback;
        }
      };
      
      // Asegurar que fechaInicio siempre esté presente y sea válida (requerida para filtros de agenda)
      const fechaInicio = toISOString(
        formData.fechaInicio, 
        editingTarea?.fechaInicio 
          ? toISOString(editingTarea.fechaInicio, new Date().toISOString())
          : new Date().toISOString()
      );
      
      // Preservar fechaVencimiento si existe
      const fechaVencimiento = toISOString(
        formData.fechaVencimiento,
        editingTarea?.fechaVencimiento ? toISOString(editingTarea.fechaVencimiento, null) : null
      );
      
      // Preservar fechaFin si existe
      const fechaFin = toISOString(
        formData.fechaFin,
        editingTarea?.fechaFin ? toISOString(editingTarea.fechaFin, null) : null
      );
      
      // Calcular completada correctamente basándose en estado y subtareas
      const subtareas = formData.subtareas || [];
      let completadaCalculada = false;
      
      // Si hay subtareas, calcular basándose en ellas
      if (subtareas.length > 0) {
        const todasCompletadas = subtareas.every(st => st.completada);
        completadaCalculada = todasCompletadas;
      } else {
        // Si no hay subtareas, basarse en el estado
        const estado = formData.estado || editingTarea?.estado || 'PENDIENTE';
        completadaCalculada = estado === 'COMPLETADA';
      }
      
      // Usar el valor calculado o el explícito del formulario
      const completada = formData.completada !== undefined 
        ? formData.completada 
        : (editingTarea?.completada !== undefined 
          ? editingTarea.completada 
          : completadaCalculada);
      
      // Construir objeto preservando todos los campos de la tarea original
      // Esto asegura que campos como googleTasksSync, usuario, etc. no se pierdan
      const datosAEnviar = {
        // Campos del formulario (siempre presentes)
        titulo: formData.titulo,
        descripcion: formData.descripcion || '',
        estado: formData.estado || 'PENDIENTE',
        fechaInicio: fechaInicio,
        fechaVencimiento: fechaVencimiento,
        fechaFin: fechaFin,
        prioridad: formData.prioridad || 'BAJA',
        proyecto: formData.proyecto?._id || formData.proyecto || null,
        completada: completada,
        subtareas: subtareas,
        archivos: formData.archivos || [],
        // Preservar campos que no están en el formulario pero son importantes
        ...(editingTarea && {
          usuario: editingTarea.usuario,
          googleTasksSync: editingTarea.googleTasksSync,
          orden: editingTarea.orden,
          pushCount: editingTarea.pushCount
        })
      };
      
      console.log('📝 Datos a enviar al actualizar:', { 
        ...datosAEnviar, 
        subtareas: `[${datosAEnviar.subtareas.length} subtareas]`,
        fechaInicio,
        fechaVencimiento,
        fechaFin
      });

      if (editingTarea) {
        // Usar la función con historial automático
        await updateWithHistory(editingTarea._id, datosAEnviar, editingTarea);
        enqueueSnackbar('Tarea actualizada exitosamente', { variant: 'success' });
      } else {
        // Usar la función con historial automático
        await createWithHistory(datosAEnviar);
        enqueueSnackbar('Tarea creada exitosamente', { variant: 'success' });
      }

      setIsFormOpen(false);
      setEditingTarea(null);
      
      // Recargar datos del servidor para mantener consistencia
      await fetchTareas();
      await fetchProyectos();
    } catch (error) {
      console.error('Error al guardar tarea:', error.response?.data || error.message);
      enqueueSnackbar(
        error.response?.data?.error || 'Error al guardar la tarea', 
        { variant: 'error' }
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
            height: isMobile ? 'calc(100vh - 180px)' : 'calc(100vh - 190px)',
            overflowY: isMobile ? 'auto' : 'hidden',
            overflowX: 'hidden',
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
            // Vista móvil: una columna según agendaView
            <TareasTable
              tareas={tareasAgenda}
              agendaView={agendaView}
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
            />
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
                <Box 
                  sx={{ 
                    flex: 1, 
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    minHeight: 0,
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
                <Box 
                  sx={{ 
                    flex: 1, 
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    minHeight: 0,
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
            proyectos={proyectos}
            onProyectosUpdate={fetchProyectos}
            createWithHistory={createWithHistory}
            updateWithHistory={updateWithHistory}
            deleteWithHistory={deleteWithHistory}
          />
        )}
        
        {/* Modal de configuración de Google Tasks */}
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

export default Tareas;