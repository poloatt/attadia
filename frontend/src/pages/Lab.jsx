import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container, 
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Box,
  Typography
} from '@mui/material';
import EntityToolbar from '../components/EntityToolbar';
import EntityDetails from '../components/EntityViews/EntityDetails';
import EntityForm from '../components/EntityViews/EntityForm';
import AddIcon from '@mui/icons-material/Add';
import { 
  RestaurantOutlined as DietaIcon,
  CalendarMonth as DateIcon,
  MonitorWeightOutlined as WeightIcon,
  HealthAndSafety as HealthIcon
} from '@mui/icons-material';
import clienteAxios from '../config/axios';
import { useSnackbar } from 'notistack';
import UnderConstruction from '../components/UnderConstruction';
import { EntityActions } from '../components/EntityViews/EntityActions';

export function Lab() {
  const [mediciones, setMediciones] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMedicion, setEditingMedicion] = useState(null);
  const { enqueueSnackbar } = useSnackbar();

  const fetchMediciones = useCallback(async () => {
    try {
      const response = await clienteAxios.get('/mediciones');
      setMediciones(response.data.docs || []);
    } catch (error) {
      console.error('Error al cargar mediciones:', error);
    }
  }, []);

  useEffect(() => {
    fetchMediciones();
  }, [fetchMediciones]);

  const handleFormSubmit = async (formData) => {
    try {
      if (editingMedicion) {
        await clienteAxios.put(`/mediciones/${editingMedicion.id}`, formData);
        enqueueSnackbar('Medición actualizada exitosamente', { variant: 'success' });
      } else {
        await clienteAxios.post('/mediciones', formData);
        enqueueSnackbar('Medición creada exitosamente', { variant: 'success' });
      }
      setIsFormOpen(false);
      setEditingMedicion(null);
      await fetchMediciones();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleEdit = useCallback((medicion) => {
    setEditingMedicion(medicion);
    setIsFormOpen(true);
  }, []);

  const handleDelete = useCallback(async (id) => {
    try {
      await clienteAxios.delete(`/mediciones/${id}`);
      enqueueSnackbar('Medición eliminada exitosamente', { variant: 'success' });
      await fetchMediciones();
    } catch (error) {
      console.error('Error al eliminar medición:', error);
    }
  }, [enqueueSnackbar, fetchMediciones]);

  const formFields = [
    {
      name: 'peso',
      label: 'Peso (kg)',
      type: 'number',
      required: true
    },
    {
      name: 'musculo',
      label: 'Músculo (%)',
      type: 'number',
      required: true
    },
    {
      name: 'grasa',
      label: 'Grasa (%)',
      type: 'number',
      required: true
    },
    {
      name: 'agua',
      label: 'Agua (%)',
      type: 'number',
      required: true
    },
    {
      name: 'hueso',
      label: 'Hueso (%)',
      type: 'number',
      required: true
    },
    {
      name: 'metabolismo',
      label: 'Metabolismo (kcal)',
      type: 'number',
      required: true
    },
    {
      name: 'proteina',
      label: 'Proteína (%)',
      type: 'number',
      required: true
    },
    {
      name: 'obesidad',
      label: 'Obesidad (%)',
      type: 'number',
      required: true
    }
  ];

  return (
    <Container maxWidth="lg">
      <EntityToolbar
        onAdd={() => {
          setEditingMedicion(null);
          setIsFormOpen(true);
        }}
        navigationItems={[
          {
            icon: <HealthIcon sx={{ fontSize: 21.6 }} />,
            label: 'Salud',
            to: '/salud'
          },
          {
            icon: <DateIcon sx={{ fontSize: 21.6 }} />,
            label: 'Rutinas',
            to: '/rutinas'
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
        title="Mediciones"
        action={
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            size="small"
            onClick={() => {
              setEditingMedicion(null);
              setIsFormOpen(true);
            }}
          >
            Nueva Medición
          </Button>
        }
      >
        <UnderConstruction />
      </EntityDetails>

      <EntityForm
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingMedicion(null);
        }}
        onSubmit={handleFormSubmit}
        title={editingMedicion ? 'Editar Medición' : 'Nueva Medición'}
        fields={formFields}
        initialData={editingMedicion || {}}
        isEditing={!!editingMedicion}
      />
    </Container>
  );
}

export default Lab;
