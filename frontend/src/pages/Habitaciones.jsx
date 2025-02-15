import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container, Button, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, Chip,
  Box, Typography, Grid, IconButton
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import EntityToolbar from '../components/EntityToolbar';
import EntityDetails from '../components/EntityViews/EntityDetails';
import EntityForm from '../components/EntityViews/EntityForm';
import { useSnackbar } from 'notistack';
import clienteAxios from '../config/axios';
import { 
  ApartmentOutlined as BuildingIcon,
  PeopleOutlined as PeopleIcon,
  DescriptionOutlined as DescriptionIcon,
  Inventory2Outlined as InventoryIcon,
  BedOutlined as BedIcon,
  PersonOutlined as PersonIcon,
  HomeOutlined as HomeIcon,
  NumbersOutlined as NumberIcon
} from '@mui/icons-material';
import EmptyState from '../components/EmptyState';
import { EntityActions } from '../components/EntityViews/EntityActions';
import EntityCards from '../components/EntityViews/EntityCards';

export function Habitaciones() {
  const [habitaciones, setHabitaciones] = useState([]);
  const [propiedades, setPropiedades] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingHabitacion, setEditingHabitacion] = useState(null);
  const { enqueueSnackbar } = useSnackbar();

  const fetchHabitaciones = useCallback(async () => {
    try {
      const response = await clienteAxios.get('/habitaciones');
      setHabitaciones(response.data.docs || []);
    } catch (error) {
      console.error('Error al cargar habitaciones:', error);
      enqueueSnackbar('Error al cargar habitaciones', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  const fetchPropiedades = useCallback(async () => {
    try {
      const response = await clienteAxios.get('/propiedades');
      setPropiedades(response.data.docs || []);
    } catch (error) {
      console.error('Error al cargar propiedades:', error);
      enqueueSnackbar('Error al cargar propiedades', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchHabitaciones();
    fetchPropiedades();
  }, [fetchHabitaciones, fetchPropiedades]);

  const handleCreatePropiedad = async (data) => {
    try {
      const response = await clienteAxios.post('/propiedades', data);
      setPropiedades(prev => [...prev, response.data]);
      enqueueSnackbar('Propiedad creada exitosamente', { variant: 'success' });
      return response.data;
    } catch (error) {
      console.error('Error al crear propiedad:', error);
      enqueueSnackbar('Error al crear la propiedad', { variant: 'error' });
      throw error;
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      console.log('Enviando datos:', formData);
      let response;
      if (editingHabitacion) {
        response = await clienteAxios.put(`/habitaciones/${editingHabitacion.id}`, formData);
        setHabitaciones(prev => prev.map(h => h.id === editingHabitacion.id ? response.data : h));
      } else {
        response = await clienteAxios.post('/habitaciones', formData);
        setHabitaciones(prev => [...prev, response.data]);
      }
      setIsFormOpen(false);
      setEditingHabitacion(null);
      enqueueSnackbar('Habitación guardada exitosamente', { variant: 'success' });
      await fetchHabitaciones();
    } catch (error) {
      console.error('Error:', error);
      enqueueSnackbar(
        error.response?.data?.error || 'Error al guardar la habitación', 
        { variant: 'error' }
      );
    }
  };

  const handleEdit = useCallback((habitacion) => {
    setEditingHabitacion({
      ...habitacion,
      propiedadId: habitacion.propiedadId || habitacion.propiedad?._id
    });
    setIsFormOpen(true);
  }, []);

  const handleDelete = useCallback(async (id) => {
    try {
      await clienteAxios.delete(`/habitaciones/${id}`);
      setHabitaciones(prev => prev.filter(h => h.id !== id));
      enqueueSnackbar('Habitación eliminada exitosamente', { variant: 'success' });
    } catch (error) {
      console.error('Error al eliminar habitación:', error);
      enqueueSnackbar('Error al eliminar la habitación', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  const formFields = [
    {
      name: 'propiedadId',
      label: 'Propiedad',
      type: 'relational',
      required: true,
      options: propiedades.map(p => ({
        value: p.id,
        label: p.titulo
      })),
      onCreateNew: handleCreatePropiedad,
      createFields: [
        { name: 'titulo', label: 'Título', required: true },
        { name: 'direccion', label: 'Dirección', required: true },
        { name: 'ciudad', label: 'Ciudad', required: true },
        { name: 'estado', label: 'Estado', required: true }
      ],
      createTitle: 'Nueva Propiedad'
    },
    {
      name: 'numero',
      label: 'Número',
      required: true
    },
    {
      name: 'tipo',
      label: 'Tipo',
      type: 'select',
      required: true,
      options: [
        { value: 'INDIVIDUAL', label: 'Individual' },
        { value: 'DOBLE', label: 'Doble' },
        { value: 'SUITE', label: 'Suite' },
        { value: 'ESTUDIO', label: 'Estudio' }
      ]
    },
    {
      name: 'estado',
      label: 'Estado',
      type: 'select',
      required: true,
      options: [
        { value: 'DISPONIBLE', label: 'Disponible' },
        { value: 'OCUPADA', label: 'Ocupada' },
        { value: 'MANTENIMIENTO', label: 'Mantenimiento' },
        { value: 'RESERVADA', label: 'Reservada' }
      ]
    },
    {
      name: 'capacidad',
      label: 'Capacidad',
      type: 'number',
      required: true
    },
    {
      name: 'descripcion',
      label: 'Descripción',
      multiline: true,
      rows: 3
    }
  ];

  const cardConfig = {
    renderIcon: () => <NumberIcon />,
    getTitle: (habitacion) => `Habitación ${habitacion.numero}`,
    getDetails: (habitacion) => [
      {
        icon: <HomeIcon />,
        text: habitacion.propiedad?.titulo || propiedades.find(p => p.id === habitacion.propiedadId)?.titulo || 'N/A',
        noWrap: true
      },
      {
        icon: <BedIcon />,
        text: habitacion.tipo
      },
      {
        icon: <PersonIcon />,
        text: `${habitacion.capacidad} personas`
      }
    ],
    getStatus: (habitacion) => ({
      label: habitacion.estado,
      color: habitacion.estado === 'DISPONIBLE' ? 'success' :
             habitacion.estado === 'OCUPADA' ? 'error' :
             habitacion.estado === 'MANTENIMIENTO' ? 'warning' : 'info'
    }),
    getActions: (habitacion) => ({
      onEdit: () => handleEdit(habitacion),
      onDelete: () => handleDelete(habitacion.id),
      itemName: `la habitación ${habitacion.numero}`
    })
  };

  return (
    <Container maxWidth="lg">
      <EntityToolbar
        onAdd={() => {
          setEditingHabitacion(null);
          setIsFormOpen(true);
        }}
        searchPlaceholder="Buscar habitaciones..."
        navigationItems={[
          {
            icon: <BuildingIcon sx={{ fontSize: 20 }} />,
            label: 'Propiedades',
            to: '/propiedades'
          },
          {
            icon: <PeopleIcon sx={{ fontSize: 20 }} />,
            label: 'Inquilinos',
            to: '/inquilinos'
          },
          {
            icon: <DescriptionIcon sx={{ fontSize: 20 }} />,
            label: 'Contratos',
            to: '/contratos'
          },
          {
            icon: <InventoryIcon sx={{ fontSize: 20 }} />,
            label: 'Inventario',
            to: '/inventario'
          }
        ]}
      />

      <EntityDetails
        title="Habitaciones"
        action={
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            size="small"
            onClick={() => {
              setEditingHabitacion(null);
              setIsFormOpen(true);
            }}
            sx={{ borderRadius: 0 }}
          >
            Nueva Habitación
          </Button>
        }
      >
        {habitaciones.length === 0 ? (
          <EmptyState onAdd={() => setIsFormOpen(true)} />
        ) : (
          <EntityCards 
            data={habitaciones}
            config={cardConfig}
          />
        )}
      </EntityDetails>

      <EntityForm
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingHabitacion(null);
        }}
        onSubmit={handleFormSubmit}
        title={editingHabitacion ? 'Editar Habitación' : 'Nueva Habitación'}
        fields={formFields}
        initialData={editingHabitacion || {}}
        isEditing={!!editingHabitacion}
      />
    </Container>
  );
}

export default Habitaciones; 