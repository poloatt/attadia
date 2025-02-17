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
  BathtubOutlined as BathIcon,
  KitchenOutlined as KitchenIcon,
  WeekendOutlined as LivingIcon,
  YardOutlined as GardenIcon,
  DeckOutlined as TerraceIcon,
  LocalLaundryServiceOutlined as LaundryIcon,
  HomeWorkOutlined as StudioIcon,
  MeetingRoomOutlined as RoomIcon,
  HomeOutlined as HouseIcon,
  BusinessOutlined as OfficeIcon,
  StorefrontOutlined as StoreIcon,
  LandscapeOutlined as LandIcon
} from '@mui/icons-material';
import EmptyState from '../components/EmptyState';
import { EntityActions } from '../components/EntityViews/EntityActions';
import EntityGroupedCards from '../components/EntityViews/EntityGroupedCards';

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
      propiedadId: habitacion.propiedadId || habitacion.propiedad?._id || habitacion.propiedad?.id,
      tipo: habitacion.tipo,
      nombrePersonalizado: habitacion.nombrePersonalizado
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

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case 'BAÑO':
        return <BathIcon />;
      case 'TOILETTE':
        return <BathIcon />;
      case 'DORMITORIO_DOBLE':
      case 'DORMITORIO_SIMPLE':
        return <BedIcon />;
      case 'ESTUDIO':
        return <StudioIcon />;
      case 'COCINA':
        return <KitchenIcon />;
      case 'DESPENSA':
        return <KitchenIcon />;
      case 'SALA_PRINCIPAL':
        return <LivingIcon />;
      case 'PATIO':
      case 'JARDIN':
        return <GardenIcon />;
      case 'TERRAZA':
        return <TerraceIcon />;
      case 'LAVADERO':
        return <LaundryIcon />;
      default:
        return <RoomIcon />;
    }
  };

  const getPropiedadIcon = (tipo) => {
    switch (tipo) {
      case 'CASA':
        return <HouseIcon sx={{ fontSize: 20, color: 'text.secondary' }} />;
      case 'DEPARTAMENTO':
        return <BuildingIcon sx={{ fontSize: 20, color: 'text.secondary' }} />;
      case 'OFICINA':
        return <OfficeIcon sx={{ fontSize: 20, color: 'text.secondary' }} />;
      case 'LOCAL':
        return <StoreIcon sx={{ fontSize: 20, color: 'text.secondary' }} />;
      case 'TERRENO':
        return <LandIcon sx={{ fontSize: 20, color: 'text.secondary' }} />;
      default:
        return <BuildingIcon sx={{ fontSize: 20, color: 'text.secondary' }} />;
    }
  };

  const cardConfig = {
    groupBy: (habitacion) => {
      const propiedad = habitacion.propiedad?.titulo || 
        propiedades.find(p => p.id === habitacion.propiedadId)?.titulo || 
        'Sin Propiedad';
      const propiedadData = habitacion.propiedad || 
        propiedades.find(p => p.id === habitacion.propiedadId);
      return {
        key: propiedad,
        label: propiedad,
        icon: getPropiedadIcon(propiedadData?.tipo)
      };
    },
    getTitle: (habitacion) => {
      if (habitacion.tipo === 'OTRO') {
        return (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            width: '100%'
          }}>
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
              '& .MuiSvgIcon-root': {
                fontSize: '1rem',
                color: 'text.secondary'
              }
            }}>
              {getTipoIcon(habitacion.tipo)}
            </Box>
            <Typography 
              variant="subtitle2"
              sx={{ fontWeight: 500 }}
            >
              {habitacion.nombrePersonalizado}
            </Typography>
          </Box>
        );
      }
      const tipoLabel = formFields.find(f => f.name === 'tipo')?.options.find(opt => opt.value === habitacion.tipo)?.label;
      return (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          width: '100%'
        }}>
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            '& .MuiSvgIcon-root': {
              fontSize: '1rem',
              color: 'text.secondary'
            }
          }}>
            {getTipoIcon(habitacion.tipo)}
          </Box>
          <Typography 
            variant="subtitle2"
            sx={{ fontWeight: 500 }}
          >
            {tipoLabel || habitacion.tipo}
          </Typography>
        </Box>
      );
    },
    getDetails: () => [],
    getActions: (habitacion) => ({
      onEdit: () => handleEdit(habitacion),
      onDelete: () => handleDelete(habitacion.id),
      itemName: `la habitación "${habitacion.tipo === 'OTRO' ? habitacion.nombrePersonalizado : formFields.find(f => f.name === 'tipo')?.options.find(opt => opt.value === habitacion.tipo)?.label || habitacion.tipo}"`
    })
  };

  const formFields = [
    {
      name: 'propiedadId',
      label: 'Propiedad',
      type: 'relational',
      required: true,
      options: propiedades.map(p => ({
        value: p.id,
        label: p.titulo,
        icon: getPropiedadIcon(p.tipo)
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
      name: 'tipo',
      label: 'Tipo de Habitación',
      type: 'select',
      required: true,
      options: [
        { value: 'BAÑO', label: 'Baño', icon: <BathIcon /> },
        { value: 'TOILETTE', label: 'Toilette', icon: <BathIcon /> },
        { value: 'DORMITORIO_DOBLE', label: 'Dormitorio Doble', icon: <BedIcon /> },
        { value: 'DORMITORIO_SIMPLE', label: 'Dormitorio Simple', icon: <BedIcon /> },
        { value: 'ESTUDIO', label: 'Estudio', icon: <StudioIcon /> },
        { value: 'COCINA', label: 'Cocina', icon: <KitchenIcon /> },
        { value: 'DESPENSA', label: 'Despensa', icon: <KitchenIcon /> },
        { value: 'SALA_PRINCIPAL', label: 'Sala Principal', icon: <LivingIcon /> },
        { value: 'PATIO', label: 'Patio', icon: <GardenIcon /> },
        { value: 'JARDIN', label: 'Jardín', icon: <GardenIcon /> },
        { value: 'TERRAZA', label: 'Terraza', icon: <TerraceIcon /> },
        { value: 'LAVADERO', label: 'Lavadero', icon: <LaundryIcon /> },
        { divider: true },
        { value: 'OTRO', label: 'Otro tipo...', icon: <RoomIcon /> }
      ]
    },
    {
      name: 'nombrePersonalizado',
      label: 'Especificar tipo',
      type: 'text',
      placeholder: 'Ej: Sala de juegos, Gimnasio, etc.',
      helperText: 'Ingresa el nombre del tipo de habitación personalizado',
      hidden: formData => formData.tipo !== 'OTRO',
      required: false,
      validate: (value, formData) => {
        if (formData.tipo === 'OTRO' && (!value || value.trim() === '')) {
          return 'Debes especificar el tipo de habitación';
        }
        return '';
      }
    }
  ];

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
          <EntityGroupedCards 
            data={habitaciones}
            config={cardConfig}
            gridProps={{
              xs: 12,
              sm: 6,
              md: 4,
              lg: 3
            }}
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