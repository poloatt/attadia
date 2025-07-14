import React from 'react';
import { Box, Typography, Autocomplete } from '@mui/material';
import { StyledTextField, FormSection, StyledToggleButton } from './ContratoFormStyles';
import { TIPO_ALQUILER } from './ContratoFormConstants';

const ContratoPropiedadSection = ({
  formData,
  selectedPropiedad,
  onPropiedadChange,
  onTipoAlquilerChange,
  relatedData,
  errors
}) => {
  return (
    <FormSection>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        <Autocomplete
          sx={{ flex: 1 }}
          value={selectedPropiedad}
          onChange={(_, newValue) => onPropiedadChange(newValue)}
          options={relatedData.propiedades || []}
          getOptionLabel={(option) => option.alias || ''}
          renderInput={(params) => (
            <StyledTextField
              {...params}
              label="Propiedad"
              error={!!errors.propiedad}
              helperText={errors.propiedad}
              InputLabelProps={{
                ...params.InputLabelProps,
                shrink: true
              }}
            />
          )}
        />
        {!formData.esMantenimiento && (
          <Box sx={{ 
            display: 'flex', 
            gap: 0.5,
            alignSelf: 'center',
            height: '56px',
            alignItems: 'center'
          }}>
            {TIPO_ALQUILER.map((tipo) => (
              <StyledToggleButton
                key={String(tipo.valor)}
                value={tipo.valor}
                selected={formData.esPorHabitacion === tipo.valor}
                onClick={() => onTipoAlquilerChange(tipo.valor)}
                customcolor={tipo.color}
              >
                {tipo.icon}
                <Typography 
                  variant="body2" 
                  className={formData.esPorHabitacion === tipo.valor ? 'selected' : ''}
                  sx={{ 
                    textTransform: 'capitalize',
                    fontSize: '0.875rem',
                    display: formData.esPorHabitacion === tipo.valor ? 'block' : 'none',
                    '.MuiButtonBase-root:hover &': {
                      display: 'block'
                    }
                  }}
                >
                  {tipo.label.toLowerCase()}
                </Typography>
              </StyledToggleButton>
            ))}
          </Box>
        )}
      </Box>
    </FormSection>
  );
};

export default ContratoPropiedadSection; 