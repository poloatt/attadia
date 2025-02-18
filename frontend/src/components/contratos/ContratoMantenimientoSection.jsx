import React from 'react';
import { Box, Typography, Switch } from '@mui/material';
import { Engineering, Info as InfoIcon } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { FormSection } from './ContratoFormStyles';

const ContratoMantenimientoSection = ({ formData, onChange, theme }) => {
  return (
    <FormSection>
      <Box sx={{ 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Engineering sx={{ color: 'warning.main' }} />
          <Typography variant="subtitle1">Reservar Mantenimiento</Typography>
        </Box>
        <Switch
          checked={formData.esMantenimiento}
          onChange={(e) => {
            const esMantenimiento = e.target.checked;
            onChange(esMantenimiento);
          }}
          sx={{
            '& .MuiSwitch-switchBase.Mui-checked': {
              color: 'warning.main',
              '&:hover': {
                backgroundColor: alpha(theme.palette.warning.main, 0.08)
              }
            },
            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
              backgroundColor: 'warning.main'
            }
          }}
        />
      </Box>
      {formData.esMantenimiento && (
        <Typography 
          variant="caption" 
          color="warning.main"
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <InfoIcon sx={{ fontSize: '1rem' }} />
          Durante el mantenimiento, el monto mensual será 0 y no se requiere inquilino
        </Typography>
      )}
    </FormSection>
  );
};

export default ContratoMantenimientoSection; 