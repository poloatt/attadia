import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Box,
  Chip
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { InquilinoList, InquilinoForm } from '../components/inquilinos';
import EntityDetails from '../components/EntityViews/EntityDetails';
import EntityToolbar from '../components/EntityToolbar';
import {
  ApartmentOutlined as BuildingIcon,
  BedOutlined as BedIcon,
  DescriptionOutlined as ContratosIcon,
  Inventory2Outlined as InventoryIcon
} from '@mui/icons-material';
import clienteAxios from '../config/axios';
import { useNavigate } from 'react-router-dom';

export function Inquilinos() {
  const [inquilinos, setInquilinos] = useState([]);
  const [propiedades, setPropiedades] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [selectedInquilino, setSelectedInquilino] = useState(null);
  const [activeFilter, setActiveFilter] = useState('activos'); // 'activos', 'inactivos', 'todos'
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/');
  };

  // Cargar inquilinos
  const fetchInquilinos = async (propiedadId = null) => {
    setIsLoading(true);
    try {
      const url = propiedadId 
        ? `/api/inquilinos?propiedad=${propiedadId}`
        : '/api/inquilinos';
      const response = await clienteAxios.get(url);
      console.log('Inquilinos obtenidos:', response.data.docs);
      setInquilinos(response.data.docs);
    } catch (error) {
      console.error('Error al cargar inquilinos:', error);
      enqueueSnackbar('Error al cargar inquilinos', { variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar propiedades
  const fetchPropiedades = async () => {
    try {
      const response = await clienteAxios.get('/api/propiedades');
      setPropiedades(response.data.docs);
    } catch (error) {
      console.error('Error al cargar propiedades:', error);
      enqueueSnackbar('Error al cargar propiedades', { variant: 'error' });
    }
  };

  useEffect(() => {
    fetchInquilinos();
    fetchPropiedades();
  }, []);

  const handleSubmit = async (formData) => {
    try {
      if (selectedInquilino) {
        await clienteAxios.put(`/api/inquilinos/${selectedInquilino._id}`, formData);
        enqueueSnackbar('Inquilino actualizado correctamente', { variant: 'success' });
      } else {
        await clienteAxios.post('/api/inquilinos', formData);
        enqueueSnackbar('Inquilino creado correctamente', { variant: 'success' });
      }
      fetchInquilinos();
      handleCloseForm();
    } catch (error) {
      console.error('Error al guardar inquilino:', error);
      throw error;
    }
  };

  const handleEdit = (inquilino) => {
    setSelectedInquilino(inquilino);
    setOpenForm(true);
  };

  const handleDelete = async (inquilino) => {
    if (!window.confirm('¿Estás seguro de eliminar este inquilino?')) return;
    
    try {
      await clienteAxios.delete(`/api/inquilinos/${inquilino._id}`);
      enqueueSnackbar('Inquilino eliminado correctamente', { variant: 'success' });
      fetchInquilinos();
    } catch (error) {
      console.error('Error al eliminar inquilino:', error);
      enqueueSnackbar('Error al eliminar el inquilino', { variant: 'error' });
    }
  };

  const handleCloseForm = () => {
    setSelectedInquilino(null);
    setOpenForm(false);
  };

  const handleCreateContract = (inquilino) => {
    // Navegar a la página de contratos con los datos del inquilino pre-llenados
    navigate('/contratos', {
      state: {
        createContract: true,
        inquilinoData: inquilino
      }
    });
  };

  // Filtrar inquilinos según el filtro activo
  const inquilinosFiltrados = useMemo(() => {
    if (activeFilter === 'activos') {
      return inquilinos.filter(inquilino => {
        const estado = inquilino.estado || 'PENDIENTE';
        return ['ACTIVO', 'RESERVADO', 'PENDIENTE'].includes(estado);
      });
    } else if (activeFilter === 'inactivos') {
      return inquilinos.filter(inquilino => {
        const estado = inquilino.estado || 'PENDIENTE';
        return ['INACTIVO', 'SIN_CONTRATO'].includes(estado);
      });
    } else {
      return inquilinos; // 'todos'
    }
  }, [inquilinos, activeFilter]);

  return (
    <Container maxWidth={false}>
      <EntityToolbar
        onAdd={() => setOpenForm(true)}
        onBack={handleBack}
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
            icon: <ContratosIcon sx={{ fontSize: 20 }} />,
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

      {/* Filtros de grupos */}
      <Box sx={{ mt: 2, mb: 2, display: 'flex', gap: 1 }}>
        <Chip
          label={`Inquilinos Activos (${inquilinos.filter(i => ['ACTIVO', 'RESERVADO', 'PENDIENTE'].includes(i.estado || 'PENDIENTE')).length})`}
          onClick={() => setActiveFilter('activos')}
          color={activeFilter === 'activos' ? 'primary' : 'default'}
          variant={activeFilter === 'activos' ? 'filled' : 'outlined'}
          sx={{ 
            borderRadius: 0,
            clipPath: 'polygon(0% 0%, 100% 0%, 98% 100%, 2% 100%)',
            fontWeight: 500
          }}
        />
        <Chip
          label={`Inquilinos Inactivos (${inquilinos.filter(i => ['INACTIVO', 'SIN_CONTRATO'].includes(i.estado || 'PENDIENTE')).length})`}
          onClick={() => setActiveFilter('inactivos')}
          color={activeFilter === 'inactivos' ? 'primary' : 'default'}
          variant={activeFilter === 'inactivos' ? 'filled' : 'outlined'}
          sx={{ 
            borderRadius: 0,
            clipPath: 'polygon(0% 0%, 100% 0%, 98% 100%, 2% 100%)',
            fontWeight: 500
          }}
        />
        <Chip
          label={`Todos los Inquilinos (${inquilinos.length})`}
          onClick={() => setActiveFilter('todos')}
          color={activeFilter === 'todos' ? 'primary' : 'default'}
          variant={activeFilter === 'todos' ? 'filled' : 'outlined'}
          sx={{ 
            borderRadius: 0,
            clipPath: 'polygon(0% 0%, 100% 0%, 98% 100%, 2% 100%)',
            fontWeight: 500
          }}
        />
      </Box>

      <Box sx={{ py: 2 }}>
        <EntityDetails>
          <InquilinoList
            inquilinos={inquilinosFiltrados}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onCreateContract={handleCreateContract}
          />
        </EntityDetails>
      </Box>

      <InquilinoForm
        open={openForm}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
        initialData={selectedInquilino}
        propiedades={propiedades}
      />
    </Container>
  );
}

export default Inquilinos;
