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
  Chip
} from '@mui/material';
import EntityToolbar from '../components/EntityToolbar';
import EntityDetails from '../components/EntityViews/EntityDetails';
import EntityForm from '../components/EntityViews/EntityForm';
import AddIcon from '@mui/icons-material/Add';
import { 
  ScienceOutlined as LabIcon,
  RestaurantOutlined as DietaIcon,
  AutorenewOutlined as RutinasIcon,
  MonitorWeightOutlined as WeightIcon
} from '@mui/icons-material';
import clienteAxios from '../config/axios';
import { useSnackbar } from 'notistack';
import EmptyState from '../components/EmptyState';
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
      enqueueSnackbar('Error al cargar mediciones', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchMediciones();
  }, [fetchMediciones]);

  const handleFormSubmit = async (formData) => {
    try {
      let response;
      if (editingMedicion) {
        response = await clienteAxios.put(`/mediciones/${editingMedicion.id}`, formData);
        enqueueSnackbar('Medición actualizada exitosamente', { variant: 'success' });
      } else {
        response = await clienteAxios.post('/mediciones', formData);
        enqueueSnackbar('Medición creada exitosamente', { variant: 'success' });
      }
      setIsFormOpen(false);
      setEditingMedicion(null);
      await fetchMediciones();
    } catch (error) {
      console.error('Error:', error);
      enqueueSnackbar(
        error.response?.data?.error || 'Error al guardar la medición', 
        { variant: 'error' }
      );
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
      enqueueSnackbar('Error al eliminar la medición', { variant: 'error' });
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
            icon: <RutinasIcon sx={{ fontSize: 20 }} />,
            label: 'Rutinas',
            to: '/rutinas'
          },
          {
            icon: <DietaIcon sx={{ fontSize: 20 }} />,
            label: 'Dieta',
            to: '/dieta'
          },
          {
            icon: <WeightIcon sx={{ fontSize: 20 }} />,
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
        {mediciones.length === 0 ? (
          <EmptyState onAdd={() => setIsFormOpen(true)} />
        ) : (
          <TableContainer component={Paper} elevation={0}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell align="right">Peso</TableCell>
                  <TableCell align="right">Músculo</TableCell>
                  <TableCell align="right">Grasa</TableCell>
                  <TableCell align="right">Agua</TableCell>
                  <TableCell align="right">IMC</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mediciones.map((medicion) => (
                  <TableRow key={medicion.id}>
                    <TableCell>
                      {new Date(medicion.fecha).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">{medicion.peso?.toFixed(1)} kg</TableCell>
                    <TableCell align="right">{medicion.musculo?.toFixed(1)}%</TableCell>
                    <TableCell align="right">{medicion.grasa?.toFixed(1)}%</TableCell>
                    <TableCell align="right">{medicion.agua?.toFixed(1)}%</TableCell>
                    <TableCell align="right">
                      <Chip 
                        label={medicion.imc?.toFixed(1)}
                        color={
                          medicion.imc < 18.5 ? 'warning' :
                          medicion.imc < 25 ? 'success' :
                          medicion.imc < 30 ? 'warning' : 'error'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <EntityActions
                        onEdit={() => handleEdit(medicion)}
                        onDelete={() => handleDelete(medicion.id)}
                        itemName={`la medición del ${new Date(medicion.fecha).toLocaleDateString()}`}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
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
