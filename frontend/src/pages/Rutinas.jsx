import React, { useState, useEffect } from 'react';
import { Container, Dialog, Alert, IconButton } from '@mui/material';
import EntityToolbar from '../components/EntityToolbar';
import { 
  ScienceOutlined as LabIcon,
  RestaurantOutlined as DietaIcon,
  MonitorWeightOutlined as WeightIcon,
  HealthAndSafety as HealthIcon,
  CalendarMonth as DateIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EntityDetails from '../components/EntityViews/EntityDetails';
import clienteAxios from '../config/axios';
import { useSnackbar } from 'notistack';
import { RutinaTable } from '../components/rutinas/RutinaTable';
import { RutinaForm } from '../components/rutinas/RutinaForm';

function Rutinas() {
  const [rutina, setRutina] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRutina, setEditingRutina] = useState(null);
  const { enqueueSnackbar } = useSnackbar();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRutina(currentPage);
  }, [currentPage]);

  // Escuchar el evento editRutina
  useEffect(() => {
    const handleEditRutinaEvent = (event) => {
      const { rutina } = event.detail;
      if (rutina) {
        console.log('Editando rutina recibida del evento:', rutina);
        setEditingRutina(rutina);
        setOpenDialog(true);
      }
    };

    // Escuchar eventos de cambio para actualizar la vista
    const handleEntityUpdated = (event) => {
      console.log('Evento de actualización recibido:', event.detail);
      
      // Si el evento es de rutinas, actualizar la vista
      if (event.detail.type === 'rutinas') {
        // Esperar un breve momento para que la base de datos se actualice
        setTimeout(() => {
          console.log('Recargando rutina después de evento de actualización');
          fetchRutina(currentPage);
        }, 500);
      }
    };

    window.addEventListener('editRutina', handleEditRutinaEvent);
    window.addEventListener('entityUpdated', handleEntityUpdated);
    
    return () => {
      window.removeEventListener('editRutina', handleEditRutinaEvent);
      window.removeEventListener('entityUpdated', handleEntityUpdated);
    };
  }, [currentPage]);

  const fetchRutina = async (page) => {
    try {
      console.log('Fetching rutina para página:', page);
      const response = await clienteAxios.get('/api/rutinas', {
        params: {
          sort: '-fecha',
          page,
          limit: 1
        }
      });
      const docs = response.data?.docs || [];
      const totalDocs = response.data?.totalDocs || 0;
      const totalPages = response.data?.totalPages || 1;
      
      console.log('Respuesta del servidor:', {
        totalDocs,
        totalPages,
        currentPage: page,
        docs: docs.map(d => ({
          id: d._id,
          fecha: new Date(d.fecha).toLocaleDateString(),
          completitud: d.completitud
        }))
      });
      
      setTotalPages(totalPages);
      setRutina(docs[0] || null);
    } catch (error) {
      console.error('Error al cargar rutina:', error);
      enqueueSnackbar('Error al cargar rutina', { variant: 'error' });
      setRutina(null);
    }
  };

  const handlePrevious = () => {
    console.log('Navegando a registro más reciente');
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNext = () => {
    console.log('Navegando a registro más antiguo');
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handleOpenDialog = (rutina = null) => {
    console.log('Abriendo diálogo con rutina:', rutina);
    // Limpiar cualquier error previo
    setError(null);
    // Establecer la rutina que se está editando
    setEditingRutina(rutina);
    // Abrir el diálogo
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingRutina(null);
  };

  const handleSubmit = async (formData) => {
    try {
      console.log('Rutinas: handleSubmit recibió formData:', formData);
      
      // Si ya tenemos el ID, es una actualización, sino es crear
      if (formData._id) {
        // Es una actualización de rutina existente
        const response = await clienteAxios.put(`/api/rutinas/${formData._id}`, formData);
        console.log('Rutina actualizada:', response.data);
        
        // Mostrar mensaje de éxito
        enqueueSnackbar('Rutina actualizada exitosamente', { variant: 'success' });
        
        // Actualizar el estado
        setRutina(response.data);
        
        // Disparar evento de actualización
        window.dispatchEvent(new CustomEvent('entityUpdated', {
          detail: { 
            type: 'rutinas', 
            action: 'update', 
            id: response.data._id 
          }
        }));
        
        // Cerrar el diálogo
        handleCloseDialog();
        
        // Recargar datos
        setTimeout(() => {
          fetchRutina(currentPage);
        }, 300);
      } else {
        // Es crear una nueva rutina
        try {
          // Si ya estamos en proceso de crear, evitar crear duplicados
          const response = await clienteAxios.post('/api/rutinas', formData);
          console.log('Rutina creada:', response.data);
          
          // Mostrar mensaje de éxito
          enqueueSnackbar('Rutina creada exitosamente', { variant: 'success' });
          
          // Actualizar el estado
          setRutina(response.data);
          setCurrentPage(1);
          
          // Disparar evento de actualización
          window.dispatchEvent(new CustomEvent('entityUpdated', {
            detail: { 
              type: 'rutinas', 
              action: 'create', 
              id: response.data._id 
            }
          }));
          
          // Cerrar el diálogo
          handleCloseDialog();
          
          // Recargar datos
          setTimeout(() => {
            fetchRutina(1);
          }, 300);
        } catch (error) {
          if (error.response?.status === 409) {
            console.log('Error 409: Conflicto - Ya existe una rutina para esta fecha');
            enqueueSnackbar('Ya existe una rutina para esta fecha', { variant: 'error' });
            
            // No cerrar el diálogo para permitir al usuario elegir otra fecha
            // Intentar cargar la rutina existente para mostrarla
            if (error.response?.data?.rutina?.id) {
              try {
                const existingRutina = await clienteAxios.get(`/api/rutinas/${error.response.data.rutina.id}`);
                setRutina(existingRutina.data);
                setCurrentPage(1);
                
                // Cerrar el diálogo después de cargar la rutina existente
                handleCloseDialog();
                
                // Notificar que se está mostrando una rutina existente
                enqueueSnackbar('Mostrando la rutina existente para la fecha seleccionada', { 
                  variant: 'info',
                  autoHideDuration: 5000
                });
              } catch (fetchError) {
                console.error('Error al obtener la rutina existente:', fetchError);
              }
            }
          } else {
            throw error; // Propagar otros errores
          }
        }
      }
    } catch (error) {
      console.error('Error al guardar rutina:', error);
      
      enqueueSnackbar(
        error.response?.data?.error || 'Error al guardar la rutina', 
        { variant: 'error' }
      );
    }
  };

  const handleDelete = async (id) => {
    try {
      await clienteAxios.delete(`/api/rutinas/${id}`);
      enqueueSnackbar('Rutina eliminada exitosamente', { variant: 'success' });
      
      // Disparar evento de actualización
      window.dispatchEvent(new CustomEvent('entityUpdated', {
        detail: { type: 'rutinas', action: 'delete' }
      }));
      
      fetchRutina(currentPage);
    } catch (error) {
      console.error('Error al eliminar rutina:', error);
      enqueueSnackbar('Error al eliminar la rutina', { variant: 'error' });
    }
  };

  const handleCheckChange = async (updatedRutina) => {
    try {
      const { data } = await clienteAxios.put(`/api/rutinas/${updatedRutina._id}`, updatedRutina);
      setRutina(data);
      fetchRutina(currentPage);
    } catch (error) {
      console.error('Error al actualizar rutina:', error);
      enqueueSnackbar('Error al actualizar la rutina', { variant: 'error' });
      fetchRutina(currentPage);
    }
  };

  return (
    <Container maxWidth="lg">
      <EntityToolbar
        onAdd={() => handleOpenDialog()}
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
      
      <EntityDetails 
        title="Rutinas"
        icon={<DateIcon sx={{ fontSize: 20 }} />}
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon sx={{ fontSize: '1.25rem' }} />}
            size="small"
            onClick={() => handleOpenDialog()}
            sx={{ 
              borderRadius: 0,
              fontSize: '0.75rem',
              height: 24,
              textTransform: 'none',
              px: 1,
              py: 0
            }}
          >
            Nueva Rutina
          </Button>
        }
      >
        <RutinaTable
          rutina={rutina}
          onEdit={() => handleOpenDialog(rutina)}
          onDelete={() => handleDelete(rutina?._id)}
          onCheckChange={handleCheckChange}
          onPrevious={handlePrevious}
          onNext={handleNext}
          hasPrevious={currentPage > 1}
          hasNext={currentPage < totalPages}
        />
      </EntityDetails>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
      >
        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
            <IconButton 
              size="small" 
              onClick={() => setError(null)}
              sx={{ ml: 1 }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Alert>
        )}
        <RutinaForm
          key={`rutina-form-${Date.now()}`}
          open={openDialog}
          onClose={handleCloseDialog}
          onSubmit={handleSubmit}
          initialData={editingRutina}
        />
      </Dialog>
    </Container>
  );
}

export default Rutinas;
