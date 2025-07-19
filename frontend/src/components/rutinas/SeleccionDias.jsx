import React from 'react';
import { 
  Box, 
  ToggleButtonGroup, 
  ToggleButton, 
  Typography 
} from '@mui/material';

const DIAS_SEMANA = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' }
];

/**
 * Componente para seleccionar días de la semana o del mes
 * @param {Object} props - Propiedades del componente
 * @param {string} props.tipo - Tipo de selección: 'semana' o 'mes'
 * @param {Array<number>} props.diasSeleccionados - Array con los días seleccionados
 * @param {Function} props.onChange - Función para manejar cambios en la selección
 */
export const SeleccionDias = ({ tipo, diasSeleccionados = [], onChange }) => {
  // Asegurar que diasSeleccionados sea un array
  const valoresSeleccionados = Array.isArray(diasSeleccionados) ? diasSeleccionados : [];
  
  const handleChange = (event, newValue) => {
    // Siempre debe haber al menos un día seleccionado
    if (newValue && newValue.length > 0) {
      onChange(newValue);
    }
  };

  if (tipo === 'semana') {
    return (
      <Box sx={{ width: '100%' }}>
        <ToggleButtonGroup
          value={valoresSeleccionados}
          onChange={handleChange}
          aria-label="días de la semana"
          color="primary"
          size="small"
          fullWidth
          multiple
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 0.5,
            '& .MuiToggleButtonGroup-grouped': {
              flex: '1 0 auto',
              minWidth: 50
            }
          }}
        >
          {DIAS_SEMANA.map((dia) => (
            <ToggleButton 
              key={dia.value} 
              value={dia.value}
              sx={{ 
                textTransform: 'none',
                py: 0.5
              }}
            >
              {dia.label.substring(0, 3)}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
    );
  }

  if (tipo === 'mes') {
    return (
      <Box sx={{ width: '100%' }}>
        <ToggleButtonGroup
          value={valoresSeleccionados}
          onChange={handleChange}
          aria-label="días del mes"
          color="primary"
          size="small"
          multiple
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 0.5,
            width: '100%'
          }}
        >
          {Array.from({ length: 31 }, (_, index) => (
            <ToggleButton 
              key={index + 1} 
              value={index + 1}
              sx={{ 
                height: 36,
                minWidth: 36
              }}
            >
              {index + 1}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
    );
  }
  
  // Si no es un tipo válido, mostrar mensaje de error
  return (
    <Typography color="error">
      Tipo de selección inválido: {tipo}. Use 'semana' o 'mes'.
    </Typography>
  );
};

export default SeleccionDias; 
