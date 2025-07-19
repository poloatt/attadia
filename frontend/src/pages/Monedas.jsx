import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Container, 
  Button,
  Box,
  CircularProgress,
  Tooltip,
  Typography,
  IconButton,
  Grid,
  Card,
  CardContent,
  CardActions,
  Fade,
  Menu,
  MenuItem,
  Divider,
  Switch,
  Chip
} from '@mui/material';
import EntityToolbar from '../components/EntityViews/EntityToolbar';
import { EntityDetails, EntityForm } from '../components/EntityViews';
import { 
  AccountBalanceOutlined as BankIcon,
  AccountBalanceWalletOutlined as WalletIcon,
  CurrencyExchangeOutlined as CurrencyIcon,
  AutorenewOutlined as RecurrentIcon,
  PersonOutlineOutlined,
  MoreVertOutlined as MoreIcon,
  EditOutlined as EditIcon,
  DeleteOutlineOutlined as DeleteIcon,
  CheckOutlined as CheckIcon,
  CloseOutlined as CloseIcon,
  AddOutlined as AddIcon,
  RefreshOutlined as RefreshIcon
} from '@mui/icons-material';
import clienteAxios from '../config/axios';
import { useSnackbar } from 'notistack';
import { EmptyState } from '../components/common';
import { useValuesVisibility } from '../context/ValuesVisibilityContext';
import { useAPI } from '../hooks/useAPI';

const COLORES_MONEDA = {
  CELESTE_ARGENTINA: { value: '#75AADB', label: 'Celeste Argentina' },
  AZUL_NAVY: { value: '#000080', label: 'Azul Navy' },
  TEAL: { value: '#008080', label: 'Teal' },
  DARK_TEAL: { value: '#006666', label: 'Dark Teal' },
  DARK_GREEN: { value: '#006400', label: 'Dark Green' },
  VIOLETA_OSCURO: { value: '#4B0082', label: 'Violeta Oscuro' }
};

const MonedaCard = React.memo(({ moneda, onEdit, onDelete, onToggleActive, onColorChange, showValues }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [isEditingColor, setIsEditingColor] = useState(false);
  const [balance, setBalance] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const open = Boolean(anchorEl);
  
  // Garantizar que tenemos un ID válido
  const monedaId = moneda.id || moneda._id;

  // Usar useAPI para obtener el balance de forma segura - optimizado
  const { 
    data: balanceData, 
    loading: balanceLoading, 
    error: balanceError 
  } = useAPI(monedaId ? `/api/monedas/${monedaId}/balance` : null, {
    params: {
      fechaFin: new Date().toISOString().split('T')[0],
      estado: 'PAGADO'
    },
    dependencies: [monedaId], // Solo depender del ID de moneda
    enableCache: true, // Activar caché para reducir solicitudes
    cacheDuration: 120000, // Caché de 2 minutos
    forceRevalidate: false // No forzar revalidación en cada render
  });

  // Actualizar el balance cuando cambian los datos
  useEffect(() => {
    if (balanceData) {
      setBalance(balanceData.balance || 0);
      setLoadingBalance(false);
    }
  }, [balanceData]);

  // Manejar errores de balance
  useEffect(() => {
    if (balanceError) {
      setLoadingBalance(false);
    }
  }, [balanceError]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleColorClick = (color) => {
    if (monedaId) {
      onColorChange(monedaId, color);
      setIsEditingColor(false);
    }
  };

  return (
    <Card 
      elevation={0} 
      sx={{ 
        position: 'relative',
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: 'primary.main',
          transform: 'translateY(-2px)',
          boxShadow: 1
        }
      }}
    >
      <CardContent sx={{ pt: 3, pb: 1 }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          mb: 2
        }}>
          <Box>
            <Typography variant="h6" sx={{ 
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <Box 
                component="span" 
                sx={{ 
                  width: 32,
                  height: 32,
                  borderRadius: 1,
                  bgcolor: moneda.color || COLORES_MONEDA.CELESTE_ARGENTINA.value,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontFamily: 'monospace',
                  cursor: isEditingColor ? 'default' : 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: isEditingColor ? 'none' : 'scale(1.1)'
                  }
                }}
                onClick={() => setIsEditingColor(!isEditingColor)}
              >
                {moneda.simbolo}
              </Box>
              {moneda.codigo}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {moneda.nombre}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Switch
              size="small"
              checked={moneda.activa}
              onChange={() => onToggleActive(monedaId)}
              sx={{ mr: -1 }}
            />
            <IconButton
              size="small"
              onClick={handleClick}
              sx={{ 
                opacity: 0.5,
                '&:hover': { opacity: 1 }
              }}
            >
              <MoreIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Color Picker */}
        <Fade in={isEditingColor}>
          <Box sx={{ 
            display: isEditingColor ? 'grid' : 'none',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 1,
            mt: 2
          }}>
            {Object.entries(COLORES_MONEDA).map(([key, { value, label }]) => (
              <Tooltip key={key} title={label} arrow>
                <Box
                  onClick={() => handleColorClick(value)}
                  sx={{
                    width: '100%',
                    paddingTop: '100%',
                    position: 'relative',
                    cursor: 'pointer',
                    borderRadius: 1,
                    bgcolor: value,
                    border: '2px solid',
                    borderColor: moneda.color === value ? 'primary.main' : 'transparent',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      boxShadow: 2
                    }
                  }}
                />
              </Tooltip>
            ))}
          </Box>
        </Fade>

        {/* Balance Preview */}
        {!isEditingColor && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 0.5
            }}>
              Balance actual:
              {balanceLoading && (
                <CircularProgress size={12} thickness={4} sx={{ ml: 1 }} />
              )}
            </Typography>
            <Typography 
              variant="h5" 
              sx={{ 
                color: balance >= 0 ? 
                  (moneda.color || COLORES_MONEDA.CELESTE_ARGENTINA.value) : 
                  'error.main',
                fontWeight: 500,
                mt: 0.5,
                opacity: balanceLoading ? 0.5 : 1,
                transition: 'opacity 0.2s'
              }}
            >
              {moneda.simbolo} {balanceLoading ? '...' : 
                showValues ? balance.toLocaleString('es-AR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                }) : '****'
              }
            </Typography>
          </Box>
        )}
      </CardContent>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        elevation={1}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => { handleClose(); onEdit(moneda); }}>
          <EditIcon sx={{ fontSize: 18, mr: 1 }} />
          Editar
        </MenuItem>
        <MenuItem 
          onClick={() => { handleClose(); onDelete(monedaId); }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ fontSize: 18, mr: 1 }} />
          Eliminar
        </MenuItem>
      </Menu>
    </Card>
  );
});

export function Monedas() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMoneda, setEditingMoneda] = useState(null);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const { showValues } = useValuesVisibility();

  // Usar nuestro hook personalizado para cargar monedas - Optimizaciones
  const { 
    data: monedasData, 
    loading: isLoading, 
    error: monedasError,
    refetch: refetchMonedas
  } = useAPI('/api/monedas', {
    enableCache: true, // Activar caché para reducir solicitudes
    cacheDuration: 30000, // 30 segundos de caché
    dependencies: [], // Quitar dependencia a window.location.href
    forceRevalidate: false, // No forzar revalidación en cada render
    params: {} // Quitar timestamp para evitar renderizados continuos
  });

  // Extraer las monedas del resultado paginado con useMemo para evitar renderizados innecesarios
  const monedas = useMemo(() => {
    if (Array.isArray(monedasData?.docs)) return monedasData.docs;
    if (Array.isArray(monedasData)) return monedasData;
    return [];
  }, [monedasData]);

  // Elementos de navegación con useMemo para evitar recrear el array en cada renderizado
  const navigationItems = useMemo(() => [
    {
      icon: <BankIcon sx={{ fontSize: 21.6 }} />,
      label: 'Cuentas',
      to: '/cuentas'
    },
    {
      icon: <WalletIcon sx={{ fontSize: 21.6 }} />,
      label: 'Transacciones',
      to: '/transacciones'
    },
    {
      icon: <RecurrentIcon sx={{ fontSize: 21.6 }} />,
      label: 'Recurrentes',
      to: '/recurrente'
    },
    {
      icon: <PersonOutlineOutlined sx={{ fontSize: 21.6 }} />,
      label: 'Deudores',
      to: '/deudores'
    }
  ], []);

  // Agregar log para debug
  useEffect(() => {
    // Eliminar logs innecesarios que pueden estar causando problemas
  }, [monedasData, monedas]);

  // Manejar errores de la API
  useEffect(() => {
    if (monedasError) {
      console.error('Error al cargar monedas:', monedasError);
      enqueueSnackbar('Error al cargar monedas: ' + monedasError.message, { variant: 'error' });
    }
  }, [monedasError, enqueueSnackbar]);

  // Recargar datos periódicamente para mantener la información actualizada - reducir frecuencia
  useEffect(() => {
    // Solo si no estamos en modo de carga y tenemos la página activa
    if (!isLoading && document.visibilityState === 'visible') {
      const interval = setInterval(() => {
        // Recargar datos silenciosamente sin logs
        refetchMonedas();
      }, 60000); // Recargar cada 60 segundos en lugar de 30
      
      // Limpiar el intervalo cuando el componente se desmonte
      return () => clearInterval(interval);
    }
  }, [isLoading, refetchMonedas]);
  
  // Recargar datos cuando la pestaña vuelve a estar activa
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Recargar sin logs
        refetchMonedas();
      }
    };
    
    // Registrar el listener para el evento visibilitychange
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Limpiar el listener cuando el componente se desmonte
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refetchMonedas]);

  // Escuchar el evento del botón "+" del Header
  useEffect(() => {
    const handleHeaderAdd = (e) => {
      if (e.detail?.type === 'moneda') {
        setEditingMoneda(null);
        setIsFormOpen(true);
      }
    };
    
    window.addEventListener('headerAddButtonClicked', handleHeaderAdd);
    return () => window.removeEventListener('headerAddButtonClicked', handleHeaderAdd);
  }, []);

  const handleFormSubmit = useCallback(async (formData) => {
    try {
      // Mostrar mensaje de carga
      const loadingMsg = enqueueSnackbar('Guardando moneda...', { 
        variant: 'info',
        persist: true 
      });
      
      let response;
      let monedaId = null;
      
      if (editingMoneda) {
        // Usar siempre el ID normalizado
        monedaId = editingMoneda.id || editingMoneda._id;
        
        if (!monedaId) {
          closeSnackbar(loadingMsg);
          enqueueSnackbar('Error: ID de moneda no válido', { variant: 'error' });
          return;
        }
        
        // Normalizar datos antes de enviar
        const datosActualizados = {
          codigo: formData.codigo?.trim() || '',
          nombre: formData.nombre?.trim() || '',
          simbolo: formData.simbolo?.trim() || '',
          color: formData.color || COLORES_MONEDA.CELESTE_ARGENTINA.value,
          activa: typeof formData.activa === 'boolean' ? formData.activa : true
        };
        
        response = await clienteAxios.put(`/api/monedas/${monedaId}`, datosActualizados);
        closeSnackbar(loadingMsg);
        enqueueSnackbar('Moneda actualizada exitosamente', { variant: 'success' });
      } else {
        // Normalizar datos para nueva moneda
        const nuevaMoneda = {
          codigo: formData.codigo?.trim() || '',
          nombre: formData.nombre?.trim() || '',
          simbolo: formData.simbolo?.trim() || '',
          color: formData.color || COLORES_MONEDA.CELESTE_ARGENTINA.value,
          activa: true
        };
        
        response = await clienteAxios.post('/api/monedas', nuevaMoneda);
        closeSnackbar(loadingMsg);
        enqueueSnackbar('Moneda creada exitosamente', { variant: 'success' });
      }
      
      setIsFormOpen(false);
      setEditingMoneda(null);
      await refetchMonedas();
    } catch (error) {
      console.error('Error al guardar moneda:', error);
      enqueueSnackbar('Error al guardar moneda: ' + (error.response?.data?.message || error.message), { variant: 'error' });
    }
  }, [editingMoneda, enqueueSnackbar, closeSnackbar, refetchMonedas]);

  const handleEdit = useCallback((moneda) => {
    if (!moneda || (!moneda.id && !moneda._id)) {
      enqueueSnackbar('Error: No se puede editar la moneda', { variant: 'error' });
      return;
    }
    
    // Normalizar el objeto para edición
    const monedaEditada = {
      id: moneda.id || moneda._id,
      _id: moneda.id || moneda._id,
      codigo: moneda.codigo || '',
      nombre: moneda.nombre || '',
      simbolo: moneda.simbolo || '',
      color: moneda.color || COLORES_MONEDA.CELESTE_ARGENTINA.value,
      activa: typeof moneda.activa === 'boolean' ? moneda.activa : true
    };
    
    setEditingMoneda(monedaEditada);
    setIsFormOpen(true);
  }, [enqueueSnackbar]);

  const handleDelete = useCallback(async (id) => {
    if (!id) {
      enqueueSnackbar('Error: ID de moneda no válido', { variant: 'error' });
      return;
    }
    
    try {
      // Mostrar mensaje de carga
      const loadingMsg = enqueueSnackbar('Eliminando moneda...', { 
        variant: 'info',
        persist: true 
      });
      
      await clienteAxios.delete(`/api/monedas/${id}`);
      
      // Cerrar mensaje de carga
      closeSnackbar(loadingMsg);
      enqueueSnackbar('Moneda eliminada exitosamente', { variant: 'success' });
      await refetchMonedas();
    } catch (error) {
      enqueueSnackbar('Error al eliminar la moneda: ' + (error.response?.data?.message || error.message), { variant: 'error' });
    }
  }, [enqueueSnackbar, closeSnackbar, refetchMonedas]);

  const handleToggleActive = useCallback(async (id) => {
    if (!id) {
      enqueueSnackbar('Error: ID de moneda no válido', { variant: 'error' });
      return;
    }
    
    try {
      // Mostrar mensaje de carga
      const loadingMsg = enqueueSnackbar('Actualizando estado...', { 
        variant: 'info',
        persist: true 
      });
      
      // Buscar la moneda existente
      const moneda = monedas.find(m => m.id === id || m._id === id);
      
      if (!moneda) {
        closeSnackbar(loadingMsg);
        enqueueSnackbar('Error: No se pudo encontrar la moneda', { variant: 'error' });
        return;
      }
      
      // Realizar la operación
      await clienteAxios.patch(`/api/monedas/${id}/toggle-active`);
      
      // Cerrar mensaje de carga
      closeSnackbar(loadingMsg);
      
      enqueueSnackbar(
        `Moneda ${moneda.codigo} ${!moneda.activa ? 'activada' : 'desactivada'} exitosamente`, 
        { variant: 'success' }
      );
      
      // Recargar datos
      await refetchMonedas();
    } catch (error) {
      enqueueSnackbar('Error al cambiar el estado de la moneda: ' + (error.response?.data?.message || error.message), { variant: 'error' });
    }
  }, [monedas, enqueueSnackbar, closeSnackbar, refetchMonedas]);

  const handleColorChange = useCallback(async (id, color) => {
    if (!id) {
      enqueueSnackbar('Error: ID de moneda no válido', { variant: 'error' });
      return;
    }
    
    try {
      // Mostrar mensaje de carga
      const loadingMsg = enqueueSnackbar('Actualizando color...', { 
        variant: 'info',
        persist: true 
      });
      
      // Buscar la moneda para verificar que existe
      const moneda = monedas.find(m => m.id === id || m._id === id);
      
      if (!moneda) {
        closeSnackbar(loadingMsg);
        enqueueSnackbar('Error: No se pudo encontrar la moneda', { variant: 'error' });
        return;
      }
      
      // Realizar la operación
      await clienteAxios.put(`/api/monedas/${id}`, { color });
      
      // Cerrar mensaje de carga
      closeSnackbar(loadingMsg);
      enqueueSnackbar('Color actualizado exitosamente', { variant: 'success' });
      
      // Recargar datos
      await refetchMonedas();
    } catch (error) {
      enqueueSnackbar('Error al actualizar el color: ' + (error.response?.data?.message || error.message), { variant: 'error' });
    }
  }, [monedas, enqueueSnackbar, closeSnackbar, refetchMonedas]);

  const formFields = [
    {
      name: 'codigo',
      label: 'Código',
      type: 'text',
      required: true,
      helperText: 'Ejemplo: USD, EUR, ARS'
    },
    {
      name: 'nombre',
      label: 'Nombre',
      type: 'text',
      required: true,
      helperText: 'Ejemplo: Dólar Estadounidense, Euro, Peso Argentino'
    },
    {
      name: 'simbolo',
      label: 'Símbolo',
      type: 'text',
      required: true,
      helperText: 'Ejemplo: $, €, ₱'
    },
    {
      name: 'color',
      label: 'Color para balances positivos',
      type: 'select',
      required: true,
      options: Object.entries(COLORES_MONEDA).map(([key, { value, label }]) => ({
        value: value,
        label: label
      })),
      helperText: 'Este color se usará para mostrar los balances positivos en esta moneda'
    }
  ];

  return (
    <Box sx={{ px: 0, width: '100%' }}>
      <EntityToolbar />
      
      <EntityDetails 
        title="Monedas"
        subtitle="Gestiona las monedas disponibles en el sistema"
        icon={<CurrencyIcon />}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Recargar datos">
              <IconButton 
                size="small"
                onClick={() => {
                  const loadingMsg = enqueueSnackbar('Recargando datos...', { 
                    variant: 'info',
                    persist: true 
                  });
                  refetchMonedas().then(() => {
                    closeSnackbar(loadingMsg);
                    enqueueSnackbar('Datos actualizados', { variant: 'success' });
                  });
                }}
                sx={{ bgcolor: 'background.paper', borderRadius: 1 }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />} 
              size="small"
              onClick={() => {
                setEditingMoneda(null);
                setIsFormOpen(true);
              }}
              sx={{
                borderRadius: 1,
                textTransform: 'none'
              }}
            >
              Nueva Moneda
            </Button>
          </Box>
        }
      >
        {isLoading ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: 200 
          }}>
            <CircularProgress />
          </Box>
        ) : monedas.length === 0 ? (
          <EmptyState 
            onAdd={() => setIsFormOpen(true)}
            message="No hay monedas configuradas"
            submessage="Haz clic en el botón para agregar una nueva moneda"
          />
        ) : (
          <Grid container spacing={2}>
            {monedas.map((moneda) => {
              // Normalizar los datos de la moneda para asegurar consistencia
              const normalizedMoneda = {
                id: moneda.id || moneda._id,
                _id: moneda.id || moneda._id, // Para compatibilidad con API
                codigo: moneda.codigo || 'Sin código',
                nombre: moneda.nombre || 'Sin nombre',
                simbolo: moneda.simbolo || '$',
                color: moneda.color || COLORES_MONEDA.CELESTE_ARGENTINA.value,
                activa: typeof moneda.activa === 'boolean' ? moneda.activa : true
              };
              
              return (
                <Grid item xs={12} sm={6} md={4} key={normalizedMoneda.id}>
                  <MonedaCard
                    moneda={normalizedMoneda}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleActive={handleToggleActive}
                    onColorChange={handleColorChange}
                    showValues={showValues}
                  />
                </Grid>
              );
            })}
          </Grid>
        )}
      </EntityDetails>

      <EntityForm
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingMoneda(null);
        }}
        onSubmit={handleFormSubmit}
        title={editingMoneda ? 'Editar Moneda' : 'Nueva Moneda'}
        fields={formFields}
        initialData={editingMoneda || { color: COLORES_MONEDA.CELESTE_ARGENTINA.value }}
        isEditing={!!editingMoneda}
      />
    </Box>
  );
}

export default Monedas;