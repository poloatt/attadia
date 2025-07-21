import React from 'react';
import { Box } from '@mui/material';
import { FormSection } from './ContratoFormStyles';
import { CommonDate } from '../../common/CommonDate';

const ContratoFechasSection = ({
  formData,
  onFechaChange,
  errors
}) => {
  return (
    <FormSection>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <CommonDate
          sx={{ flex: 1 }}
          label="Fecha de Inicio"
          value={formData.fechaInicio}
          onChange={(newValue) => onFechaChange('fechaInicio', newValue)}
          error={!!errors.fechaInicio}
          helperText={errors.fechaInicio}
        />
        <CommonDate
          sx={{ flex: 1 }}
          label="Fecha de Fin"
          value={formData.fechaFin}
          onChange={(newValue) => onFechaChange('fechaFin', newValue)}
          error={!!errors.fechaFin}
          helperText={errors.fechaFin}
          minDate={formData.fechaInicio}
        />
      </Box>
    </FormSection>
  );
};

export default ContratoFechasSection; 
