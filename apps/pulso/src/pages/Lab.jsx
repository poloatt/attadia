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
import { CommonDetails, CommonForm, CommonActions } from '@shared/components/common';
import { Toolbar } from '@shared/navigation';
import AddIcon from '@mui/icons-material/Add';
import { 
  RestaurantOutlined as DietaIcon,
  CalendarMonth as DateIcon,
  MonitorWeightOutlined as WeightIcon,
  HealthAndSafety as HealthIcon
} from '@mui/icons-material';
import clienteAxios from '@shared/config/axios';
import { useSnackbar } from 'notistack';
import { CommonConstruction } from '@shared/components/common';
import { useNavigate } from 'react-router-dom';

export function Lab() {
  const [mediciones, setMediciones] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMedicion, setEditingMedicion] = useState(null);
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const fetchMediciones = useCallback(async () => {
    try {
      const response = await clienteAxios.get('/api/lab/mediciones');
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
        await clienteAxios.put(`/api/lab/mediciones/${editingMedicion.id}`, formData);
        enqueueSnackbar('Medición actualizada exitosamente', { variant: 'success' });
      } else {
        await clienteAxios.post('/api/lab/mediciones', formData);
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
      await clienteAxios.delete(`/api/lab/mediciones/${id}`);
      enqueueSnackbar('Medición eliminada exitosamente', { variant: 'success' });
      await fetchMediciones();
    } catch (error) {
      console.error('Error al eliminar medición:', error);
    }
  }, [enqueueSnackbar, fetchMediciones]);

  const handleBack = () => {
    navigate('/rutinas');
  };

  // Escuchar evento del Header para abrir formulario
  useEffect(() => {
    const handleHeaderAddButton = (event) => {
      if (event.detail?.type === 'medicion') {
        setEditingMedicion(null);
        setIsFormOpen(true);
      }
    };

    window.addEventListener('headerAddButtonClicked', handleHeaderAddButton);
    return () => window.removeEventListener('headerAddButtonClicked', handleHeaderAddButton);
  }, []);

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
    <Box sx={{ px: 0, width: '100%' }}>
      <CommonDetails
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
        <CommonConstruction />
      </CommonDetails>

      <CommonForm
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
    </Box>
  );
}

export default Lab;
