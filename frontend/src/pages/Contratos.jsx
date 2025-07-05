import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Container, 
  Button,
  Box,
  Grid,
  Paper,
  Chip,
  Typography,
  Dialog,
  IconButton,
  Tooltip
} from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon, ViewList as ListIcon, GridView as GridIcon } from '@mui/icons-material';
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
import { useNavigate, useLocation } from 'react-router-dom';

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
  const [activeFilter, setActiveFilter] = useState('activos'); // 'activos', 'finalizados' o 'todos'
  const [viewMode, setViewMode] = useState('list'); // 'list' o 'grid'
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    navigate('/');
  };

  // Escuchar el evento del Header para abrir el formulario
  useEffect(() => {
    const handleHeaderAddButton = (event) => {
      if (event.detail.type === 'contrato') {
        setEditingContrato(null);
        setIsFormOpen(true);
      }
    };

    window.addEventListener('headerAddButtonClicked', handleHeaderAddButton);

    return () => {
      window.removeEventListener('headerAddButtonClicked', handleHeaderAddButton);
    };
  }, []);

  // Función para cargar datos sin useCallback inicialmente
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Cargando datos relacionados...');

      // Agregamos un pequeño delay entre cada grupo de llamadas
      const [contratosRes, propiedadesRes] = await Promise.all([
        clienteAxios.get('/api/contratos'),
        clienteAxios.get('/api/propiedades')
      ]);

      await new Promise(resolve => setTimeout(resolve, 100));

      const [inquilinosRes, habitacionesRes] = await Promise.all([
        clienteAxios.get('/api/inquilinos'),
        clienteAxios.get('/api/habitaciones')
      ]);

      await new Promise(resolve => setTimeout(resolve, 100));

      const [cuentasRes, monedasRes] = await Promise.all([
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

      // Debug: Verificar si montoMensual está presente en los contratos
      console.log('Debug montoMensual en contratos:', contratos.map(c => ({
        id: c._id,
        montoMensual: c.montoMensual,
        tipo: typeof c.montoMensual,
        esMantenimiento: c.esMantenimiento
      })));

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
      if (err.message !== 'Solicitud cancelada por repetirse demasiado rápido') {
        setError('Error al cargar los datos. Por favor, intente nuevamente.');
        enqueueSnackbar('Error al cargar los datos', { variant: 'error' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Ahora envolvemos fetchData en useCallback
  const loadData = useCallback(fetchData, [enqueueSnackbar]);

  // Efecto para cargar datos iniciales
  useEffect(() => {
    const timer = setTimeout(loadData, 500);
    return () => clearTimeout(timer);
  }, [loadData]);

  // Efecto para manejar la navegación desde inquilinos
  useEffect(() => {
    if (location.state?.createContract && location.state?.inquilinoData) {
      const inquilinoData = location.state.inquilinoData;
      
      // Esperar a que se carguen los datos relacionados
      const checkDataAndOpenForm = () => {
        if (relatedData.propiedades.length > 0 && relatedData.cuentas.length > 0) {
          // Configurar el contrato con el inquilino pre-seleccionado
          setEditingContrato({
            inquilino: [inquilinoData],
            esMantenimiento: false,
            tipoContrato: 'ALQUILER'
          });
          setIsFormOpen(true);
          
          // Limpiar el state de navegación para evitar que se abra nuevamente
          navigate(location.pathname, { replace: true });
        } else {
          // Si los datos no están listos, esperar un poco más
          setTimeout(checkDataAndOpenForm, 100);
        }
      };
      
      checkDataAndOpenForm();
    }
  }, [location.state, relatedData, navigate, location.pathname]);

  // Efecto para manejar la navegación para editar un contrato específico
  useEffect(() => {
    if (location.state?.editContract && location.state?.contratoId) {
      const contratoId = location.state.contratoId;
      
      // Esperar a que se carguen los datos relacionados
      const checkDataAndOpenForm = () => {
        if (contratos.length > 0 && relatedData.propiedades.length > 0) {
          // Buscar el contrato específico
          const contrato = contratos.find(c => c._id === contratoId);
          if (contrato) {
            setEditingContrato(contrato);
            setIsFormOpen(true);
          }
          
          // Limpiar el state de navegación para evitar que se abra nuevamente
          navigate(location.pathname, { replace: true });
        } else {
          // Si los datos no están listos, esperar un poco más
          setTimeout(checkDataAndOpenForm, 100);
        }
      };
      
      checkDataAndOpenForm();
    }
  }, [location.state, contratos, relatedData, navigate, location.pathname]);

  const handleEdit = useCallback((contrato) => {
    console.log('Editando contrato:', contrato);
    
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
      if (editingContrato && (editingContrato._id || editingContrato.id)) {
        const contratoId = editingContrato._id || editingContrato.id;
        response = await clienteAxios.put(`/api/contratos/${contratoId}`, formData);
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

  // Función para actualizar estados de contratos
  const handleActualizarEstados = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await clienteAxios.post('/api/contratos/actualizar-estados');
      
      enqueueSnackbar(
        `Estados actualizados: ${response.data.resultado.actualizados} de ${response.data.resultado.procesados} contratos`,
        { variant: 'success' }
      );
      
      // Recargar los datos después de la actualización
      await loadData();
    } catch (error) {
      console.error('Error al actualizar estados:', error);
      enqueueSnackbar('Error al actualizar estados de contratos', { variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [enqueueSnackbar, loadData]);

  // Filtrar contratos según el filtro activo
  const contratosFiltrados = useMemo(() => {
    if (activeFilter === 'activos') {
      return contratos.filter(contrato => {
        const estado = contrato.estadoActual || contrato.estado;
        return ['ACTIVO', 'RESERVADO', 'PLANEADO', 'MANTENIMIENTO'].includes(estado);
      });
    } else if (activeFilter === 'finalizados') {
      return contratos.filter(contrato => {
        const estado = contrato.estadoActual || contrato.estado;
        return estado === 'FINALIZADO';
      });
    }
    return contratos.filter(contrato => {
      const estado = contrato.estadoActual || contrato.estado;
      return ['ACTIVO', 'RESERVADO', 'PLANEADO', 'MANTENIMIENTO'].includes(estado);
    });
  }, [contratos, activeFilter]);

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
          case 'FINALIZADO': return 'default';
          case 'PLANEADO': return 'info';
          case 'MANTENIMIENTO': return 'warning';
          default: return 'default';
        }
      })()
    })
  };

  const handleToggleView = () => {
    setViewMode((prev) => (prev === 'list' ? 'grid' : 'list'));
  };

  return (
    <Container maxWidth="xl">
      <EntityToolbar
        title="Contratos"
        onBack={handleBack}
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

      {/* Filtros de grupos */}
      <Box sx={{ mt: 2, mb: 2, display: 'flex', gap: 1 }}>
        <Chip
          label={`Contratos Activos (${contratos.filter(c => ['ACTIVO', 'RESERVADO', 'PLANEADO', 'MANTENIMIENTO'].includes(c.estadoActual || c.estado)).length})`}
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
          label={`Contratos Finalizados (${contratos.filter(c => (c.estadoActual || c.estado) === 'FINALIZADO').length})`}
          onClick={() => setActiveFilter('finalizados')}
          color={activeFilter === 'finalizados' ? 'primary' : 'default'}
          variant={activeFilter === 'finalizados' ? 'filled' : 'outlined'}
          sx={{ 
            borderRadius: 0,
            clipPath: 'polygon(0% 0%, 100% 0%, 98% 100%, 2% 100%)',
            fontWeight: 500
          }}
        />
      </Box>

      {contratosFiltrados.length === 0 ? (
        <EmptyState
          icon={DescriptionIcon}
          title={`No hay contratos ${activeFilter === 'activos' ? 'activos' : 'finalizados'}`}
          description={activeFilter === 'activos' ? 
            "No hay contratos activos, reservados, planeados o en mantenimiento" : 
            "No hay contratos finalizados"
          }
        />
      ) : (
        <ContratosView
          contratos={contratosFiltrados}
          relatedData={relatedData}
          onEdit={handleEdit}
          onDelete={handleDelete}
          viewMode={viewMode}
          onToggleView={handleToggleView}
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