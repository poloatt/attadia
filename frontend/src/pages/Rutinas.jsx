import React, { useState, useEffect } from 'react';
import { Container } from '@mui/material';
import EntityToolbar from '../components/EntityToolbar';
import { 
  ScienceOutlined as LabIcon,
  RestaurantOutlined as DietaIcon
} from '@mui/icons-material';
import { Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EntityDetails from '../components/EntityViews/EntityDetails';
import clienteAxios from '../config/axios';
import { useSnackbar } from 'notistack';
import { RutinaTable } from '../components/rutinas/RutinaTable';
import { RutinaForm } from '../components/rutinas/RutinaForm';

export function Rutinas() {
  const [rutina, setRutina] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRutina, setEditingRutina] = useState(null);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchRutina();
  }, []);

  const fetchRutina = async () => {
    try {
      const response = await clienteAxios.get('/rutinas', {
        params: {
          sort: '-fecha',
          limit: 1
        }
      });
      const docs = response.data?.docs || [];
      console.log('Rutina recibida:', docs[0]);
      setRutina(docs[0] || null);
    } catch (error) {
      console.error('Error al cargar rutina:', error);
      enqueueSnackbar('Error al cargar rutina', { variant: 'error' });
      setRutina(null);
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
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const dataToSend = {
        ...formData,
        fecha: today.toISOString()
      };

      if (editingRutina?._id) {
        await clienteAxios.put(`/rutinas/${editingRutina._id}`, dataToSend);
        enqueueSnackbar('Rutina actualizada exitosamente', { variant: 'success' });
      } else {
        await clienteAxios.post('/rutinas', dataToSend);
        enqueueSnackbar('Rutina creada exitosamente', { variant: 'success' });
      }
      handleCloseDialog();
      fetchRutina();
    } catch (error) {
      console.error('Error al guardar rutina:', error);
      if (error.response?.status === 409) {
        enqueueSnackbar('Ya existe una rutina para el día de hoy', { variant: 'error' });
      } else {
        enqueueSnackbar('Error al guardar la rutina', { variant: 'error' });
      }
    }
  };

  const handleDelete = async (id) => {
    try {
      await clienteAxios.delete(`/rutinas/${id}`);
      enqueueSnackbar('Rutina eliminada exitosamente', { variant: 'success' });
      fetchRutina();
    } catch (error) {
      console.error('Error al eliminar rutina:', error);
      enqueueSnackbar('Error al eliminar la rutina', { variant: 'error' });
    }
  };

  const handleCheckChange = async (updatedRutina) => {
    try {
      const { data } = await clienteAxios.put(`/rutinas/${updatedRutina._id}`, updatedRutina);
      setRutina(data);
    } catch (error) {
      console.error('Error al actualizar rutina:', error);
      enqueueSnackbar('Error al actualizar la rutina', { variant: 'error' });
      fetchRutina();
    }
  };

  return (
    <Container maxWidth="lg">
      <EntityToolbar
        onAdd={() => handleOpenDialog()}
        navigationItems={[
          {
            icon: <LabIcon sx={{ fontSize: 20 }} />,
            label: 'Lab',
            to: '/lab'
          },
          {
            icon: <DietaIcon sx={{ fontSize: 20 }} />,
            label: 'Dieta',
            to: '/dieta'
          }
        ]}
      />
      
      <EntityDetails 
        title="Rutinas"
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            size="small"
            onClick={() => handleOpenDialog()}
            sx={{ borderRadius: 0 }}
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
