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

      console.log('Cargando datos relacionados...');

      // Cargar todos los datos en paralelo
      const [
        contratosRes,
        propiedadesRes,
        inquilinosRes,
        habitacionesRes,
        cuentasRes,
        monedasRes
      ] = await Promise.all([
        clienteAxios.get('/api/contratos'),
        clienteAxios.get('/api/propiedades'),
        clienteAxios.get('/api/inquilinos'),
        clienteAxios.get('/api/habitaciones'),
        clienteAxios.get('/api/cuentas'),
        clienteAxios.get('/api/monedas')
      ]);

      const contratos = contratosRes.data.docs || [];
      const propiedades = propiedadesRes.data.docs || [];
      const inquilinos = inquilinosRes.data.docs || [];
      const habitaciones = habitacionesRes.data.docs || [];
      const cuentas = cuentasRes.data.docs || [];
      const monedas = monedasRes.data.docs || [];

      console.log('Datos cargados:', {
        contratos: contratos.length,
        propiedades: propiedades.length,
        inquilinos: inquilinos.length,
        habitaciones: habitaciones.length,
        cuentas: cuentas.length,
        monedas: monedas.length
      });

      // Verificar que los contratos tengan la información de cuenta
      contratos.forEach(contrato => {
        if (contrato.cuenta) {
          console.log(`Contrato ${contrato._id} tiene cuenta:`, contrato.cuenta);
        } else {
          console.log(`Contrato ${contrato._id} NO tiene cuenta`);
        }
      });

      setContratos(contratos);
      setRelatedData({
        propiedades,
        inquilinos,
        habitaciones,
        cuentas,
        monedas
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
    console.log('Cuenta del contrato:', contrato.cuenta);
    
    // Asegurarse de que todos los datos relacionados estén cargados antes de abrir el formulario
    if (relatedData.propiedades.length === 0 || 
        relatedData.inquilinos.length === 0 || 
        relatedData.cuentas.length === 0) {
      loadData().then(() => {
        console.log('Datos relacionados cargados:', {
          propiedades: relatedData.propiedades.length,
          inquilinos: relatedData.inquilinos.length,
          cuentas: relatedData.cuentas.length,
          monedas: relatedData.monedas.length
        });
        setEditingContrato(contrato);
        setIsFormOpen(true);
      });
    } else {
      console.log('Datos relacionados ya cargados:', {
        propiedades: relatedData.propiedades.length,
        inquilinos: relatedData.inquilinos.length,
        cuentas: relatedData.cuentas.length,
        monedas: relatedData.monedas.length
      });
      setEditingContrato(contrato);
      setIsFormOpen(true);
    }
  }, [relatedData, loadData]);

  const handleDelete = useCallback(async (id) => {
    try {
      await clienteAxios.delete(`/api/contratos/${id}`);
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
      
      // Asegurarse de que la cuenta esté presente si no es un contrato de mantenimiento
      if (!formData.esMantenimiento && !formData.cuenta && editingContrato?.cuenta) {
        console.log('Agregando cuenta del contrato existente:', editingContrato.cuenta);
        formData.cuenta = typeof editingContrato.cuenta === 'object' ? 
          (editingContrato.cuenta._id || editingContrato.cuenta.id) : 
          editingContrato.cuenta;
      }
      
      let response;
      if (editingContrato) {
        response = await clienteAxios.put(`/api/contratos/${editingContrato._id}`, formData);
        enqueueSnackbar('Contrato actualizado exitosamente', { variant: 'success' });
      } else {
        response = await clienteAxios.post('/api/contratos', formData);
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