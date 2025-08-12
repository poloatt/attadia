import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, CircularProgress, Paper, Button } from '@mui/material';
import useResponsive from '../hooks/useResponsive';
import RutinaTable from '../components/rutinas/RutinaTable';
import { RutinaForm } from '../components/rutinas/RutinaForm';

import { RutinasProvider, useRutinas } from '../context/RutinasContext';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  CalendarMonthOutlined as DateIcon,
  Info as InfoIcon,
  Add as AddIcon
} from '@mui/icons-material';

/**
 * Componente envoltorio que expone el contexto de rutinas
 */
const RutinasWithContext = () => {
  const params = useParams();
  const rutinaId = params.id;
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const rutinasContext = useRutinas();
  const { 
    rutina, 
    rutinas, 
    loading, 
    error, 
    fetchRutinas, 
    getRutinaById
  } = rutinasContext;
  const [editMode, setEditMode] = useState(false);
  const [rutinaToEdit, setRutinaToEdit] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const initialFetchDone = useRef(false);
  
  // Actualizar la página actual cuando cambia la rutina
  useEffect(() => {
    if (rutina) {
      const index = rutinas.findIndex(r => r._id === rutina._id);
      if (index !== -1) {
        setCurrentPage(index + 1);
        setTotalPages(rutinas.length);
      }
    }
  }, [rutina, rutinas]);
  
  // Cargar todas las rutinas solo cuando se accede a la página
  useEffect(() => {
    if (!initialFetchDone.current) {
      console.log('[Rutinas] Página de rutinas accedida, cargando datos');
      initialFetchDone.current = true;
      fetchRutinas();
    }
  }, [fetchRutinas]);
  
  // Cargar rutina específica si hay un ID en los parámetros
  useEffect(() => {
    if (rutinaId && rutinas.length > 0) {
      console.log(`[Rutinas] Intentando cargar rutina específica con ID: ${rutinaId}`);
      const rutina = rutinas.find(r => r._id === rutinaId);
      
      if (rutina) {
        console.log(`[Rutinas] Rutina encontrada, cargando detalles`);
        getRutinaById(rutinaId);
      } else {
        console.log(`[Rutinas] Rutina con ID ${rutinaId} no encontrada, redireccionando`);
        navigate('/tiempo/rutinas');
      }
    }
  }, [rutinaId, rutinas, getRutinaById, navigate]);
  
  // Handler para crear nueva rutina
  const handleAddRutina = () => {
    setRutinaToEdit(null);
    setEditMode(true);
  };

  // Handler para editar rutina existente
  const handleEditRutina = (rutina) => {
    setRutinaToEdit(rutina);
    setEditMode(true);
  };

  // Exponer el contexto de rutinas a nivel global para compatibilidad
  useEffect(() => {
    window.rutinasContext = rutinasContext;
    
    return () => {
      delete window.rutinasContext;
    };
  }, [rutinasContext]);

  // Event listeners para manejar acciones desde la navegación específica
  useEffect(() => {
    const handleEditRutinaEvent = (event) => {
      const { rutina } = event.detail;
      handleEditRutina(rutina);
    };

    const handleAddRutinaEvent = () => {
      handleAddRutina();
    };

    window.addEventListener('editRutina', handleEditRutinaEvent);
    window.addEventListener('addRutina', handleAddRutinaEvent);

    return () => {
      window.removeEventListener('editRutina', handleEditRutinaEvent);
      window.removeEventListener('addRutina', handleAddRutinaEvent);
    };
  }, [handleEditRutina, handleAddRutina]);

  // Handler para cerrar el formulario
  const handleCloseForm = () => {
    setEditMode(false);
    setRutinaToEdit(null);
  };

  // Esta parte del código es nueva o modificada
  const EmptyStateMessage = () => {
    if (loading) return null;
    
    if (error) {
      return (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2,
            backgroundColor: 'error.light',
            color: 'error.contrastText',
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <InfoIcon color="error" />
          <Typography variant="body2">{error}</Typography>
        </Paper>
      );
    }
    
    if (!rutina) {
      return (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2,
            bgcolor: 'background.paper',
            borderRadius: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
            textAlign: 'center'
          }}
        >
          <DateIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.7 }} />
          <Typography variant="h6">No hay rutinas disponibles</Typography>
          <Typography variant="body2" color="text.secondary">
            Puedes crear una nueva rutina usando el botón de agregar.
          </Typography>
          <Box mt={2}>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddIcon />}
              onClick={handleAddRutina}
            >
              Crear Rutina
            </Button>
          </Box>
        </Paper>
      );
    }
    
    return null;
  };

  return (
    <Box component="main" className="page-main-content" sx={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ 
        width: '100%', 
        maxWidth: 900,
        mx: 'auto',
        px: { xs: 1, sm: 2, md: 3 },
        py: 0,
        pb: { xs: 10, sm: 4 },
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: 0
      }}>
        <Box 
          sx={{ 
            py: isMobile ? 1 : 2,
            px: { xs: 1, sm: 2, md: 3 },
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
          {/* Loader cuando se están cargando datos */}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          )}
          {/* Mensaje de estado vacío */}
          {!loading && !rutina && <EmptyStateMessage />}
          {/* Vista principal de rutinas */}
          {!loading && !editMode && rutina && (
            <RutinaTable 
              rutina={{
                ...rutina,
                _page: currentPage,
                _totalPages: totalPages
              }}
              onEdit={handleEditRutina}
            />
          )}
          {/* Formulario de edición */}
          {editMode && (
            <RutinaForm 
              open={true}
              onClose={handleCloseForm}
              initialData={rutinaToEdit}
              isEditing={!!rutinaToEdit}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
};

/**
 * Componente principal que provee el contexto
 */
const Rutinas = () => {
  return (
    <RutinasProvider>
      <RutinasWithContext />
    </RutinasProvider>
  );
};

export default Rutinas;
