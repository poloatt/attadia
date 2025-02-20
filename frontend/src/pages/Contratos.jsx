import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container, 
  Button,
  Box,
  Grid,
  Paper,
  Chip,
  Typography,
  Dialog
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { 
  ApartmentOutlined as BuildingIcon,
  BedOutlined as BedIcon,
  PeopleOutlined as PeopleIcon,
  Inventory2Outlined as InventoryIcon,
  DescriptionOutlined as DescriptionIcon,
  CalendarTodayOutlined as CalendarIcon,
  AttachMoneyOutlined as MoneyIcon,
  HomeWorkOutlined as HomeIcon,
  PersonOutlineOutlined as PersonIcon
} from '@mui/icons-material';
import EntityToolbar from '../components/EntityToolbar';
import EntityDetails from '../components/EntityViews/EntityDetails';
import ContratoForm from '../components/contratos/ContratoForm';
import { useSnackbar } from 'notistack';
import clienteAxios from '../config/axios';
import EmptyState from '../components/EmptyState';
import { EntityActions } from '../components/EntityViews/EntityActions';
import EntityCards from '../components/EntityViews/EntityCards';
import ContratosView from '../components/contratos/ContratosView';

export function Contratos() {
  const [contratos, setContratos] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContrato, setEditingContrato] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [relatedData, setRelatedData] = useState({
    propiedades: [],
    inquilinos: [],
    habitaciones: [],
    cuentas: [],
    monedas: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { enqueueSnackbar } = useSnackbar();

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Cargar todos los datos en paralelo
      const [
        contratosRes,
        propiedadesRes,
        inquilinosRes,
        habitacionesRes,
        cuentasRes,
        monedasRes
      ] = await Promise.all([
        clienteAxios.get('/contratos'),
        clienteAxios.get('/propiedades'),
        clienteAxios.get('/inquilinos'),
        clienteAxios.get('/habitaciones'),
        clienteAxios.get('/cuentas'),
        clienteAxios.get('/monedas')
      ]);

      setContratos(contratosRes.data.docs || []);
      setRelatedData({
        propiedades: propiedadesRes.data.docs || [],
        inquilinos: inquilinosRes.data.docs || [],
        habitaciones: habitacionesRes.data.docs || [],
        cuentas: cuentasRes.data.docs || [],
        monedas: monedasRes.data.docs || []
      });
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar los datos. Por favor, intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEdit = useCallback((contrato) => {
    console.log('Editando contrato:', contrato);
    // Asegurarse de que todos los datos relacionados estén cargados antes de abrir el formulario
    if (relatedData.propiedades.length === 0 || 
        relatedData.inquilinos.length === 0 || 
        relatedData.cuentas.length === 0) {
      loadData().then(() => {
        setEditingContrato(contrato);
        setIsFormOpen(true);
      });
    } else {
      setEditingContrato(contrato);
      setIsFormOpen(true);
    }
  }, [relatedData, loadData]);

  const handleDelete = useCallback(async (id) => {
    try {
      await clienteAxios.delete(`/contratos/${id}`);
      enqueueSnackbar('Contrato eliminado exitosamente', { variant: 'success' });
      await loadData();
    } catch (error) {
      console.error('Error al eliminar contrato:', error);
      enqueueSnackbar('Error al eliminar el contrato', { variant: 'error' });
    }
  }, [enqueueSnackbar, loadData]);

  const handleFormSubmit = async (formData) => {
    try {
      setIsSaving(true);
      console.log('Datos a enviar:', formData);
      
      let response;
      if (editingContrato) {
        response = await clienteAxios.put(`/contratos/${editingContrato._id}`, formData);
        enqueueSnackbar('Contrato actualizado exitosamente', { variant: 'success' });
      } else {
        response = await clienteAxios.post('/contratos', formData);
        enqueueSnackbar('Contrato creado exitosamente', { variant: 'success' });
      }

      await loadData();
      setIsFormOpen(false);
      setEditingContrato(null);
    } catch (error) {
      console.error('Error al guardar contrato:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Error al guardar el contrato';
      enqueueSnackbar(errorMessage, { variant: 'error' });
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const cardConfig = {
    renderIcon: () => <DescriptionIcon />,
    getTitle: (contrato) => {
      const propiedad = relatedData.propiedades.find(p => p._id === contrato.propiedad);
      return propiedad?.titulo || 'N/A';
    },
    getDetails: (contrato) => [
      {
        icon: <PersonIcon />,
        text: (() => {
          const inquilino = relatedData.inquilinos.find(i => i._id === contrato.inquilino);
          return inquilino ? `${inquilino.nombre} ${inquilino.apellido}` : 'N/A';
        })(),
        noWrap: true
      },
      {
        icon: <CalendarIcon />,
        text: `${new Date(contrato.fechaInicio).toLocaleDateString()} - ${new Date(contrato.fechaFin).toLocaleDateString()}`
      },
      {
        icon: <MoneyIcon />,
        text: (() => {
          const moneda = relatedData.monedas.find(m => m._id === contrato.moneda);
          return `${moneda?.simbolo || ''} ${contrato.montoMensual}`;
        })()
      },
      {
        icon: <HomeIcon />,
        text: (() => {
          const habitacion = relatedData.habitaciones.find(h => h._id === contrato.habitacion);
          return habitacion?.nombre || 'N/A';
        })()
      }
    ],
    getStatus: (contrato) => ({
      label: contrato.estado,
      color: (() => {
        switch (contrato.estado) {
          case 'ACTIVO': return 'success';
          case 'FINALIZADO': return 'error';
          case 'PLANEADO': return 'info';
          case 'MANTENIMIENTO': return 'warning';
          default: return 'default';
        }
      })()
    })
  };

  return (
    <Container maxWidth="xl">
      <EntityToolbar
        title="Contratos"
        onAdd={() => {
          setEditingContrato(null);
          setIsFormOpen(true);
        }}
        searchPlaceholder="Buscar contratos..."
        navigationItems={[
          {
            icon: <BuildingIcon sx={{ fontSize: 21.6 }} />,
            label: 'Propiedades',
            to: '/propiedades'
          },
          {
            icon: <BedIcon sx={{ fontSize: 21.6 }} />,
            label: 'Habitaciones',
            to: '/habitaciones'
          },
          {
            icon: <PeopleIcon sx={{ fontSize: 21.6 }} />,
            label: 'Inquilinos',
            to: '/inquilinos'
          },
          {
            icon: <InventoryIcon sx={{ fontSize: 21.6 }} />,
            label: 'Inventario',
            to: '/inventario'
          }
        ]}
      />

      {contratos.length === 0 ? (
        <EmptyState
          icon={DescriptionIcon}
          title="No hay contratos"
          description="Comienza creando un nuevo contrato"
        />
      ) : (
        <ContratosView
          contratos={contratos}
          relatedData={relatedData}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {isFormOpen && (
        <ContratoForm
          initialData={editingContrato || {}}
          relatedData={relatedData}
          onSubmit={handleFormSubmit}
          onClose={() => {
            if (!isSaving) {
              setIsFormOpen(false);
              setEditingContrato(null);
            }
          }}
          isSaving={isSaving}
        />
      )}
    </Container>
  );
}

export default Contratos; 