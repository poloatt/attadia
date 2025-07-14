import React from 'react';
import { Box, Typography, Autocomplete, Chip } from '@mui/material';
import { Person } from '@mui/icons-material';
import { StyledTextField, FormSection } from './ContratoFormStyles';

const ContratoInquilinosSection = ({
  selectedInquilinos,
  onInquilinosChange,
  relatedData,
  errors
}) => {
  return (
    <FormSection>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Autocomplete
          multiple
          value={selectedInquilinos}
          onChange={(_, newValue) => onInquilinosChange(newValue)}
          options={relatedData.inquilinos || []}
          getOptionLabel={(option) => 
            option && typeof option === 'object' ? 
              `${option.nombre || ''} ${option.apellido || ''}` : ''
          }
          renderInput={(params) => (
            <StyledTextField
              {...params}
              label="Seleccionar Inquilinos"
              error={!!errors.inquilino}
              helperText={errors.inquilino}
              InputLabelProps={{
                ...params.InputLabelProps,
                shrink: true
              }}
            />
          )}
          renderTags={() => null}
        />
        {selectedInquilinos.length > 0 && (
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 1,
            p: 1,
            bgcolor: 'background.default'
          }}>
            {selectedInquilinos.map((inquilino) => inquilino && (
              <Chip
                key={inquilino._id}
                label={`${inquilino.nombre || ''} ${inquilino.apellido || ''}`}
                onDelete={() => {
                  const newInquilinos = selectedInquilinos.filter(
                    i => i._id !== inquilino._id
                  );
                  onInquilinosChange(newInquilinos);
                }}
                sx={{ 
                  borderRadius: 0,
                  bgcolor: 'background.paper',
                  '& .MuiChip-deleteIcon': {
                    color: 'text.secondary',
                    '&:hover': {
                      color: 'error.main'
                    }
                  }
                }}
              />
            ))}
          </Box>
        )}
      </Box>
    </FormSection>
  );
};

export default ContratoInquilinosSection; 