import React, { useEffect, useState, useRef } from 'react';
import { Container, Box, Typography, CircularProgress, Snackbar, Alert, Grid, Paper, Button } from '@mui/material';
import RutinaTable from '../components/rutinas/RutinaTable';
import { RutinasProvider, useRutinas } from '../components/rutinas/context/RutinasContext';
import { RutinaForm } from '../components/rutinas';
import { MemoizedRutinaNavigation as RutinaNavigation } from '../components/rutinas/RutinaNavigation';
import EntityToolbar from '../components/EntityToolbar';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  CalendarMonthOutlined as DateIcon,
  ScienceOutlined as LabIcon,
  RestaurantOutlined as DietaIcon,
  MonitorWeightOutlined as WeightIcon,
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
  const rutinasContext = useRutinas();
  const { 
    rutina, 
    rutinas, 
    loading, 
    error, 
    fetchRutinas, 
    getRutinaById,
    handlePrevious,
    handleNext,
    deleteRutina
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
  
  // Cargar todas las rutinas solo una vez al inicio
  useEffect(() => {
    if (!initialFetchDone.current) {
      console.log('[Rutinas] Cargando todas las rutinas (primera vez)');
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
        navigate('/rutinas');
      }
    }
  }, [rutinaId, rutinas, getRutinaById, navigate]);
  
  // Exponer el contexto de rutinas a nivel global para compatibilidad
  useEffect(() => {
    window.rutinasContext = rutinasContext;
    
    return () => {
      delete window.rutinasContext;
    };
  }, [rutinasContext]);

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
    <>
      {/* EntityToolbar para navegación y acciones */}
      <EntityToolbar
        entityName="rutina"
        icon={<DateIcon />}
        title="Rutinas"
        showAddButton={true}
        showBackButton={false}
        onAdd={handleAddRutina}
        navigationItems={[
          {
            icon: <LabIcon sx={{ fontSize: 21.6 }} />,
            label: 'Lab',
            to: '/lab'
          },
          {
            icon: <DietaIcon sx={{ fontSize: 21.6 }} />,
            label: 'Dieta',
            to: '/dieta'
          },
          {
            icon: <WeightIcon sx={{ fontSize: 21.6 }} />,
            label: 'Composición Corporal',
            to: '/datacorporal'
          }
        ]}
      />
      
      <Container maxWidth="lg" sx={{ mt: 0, mb: 4 }}>
        <Box sx={{ 
          position: 'relative', 
          maxHeight: 'calc(100vh - 190px)',
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
          },
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255, 255, 255, 0.1) transparent'
        }}>
          {/* Loader cuando se están cargando datos */}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          )}
          
          {/* Mensaje de estado vacío */}
          <EmptyStateMessage />
          
          {/* Vista principal de rutinas */}
          {!loading && !editMode && rutina && (
            <>
              <RutinaNavigation 
                rutina={rutina}
                loading={loading}
                currentPage={currentPage}
                totalPages={totalPages}
                onEdit={handleEditRutina}
                onAdd={handleAddRutina}
              />
              <RutinaTable 
                rutina={{
                  ...rutina,
                  _page: currentPage,
                  _totalPages: totalPages
                }}
                onEdit={handleEditRutina}
              />
            </>
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
      </Container>
    </>
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
