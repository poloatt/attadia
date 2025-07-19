import React from 'react';
import { Box, Paper, Typography, Chip } from '@mui/material';
import { Info as InfoIcon, HistoryOutlined as HistoryIcon } from '@mui/icons-material';

/**
 * Componente para mostrar un mensaje cuando no hay datos históricos disponibles
 * Sigue la estética de la aplicación con bordes geométricos
 */
const HistoricalAlert = ({ message = "No hay datos históricos disponibles" }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 2,
        backgroundColor: 'rgba(25, 118, 210, 0.08)',
        border: '1px solid rgba(25, 118, 210, 0.2)',
        borderRadius: 1,
        overflow: 'hidden',
        // Diseño geométrico para seguir la estética
        clipPath: 'polygon(0% 0%, 100% 0%, 98% 100%, 2% 100%)',
        position: 'relative',
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1.5 
      }}>
        <Box 
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 1, 
            p: 0.8,
            bgcolor: 'primary.light',
            // Diseño geométrico para el icono
            clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
          }}
        >
          <HistoryIcon sx={{ color: 'white', fontSize: 20 }} />
        </Box>
        
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 500, color: 'primary.main' }}>
            {message}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Completa elementos de la rutina para generar datos históricos.
          </Typography>
        </Box>
        
        <Chip 
          label="Info" 
          size="small" 
          color="primary" 
          variant="outlined"
          sx={{ 
            height: '20px', 
            fontSize: '0.65rem',
            // Diseño geométrico para el chip
            clipPath: 'polygon(5% 0%, 95% 0%, 100% 50%, 95% 100%, 5% 100%, 0% 50%)',
            pl: 0.25,
            pr: 0.25
          }} 
        />
      </Box>
    </Paper>
  );
};

export default HistoricalAlert; 
