import React, { useEffect, useState, useRef } from 'react';
import { Container, Box, Typography, CircularProgress, Snackbar, Alert, Grid } from '@mui/material';
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
  HealthAndSafety as HealthIcon
} from '@mui/icons-material';
import { FooterNavigation } from '../navigation/navigationbar';

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

  return (
    <>
      {/* EntityToolbar para navegación y acciones */}
      <EntityToolbar
        entityName="rutina"
        icon={<DateIcon />}
        title="Rutinas"
        showAddButton={false}
        navigationItems={[
          {
            icon: <LabIcon sx={{ fontSize: 21.6 }} />,
            label: 'Lab',
            to: '/lab'
          },
          {
            icon: <HealthIcon sx={{ fontSize: 21.6 }} />,
            label: 'Salud',
            to: '/salud'
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
      
      <Container maxWidth="lg" sx={{ 
        mt: 0, 
        mb: 4,
        pb: '104px', // Ajustado para el footer elevado (80px + 24px)
        minHeight: 'calc(100vh - 104px)' // Ajustado para considerar el nuevo espacio del footer
      }}>
        <Box sx={{ 
          position: 'relative', 
          maxHeight: 'calc(100vh - 180px)', 
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
          
          {/* Mensajes de error */}
          {error && (
            <Snackbar open={!!error} autoHideDuration={6000}>
              <Alert severity="error" sx={{ width: '100%' }}>
                {error}
              </Alert>
            </Snackbar>
          )}
          
          {/* Vista principal de rutinas */}
          {!loading && !editMode && rutina && (
            <>
              <RutinaNavigation 
                onAdd={handleAddRutina}
                onEdit={handleEditRutina}
                rutina={rutina}
                loading={loading}
                currentPage={currentPage}
                totalPages={totalPages}
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
              rutina={rutinaToEdit} 
              onClose={handleCloseForm}
            />
          )}
        </Box>
      </Container>
      <FooterNavigation />
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
