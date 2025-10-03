import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container, Button, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, Chip,
  Box, Typography, Grid, IconButton
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

import { CommonDetails, CommonForm, CommonActions } from '@shared/components/common';
import { CommonGrid } from '@shared/components/common';
import { HabitacionesForm } from '../propiedades';
import { snackbar } from '@shared/components/common';
import clienteAxios from '@shared/config/axios';
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
import { EmptyState } from '@shared/components/common';
import { useLocation, useNavigate } from 'react-router-dom';
import { useFormManager } from '@shared/context/FormContext';
import { Toolbar } from '@shared/navigation';

export function Habitaciones() {
  const [habitaciones, setHabitaciones] = useState([]);
  const [propiedades, setPropiedades] = useState([]);
  const [loading, setLoading] = useState(true);
  // Usar snackbar unificado
  const location = useLocation();
  const navigate = useNavigate();
  // --- NUEVO: Contexto de formularios ---
  const { openForm, closeForm, getFormState } = useFormManager();
  const { open, initialData } = getFormState('habitacion');

  const handleBack = () => {
    navigate('/');
  };

  // Eliminar el useEffect de headerAddButtonClicked

  const fetchHabitaciones = useCallback(async () => {
    try {
      setLoading(true);
      const response = await clienteAxios.get('/api/habitaciones');
      setHabitaciones(response.data.docs || []);
    } catch (error) {
      console.error('Error al cargar habitaciones:', error);
      snackbar.error('Error al cargar habitaciones');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPropiedades = useCallback(async () => {
    try {
      const response = await clienteAxios.get('/api/propiedades');
      setPropiedades(response.data.docs || []);
    } catch (error) {
      console.error('Error al cargar propiedades:', error);
      snackbar.error('Error al cargar propiedades');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchHabitaciones();
      fetchPropiedades();
    }, 500);

    return () => clearTimeout(timer);
  }, [fetchHabitaciones, fetchPropiedades]);

  // Abrir formulario tras redirección si openAdd está en el estado
  useEffect(() => {
    if (location.state?.openAdd) {
      openForm('habitacion');
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, openForm, navigate]);

  // Escuchar evento del Header para abrir formulario
  useEffect(() => {
    const handleHeaderAddButton = (event) => {
      if (
        (event.detail?.path && event.detail.path === location.pathname) ||
        event.detail?.type === 'habitacion'
      ) {
        openForm('habitacion');
      }
    };
    window.addEventListener('headerAddButtonClicked', handleHeaderAddButton);
    return () => window.removeEventListener('headerAddButtonClicked', handleHeaderAddButton);
  }, [openForm, location.pathname]);

  const handleCreatePropiedad = async (data) => {
    try {
      const response = await clienteAxios.post('/api/propiedades', data);
      setPropiedades(prev => [...prev, response.data]);
      snackbar.success('Propiedad creada exitosamente');
      return response.data;
    } catch (error) {
      console.error('Error al crear propiedad:', error);
      snackbar.error('Error al crear la propiedad');
      throw error;
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      console.log('Enviando datos:', formData);
      let response;
      if (initialData) { // Si estamos editando
        response = await clienteAxios.put(`/api/habitaciones/${initialData.id}`, formData);
        setHabitaciones(prev => prev.map(h => h.id === initialData.id ? response.data : h));
      } else { // Si estamos creando
        response = await clienteAxios.post('/api/habitaciones', formData);
        setHabitaciones(prev => [...prev, response.data]);
      }
      closeForm('habitacion');
      snackbar.success('Habitación guardada exitosamente');
      await fetchHabitaciones();
    } catch (error) {
      console.error('Error:', error);
      snackbar.error(error.response?.data?.error || 'Error al guardar la habitación');
    }
  };

  const handleMultipleHabitacionesSubmit = async (habitacionesData) => {
    try {
      console.log('Enviando múltiples habitaciones:', habitacionesData);
      
      // Crear todas las habitaciones en paralelo
      const promises = habitacionesData.map(habitacionData => 
        clienteAxios.post('/api/habitaciones', habitacionData)
      );
      
      const responses = await Promise.all(promises);
      const nuevasHabitaciones = responses.map(response => response.data);
      
      setHabitaciones(prev => [...prev, ...nuevasHabitaciones]);
      closeForm('habitacion');
      
      await fetchHabitaciones();
    } catch (error) {
      console.error('Error al crear múltiples habitaciones:', error);
      throw error;
    }
  };

  const handleEdit = useCallback((habitacion) => {
    openForm('habitacion', {
      ...habitacion,
      propiedadId: habitacion.propiedadId || habitacion.propiedad?._id || habitacion.propiedad?.id,
      tipo: habitacion.tipo,
      nombrePersonalizado: habitacion.nombrePersonalizado
    });
  }, [openForm]);

  const handleDelete = useCallback(async (id) => {
    try {
      await clienteAxios.delete(`/api/habitaciones/${id}`);
      setHabitaciones(prev => prev.filter(h => h.id !== id));
      snackbar.success('Habitación eliminada exitosamente');
    } catch (error) {
      console.error('Error al eliminar habitación:', error);
      snackbar.error('Error al eliminar la habitación');
    }
  }, []);

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
    <Box sx={{ px: 0, width: '100%' }}>

      {/* Eliminar <Toolbar /> */}

      <CommonDetails
        title="Habitaciones"
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              variant="outlined" 
              startIcon={<AddIcon />} 
              size="small"
              onClick={() => {
                openForm('habitacion');
              }}
              sx={{ borderRadius: 0 }}
            >
              Múltiples
            </Button>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />} 
              size="small"
              onClick={() => {
                openForm('habitacion');
              }}
              sx={{ borderRadius: 0 }}
            >
              Nueva Habitación
            </Button>
          </Box>
        }
      >
        {habitaciones.length === 0 ? (
          <EmptyState onAdd={() => openForm('habitacion')} />
        ) : (
          <CommonGrid
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
      </CommonDetails>

      <CommonForm
        open={false} // Desactivado, solo usar HabitacionesForm para alta
        onClose={() => {}}
        onSubmit={() => {}}
        title={''}
        fields={[]}
        initialData={{}}
        isEditing={false}
      />

      <HabitacionesForm
        open={open}
        onClose={() => closeForm('habitacion')}
        onSubmit={handleMultipleHabitacionesSubmit}
        propiedades={propiedades}
        initialPropiedadId={initialData?.propiedadId}
      />
    </Box>
  );
}

export default Habitaciones; 