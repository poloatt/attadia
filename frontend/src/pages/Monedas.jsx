import React, { useState, useEffect, useCallback } from 'react';
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
import EntityToolbar from '../components/EntityToolbar';
import EntityDetails from '../components/EntityViews/EntityDetails';
import EntityForm from '../components/EntityViews/EntityForm';
import { 
  AccountBalanceOutlined as BankIcon,
  AccountBalanceWalletOutlined as WalletIcon,
  CurrencyExchangeOutlined as CurrencyIcon,
  MoreVertOutlined as MoreIcon,
  EditOutlined as EditIcon,
  DeleteOutlineOutlined as DeleteIcon,
  CheckOutlined as CheckIcon,
  CloseOutlined as CloseIcon,
  AddOutlined as AddIcon
} from '@mui/icons-material';
import clienteAxios from '../config/axios';
import { useSnackbar } from 'notistack';
import EmptyState from '../components/EmptyState';

const COLORES_MONEDA = {
  CELESTE_ARGENTINA: { value: '#75AADB', label: 'Celeste Argentina' },
  AZUL_NAVY: { value: '#000080', label: 'Azul Navy' },
  TEAL: { value: '#008080', label: 'Teal' },
  DARK_TEAL: { value: '#006666', label: 'Dark Teal' },
  DARK_GREEN: { value: '#006400', label: 'Dark Green' },
  VIOLETA_OSCURO: { value: '#4B0082', label: 'Violeta Oscuro' }
};

const MonedaCard = ({ moneda, onEdit, onDelete, onToggleActive, onColorChange }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [isEditingColor, setIsEditingColor] = useState(false);
  const [balance, setBalance] = useState(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const open = Boolean(anchorEl);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        setLoadingBalance(true);
        const today = new Date().toISOString().split('T')[0];
        const response = await clienteAxios.get(`/monedas/${moneda.id}/balance`, {
          params: {
            fechaFin: today,
            estado: 'PAGADO'
          }
        });
        setBalance(response.data.balance || 0);
      } catch (error) {
        console.error('Error al obtener balance:', error);
        setBalance(0);
      } finally {
        setLoadingBalance(false);
      }
    };

    fetchBalance();
  }, [moneda.id]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleColorClick = (color) => {
    onColorChange(moneda.id, color);
    setIsEditingColor(false);
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
              onChange={() => onToggleActive(moneda.id)}
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
              {loadingBalance && (
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
                opacity: loadingBalance ? 0.5 : 1,
                transition: 'opacity 0.2s'
              }}
            >
              {moneda.simbolo} {loadingBalance ? '...' : 
                balance.toLocaleString('es-AR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })
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
          onClick={() => { handleClose(); onDelete(moneda.id); }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ fontSize: 18, mr: 1 }} />
          Eliminar
        </MenuItem>
      </Menu>
    </Card>
  );
};

export function Monedas() {
  const [monedas, setMonedas] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMoneda, setEditingMoneda] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { enqueueSnackbar } = useSnackbar();

  const fetchMonedas = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await clienteAxios.get('/monedas');
      setMonedas(response.data.docs || []);
    } catch (error) {
      console.error('Error al cargar monedas:', error);
      enqueueSnackbar('Error al cargar monedas', { variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchMonedas();
  }, [fetchMonedas]);

  const handleFormSubmit = useCallback(async (formData) => {
    try {
      let response;
      if (editingMoneda) {
        response = await clienteAxios.put(`/monedas/${editingMoneda.id}`, formData);
        setMonedas(prev => prev.map(m => m.id === editingMoneda.id ? response.data : m));
        enqueueSnackbar('Moneda actualizada exitosamente', { variant: 'success' });
      } else {
        response = await clienteAxios.post('/monedas', formData);
        setMonedas(prev => [...prev, response.data]);
        enqueueSnackbar('Moneda creada exitosamente', { variant: 'success' });
      }
      setIsFormOpen(false);
      setEditingMoneda(null);
      await fetchMonedas();
    } catch (error) {
      console.error('Error:', error);
      enqueueSnackbar(
        error.response?.data?.error || 'Error al guardar la moneda', 
        { variant: 'error' }
      );
    }
  }, [enqueueSnackbar, editingMoneda, fetchMonedas]);

  const handleEdit = useCallback((moneda) => {
    setEditingMoneda(moneda);
    setIsFormOpen(true);
  }, []);

  const handleDelete = useCallback(async (id) => {
    try {
      await clienteAxios.delete(`/monedas/${id}`);
      setMonedas(prev => prev.filter(m => m.id !== id));
      enqueueSnackbar('Moneda eliminada exitosamente', { variant: 'success' });
    } catch (error) {
      console.error('Error al eliminar moneda:', error);
      enqueueSnackbar('Error al eliminar la moneda', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  const handleToggleActive = useCallback(async (id) => {
    try {
      const moneda = monedas.find(m => m.id === id);
      await clienteAxios.patch(`/monedas/${id}/toggle-active`);
      setMonedas(prev => prev.map(m => 
        m.id === id ? { ...m, activa: !m.activa } : m
      ));
      enqueueSnackbar(
        `Moneda ${moneda.codigo} ${!moneda.activa ? 'activada' : 'desactivada'} exitosamente`, 
        { variant: 'success' }
      );
    } catch (error) {
      console.error('Error al cambiar estado de la moneda:', error);
      enqueueSnackbar('Error al cambiar el estado de la moneda', { variant: 'error' });
    }
  }, [monedas, enqueueSnackbar]);

  const handleColorChange = useCallback(async (id, color) => {
    try {
      const response = await clienteAxios.put(`/monedas/${id}`, { color });
      setMonedas(prev => prev.map(m => m.id === id ? response.data : m));
      enqueueSnackbar('Color actualizado exitosamente', { variant: 'success' });
    } catch (error) {
      console.error('Error al actualizar color:', error);
      enqueueSnackbar('Error al actualizar el color', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

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
    <Container maxWidth="lg">
      <EntityToolbar
        onAdd={() => {
          setEditingMoneda(null);
          setIsFormOpen(true);
        }}
        entityName="moneda"
        navigationItems={[
          {
            icon: <BankIcon sx={{ fontSize: 18 }} />,
            label: 'Cuentas',
            to: '/cuentas'
          },
          {
            icon: <WalletIcon sx={{ fontSize: 18 }} />,
            label: 'Transacciones',
            to: '/transacciones'
          }
        ]}
      />
      
      <EntityDetails 
        title="Monedas"
        subtitle="Gestiona las monedas disponibles en el sistema"
        icon={<CurrencyIcon />}
        action={
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
            {monedas.map((moneda) => (
              <Grid item xs={12} sm={6} md={4} key={moneda.id}>
                <MonedaCard
                  moneda={moneda}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleActive={handleToggleActive}
                  onColorChange={handleColorChange}
                />
              </Grid>
            ))}
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
    </Container>
  );
}

export default Monedas;