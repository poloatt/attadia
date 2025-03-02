import React from 'react';
import { Container, Box, Typography, useTheme } from '@mui/material';
import UnderConstruction from '../components/UnderConstruction';

export function Configuracion() {
  const theme = useTheme();

  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          p: 3,
          backgroundColor: 'background.paper',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          mt: 2
        }}
      >
        <Typography
          variant="h5"
          component="h1"
          sx={{
            mb: 3,
            fontWeight: 500,
            color: theme.palette.text.primary,
            textTransform: 'uppercase',
            letterSpacing: '0.02em'
          }}
        >
          Configuración del Sistema
        </Typography>
        <UnderConstruction />
      </Box>
    </Container>
  );
}

export default Configuracion;
