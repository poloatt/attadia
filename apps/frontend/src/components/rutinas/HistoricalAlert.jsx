import React from 'react';
import { Typography, Box } from '@mui/material';

/**
 * Componente para mostrar un mensaje simple cuando no hay datos históricos disponibles
 */
const HistoricalAlert = ({ message = "No hay datos históricos disponibles" }) => {
  return (
    <Box sx={{ width: '100%', py: 2, textAlign: 'center' }}>
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Completa elementos de la rutina para generar datos históricos.
      </Typography>
    </Box>
  );
};

export default HistoricalAlert; 
