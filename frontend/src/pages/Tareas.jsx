import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container,
  Box,
  Button,
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  FilterList as FilterListIcon,
  TaskOutlined as TaskIcon,
  FolderOutlined as ProjectIcon,
  ArchiveOutlined as ArchiveIcon,
  Visibility as ShowValuesIcon,
  VisibilityOff as HideValuesIcon,
  AccessTimeOutlined as TimeIcon,
} from '@mui/icons-material';
import { Toolbar } from '../navigation';
import TareasTable from '../components/proyectos/TareasTable';
import TareaForm from '../components/proyectos/TareaForm';
import clienteAxios from '../config/axios';
import { useSnackbar } from 'notistack';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNavigationBar } from '../context/NavigationBarContext';
import { useValuesVisibility } from '../context/ValuesVisibilityContext';
import { usePageWithHistory } from '../hooks/useGlobalActionHistory';

export function Tareas() {
  const [tareas, setTareas] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTarea, setEditingTarea] = useState(null);
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const location = useLocation();
  const { setTitle, setActions } = useNavigationBar();
  const { showValues, toggleValuesVisibility } = useValuesVisibility();
  const navigate = useNavigate();

  // Usar el sistema automático de historial
  const { 
    isSupported,
    createWithHistory, 
    updateWithHistory, 
    deleteWithHistory 
  } = usePageWithHistory(
    // Función para recargar datos
    async () => {
      await fetchProyectos();
      await fetchTareas();
    },
    // Función para manejar errores
    (error) => {
      console.error('Error al revertir acción:', error);
      enqueueSnackbar('Error al revertir la acción', { variant: 'error' });
    }
  );

  useEffect(() => {
    setTitle('Tareas');
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
  }, [setTitle, setActions]);

  const fetchProyectos = useCallback(async () => {
    try {
      // Obtener proyectos con sus tareas incluidas
      const response = await clienteAxios.get(`/api/proyectos?populate=tareas&_t=${Date.now()}`);
      console.log('Proyectos con tareas:', response.data);
      setProyectos(response.data.docs || []);
    } catch (error) {
      console.error('Error:', error);
      enqueueSnackbar('Error al cargar proyectos', { variant: 'error' });
      setProyectos([]);
    }
  }, [enqueueSnackbar]);

  const fetchTareas = useCallback(async () => {
    try {
      // Agregar timestamp para evitar cache
      const response = await clienteAxios.get(`/api/tareas?_t=${Date.now()}`);
      setTareas(response.data.docs || []);
    } catch (error) {
      console.error('Error:', error);
      enqueueSnackbar('Error al cargar tareas', { variant: 'error' });
      setTareas([]);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchTareas();
    fetchProyectos();
  }, [fetchTareas, fetchProyectos]);

  // Escuchar eventos del Header
  useEffect(() => {
    const handleHeaderAddButton = (event) => {
      if (event.detail.type === 'tarea') {
        setEditingTarea(null);
        setIsFormOpen(true);
      }
    };

    // Escuchar eventos de deshacer específicos para tareas
    const handleUndoTareaAction = (event) => {
      const action = event.detail;
      console.log('Undo de tarea detectado en página de Tareas:', action);
      // Refrescar tareas después del undo
      setTimeout(() => {
        fetchTareas();
        fetchProyectos();
      }, 500);
    };

    window.addEventListener('headerAddButtonClicked', handleHeaderAddButton);
    window.addEventListener('undoAction_tarea', handleUndoTareaAction);
    
    return () => {
      window.removeEventListener('headerAddButtonClicked', handleHeaderAddButton);
      window.removeEventListener('undoAction_tarea', handleUndoTareaAction);
    };
  }, [fetchTareas, fetchProyectos]);

  const handleFormSubmit = async (formData) => {
    try {
      const datosAEnviar = {
        ...formData,
        proyecto: formData.proyecto?._id || formData.proyecto
      };

      console.log('📝 Datos a enviar:', datosAEnviar);

      if (editingTarea) {
        console.log('🔄 Actualizando tarea:', editingTarea._id);
        
        // Usar la función con historial automático
        const updatedTarea = await updateWithHistory(editingTarea._id, datosAEnviar, editingTarea);
        
        console.log('✅ Tarea actualizada recibida:', updatedTarea);
        
        // Actualizar estado local inmediatamente
        setTareas(prevTareas => 
          prevTareas.map(tarea => 
            tarea._id === editingTarea._id ? updatedTarea : tarea
          )
        );
        
        enqueueSnackbar('Tarea actualizada exitosamente', { variant: 'success' });
      } else {
        console.log('➕ Creando nueva tarea');
        
        // Usar la función con historial automático
        const newTarea = await createWithHistory(datosAEnviar);
        
        console.log('✅ Nueva tarea creada:', newTarea);
        
        // Agregar la nueva tarea al estado local
        setTareas(prevTareas => [newTarea, ...prevTareas]);
        
        enqueueSnackbar('Tarea creada exitosamente', { variant: 'success' });
      }

      setIsFormOpen(false);
      setEditingTarea(null);
      
      // Recargar datos después de un breve delay para asegurar sincronización
      setTimeout(() => {
        console.log('🔄 Recargando datos...');
        fetchTareas();
        fetchProyectos();
      }, 500);
    } catch (error) {
      console.error('❌ Error completo:', error);
      console.error('❌ Detalles del error:', error.response?.data);
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
      await deleteWithHistory(id);
      enqueueSnackbar('Tarea eliminada exitosamente', { variant: 'success' });
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
    navigate('/tiempo');
  };

  return (
    <Box sx={{ px: { xs: 1, sm: 2, md: 3 }, width: '100%' }}>
      <Box sx={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Toolbar />
        <Box 
          sx={{ 
            py: isMobile ? 1 : 2,
            px: isMobile ? 0 : 1,
            height: isMobile ? 'calc(100vh - 180px)' : 'calc(100vh - 190px)',
            overflowY: 'auto',
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
          <TareasTable
            tareas={tareas}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onUpdateEstado={handleUpdateEstado}
            isArchive={false}
            showValues={showValues}
            updateWithHistory={updateWithHistory}
            updateTareaWithHistory={updateWithHistory}
          />
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
      </Box>
    </Box>
  );
}

export default Tareas;