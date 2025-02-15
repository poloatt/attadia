import React, { useState, useEffect } from 'react';
import { Container, Button } from '@mui/material';
import EntityToolbar from '../components/EntityToolbar';
import EntityDetails from '../components/EntityViews/EntityDetails';
import { DataCorporalTable } from '../components/bodycomposition/DataCorporalTable';
import { DataCorporalForm } from '../components/bodycomposition/DataCorporalForm';
import clienteAxios from '../config/axios';
import { useSnackbar } from 'notistack';
import AddIcon from '@mui/icons-material/Add';
import { 
  ScienceOutlined as LabIcon,
  RestaurantOutlined as DietaIcon,
  TaskAltOutlined as RutinasIcon,
  MonitorWeightOutlined as WeightIcon
} from '@mui/icons-material';

export function DataCorporal() {
  const [data, setData] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await clienteAxios.get('/datacorporal');
      setData(response.data.docs || []);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      enqueueSnackbar('Error al cargar los datos', { variant: 'error' });
    }
  };

  const handleOpenDialog = (dataToEdit = null) => {
    setEditingData(dataToEdit);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingData(null);
  };

  const handleSubmit = async (formData) => {
    try {
      if (editingData?._id) {
        await clienteAxios.put(`/datacorporal/${editingData._id}`, formData);
        enqueueSnackbar('Registro actualizado exitosamente', { variant: 'success' });
      } else {
        await clienteAxios.post('/datacorporal', formData);
        enqueueSnackbar('Registro creado exitosamente', { variant: 'success' });
      }
      handleCloseDialog();
      fetchData();
    } catch (error) {
      console.error('Error al guardar:', error);
      if (error.response?.status === 409) {
        enqueueSnackbar('Ya existe un registro para esta fecha', { variant: 'error' });
      } else {
        enqueueSnackbar('Error al guardar el registro', { variant: 'error' });
      }
    }
  };

  const handleDelete = async (id) => {
    try {
      await clienteAxios.delete(`/datacorporal/${id}`);
      enqueueSnackbar('Registro eliminado exitosamente', { variant: 'success' });
      fetchData();
    } catch (error) {
      console.error('Error al eliminar:', error);
      enqueueSnackbar('Error al eliminar el registro', { variant: 'error' });
    }
  };

  return (
    <Container maxWidth="lg">
      <EntityToolbar
        onAdd={() => handleOpenDialog()}
        showBackButton={true}
        navigationItems={[
          {
            icon: <LabIcon sx={{ fontSize: 20 }} />,
            label: 'Lab',
            to: '/lab'
          },
          {
            icon: <RutinasIcon sx={{ fontSize: 20 }} />,
            label: 'Rutinas',
            to: '/rutinas'
          },
          {
            icon: <DietaIcon sx={{ fontSize: 20 }} />,
            label: 'Dieta',
            to: '/dieta'
          }
        ]}
      />
      
      <EntityDetails 
        title="Composición Corporal"
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            size="small"
            onClick={() => handleOpenDialog()}
            sx={{ borderRadius: 0 }}
          >
            Nuevo Registro
          </Button>
        }
      >
        <DataCorporalTable
          data={data}
          onEdit={handleOpenDialog}
          onDelete={handleDelete}
        />
      </EntityDetails>

      <DataCorporalForm
        open={openDialog}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        initialData={editingData}
      />
    </Container>
  );
}

export default DataCorporal; 