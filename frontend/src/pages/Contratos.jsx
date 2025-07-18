import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Box,
  Typography,
  IconButton,
  Collapse,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';
import { 
  DescriptionOutlined as DescriptionIcon,
  CalendarTodayOutlined as CalendarIcon,
  AttachMoneyOutlined as MoneyIcon,
  HomeWorkOutlined as HomeIcon,
  PersonOutlineOutlined as PersonIcon,
  AutoAwesome as WizardIcon,
  Edit as EditIcon
} from '@mui/icons-material';

import ContratoForm from '../components/propiedades/contratos/ContratoForm';
import { ContratoWizard } from '../components/propiedades/contratos';
import { useSnackbar } from 'notistack';
import clienteAxios from '../config/axios';
import EmptyState from '../components/EmptyState';
import { ContratosContainer, useContratoData } from '../components/propiedades/contratos';
import { useNavigate, useLocation } from 'react-router-dom';
import { calcularAlquilerMensualPromedio } from '../components/propiedades/contratos/contratoUtils';
import EntityToolbar from '../components/EntityToolbar';

export function Contratos() {
  const [contratos, setContratos] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
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
  const [useWizard, setUseWizard] = useState(true); // Por defecto usar wizard
  const [showFormChoice, setShowFormChoice] = useState(false);

  const [viewMode] = useState('grid'); // 'list' o 'grid'
  const [isActiveContractsExpanded, setIsActiveContractsExpanded] = useState(true);
  const [isFinishedContractsExpanded, setIsFinishedContractsExpanded] = useState(false);
  const [isPlannedContractsExpanded, setIsPlannedContractsExpanded] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const location = useLocation();

  // Escuchar el evento del Header para abrir el selector de formulario
  useEffect(() => {
    const handleHeaderAddButton = (event) => {
      if (event.detail.type === 'contrato') {
        setEditingContrato(null);
        // Abrir el selector de formulario en lugar de abrir directamente
        setShowFormChoice(true);
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

      // Todas las llamadas en paralelo
      const [
        contratosRes,
        propiedadesRes,
        inquilinosRes,
        habitacionesRes,
        cuentasRes,
        monedasRes
      ] = await Promise.all([
        clienteAxios.get('/api/contratos/estado-actual'),
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

  // Evitar doble carga en StrictMode (React 18)
  const isFirstLoad = useRef(true);
  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      loadData();
    }
  }, [loadData]);

  // Efecto para manejar la navegación desde inquilinos
  useEffect(() => {
    if (location.state?.createContract && location.state?.inquilinoData) {
      const inquilinoData = location.state.inquilinoData;
      
      // Esperar a que se carguen los datos relacionados
      const checkDataAndOpenForm = () => {
        if (relatedData.propiedades.length > 0 && relatedData.cuentas.length > 0) {
          // Configurar el contrato con el inquilino pre-seleccionado
          const initialData = {
            inquilino: [inquilinoData],
            esMantenimiento: false,
            tipoContrato: 'ALQUILER'
          };
          
          setEditingContrato(initialData);
          
          // Abrir el selector de formulario
          setShowFormChoice(true);
          
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
            // Para edición, siempre usar el formulario tradicional
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
    setEditingContrato(contrato);
    // Para edición, siempre usar el formulario tradicional
    setIsFormOpen(true);
  }, []);

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
      console.log('=== HANDLE FORM SUBMIT ===');
      console.log('formData completo:', JSON.stringify(formData, null, 2));
      console.log('precioTotal en formData:', formData.precioTotal);
      console.log('tipoContrato en formData:', formData.tipoContrato);
      console.log('esMantenimiento en formData:', formData.esMantenimiento);
      
      // Asegurarse de que la cuenta esté presente si no es un contrato de mantenimiento
      if (!formData.esMantenimiento && !formData.cuenta && editingContrato?.cuenta) {
        formData.cuenta = typeof editingContrato.cuenta === 'object' ? 
          (editingContrato.cuenta._id || editingContrato.cuenta.id) : 
          editingContrato.cuenta;
      }
      
      let response;
      if (editingContrato && (editingContrato._id || editingContrato.id)) {
        const contratoId = editingContrato._id || editingContrato.id;
        console.log('Enviando PUT a:', `/api/contratos/${contratoId}`);
        console.log('Datos finales a enviar:', JSON.stringify(formData, null, 2));
        response = await clienteAxios.put(`/api/contratos/${contratoId}`, formData);
        enqueueSnackbar('Contrato actualizado exitosamente', { variant: 'success' });
      } else {
        console.log('Enviando POST a:', '/api/contratos');
        console.log('Datos finales a enviar:', JSON.stringify(formData, null, 2));
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

  const handleWizardSubmit = async (formData) => {
    try {
      setIsSaving(true);
      console.log('Datos del wizard a enviar:', formData);
      
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
      setIsWizardOpen(false);
      setEditingContrato(null);
    } catch (error) {
      console.error('Error al guardar contrato desde wizard:', error);
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

  // Función para abrir el selector de formulario
  const handleOpenFormChoice = () => {
    setShowFormChoice(true);
  };

  // Función para cerrar el selector de formulario
  const handleCloseFormChoice = () => {
    setShowFormChoice(false);
  };

  // Función para seleccionar el tipo de formulario
  const handleSelectFormType = (useWizardMode) => {
    setUseWizard(useWizardMode);
    setShowFormChoice(false);
    setEditingContrato(null);
    
    if (useWizardMode) {
      setIsWizardOpen(true);
    } else {
      setIsFormOpen(true);
    }
  };

  // Usar hook personalizado para datos de contratos
  const { contratosPorEstado } = useContratoData(contratos, relatedData);
  const contratosActivos = contratosPorEstado.ACTIVO || [];
  const contratosFinalizados = contratosPorEstado.FINALIZADO || [];
  const contratosPlaneados = contratosPorEstado.PLANEADO || [];

  const cardConfig = useMemo(() => ({
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
          return `${moneda?.simbolo || ''} ${calcularAlquilerMensualPromedio(contrato)}`;
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
  }), [relatedData]);

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 1200,
        mx: 'auto',
        px: { xs: 1, sm: 2, md: 3 },
        py: 2,
        pb: { xs: 12, sm: 4 }, // Espacio para BottomNavigation en mobile
        minHeight: 'calc(100vh - 88px)',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: 2
      }}
    >
      <EntityToolbar />
      {/* Sección de Contratos Activos */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" color="text.secondary">
            Contratos Activos ({contratosActivos.length})
          </Typography>
          <IconButton
            onClick={() => setIsActiveContractsExpanded(!isActiveContractsExpanded)}
            size="small"
          >
            {isActiveContractsExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
        <Collapse in={isActiveContractsExpanded}>
          {contratosActivos.length === 0 ? (
            <EmptyState
              icon={DescriptionIcon}
              title="No hay contratos activos"
              description="No hay contratos activos, reservados, planeados o en mantenimiento"
            />
          ) : (
            <ContratosContainer
              contratos={contratosActivos}
              relatedData={relatedData}
              onEdit={handleEdit}
              onDelete={handleDelete}
              viewMode={viewMode}
            />
          )}
        </Collapse>
      </Box>

      {/* Sección de Contratos Planeados */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" color="text.secondary">
            Contratos Planeados ({contratosPlaneados.length})
          </Typography>
          <IconButton
            onClick={() => setIsPlannedContractsExpanded && setIsPlannedContractsExpanded(prev => !prev)}
            size="small"
          >
            {typeof isPlannedContractsExpanded !== 'undefined' && isPlannedContractsExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
        <Collapse in={typeof isPlannedContractsExpanded !== 'undefined' ? isPlannedContractsExpanded : true}>
          {contratosPlaneados.length === 0 ? (
            <EmptyState
              icon={DescriptionIcon}
              title="No hay contratos planeados"
              description="No hay contratos planeados para mostrar"
            />
          ) : (
            <ContratosContainer
              contratos={contratosPlaneados}
              relatedData={relatedData}
              onEdit={handleEdit}
              onDelete={handleDelete}
              viewMode={viewMode}
            />
          )}
        </Collapse>
      </Box>

      {/* Sección de Contratos Finalizados */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" color="text.secondary">
            Contratos Finalizados ({contratosFinalizados.length})
          </Typography>
          <IconButton
            onClick={() => setIsFinishedContractsExpanded(!isFinishedContractsExpanded)}
            size="small"
          >
            {isFinishedContractsExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
        <Collapse in={isFinishedContractsExpanded}>
          {contratosFinalizados.length === 0 ? (
            <EmptyState
              icon={DescriptionIcon}
              title="No hay contratos finalizados"
              description="No hay contratos finalizados"
            />
          ) : (
            <ContratosContainer
              contratos={contratosFinalizados}
              relatedData={relatedData}
              onEdit={handleEdit}
              onDelete={handleDelete}
              viewMode={viewMode}
            />
          )}
        </Collapse>
      </Box>

      {/* Formulario tradicional */}
      {isFormOpen && (
        <ContratoForm
          open={isFormOpen}
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

      {/* Wizard de contratos */}
      {isWizardOpen && (
        <ContratoWizard
          open={isWizardOpen}
          initialData={editingContrato || {}}
          relatedData={relatedData}
          onSubmit={handleWizardSubmit}
          onClose={() => {
            if (!isSaving) {
              setIsWizardOpen(false);
              setEditingContrato(null);
            }
          }}
          isSaving={isSaving}
        />
      )}

      {/* Diálogo para seleccionar tipo de formulario */}
      <Dialog
        open={showFormChoice}
        onClose={handleCloseFormChoice}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 0 }
        }}
      >
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>
          Seleccionar método de creación
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<WizardIcon />}
              onClick={() => handleSelectFormType(true)}
              sx={{ 
                justifyContent: 'flex-start', 
                p: 2, 
                borderRadius: 0,
                borderWidth: 2
              }}
            >
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Wizard Asistido
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Flujo paso a paso guiado para crear contratos de forma sencilla
                </Typography>
              </Box>
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => handleSelectFormType(false)}
              sx={{ 
                justifyContent: 'flex-start', 
                p: 2, 
                borderRadius: 0,
                borderWidth: 2
              }}
            >
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Formulario Completo
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Formulario tradicional con todas las opciones disponibles
                </Typography>
              </Box>
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={handleCloseFormChoice} sx={{ borderRadius: 0 }}>
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Contratos; 