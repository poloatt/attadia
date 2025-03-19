import React, { useState, useEffect, useRef } from 'react';
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
  const [processingSubmit, setProcessingSubmit] = useState(false);
  const recentlyCreatedRutinas = useRef(new Set());

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
    // Cerrar el diálogo
    setOpenDialog(false);
    
    // Estos estados se limpiarán cuando termine la animación de cierre (en onExited)
    // pero los marcamos para limpieza inmediata también
    setEditingRutina(null);
    setError(null);
    
    console.log('Diálogo cerrado, estados limpiados');
  };

  const handleSubmit = async (formData) => {
    try {
      console.log('Rutinas: handleSubmit recibió formData:', formData);
      
      // Verificar si ya estamos procesando un envío
      if (processingSubmit) {
        console.log('Ya hay un procesamiento en curso, ignorando solicitud');
        return;
      }
      
      // Marcar como en procesamiento
      setProcessingSubmit(true);
      
      // Verificar si esta rutina ya fue procesada recientemente (evitar duplicados)
      if (formData._id && recentlyCreatedRutinas.current.has(formData._id)) {
        console.log('Esta rutina ya fue procesada recientemente, evitando duplicados:', formData._id);
        
        // Forzar cierre del diálogo si aún está abierto
        setOpenDialog(false);
        
        // Cargar la rutina directamente
        try {
          const existingRutina = await clienteAxios.get(`/api/rutinas/${formData._id}`);
          setRutina(existingRutina.data);
          setCurrentPage(1);
          
          // Notificar que se está mostrando una rutina
          enqueueSnackbar('Mostrando la rutina seleccionada', { 
            variant: 'info',
            autoHideDuration: 3000
          });
          
          // Disparar evento de actualización
          window.dispatchEvent(new CustomEvent('entityUpdated', {
            detail: { 
              type: 'rutinas', 
              action: 'load', 
              id: formData._id 
            }
          }));
        } catch (fetchError) {
          console.error('Error al obtener la rutina:', fetchError);
        }
        
        // Finalizar el procesamiento
        setProcessingSubmit(false);
        return;
      }
      
      // Verificar si hay un error de conflicto marcado desde el formulario
      if (formData._error === 'conflict') {
        console.log('Recibido conflicto desde formulario, cargando la rutina existente:', formData._id);
        
        // Agregar a la lista de rutinas procesadas recientemente
        if (formData._id) {
          recentlyCreatedRutinas.current.add(formData._id);
          
          // Limpiar la lista después de 10 segundos
          setTimeout(() => {
            recentlyCreatedRutinas.current.delete(formData._id);
          }, 10000);
        }
        
        try {
          const existingRutina = await clienteAxios.get(`/api/rutinas/${formData._id}`);
          setRutina(existingRutina.data);
          setCurrentPage(1);
          
          // Notificar que se está mostrando una rutina existente
          enqueueSnackbar('Mostrando la rutina existente para la fecha seleccionada', { 
            variant: 'info',
            autoHideDuration: 5000
          });
          
          // Notificar cambio
          window.dispatchEvent(new CustomEvent('entityUpdated', {
            detail: { 
              type: 'rutinas', 
              action: 'load', 
              id: formData._id 
            }
          }));
          
          // Forzar cierre del diálogo si aún está abierto
          setOpenDialog(false);
          
          // Finalizar el procesamiento
          setProcessingSubmit(false);
          return; // Salir anticipadamente
        } catch (fetchError) {
          console.error('Error al obtener la rutina existente:', fetchError);
        }
      }
      
      // Si ya tenemos el ID, es una actualización, sino es crear
      if (formData._id) {
        // Agregar a la lista de rutinas procesadas recientemente
        recentlyCreatedRutinas.current.add(formData._id);
        
        // Limpiar la lista después de 10 segundos
        setTimeout(() => {
          recentlyCreatedRutinas.current.delete(formData._id);
        }, 10000);
        
        // Es una actualización de rutina existente
        const response = await clienteAxios.put(`/api/rutinas/${formData._id}`, formData);
        console.log('Rutina actualizada:', response.data);
        
        // Mostrar mensaje de éxito
        enqueueSnackbar('Rutina actualizada exitosamente', { variant: 'success' });
        
        // Actualizar el estado
        setRutina(response.data);
        
        // Forzar cierre del diálogo si aún está abierto
        setOpenDialog(false);
        
        // Disparar evento de actualización
        window.dispatchEvent(new CustomEvent('entityUpdated', {
          detail: { 
            type: 'rutinas', 
            action: 'update', 
            id: response.data._id 
          }
        }));
        
        // Recargar datos después de un breve retraso
        setTimeout(() => {
          fetchRutina(currentPage);
        }, 300);
      } else {
        // Es crear una nueva rutina - NO INTENTAMOS CREAR AQUÍ
        // El formulario ya debería haber creado la rutina y nos está pasando los datos
        
        // Si tenemos datos completos de la rutina (ya fue creada)
        if (formData.id || formData._id) {
          const rutinaId = formData.id || formData._id;
          
          // Agregar a la lista de rutinas procesadas recientemente
          recentlyCreatedRutinas.current.add(rutinaId);
          
          // Limpiar la lista después de 10 segundos
          setTimeout(() => {
            recentlyCreatedRutinas.current.delete(rutinaId);
          }, 10000);
          
          console.log('Rutina ya creada, mostrando:', rutinaId);
          
          // Mostrar mensaje de éxito
          enqueueSnackbar('Rutina creada exitosamente', { variant: 'success' });
          
          // Actualizar el estado
          setRutina(formData);
          setCurrentPage(1);
          
          // Forzar cierre del diálogo si aún está abierto
          setOpenDialog(false);
          
          // Disparar evento de actualización
          window.dispatchEvent(new CustomEvent('entityUpdated', {
            detail: { 
              type: 'rutinas', 
              action: 'create', 
              id: rutinaId 
            }
          }));
          
          // Recargar datos después de un breve retraso
          setTimeout(() => {
            fetchRutina(1);
          }, 300);
        }
      }
    } catch (error) {
      console.error('Error al procesar datos de rutina:', error);
      
      enqueueSnackbar(
        error.response?.data?.error || 'Error al procesar la rutina', 
        { variant: 'error' }
      );
    } finally {
      // Siempre marcar como finalizado el procesamiento
      setProcessingSubmit(false);
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
        TransitionProps={{
          onExited: () => {
            // Limpiar todos los estados cuando el diálogo ha terminado su animación de cierre
            setEditingRutina(null);
            setError(null);
          }
        }}
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
        {openDialog && (
          <RutinaForm
            key={`rutina-form-${Date.now()}`}
            open={true}
            onClose={handleCloseDialog}
            onSubmit={handleSubmit}
            initialData={editingRutina}
          />
        )}
      </Dialog>
    </Container>
  );
}

export default Rutinas;
