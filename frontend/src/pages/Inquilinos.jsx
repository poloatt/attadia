import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container, 
  Button,
  Box,
  Grid,
  Paper,
  Chip,
  Avatar,
  Typography,
  IconButton,
  Tooltip
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { 
  ApartmentOutlined as BuildingIcon,
  BedOutlined as BedIcon,
  DescriptionOutlined as DescriptionIcon,
  Inventory2Outlined as InventoryIcon,
  EmailOutlined as EmailIcon,
  PhoneOutlined as PhoneIcon,
  BadgeOutlined as BadgeIcon
} from '@mui/icons-material';
import EntityToolbar from '../components/EntityToolbar';
import EntityDetails from '../components/EntityViews/EntityDetails';
import EntityForm from '../components/EntityViews/EntityForm';
import { useSnackbar } from 'notistack';
import clienteAxios from '../config/axios';
import EmptyState from '../components/EmptyState';
import { EntityActions } from '../components/EntityViews/EntityActions';
import EntityCards from '../components/EntityViews/EntityCards';

export function Inquilinos() {
  const [inquilinos, setInquilinos] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInquilino, setEditingInquilino] = useState(null);
  const { enqueueSnackbar } = useSnackbar();

  const fetchInquilinos = useCallback(async () => {
    try {
      const response = await clienteAxios.get('/api/inquilinos');
      setInquilinos(response.data.docs || []);
    } catch (error) {
      console.error('Error al cargar inquilinos:', error);
      enqueueSnackbar('Error al cargar inquilinos', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchInquilinos();
  }, [fetchInquilinos]);

  const handleFormSubmit = async (formData) => {
    try {
      let response;
      if (editingInquilino) {
        response = await clienteAxios.put(`/inquilinos/${editingInquilino.id}`, formData);
        enqueueSnackbar('Inquilino actualizado exitosamente', { variant: 'success' });
      } else {
        response = await clienteAxios.post('/api/inquilinos', formData);
        enqueueSnackbar('Inquilino creado exitosamente', { variant: 'success' });
      }
      setIsFormOpen(false);
      setEditingInquilino(null);
      await fetchInquilinos();
    } catch (error) {
      console.error('Error:', error);
      enqueueSnackbar(
        error.response?.data?.error || 'Error al guardar el inquilino', 
        { variant: 'error' }
      );
    }
  };

  const handleEdit = useCallback((inquilino) => {
    setEditingInquilino(inquilino);
    setIsFormOpen(true);
  }, []);

  const handleDelete = useCallback(async (id) => {
    try {
      await clienteAxios.delete(`/inquilinos/${id}`);
      enqueueSnackbar('Inquilino eliminado exitosamente', { variant: 'success' });
      await fetchInquilinos();
    } catch (error) {
      console.error('Error al eliminar inquilino:', error);
      enqueueSnackbar('Error al eliminar el inquilino', { variant: 'error' });
    }
  }, [enqueueSnackbar, fetchInquilinos]);

  const formFields = [
    {
      name: 'nombre',
      label: 'Nombre',
      required: true
    },
    {
      name: 'apellido',
      label: 'Apellido',
      required: true
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true
    },
    {
      name: 'telefono',
      label: 'Teléfono',
      required: true
    },
    {
      name: 'dni',
      label: 'DNI/Pasaporte',
      required: true
    },
    {
      name: 'nacionalidad',
      label: 'Nacionalidad',
      required: true
    },
    {
      name: 'ocupacion',
      label: 'Ocupación'
    },
    {
      name: 'estado',
      label: 'Estado',
      type: 'select',
      required: true,
      options: [
        { value: 'ACTIVO', label: 'Activo' },
        { value: 'INACTIVO', label: 'Inactivo' },
        { value: 'PENDIENTE', label: 'Pendiente' }
      ]
    }
  ];

  const cardConfig = {
    getAvatarText: (inquilino) => 
      `${inquilino.nombre?.charAt(0) || ''}${inquilino.apellido?.charAt(0) || ''}`,
    getTitle: (inquilino) => `${inquilino.nombre} ${inquilino.apellido}`,
    getDetails: (inquilino) => [
      {
        icon: <EmailIcon />,
        text: inquilino.email,
        noWrap: true
      },
      {
        icon: <PhoneIcon />,
        text: inquilino.telefono
      },
      {
        icon: <BadgeIcon />,
        text: inquilino.dni
      }
    ],
    getStatus: (inquilino) => ({
      label: inquilino.estado,
      color: inquilino.estado === 'ACTIVO' ? 'success' :
             inquilino.estado === 'INACTIVO' ? 'error' : 'warning'
    }),
    getActions: (inquilino) => ({
      onEdit: () => handleEdit(inquilino),
      onDelete: () => handleDelete(inquilino.id),
      itemName: `el inquilino ${inquilino.nombre} ${inquilino.apellido}`
    })
  };

  return (
    <Container maxWidth="lg">
      <EntityToolbar
        onAdd={() => {
          setEditingInquilino(null);
          setIsFormOpen(true);
        }}
        searchPlaceholder="Buscar inquilinos..."
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
        title="Inquilinos"
        action={
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            size="small"
            onClick={() => {
              setEditingInquilino(null);
              setIsFormOpen(true);
            }}
            sx={{ borderRadius: 0 }}
          >
            Nuevo Inquilino
          </Button>
        }
      >
        {inquilinos.length === 0 ? (
          <EmptyState onAdd={() => setIsFormOpen(true)} />
        ) : (
          <EntityCards 
            data={inquilinos}
            config={cardConfig}
          />
        )}
      </EntityDetails>

      <EntityForm
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingInquilino(null);
        }}
        onSubmit={handleFormSubmit}
        title={editingInquilino ? 'Editar Inquilino' : 'Nuevo Inquilino'}
        fields={formFields}
        initialData={editingInquilino || {}}
        isEditing={!!editingInquilino}
      />
    </Container>
  );
}

export default Inquilinos;