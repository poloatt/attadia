import React from 'react';
import { Autocomplete } from '@mui/material';
import { StyledTextField, FormSection } from './ContratoFormStyles';

const ContratoHabitacionSection = ({
  selectedHabitacion,
  onHabitacionChange,
  relatedData,
  formData,
  errors
}) => {
  if (!formData.esPorHabitacion || formData.esMantenimiento) return null;

  return (
    <FormSection>
      <Autocomplete
        value={selectedHabitacion}
        onChange={(_, newValue) => onHabitacionChange(newValue)}
        options={relatedData.habitaciones?.filter(h => 
          h.propiedad === formData.propiedad
        ) || []}
        getOptionLabel={(option) => option.nombre || ''}
        disabled={!formData.propiedad}
        renderInput={(params) => (
          <StyledTextField
            {...params}
            label="Habitación"
            error={!!errors.habitacion}
            helperText={errors.habitacion}
            InputLabelProps={{
              ...params.InputLabelProps,
              shrink: true
            }}
          />
        )}
      />
    </FormSection>
  );
};

export default ContratoHabitacionSection; 
