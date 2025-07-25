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
import { useSnackbar } from 'notistack';
import clienteAxios from '../config/axios';
import { 
  ApartmentOutlined as BuildingIcon,
  BedOutlined as BedIcon,
  PeopleOutlined as PeopleIcon,
  DescriptionOutlined as DescriptionIcon,
  AccountBalanceWalletOutlined as WalletIcon
} from '@mui/icons-material';
import { EmptyState, CommonConstruction } from '../components/common';
import { useNavigate } from 'react-router-dom';
import { CommonDetails, CommonForm, CommonActions } from '../components/common';
import { Toolbar } from '../navigation';

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
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/');
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInventario();
      fetchHabitaciones();
      fetchPropiedades();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const fetchInventario = async () => {
    try {
      const response = await clienteAxios.get('/api/inventarios');
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
      let url = '/api/habitaciones';
      if (propiedadId) {
        url = `/api/habitaciones/propiedad/${propiedadId}`;
      }
      const response = await clienteAxios.get(url);
      const habitacionesData = propiedadId ? response.data.docs : (response.data.docs || []);
      
      if (propiedadId) {
        setHabitacionesDisponibles(habitacionesData);
      } else {
        setHabitaciones(habitacionesData);
        setHabitacionesDisponibles(habitacionesData);
      }
    } catch (error) {
      console.error('Error al cargar habitaciones:', error);
      enqueueSnackbar('Error al cargar habitaciones', { variant: 'error' });
    }
  };

  const fetchPropiedades = async () => {
    try {
      const response = await clienteAxios.get('/api/propiedades');
      setPropiedades(response.data.docs || []);
    } catch (error) {
      console.error('Error al cargar propiedades:', error);
      enqueueSnackbar('Error al cargar propiedades', { variant: 'error' });
    }
  };

  const handleCreateHabitacion = async (formData) => {
    try {
      const response = await clienteAxios.post('/api/habitaciones', formData);
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
        response = await clienteAxios.post('/api/inventarios', formData);
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
      await clienteAxios.delete(`/api/inventarios/${id}`);
      enqueueSnackbar('Item eliminado exitosamente', { variant: 'success' });
      await fetchInventario();
    } catch (error) {
      console.error('Error al eliminar item:', error);
      enqueueSnackbar('Error al eliminar el item', { variant: 'error' });
    }
  }, [enqueueSnackbar, fetchInventario]);

  // Escuchar evento del Header para abrir formulario
  useEffect(() => {
    const handleHeaderAddButton = (event) => {
      if (event.detail?.type === 'inventario') {
        setEditingItem(null);
        setIsFormOpen(true);
      }
    };

    window.addEventListener('headerAddButtonClicked', handleHeaderAddButton);
    return () => window.removeEventListener('headerAddButtonClicked', handleHeaderAddButton);
  }, []);

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
    <Box sx={{
      width: '100%',
      maxWidth: 900,
      mx: 'auto',
      px: { xs: 1, sm: 2, md: 3 },
      py: 2,
      pb: { xs: 10, sm: 4 },
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      gap: 0
    }}>
      <CommonDetails
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
        <CommonConstruction />
      </CommonDetails>

      <CommonForm
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
    </Box>
  );
}

export default Inventario;