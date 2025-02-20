import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

export function UnderConstruction() {
  return (
    <Box sx={{ 
      mt: 4,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '50vh'
    }}>
      <Paper 
        elevation={0}
        sx={{ 
          p: 4,
          textAlign: 'center',
          border: '1px dashed',
          borderColor: 'divider'
        }}
      >
        <Typography variant="h4" color="text.secondary" gutterBottom>
          Página en Construcción
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Esta funcionalidad estará disponible próximamente
        </Typography>
      </Paper>
    </Box>
  );
}

export default UnderConstruction; 