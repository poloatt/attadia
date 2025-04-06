import React, { useState, useEffect } from 'react';
import { Container, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import EntityToolbar from '../components/EntityToolbar';
import EntityDetails from '../components/EntityViews/EntityDetails';
import { DataCorporalTable } from '../components/bodycomposition/DataCorporalTable';
import { DataCorporalForm } from '../components/bodycomposition/DataCorporalForm';
import UnderConstruction from '../components/UnderConstruction';
import clienteAxios from '../config/axios';
import { useSnackbar } from 'notistack';
import AddIcon from '@mui/icons-material/Add';
import { 
  ScienceOutlined as LabIcon,
  RestaurantOutlined as DietaIcon,
  CalendarMonth as DateIcon,
  HealthAndSafety as HealthIcon
} from '@mui/icons-material';

export function DataCorporal() {
  const [data, setData] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await clienteAxios.get('/api/datacorporal');
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
        await clienteAxios.post('/api/datacorporal', formData);
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

  const handleBack = () => {
    navigate('/rutinas');
  };

  return (
    <Container maxWidth="lg">
      <EntityToolbar
        onAdd={() => handleOpenDialog()}
        showBackButton={true}
        onBack={handleBack}
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
        <UnderConstruction />
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