import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container, 
  Button, 
  Box, 
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import EntityToolbar from '../components/EntityToolbar';
import EntityDetails from '../components/EntityViews/EntityDetails';
import EntityForm from '../components/EntityViews/EntityForm';
import { useSnackbar } from 'notistack';
import clienteAxios from '../config/axios';
import { 
  ApartmentOutlined as BuildingIcon,
  BedOutlined as BedIcon,
  PeopleOutlined as PeopleIcon,
  DescriptionOutlined as DescriptionIcon
} from '@mui/icons-material';
import EmptyState from '../components/EmptyState';
import { EntityActions } from '../components/EntityViews/EntityActions';

export function Inventario() {
  const [items, setItems] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { enqueueSnackbar } = useSnackbar();
  const [habitaciones, setHabitaciones] = useState([]);
  const [propiedades, setPropiedades] = useState([]);
  const [habitacionesDisponibles, setHabitacionesDisponibles] = useState([]);
  const [formData, setFormData] = useState({});
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    fetchInventario();
    fetchHabitaciones();
    fetchPropiedades();
  }, []);

  const fetchInventario = async () => {
    try {
      const response = await clienteAxios.get('/inventarios');
      setItems(response.data.docs || []);
    } catch (error) {
      console.error('Error al cargar inventario:', error);
      enqueueSnackbar('Error al cargar inventario', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchHabitaciones = async (propiedadId = null) => {
    try {
      let url = '/habitaciones';
      if (propiedadId) {
        url = `/habitaciones/propiedad/${propiedadId}`;
      }
      const response = await clienteAxios.get(url);
      if (propiedadId) {
        setHabitacionesDisponibles(response.data.docs || []);
      } else {
        setHabitaciones(response.data.docs || []);
        setHabitacionesDisponibles(response.data.docs || []);
      }
    } catch (error) {
      console.error('Error al cargar habitaciones:', error);
      enqueueSnackbar('Error al cargar habitaciones', { variant: 'error' });
    }
  };

  const fetchPropiedades = async () => {
    try {
      const response = await clienteAxios.get('/propiedades');
      setPropiedades(response.data.docs || []);
    } catch (error) {
      console.error('Error al cargar propiedades:', error);
      enqueueSnackbar('Error al cargar propiedades', { variant: 'error' });
    }
  };

  const handleCreateHabitacion = async (formData) => {
    try {
      const response = await clienteAxios.post('/habitaciones', formData);
      await fetchHabitaciones(); // Recargar las habitaciones
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      let response;
      if (editingItem) {
        response = await clienteAxios.put(`/inventarios/${editingItem.id}`, formData);
        enqueueSnackbar('Item actualizado exitosamente', { variant: 'success' });
      } else {
        response = await clienteAxios.post('/inventarios', formData);
        enqueueSnackbar('Item agregado exitosamente', { variant: 'success' });
      }
      setIsFormOpen(false);
      setEditingItem(null);
      fetchInventario();
    } catch (error) {
      console.error('Error:', error);
      enqueueSnackbar(error.response?.data?.error || 'Error al guardar item', { variant: 'error' });
    }
  };

  const handleEdit = useCallback((item) => {
    setEditingItem(item);
    setIsFormOpen(true);
  }, []);

  const handleDelete = useCallback(async (id) => {
    try {
      await clienteAxios.delete(`/inventarios/${id}`);
      enqueueSnackbar('Item eliminado exitosamente', { variant: 'success' });
      await fetchInventario();
    } catch (error) {
      console.error('Error al eliminar item:', error);
      enqueueSnackbar('Error al eliminar el item', { variant: 'error' });
    }
  }, [enqueueSnackbar, fetchInventario]);

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
      onChange: async (value) => {
        if (value) {
          await fetchHabitaciones(value);
        } else {
          setHabitacionesDisponibles(habitaciones);
        }
        setFormData(prev => ({ ...prev, propiedadId: value, habitacionId: null }));
      }
    },
    {
      name: 'habitacionId',
      label: 'Habitación',
      type: 'relational',
      required: true,
      options: habitacionesDisponibles.map(h => ({
        value: h.id,
        label: `${h.numero} - ${h.tipo}`
      })),
      disabled: !formData.propiedadId,
      onCreateNew: handleCreateHabitacion,
      createFields: [
        { name: 'numero', label: 'Número', required: true },
        { name: 'tipo', label: 'Tipo', type: 'select', required: true, 
          options: [
            { value: 'INDIVIDUAL', label: 'Individual' },
            { value: 'DOBLE', label: 'Doble' },
            { value: 'SUITE', label: 'Suite' },
            { value: 'ESTUDIO', label: 'Estudio' }
          ]
        },
        { name: 'capacidad', label: 'Capacidad', type: 'number', required: true }
      ],
      createTitle: 'Nueva Habitación'
    },
    {
      name: 'nombre',
      label: 'Nombre del Elemento',
      required: true
    },
    {
      name: 'descripcion',
      label: 'Descripción',
      multiline: true,
      rows: 3
    },
    {
      name: 'estado',
      label: 'Estado',
      type: 'select',
      required: true,
      options: [
        { value: 'NUEVO', label: 'Nuevo' },
        { value: 'BUEN_ESTADO', label: 'Buen Estado' },
        { value: 'REGULAR', label: 'Regular' },
        { value: 'MALO', label: 'Malo' },
        { value: 'REPARACION', label: 'En Reparación' }
      ]
    },
    {
      name: 'cantidad',
      label: 'Cantidad',
      type: 'number',
      required: true
    }
  ];

  return (
    <Container maxWidth="lg">
      <EntityToolbar
        onAdd={() => {
          setEditingItem(null);
          setIsFormOpen(true);
        }}
        searchPlaceholder="Buscar items..."
        navigationItems={[
          {
            icon: <BuildingIcon sx={{ fontSize: 20 }} />,
            label: 'Propiedades',
            to: '/propiedades'
          },
          {
            icon: <BedIcon sx={{ fontSize: 20 }} />,
            label: 'Habitaciones',
            to: '/habitaciones'
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
          }
        ]}
      />

      <EntityDetails
        title="Inventario"
        action={
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            size="small"
            onClick={() => {
              setEditingItem(null);
              setIsFormOpen(true);
            }}
          >
            Nuevo Item
          </Button>
        }
      >
        {items.length === 0 ? (
          <EmptyState onAdd={() => setIsFormOpen(true)} />
        ) : (
          <TableContainer component={Paper} elevation={0}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell align="right">Cantidad</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.nombre}</TableCell>
                    <TableCell>{item.descripcion}</TableCell>
                    <TableCell align="right">{item.cantidad}</TableCell>
                    <TableCell>{item.estado}</TableCell>
                    <TableCell align="right">
                      <EntityActions
                        onEdit={() => handleEdit(item)}
                        onDelete={() => handleDelete(item.id)}
                        itemName={`el item ${item.nombre}`}
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
          setEditingItem(null);
        }}
        onSubmit={handleFormSubmit}
        title={editingItem ? 'Editar Item' : 'Nuevo Item'}
        fields={formFields}
        initialData={editingItem || {}}
        isEditing={!!editingItem}
      />
    </Container>
  );
}

export default Inventario;
