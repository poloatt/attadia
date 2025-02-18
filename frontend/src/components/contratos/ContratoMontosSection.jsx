import React from 'react';
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
          getOptionLabel={(option) => 
            `${option.nombre || ''} - ${option.moneda?.simbolo || ''} (${option.tipo || ''})`
          }
          renderInput={(params) => (
            <StyledTextField
              {...params}
              label="Cuenta"
              error={!!errors.cuenta}
              helperText={errors.cuenta}
              InputLabelProps={{
                ...params.InputLabelProps,
                shrink: true
              }}
            />
          )}
          renderOption={(props, option) => {
            const { key, ...otherProps } = props;
            return (
              <Box component="li" key={key} {...otherProps}>
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