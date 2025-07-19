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
import { Add as AddIcon } from '@mui/icons-material';
import { 
  ScienceOutlined as LabIcon,
  CalendarMonth as DateIcon,
  MonitorWeightOutlined as WeightIcon,
  HealthAndSafety as HealthIcon
} from '@mui/icons-material';
import { EntityToolbar, EntityDetails, EntityForm, EntityActions } from '../components/EntityViews';
import { UnderConstruction } from '../components/common';
import { useSnackbar } from 'notistack';
import clienteAxios from '../config/axios';
import { EmptyState } from '../components/common';
import { useNavigate } from 'react-router-dom';

export function Dieta() {
  const [comidas, setComidas] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingComida, setEditingComida] = useState(null);
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const fetchComidas = useCallback(async () => {
    try {
      const response = await clienteAxios.get('/api/dietas');
      setComidas(response.data.docs || []);
    } catch (error) {
      console.error('Error al cargar comidas:', error);
      enqueueSnackbar('Error al cargar comidas', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchComidas();
  }, [fetchComidas]);

  const handleFormSubmit = async (formData) => {
    try {
      let response;
      if (editingComida) {
        response = await clienteAxios.put(`/dietas/${editingComida.id}`, formData);
        enqueueSnackbar('Comida actualizada exitosamente', { variant: 'success' });
      } else {
        response = await clienteAxios.post('/api/dietas', formData);
        enqueueSnackbar('Comida agregada exitosamente', { variant: 'success' });
      }
      setIsFormOpen(false);
      setEditingComida(null);
      await fetchComidas();
    } catch (error) {
      console.error('Error:', error);
      enqueueSnackbar(
        error.response?.data?.error || 'Error al guardar la comida', 
        { variant: 'error' }
      );
    }
  };

  const handleEdit = useCallback((comida) => {
    setEditingComida(comida);
    setIsFormOpen(true);
  }, []);

  const handleDelete = useCallback(async (id) => {
    try {
      await clienteAxios.delete(`/dietas/${id}`);
      enqueueSnackbar('Comida eliminada exitosamente', { variant: 'success' });
      await fetchComidas();
    } catch (error) {
      console.error('Error al eliminar comida:', error);
      enqueueSnackbar('Error al eliminar la comida', { variant: 'error' });
    }
  }, [enqueueSnackbar, fetchComidas]);

  const handleBack = () => {
    navigate('/rutinas');
  };

  // Escuchar evento del Header para abrir formulario
  useEffect(() => {
    const handleHeaderAddButton = (event) => {
      if (event.detail?.type === 'dieta') {
        setEditingComida(null);
        setIsFormOpen(true);
      }
    };

    window.addEventListener('headerAddButtonClicked', handleHeaderAddButton);
    return () => window.removeEventListener('headerAddButtonClicked', handleHeaderAddButton);
  }, []);

  const formFields = [
    {
      name: 'nombre',
      label: 'Nombre',
      required: true
    },
    {
      name: 'tipo',
      label: 'Tipo',
      type: 'select',
      required: true,
      options: [
        { value: 'DESAYUNO', label: 'Desayuno' },
        { value: 'ALMUERZO', label: 'Almuerzo' },
        { value: 'MERIENDA', label: 'Merienda' },
        { value: 'CENA', label: 'Cena' },
        { value: 'SNACK', label: 'Snack' }
      ]
    },
    {
      name: 'calorias',
      label: 'Calorías',
      type: 'number',
      required: true
    },
    {
      name: 'proteinas',
      label: 'Proteínas (g)',
      type: 'number',
      required: true
    },
    {
      name: 'carbohidratos',
      label: 'Carbohidratos (g)',
      type: 'number',
      required: true
    },
    {
      name: 'grasas',
      label: 'Grasas (g)',
      type: 'number',
      required: true
    },
    {
      name: 'ingredientes',
      label: 'Ingredientes',
      multiline: true,
      rows: 3,
      required: true
    },
    {
      name: 'preparacion',
      label: 'Preparación',
      multiline: true,
      rows: 3
    }
  ];

  return (
    <Box sx={{ px: 0, width: '100%' }}>
      <EntityToolbar
        onAdd={() => {
          setEditingComida(null);
          setIsFormOpen(true);
        }}
        showBackButton={true}
        onBack={handleBack}
        navigationItems={[
          {
            icon: <LabIcon sx={{ fontSize: 21.6 }} />,
            label: 'Lab',
            to: '/lab'
          },
          {
            icon: <WeightIcon sx={{ fontSize: 21.6 }} />,
            label: 'Composición Corporal',
            to: '/datacorporal'
          }
        ]}
      />

      <EntityDetails
        title="Dieta"
        action={
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            size="small"
            onClick={() => {
              setEditingComida(null);
              setIsFormOpen(true);
            }}
          >
            Nueva Comida
          </Button>
        }
      >
        <UnderConstruction />
      </EntityDetails>

      <EntityForm
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingComida(null);
        }}
        onSubmit={handleFormSubmit}
        title={editingComida ? 'Editar Comida' : 'Nueva Comida'}
        fields={formFields}
        initialData={editingComida || {}}
        isEditing={!!editingComida}
      />
    </Box>
  );
}

export default Dieta;