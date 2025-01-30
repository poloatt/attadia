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
            <strong>Nombre:</strong> {user?.name || 'No especificado'}
          </Typography>
          
          <Typography variant="body1" sx={{ mt: 1 }}>
            <strong>Email:</strong> {user?.email}
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
} 