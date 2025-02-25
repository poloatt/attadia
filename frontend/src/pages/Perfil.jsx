import React from 'react';
import { Box, Typography, Paper, Container } from '@mui/material';
import { useAuth } from '../context/AuthContext';

export default function Perfil() {
  const { user } = useAuth();

  return (
    <Container maxWidth="md">
      <Paper 
        elevation={0}
        sx={{ 
          p: 3,
          mt: 2,
          backgroundColor: 'background.paper'
        }}
      >
        <Typography variant="h5" component="h1" gutterBottom>
          Perfil de Usuario
        </Typography>
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="body1">
            <strong>Nombre:</strong> {user?.nombre || 'No especificado'}
          </Typography>
          
          <Typography variant="body1" sx={{ mt: 1 }}>
            <strong>Email:</strong> {user?.email || 'No especificado'}
          </Typography>

          <Typography variant="body1" sx={{ mt: 1 }}>
            <strong>ID:</strong> {user?.id || 'No especificado'}
          </Typography>

          <Typography variant="body1" sx={{ mt: 1 }}>
            <strong>Rol:</strong> {user?.role || 'No especificado'}
          </Typography>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Estado de autenticación: {user ? 'Autenticado' : 'No autenticado'}
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
} 