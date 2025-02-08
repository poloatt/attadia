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
import { Add as AddIcon } from '@mui/icons-material';
import { 
  ScienceOutlined as LabIcon,
  TaskAltOutlined as RutinasIcon
} from '@mui/icons-material';
import EntityToolbar from '../components/EntityToolbar';
import EntityDetails from '../components/EntityViews/EntityDetails';
import EntityForm from '../components/EntityViews/EntityForm';
import { useSnackbar } from 'notistack';
import clienteAxios from '../config/axios';
import EmptyState from '../components/EmptyState';
import { EntityActions } from '../components/EntityViews/EntityActions';

export function Dieta() {
  const [comidas, setComidas] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingComida, setEditingComida] = useState(null);
  const { enqueueSnackbar } = useSnackbar();

  const fetchComidas = useCallback(async () => {
    try {
      const response = await clienteAxios.get('/dietas');
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
        response = await clienteAxios.post('/dietas', formData);
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
    <Container maxWidth="lg">
      <EntityToolbar
        onAdd={() => {
          setEditingComida(null);
          setIsFormOpen(true);
        }}
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
        {comidas.length === 0 ? (
          <EmptyState onAdd={() => setIsFormOpen(true)} />
        ) : (
          <TableContainer component={Paper} elevation={0}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell align="right">Calorías</TableCell>
                  <TableCell align="right">Proteínas</TableCell>
                  <TableCell align="right">Carbohidratos</TableCell>
                  <TableCell align="right">Grasas</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {comidas.map((comida) => (
                  <TableRow key={comida.id}>
                    <TableCell>{comida.nombre}</TableCell>
                    <TableCell>
                      <Chip 
                        label={comida.tipo}
                        size="small"
                        color={
                          comida.tipo === 'DESAYUNO' ? 'primary' :
                          comida.tipo === 'ALMUERZO' ? 'success' :
                          comida.tipo === 'MERIENDA' ? 'info' :
                          comida.tipo === 'CENA' ? 'warning' : 'default'
                        }
                      />
                    </TableCell>
                    <TableCell align="right">{comida.calorias} kcal</TableCell>
                    <TableCell align="right">{comida.proteinas}g</TableCell>
                    <TableCell align="right">{comida.carbohidratos}g</TableCell>
                    <TableCell align="right">{comida.grasas}g</TableCell>
                    <TableCell align="right">
                      <EntityActions
                        onEdit={() => handleEdit(comida)}
                        onDelete={() => handleDelete(comida.id)}
                        itemName={`la comida ${comida.nombre}`}
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
          setEditingComida(null);
        }}
        onSubmit={handleFormSubmit}
        title={editingComida ? 'Editar Comida' : 'Nueva Comida'}
        fields={formFields}
        initialData={editingComida || {}}
        isEditing={!!editingComida}
      />
    </Container>
  );
}

export default Dieta;