import React, { useEffect } from 'react';
import { Box, Typography, Autocomplete, InputAdornment } from '@mui/material';
import { AttachMoney } from '@mui/icons-material';
import { StyledTextField, FormSection } from './ContratoFormStyles';

const ContratoMontosSection = ({
  formData,
  selectedCuenta,
  onCuentaChange,
  onMontoChange,
  relatedData,
  errors
}) => {
  useEffect(() => {
    console.log('ContratoMontosSection - selectedCuenta:', selectedCuenta);
    console.log('ContratoMontosSection - formData.cuenta:', formData.cuenta);
    console.log('ContratoMontosSection - cuentas disponibles:', relatedData.cuentas?.length || 0);
    
    // Si hay un ID de cuenta en formData pero no hay selectedCuenta, intentar encontrarla
    if (formData.cuenta && !selectedCuenta && relatedData.cuentas?.length > 0) {
      console.log('Intentando encontrar cuenta por ID:', formData.cuenta);
      const cuenta = relatedData.cuentas.find(c => c._id === formData.cuenta || c.id === formData.cuenta);
      if (cuenta) {
        console.log('Cuenta encontrada en ContratoMontosSection:', cuenta);
        onCuentaChange(cuenta);
      }
    }
  }, [selectedCuenta, formData.cuenta, relatedData.cuentas, onCuentaChange]);

  return (
    <FormSection>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <StyledTextField
            sx={{ flex: 1 }}
            label="Monto Mensual"
            value={formData.montoMensual}
            onChange={(e) => onMontoChange('montoMensual', e.target.value)}
            error={!!errors.montoMensual}
            helperText={errors.montoMensual}
            type="number"
            InputLabelProps={{
              shrink: true
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AttachMoney />
                </InputAdornment>
              )
            }}
          />
          <StyledTextField
            sx={{ flex: 1 }}
            label="Depósito"
            value={formData.deposito}
            onChange={(e) => onMontoChange('deposito', e.target.value)}
            error={!!errors.deposito}
            helperText={errors.deposito}
            type="number"
            InputLabelProps={{
              shrink: true
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AttachMoney />
                </InputAdornment>
              )
            }}
          />
        </Box>
        <Autocomplete
          value={selectedCuenta}
          onChange={(_, newValue) => onCuentaChange(newValue)}
          options={relatedData.cuentas || []}
          getOptionLabel={(option) => {
            if (!option) return '';
            return `${option.nombre || ''} - ${option.moneda?.simbolo || ''} (${option.tipo || ''})`;
          }}
          isOptionEqualToValue={(option, value) => {
            if (!option || !value) return false;
            return option._id === value._id || option.id === value.id;
          }}
          renderInput={(params) => (
            <StyledTextField
              {...params}
              label="Cuenta"
              error={!!errors.cuenta}
              helperText={errors.cuenta || (formData.cuenta && !selectedCuenta ? 'Seleccione una cuenta' : '')}
              InputLabelProps={{
                ...params.InputLabelProps,
                shrink: true
              }}
            />
          )}
          renderOption={(props, option) => {
            if (!option) return null;
            const { key, ...otherProps } = props;
            return (
              <Box component="li" key={option._id || option.id} {...otherProps}>
                <Box>
                  <Typography>{option.nombre}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.moneda?.simbolo} - {option.tipo}
                  </Typography>
                </Box>
              </Box>
            );
          }}
        />
      </Box>
    </FormSection>
  );
};

export default ContratoMontosSection; 