import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import EntityToolbar from '../components/EntityToolbar';
import EntityDetails from '../components/EntityViews/EntityDetails';
import EntityForm from '../components/EntityViews/EntityForm';
import clienteAxios from '../config/axios';
import EmptyState from '../components/EmptyState';
import { useSnackbar } from 'notistack';
import { EntityActions } from '../components/EntityViews/EntityActions';

export function Proyectos() {
  const [proyectos, setProyectos] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProyecto, setEditingProyecto] = useState(null);
  const { enqueueSnackbar } = useSnackbar();

  const fetchProyectos = useCallback(async () => {
    try {
      const response = await clienteAxios.get('/proyectos');
      setProyectos(response.data.docs || []);
    } catch (error) {
      console.error('Error:', error);
      enqueueSnackbar('Error al cargar proyectos', { variant: 'error' });
      setProyectos([]);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchProyectos();
  }, [fetchProyectos]);

  const handleFormSubmit = async (formData) => {
    try {
      let response;
      if (editingProyecto) {
        response = await clienteAxios.put(`/proyectos/${editingProyecto.id}`, formData);
        enqueueSnackbar('Proyecto actualizado exitosamente', { variant: 'success' });
      } else {
        response = await clienteAxios.post('/proyectos', formData);
        enqueueSnackbar('Proyecto creado exitosamente', { variant: 'success' });
      }
      setIsFormOpen(false);
      setEditingProyecto(null);
      await fetchProyectos();
    } catch (error) {
      console.error('Error:', error);
      enqueueSnackbar(
        error.response?.data?.error || 'Error al guardar el proyecto', 
        { variant: 'error' }
      );
    }
  };

  const handleEdit = useCallback((proyecto) => {
    setEditingProyecto(proyecto);
    setIsFormOpen(true);
  }, []);

  const handleDelete = useCallback(async (id) => {
    try {
      await clienteAxios.delete(`/proyectos/${id}`);
      enqueueSnackbar('Proyecto eliminado exitosamente', { variant: 'success' });
      await fetchProyectos();
    } catch (error) {
      console.error('Error al eliminar proyecto:', error);
      enqueueSnackbar('Error al eliminar el proyecto', { variant: 'error' });
    }
  }, [enqueueSnackbar, fetchProyectos]);

  const formFields = [
    {
      name: 'nombre',
      label: 'Nombre',
      type: 'text',
      required: true
    },
    {
      name: 'descripcion',
      label: 'Descripción',
      type: 'text',
      multiline: true,
      rows: 3
    },
    {
      name: 'estado',
      label: 'Estado',
      type: 'select',
      required: true,
      options: [
        { value: 'ACTIVO', label: 'Activo' },
        { value: 'PAUSADO', label: 'Pausado' },
        { value: 'COMPLETADO', label: 'Completado' },
        { value: 'CANCELADO', label: 'Cancelado' }
      ]
    },
    {
      name: 'fechaInicio',
      label: 'Fecha de Inicio',
      type: 'date',
      required: true
    },
    {
      name: 'fechaFin',
      label: 'Fecha de Fin',
      type: 'date'
    }
  ];

  return (
    <Container maxWidth="lg">
      <EntityToolbar
        onAdd={() => {
          setEditingProyecto(null);
          setIsFormOpen(true);
        }}
        entityName="proyecto"
        navigationItems={[]}
      />
      <EntityDetails
        title="Proyectos"
        action={
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            size="small"
            onClick={() => {
              setEditingProyecto(null);
              setIsFormOpen(true);
            }}
          >
            Nuevo Proyecto
          </Button>
        }
      >
        {proyectos.length === 0 ? (
          <Box sx={{ p: 2 }}>
            <EmptyState onAdd={() => setIsFormOpen(true)} />
          </Box>
        ) : (
          <TableContainer component={Paper} elevation={0}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Fecha Inicio</TableCell>
                  <TableCell>Fecha Fin</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {proyectos.map((proyecto) => (
                  <TableRow key={proyecto.id}>
                    <TableCell>{proyecto.nombre}</TableCell>
                    <TableCell>{proyecto.descripcion}</TableCell>
                    <TableCell>
                      <Chip 
                        label={proyecto.estado}
                        color={
                          proyecto.estado === 'ACTIVO' ? 'success' :
                          proyecto.estado === 'PAUSADO' ? 'warning' :
                          proyecto.estado === 'COMPLETADO' ? 'info' : 'error'
                        }
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {proyecto.fechaInicio ? new Date(proyecto.fechaInicio).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      {proyecto.fechaFin ? new Date(proyecto.fechaFin).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell align="right">
                      <EntityActions
                        onEdit={() => handleEdit(proyecto)}
                        onDelete={() => handleDelete(proyecto.id)}
                        itemName={`el proyecto ${proyecto.nombre}`}
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
          setEditingProyecto(null);
        }}
        onSubmit={handleFormSubmit}
        title={editingProyecto ? 'Editar Proyecto' : 'Nuevo Proyecto'}
        fields={formFields}
        initialData={editingProyecto || {}}
        isEditing={!!editingProyecto}
      />
    </Container>
  );
}

export default Proyectos;
