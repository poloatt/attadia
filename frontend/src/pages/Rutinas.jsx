import React, { useState, useEffect } from 'react';
import { Container } from '@mui/material';
import EntityToolbar from '../components/EntityToolbar';
import { 
  ScienceOutlined as LabIcon,
  RestaurantOutlined as DietaIcon,
  MonitorWeightOutlined as WeightIcon,
  HealthAndSafety as HealthIcon,
  CalendarMonth as DateIcon
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

    window.addEventListener('editRutina', handleEditRutinaEvent);
    
    return () => {
      window.removeEventListener('editRutina', handleEditRutinaEvent);
    };
  }, []);

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

  const handleOpenDialog = (rutinaToEdit = null) => {
    setEditingRutina(rutinaToEdit);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingRutina(null);
  };

  const handleSubmit = async (formData) => {
    try {
      let response;
      if (editingRutina?._id) {
        response = await clienteAxios.put(`/api/rutinas/${editingRutina._id}`, formData);
        enqueueSnackbar('Rutina actualizada exitosamente', { variant: 'success' });
        handleCloseDialog();
      } else {
        response = await clienteAxios.post('/api/rutinas', formData);
        console.log('Rutina creada:', response.data);
        setRutina(response.data);
        setCurrentPage(1);
        setTotalPages(prev => Math.max(1, prev));
        enqueueSnackbar('Rutina creada exitosamente', { variant: 'success' });
        handleCloseDialog();
      }
      
      if (editingRutina?._id) {
        await fetchRutina(1);
        setCurrentPage(1);
      }
    } catch (error) {
      console.error('Error al guardar rutina:', error);
      if (error.response?.status === 409) {
        enqueueSnackbar('Ya existe una rutina para esta fecha', { variant: 'error' });
        return;
      } else {
        enqueueSnackbar(
          error.response?.data?.error || 'Error al guardar la rutina', 
          { variant: 'error' }
        );
        handleCloseDialog();
      }
    }
  };

  const handleDelete = async (id) => {
    try {
      await clienteAxios.delete(`/api/rutinas/${id}`);
      enqueueSnackbar('Rutina eliminada exitosamente', { variant: 'success' });
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

      <RutinaForm
        open={openDialog}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        initialData={editingRutina || undefined}
      />
    </Container>
  );
}

export default Rutinas;
