import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Autocomplete,
  Grid,
  Alert,
  InputAdornment,
  Chip,
  Divider
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import {
  AttachMoney as MoneyIcon,
  AccountBalance as AccountIcon,
  AccountBalanceWalletOutlined as DepositIcon,
  Link as LinkIcon,
  Calculate as CalculateIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 0,
    backgroundColor: alpha(theme.palette.background.paper, 0.9),
    '& fieldset': {
      borderColor: theme.palette.divider
    },
    '&:hover fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.2)'
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main
    }
  }
}));

const FinancialCard = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 0,
  backgroundColor: alpha(theme.palette.background.paper, 0.5),
  display: 'flex',
  flexDirection: 'column',
  gap: 1
}));

const FinancialTermsStep = ({
  formData,
  onFormDataChange,
  onErrorsChange,
  onStepComplete,
  errors,
  relatedData,
  theme
}) => {
  const [selectedCuenta, setSelectedCuenta] = useState(null);
  const [alquilerMensual, setAlquilerMensual] = useState(0);

  // Obtener cuenta seleccionada
  useEffect(() => {
    if (formData.cuenta && relatedData.cuentas) {
      const cuenta = relatedData.cuentas.find(c => 
        c._id === formData.cuenta || c.id === formData.cuenta
      );
      setSelectedCuenta(cuenta || null);
    }
  }, [formData.cuenta, relatedData.cuentas]);

  // Calcular alquiler mensual
  useEffect(() => {
    if (formData.precioTotal && formData.fechaInicio && formData.fechaFin && !formData.esMantenimiento) {
      const inicio = new Date(formData.fechaInicio);
      const fin = new Date(formData.fechaFin);
      const mesesTotales = (fin.getFullYear() - inicio.getFullYear()) * 12 + 
                          (fin.getMonth() - inicio.getMonth()) + 1;
      
      const mensual = parseFloat(formData.precioTotal) / mesesTotales;
      setAlquilerMensual(Math.round(mensual * 100) / 100);
    } else {
      setAlquilerMensual(0);
    }
  }, [formData.precioTotal, formData.fechaInicio, formData.fechaFin, formData.esMantenimiento]);

  const validateStep = () => {
    const newErrors = {};
    
    // Validar precio total
    if (!formData.precioTotal || parseFloat(formData.precioTotal) <= 0) {
      newErrors.precioTotal = 'El precio total debe ser mayor a 0';
    }
    
    // Validar cuenta
    if (!formData.cuenta) {
      newErrors.cuenta = 'Selecciona una cuenta';
    }
    
    // Validar depósito (opcional pero debe ser número válido)
    if (formData.deposito && isNaN(parseFloat(formData.deposito))) {
      newErrors.deposito = 'El depósito debe ser un número válido';
    }
    
    // Validar URL del documento (opcional pero debe ser URL válida si se proporciona)
    if (formData.documentoUrl && !isValidUrl(formData.documentoUrl)) {
      newErrors.documentoUrl = 'Ingresa una URL válida';
    }
    
    onErrorsChange(newErrors);
    
    const isValid = Object.keys(newErrors).length === 0;
    onStepComplete(2, isValid);
  };

  useEffect(() => {
    validateStep();
  }, [formData.precioTotal, formData.cuenta, formData.deposito, formData.documentoUrl]);

  const handleCuentaChange = (cuenta) => {
    setSelectedCuenta(cuenta);
    onFormDataChange({ 
      cuenta: cuenta?._id || cuenta?.id || ''
    });
  };

  const handlePrecioTotalChange = (value) => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    onFormDataChange({ precioTotal: numericValue });
  };

  const handleDepositoChange = (value) => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    onFormDataChange({ deposito: numericValue });
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const formatCurrency = (amount, currency = '$') => {
    return `${currency} ${parseFloat(amount || 0).toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const getMonedaSimbolo = () => {
    return selectedCuenta?.moneda?.simbolo || '$';
  };

  const monedaSimbolo = getMonedaSimbolo();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Título del paso */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        <MoneyIcon sx={{ fontSize: '1.5rem', color: 'primary.main' }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Términos Financieros
        </Typography>
      </Box>

      {/* Precio Total */}
      <Box>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
          Monto Total del Contrato
        </Typography>
        
        <StyledTextField
          fullWidth
          label="Precio Total"
          value={formData.precioTotal}
          onChange={(e) => handlePrecioTotalChange(e.target.value)}
          error={!!errors.precioTotal}
          helperText={errors.precioTotal}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <MoneyIcon sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            )
          }}
        />

        {/* Cálculo automático del alquiler mensual */}
        {alquilerMensual > 0 && (
          <Box sx={{ 
            mt: 2, 
            p: 1.5, 
            bgcolor: alpha(theme.palette.success.main, 0.05),
            border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
            borderRadius: 0
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <CalculateIcon sx={{ fontSize: '1rem', color: 'success.main' }} />
              <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 500 }}>
                Alquiler mensual promedio: {formatCurrency(alquilerMensual, monedaSimbolo)}
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Calculado automáticamente basado en el precio total y duración del contrato
            </Typography>
          </Box>
        )}
      </Box>

      {/* Cuenta */}
      <Box>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
          Cuenta de Cobro
        </Typography>
        
        <Autocomplete
          options={relatedData.cuentas || []}
          value={selectedCuenta}
          onChange={(_, newValue) => handleCuentaChange(newValue)}
          getOptionLabel={(option) => 
            `${option.nombre} (${option.moneda?.simbolo || '$'})`
          }
          renderInput={(params) => (
            <StyledTextField
              {...params}
              label="Seleccionar cuenta"
              error={!!errors.cuenta}
              helperText={errors.cuenta}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position="start">
                    <AccountIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                )
              }}
            />
          )}
          renderOption={(props, option) => (
            <Box component="li" {...props}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <AccountIcon sx={{ color: 'text.secondary' }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {option.nombre}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {option.moneda?.nombre} ({option.moneda?.simbolo})
                  </Typography>
                </Box>
                <Chip
                  label={option.tipo || 'Cuenta'}
                  size="small"
                  sx={{ 
                    fontSize: '0.7rem',
                    height: 20,
                    borderRadius: 0
                  }}
                />
              </Box>
            </Box>
          )}
        />

        {/* Información de la cuenta seleccionada */}
        {selectedCuenta && (
          <FinancialCard sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <AccountIcon sx={{ color: 'primary.main' }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {selectedCuenta.nombre}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Moneda: {selectedCuenta.moneda?.nombre} ({selectedCuenta.moneda?.simbolo})
            </Typography>
            {selectedCuenta.tipo && (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Tipo: {selectedCuenta.tipo}
              </Typography>
            )}
          </FinancialCard>
        )}
      </Box>

      {/* Depósito */}
      <Box>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
          Depósito (Opcional)
        </Typography>
        
        <StyledTextField
          fullWidth
          label="Monto del depósito"
          value={formData.deposito}
          onChange={(e) => handleDepositoChange(e.target.value)}
          error={!!errors.deposito}
          helperText={errors.deposito || 'Monto que se cobra como depósito de garantía'}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <DepositIcon sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            )
          }}
        />
      </Box>

      {/* URL del documento */}
      <Box>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
          Documento del Contrato (Opcional)
        </Typography>
        
        <StyledTextField
          fullWidth
          label="URL del documento"
          value={formData.documentoUrl}
          onChange={(e) => onFormDataChange({ documentoUrl: e.target.value })}
          error={!!errors.documentoUrl}
          helperText={errors.documentoUrl || 'Enlace al documento del contrato (Google Drive, Dropbox, etc.)'}
          placeholder="https://drive.google.com/..."
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LinkIcon sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            )
          }}
        />
      </Box>

      {/* Resumen financiero */}
      <Box>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
          Resumen Financiero
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FinancialCard>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <MoneyIcon sx={{ color: 'primary.main' }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Precio Total
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>
                {formatCurrency(formData.precioTotal, monedaSimbolo)}
              </Typography>
            </FinancialCard>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FinancialCard>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TrendingUpIcon sx={{ color: 'success.main' }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Alquiler Mensual
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ color: 'success.main', fontWeight: 600 }}>
                {formatCurrency(alquilerMensual, monedaSimbolo)}
              </Typography>
            </FinancialCard>
          </Grid>
        </Grid>

        {formData.deposito && parseFloat(formData.deposito) > 0 && (
          <FinancialCard sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <DepositIcon sx={{ color: 'warning.main' }} />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Depósito de Garantía
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ color: 'warning.main', fontWeight: 600 }}>
              {formatCurrency(formData.deposito, monedaSimbolo)}
            </Typography>
          </FinancialCard>
        )}
      </Box>

      {/* Alertas */}
      {formData.esMantenimiento && (
        <Alert severity="info" sx={{ borderRadius: 0 }}>
          Los contratos de mantenimiento no generan cuotas mensuales automáticas. 
          Los pagos se gestionan manualmente según los servicios prestados.
        </Alert>
      )}

      {selectedCuenta && selectedCuenta.tipo === 'DIGITAL' && (
        <Alert severity="success" sx={{ borderRadius: 0 }}>
          Cuenta digital seleccionada. Los pagos se pueden procesar automáticamente.
        </Alert>
      )}

      {/* Resumen del paso */}
      <Box sx={{ 
        p: 2, 
        bgcolor: alpha(theme.palette.background.paper, 0.5),
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 0
      }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          <strong>Resumen:</strong> 
          {` Contrato por ${formatCurrency(formData.precioTotal, monedaSimbolo)}`}
          {alquilerMensual > 0 && ` (${formatCurrency(alquilerMensual, monedaSimbolo)}/mes)`}
          {selectedCuenta && ` en cuenta ${selectedCuenta.nombre}`}
          {formData.deposito && parseFloat(formData.deposito) > 0 && ` con depósito de ${formatCurrency(formData.deposito, monedaSimbolo)}`}
        </Typography>
      </Box>
    </Box>
  );
};

export default FinancialTermsStep; 
