import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  LinearProgress,
  Fade,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Chip,
  Autocomplete,
  CircularProgress,
  Dialog as MuiDialog
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SyncIcon from '@mui/icons-material/Sync';
import { useSnackbar } from 'notistack';
import { useRelationalData } from '../../hooks/useRelationalData';
import clienteAxios from '../../config/axios';
import MercadoPagoConnectButton from './MercadoPagoConnectButton';
import GoogleIcon from '@mui/icons-material/Google';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import GoogleWalletConnectButton from './GoogleWalletConnectButton';
import UalaConnectButton from './UalaConnectButton';
import WiseConnectButton from './WiseConnectButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 0,
    backgroundColor: theme.palette.background.default,
    backgroundImage: 'none',
    [theme.breakpoints.down('sm')]: {
      margin: 0,
      maxHeight: '100%',
      height: '100%',
      width: '100%',
      maxWidth: '100%'
    },
    [theme.breakpoints.up('sm')]: {
      minWidth: '600px',
      maxWidth: '800px'
    }
  }
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 0,
    height: 40,
    backgroundColor: theme.palette.background.default,
    '& fieldset': {
      borderColor: theme.palette.divider
    }
  },
  '& .MuiInputLabel-root': {
    transform: 'translate(14px, -9px) scale(0.75)',
    '&.Mui-focused, &.MuiFormLabel-filled': {
      transform: 'translate(14px, -9px) scale(0.75)'
    }
  },
  '& .MuiInputLabel-shrink': {
    transform: 'translate(14px, -9px) scale(0.75)'
  }
}));

const TIPOS_CONEXION = [
  { valor: 'PLAID', label: 'Plaid', descripcion: 'Conecta con más de 11,000 instituciones financieras' },
  { valor: 'OPEN_BANKING', label: 'Open Banking', descripcion: 'Estándar europeo de APIs bancarias' },
  { valor: 'API_DIRECTA', label: 'API Directa', descripcion: 'Conexión directa con el banco' },
  { valor: 'MERCADOPAGO', label: 'MercadoPago', descripcion: 'Sincronización automática con MercadoPago' },
  { valor: 'MANUAL', label: 'Manual', descripcion: 'Importación manual de transacciones' }
];

const BANCOS_POPULARES = [
  'Banco Santander',
  'BBVA',
  'Banco de Chile',
  'Banco Estado',
  'Banco BCI',
  'Banco Security',
  'Banco Falabella',
  'Banco Ripley',
  'Banco Consorcio',
  'Banco Itaú',
  'Scotiabank',
  'Banco de Crédito e Inversiones',
  'Banco Edwards',
  'Banco Internacional',
  'Banco Paris',
  'Banco Santander-Chile',
  'Banco de A. Edwards',
  'Banco Bice',
  'Banco Corpbanca',
  'Banco del Desarrollo',
  'ICBC' // Agregado ICBC
];

// Color de MercadoPago
const MERCADOPAGO_COLOR = '#009ee3';

const BankConnectionForm = ({ 
  open, 
  onClose, 
  onSubmit,
  initialData = {},
  isEditing = false 
}) => {
  const [formData, setFormData] = useState({
    nombre: initialData.nombre || '',
    banco: initialData.banco || '',
    tipo: initialData.tipo || 'PLAID',
    cuenta: '',
    credenciales: {
      accessToken: '',
      refreshToken: '',
      institutionId: '',
      accountId: '',
      apiKey: '',
      apiSecret: '',
      username: '',
      password: '',
      userId: ''
    },
    configuracion: {
      sincronizacionAutomatica: initialData.configuracion?.sincronizacionAutomatica ?? true,
      frecuenciaSincronizacion: initialData.configuracion?.frecuenciaSincronizacion || 'DIARIA',
      categorizacionAutomatica: initialData.configuracion?.categorizacionAutomatica ?? true
    }
  });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  
  // Definición de campos relacionales
  const relatedFields = [
    { 
      type: 'relational',
      name: 'cuenta',
      endpoint: '/cuentas',
      labelField: 'nombre',
      populate: ['moneda']
    }
  ];

  const { relatedData, isLoading: isLoadingRelated } = useRelationalData({
    open,
    relatedFields
  });

  const [selectedCuenta, setSelectedCuenta] = useState(null);
  const [walletModal, setWalletModal] = useState(null);
  const [tipoCuenta, setTipoCuenta] = useState(null);

  // Efecto para reiniciar el formulario cuando se abre
  useEffect(() => {
    if (open) {
      console.log('Reiniciando formulario con datos:', initialData);
      setFormData({
        nombre: initialData.nombre || '',
        banco: initialData.banco || '',
        tipo: initialData.tipo || 'PLAID',
        cuenta: '',
        credenciales: {
          accessToken: '',
          refreshToken: '',
          institutionId: '',
          accountId: '',
          apiKey: '',
          apiSecret: '',
          username: '',
          password: '',
          userId: ''
        },
        configuracion: {
          sincronizacionAutomatica: initialData.configuracion?.sincronizacionAutomatica ?? true,
          frecuenciaSincronizacion: initialData.configuracion?.frecuenciaSincronizacion || 'DIARIA',
          categorizacionAutomatica: initialData.configuracion?.categorizacionAutomatica ?? true
        }
      });
      setSelectedCuenta(null);
      setErrors({});
      setTipoCuenta(null); // Resetear el tipo de cuenta seleccionado
    }
  }, [open]);

  // Efecto para manejar la cuenta cuando los datos relacionales están disponibles
  useEffect(() => {
    const inicializarCuenta = () => {
      if (!relatedData?.cuenta?.length || !initialData.cuenta) return;

      const cuentaId = typeof initialData.cuenta === 'string' ? 
        initialData.cuenta : 
        (initialData.cuenta?._id || initialData.cuenta?.id);

      const cuentaEncontrada = relatedData.cuenta.find(c => 
        c._id === cuentaId || c.id === cuentaId
      );

      if (cuentaEncontrada) {
        setSelectedCuenta(cuentaEncontrada);
        setFormData(prev => ({
          ...prev,
          cuenta: cuentaEncontrada._id || cuentaEncontrada.id
        }));
      }
    };

    if (open && !isLoadingRelated) {
      inicializarCuenta();
    }
  }, [relatedData?.cuenta, initialData.cuenta, open, isLoadingRelated]);

  const handleChange = useCallback((name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  }, [errors]);

  const handleCredencialesChange = useCallback((name, value) => {
    setFormData(prev => ({
      ...prev,
      credenciales: {
        ...prev.credenciales,
        [name]: value
      }
    }));
  }, []);

  const handleConfiguracionChange = useCallback((name, value) => {
    setFormData(prev => ({
      ...prev,
      configuracion: {
        ...prev.configuracion,
        [name]: value
      }
    }));
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      // Generar nombre automáticamente
      let nombreGenerado = '';
      const tipoLabel = TIPOS_CONEXION.find(t => t.valor === formData.tipo)?.label || formData.tipo;
      if (formData.tipo === 'MERCADOPAGO') {
        nombreGenerado = 'MercadoPago';
      } else if (formData.tipo === 'MANUAL') {
        nombreGenerado = 'Manual';
      } else {
        nombreGenerado = formData.banco ? `${tipoLabel} - ${formData.banco}` : tipoLabel;
      }

      // Construir el payload sin cuenta ni banco si no aplican
      const dataToSubmit = {
        ...formData,
        nombre: nombreGenerado
      };
      // Solo incluir cuenta si existe y no es MercadoPago
      if (formData.tipo !== 'MERCADOPAGO' && (selectedCuenta?.id || selectedCuenta?._id || formData.cuenta)) {
        dataToSubmit.cuenta = selectedCuenta?.id || selectedCuenta?._id || formData.cuenta;
      } else {
        delete dataToSubmit.cuenta;
      }
      // Solo incluir banco si existe y no es MercadoPago ni Manual
      if (formData.tipo !== 'MERCADOPAGO' && formData.tipo !== 'MANUAL' && formData.banco) {
        dataToSubmit.banco = formData.banco;
      } else {
        delete dataToSubmit.banco;
      }
      // Limpiar credenciales para MercadoPago
      if (formData.tipo === 'MERCADOPAGO') {
        dataToSubmit.credenciales = { userId: formData.credenciales.userId };
      }
      // Limpiar credenciales vacías para otros tipos
      if (formData.tipo !== 'MERCADOPAGO') {
        Object.keys(dataToSubmit.credenciales).forEach(key => {
          if (!dataToSubmit.credenciales[key]) {
            delete dataToSubmit.credenciales[key];
          }
        });
      }
      console.log('Datos a enviar:', dataToSubmit);
      await onSubmit(dataToSubmit);
      enqueueSnackbar(
        isEditing ? 'Conexión bancaria actualizada' : 'Conexión bancaria creada', 
        { variant: 'success' }
      );
      onClose();
    } catch (error) {
      console.error('Error al guardar:', error);
      enqueueSnackbar(
        error.response?.data?.message || error.message || 'Error al guardar', 
        { variant: 'error' }
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerificarConexion = async () => {
    if (!validateForm()) return;

    setIsVerifying(true);
    try {
      const dataToSubmit = {
        ...formData,
        cuenta: selectedCuenta?.id || selectedCuenta?._id || formData.cuenta
      };

      // Si es edición, verificar la conexión existente
      if (isEditing && initialData.id) {
        const response = await clienteAxios.post(`/api/bankconnections/${initialData.id}/verificar`);
        enqueueSnackbar(response.data.message, { variant: 'success' });
      } else {
        // Para nuevas conexiones, simular verificación
        enqueueSnackbar('Verificación completada (simulación)', { variant: 'info' });
      }
    } catch (error) {
      console.error('Error al verificar conexión:', error);
      enqueueSnackbar(
        error.response?.data?.message || error.message || 'Error al verificar conexión', 
        { variant: 'error' }
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (formData.tipo !== 'MERCADOPAGO' && formData.tipo !== 'MANUAL' && !formData.banco) newErrors.banco = 'Seleccione un banco';
    if (!formData.tipo) newErrors.tipo = 'Seleccione el tipo de conexión';
    if (formData.tipo !== 'MERCADOPAGO' && !selectedCuenta) newErrors.cuenta = 'Seleccione una cuenta';

    // Validaciones específicas por tipo
    if (formData.tipo === 'PLAID') {
      if (!formData.credenciales.accessToken) newErrors.accessToken = 'Token de acceso requerido';
    } else if (formData.tipo === 'API_DIRECTA') {
      if (!formData.credenciales.apiKey) newErrors.apiKey = 'API Key requerida';
      if (!formData.credenciales.username) newErrors.username = 'Usuario requerido';
      if (!formData.credenciales.password) newErrors.password = 'Contraseña requerida';
    } else if (formData.tipo === 'OPEN_BANKING') {
      if (!formData.credenciales.accessToken) newErrors.accessToken = 'Token de acceso requerido';
    } else if (formData.tipo === 'MERCADOPAGO') {
      if (!formData.credenciales.userId) newErrors.userId = 'User ID requerido';
      // Validar que el nombre generado no sea vacío
      const tipoLabel = TIPOS_CONEXION.find(t => t.valor === formData.tipo)?.label || formData.tipo;
      const nombreGenerado = 'MercadoPago';
      if (!nombreGenerado) newErrors.nombre = 'El nombre de la conexión no puede estar vacío';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getCamposCredenciales = () => {
    switch (formData.tipo) {
      case 'PLAID':
        return (
          <>
            <StyledTextField
              fullWidth
              label="Access Token"
              value={formData.credenciales.accessToken || ''}
              onChange={(e) => handleCredencialesChange('accessToken', e.target.value)}
              error={!!errors.accessToken}
              helperText={errors.accessToken}
              sx={{ mb: 2 }}
              InputLabelProps={{ shrink: true }}
            />
            <StyledTextField
              fullWidth
              label="Institution ID"
              value={formData.credenciales.institutionId || ''}
              onChange={(e) => handleCredencialesChange('institutionId', e.target.value)}
              sx={{ mb: 2 }}
              InputLabelProps={{ shrink: true }}
            />
            <StyledTextField
              fullWidth
              label="Account ID"
              value={formData.credenciales.accountId || ''}
              onChange={(e) => handleCredencialesChange('accountId', e.target.value)}
              sx={{ mb: 2 }}
              InputLabelProps={{ shrink: true }}
            />
          </>
        );
      case 'API_DIRECTA':
        return (
          <>
            <StyledTextField
              fullWidth
              label="API Key"
              value={formData.credenciales.apiKey || ''}
              onChange={(e) => handleCredencialesChange('apiKey', e.target.value)}
              error={!!errors.apiKey}
              helperText={errors.apiKey}
              sx={{ mb: 2 }}
              InputLabelProps={{ shrink: true }}
            />
            <StyledTextField
              fullWidth
              label="API Secret"
              type="password"
              value={formData.credenciales.apiSecret || ''}
              onChange={(e) => handleCredencialesChange('apiSecret', e.target.value)}
              sx={{ mb: 2 }}
              InputLabelProps={{ shrink: true }}
            />
            <StyledTextField
              fullWidth
              label="Usuario"
              value={formData.credenciales.username || ''}
              onChange={(e) => handleCredencialesChange('username', e.target.value)}
              error={!!errors.username}
              helperText={errors.username}
              sx={{ mb: 2 }}
              InputLabelProps={{ shrink: true }}
            />
            <StyledTextField
              fullWidth
              label="Contraseña"
              type="password"
              value={formData.credenciales.password || ''}
              onChange={(e) => handleCredencialesChange('password', e.target.value)}
              error={!!errors.password}
              helperText={errors.password}
              sx={{ mb: 2 }}
              InputLabelProps={{ shrink: true }}
            />
          </>
        );
      case 'OPEN_BANKING':
        return (
          <>
            <StyledTextField
              fullWidth
              label="Access Token"
              value={formData.credenciales.accessToken || ''}
              onChange={(e) => handleCredencialesChange('accessToken', e.target.value)}
              sx={{ mb: 2 }}
              InputLabelProps={{ shrink: true }}
            />
            <StyledTextField
              fullWidth
              label="Refresh Token"
              value={formData.credenciales.refreshToken || ''}
              onChange={(e) => handleCredencialesChange('refreshToken', e.target.value)}
              sx={{ mb: 2 }}
              InputLabelProps={{ shrink: true }}
            />
          </>
        );
      case 'MERCADOPAGO':
        return (
          <>
            <StyledTextField
              fullWidth
              label="User ID"
              value={formData.credenciales.userId || ''}
              onChange={(e) => handleCredencialesChange('userId', e.target.value)}
              error={!!errors.userId}
              helperText={errors.userId || 'ID del usuario de MercadoPago'}
              sx={{ mb: 2 }}
              InputLabelProps={{ shrink: true }}
            />
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Para obtener tu User ID:
                <br />1. Ingresa a tu cuenta de MercadoPago
                <br />2. Ve a tu perfil (Configuración)
                <br />3. Busca el campo "User ID" o "ID de usuario"
                <br />4. Copia y pégalo aquí
                <br /><br />El Access Token y la Public Key ya están configurados de forma segura por el administrador.
              </Typography>
            </Alert>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <StyledDialog
      open={open}
      onClose={!isSaving && !isVerifying ? onClose : undefined}
      maxWidth="sm"
      fullWidth
    >
      <Box sx={{ p: 3, minWidth: 350, position: 'relative', pt: 6 }}>
        {/* Botón Atrás solo si no estamos en el paso inicial */}
        {tipoCuenta && (
          <IconButton
            onClick={() => setTipoCuenta(null)}
            sx={{
              position: 'absolute',
              top: 16,
              left: 16,
              color: 'text.secondary',
              borderRadius: 0,
              bgcolor: 'transparent',
              '&:hover': { bgcolor: 'grey.900' },
              zIndex: 2
            }}
            size="small"
            aria-label="Atrás"
          >
            <ArrowBackIcon />
          </IconButton>
        )}
        {/* Botón Cerrar (X) siempre visible */}
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            color: 'text.secondary',
            borderRadius: 0,
            bgcolor: 'transparent',
            '&:hover': { bgcolor: 'grey.900' },
            zIndex: 2
          }}
          size="small"
          aria-label="Cerrar"
        >
          <CloseIcon />
        </IconButton>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          {isEditing ? 'Editar Conexión Bancaria' : 'Nueva Conexión Bancaria'}
        </Typography>

        {/* Paso 1: Selección visual de tipo de cuenta */}
        {!tipoCuenta && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary', letterSpacing: 1 }}>
              ¿Qué tipo de cuenta deseas agregar?
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box
                onClick={() => setTipoCuenta('BANCO')}
                sx={{
                  cursor: 'pointer',
                  width: '100%',
                  minHeight: 56,
                  bgcolor: 'transparent',
                  borderRadius: 0,
                  boxShadow: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  px: 2,
                  py: 1.5,
                  border: '2px solid transparent',
                  transition: 'border 0.2s, background 0.2s',
                  '&:hover': {
                    border: '2px solid',
                    borderColor: 'primary.main',
                    bgcolor: 'grey.900',
                  },
                }}
              >
                <AccountBalanceIcon sx={{ color: 'white', fontSize: 28, mr: 2 }} />
                <Typography sx={{ color: 'white', fontWeight: 600, fontSize: 16 }}>
                  Cuenta bancaria
                </Typography>
              </Box>
              <Box
                onClick={() => setTipoCuenta('BILLETERA')}
                sx={{
                  cursor: 'pointer',
                  width: '100%',
                  minHeight: 56,
                  bgcolor: 'transparent',
                  borderRadius: 0,
                  boxShadow: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  px: 2,
                  py: 1.5,
                  border: '2px solid transparent',
                  transition: 'border 0.2s, background 0.2s',
                  '&:hover': {
                    border: '2px solid',
                    borderColor: 'primary.main',
                    bgcolor: 'grey.900',
                  },
                }}
              >
                <AccountBalanceWalletIcon sx={{ color: 'white', fontSize: 28, mr: 2 }} />
                <Typography sx={{ color: 'white', fontWeight: 600, fontSize: 16 }}>
                  Billetera digital
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        {/* Paso 2: Si elige cuenta bancaria, mostrar los campos tradicionales */}
        {tipoCuenta === 'BANCO' && (
          <>
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary', letterSpacing: 1 }}>
              Información de la cuenta bancaria
            </Typography>
            <StyledTextField
              fullWidth
              label="Nombre de la cuenta"
              value={formData.nombre}
              onChange={e => handleChange('nombre', e.target.value)}
              error={!!errors.nombre}
              helperText={errors.nombre}
              sx={{ mb: 2 }}
            />
            <StyledTextField
              fullWidth
              label="Número de cuenta"
              value={formData.numero}
              onChange={e => handleChange('numero', e.target.value)}
              error={!!errors.numero}
              helperText={errors.numero}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Tipo</InputLabel>
              <Select
                value={formData.tipo}
                onChange={e => handleChange('tipo', e.target.value)}
                error={!!errors.tipo}
                sx={{ borderRadius: 0, height: 40 }}
              >
                <MenuItem value="BANCO">Cuenta bancaria</MenuItem>
                <MenuItem value="EFECTIVO">Efectivo</MenuItem>
                <MenuItem value="OTRO">Otro</MenuItem>
              </Select>
            </FormControl>
            {/* Aquí puedes agregar el selector de moneda y otros campos necesarios */}
            {/* ... */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
              <Button variant="text" color="inherit" onClick={onClose} sx={{ borderRadius: 0 }}>
                Cancelar
              </Button>
              <Button
                variant="text"
                color="inherit"
                onClick={handleSubmit}
                startIcon={isSaving ? <CircularProgress size={18} /> : <AccountBalanceIcon />}
                sx={{ borderRadius: 0, color: 'white' }}
              >
                {isSaving ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
              </Button>
            </Box>
          </>
        )}

        {/* Paso 2: Si elige billetera digital, mostrar los botones de integración */}
        {tipoCuenta === 'BILLETERA' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary', letterSpacing: 1 }}>
              Selecciona tu billetera para conectar
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
              <MercadoPagoConnectButton
                onSuccess={onClose}
                onError={(err) => enqueueSnackbar('Error conectando con MercadoPago', { variant: 'error' })}
                fullWidth
              />
              <GoogleWalletConnectButton onSuccess={onClose} onError={() => enqueueSnackbar('Próximamente', { variant: 'info' })} fullWidth />
              <UalaConnectButton onSuccess={onClose} onError={() => enqueueSnackbar('Próximamente', { variant: 'info' })} fullWidth />
              <WiseConnectButton onSuccess={onClose} onError={() => enqueueSnackbar('Próximamente', { variant: 'info' })} fullWidth />
            </Box>
            <Button variant="text" sx={{ mt: 2 }} onClick={() => setTipoCuenta(null)}>
              ← Volver
            </Button>
          </Box>
        )}
      </Box>
    </StyledDialog>
  );
};

export default BankConnectionForm; 