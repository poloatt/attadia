import React, { useEffect } from 'react';
import { Box, Typography, Paper, Container, Grid, Chip } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { EntityToolbar } from '../components/EntityViews';

export default function Perfil() {
  const { user } = useAuth();

  useEffect(() => {
    console.log('Datos del usuario en Perfil:', user);
  }, [user]);

  const formatDate = (date) => {
    if (!date) return 'No especificado';
    return new Date(date).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Si no hay usuario, mostrar mensaje de carga
  if (!user) {
    return (
      <Container maxWidth="md">
        <Paper elevation={0} sx={{ p: 3, mt: 2, backgroundColor: 'background.paper' }}>
          <Typography>Cargando datos del usuario...</Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <EntityToolbar />
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
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Información Personal
              </Typography>
              
              <Typography variant="body1" sx={{ mt: 1 }}>
                <strong>Nombre:</strong> {user.nombre || 'No especificado'}
              </Typography>
              
              <Typography variant="body1" sx={{ mt: 1 }}>
                <strong>Email:</strong> {user.email || 'No especificado'}
              </Typography>

              <Typography variant="body1" sx={{ mt: 1 }}>
                <strong>Teléfono:</strong> {user.telefono || 'No especificado'}
              </Typography>

              <Typography variant="body1" sx={{ mt: 1 }}>
                <strong>ID:</strong> {user._id || user.id || 'No especificado'}
              </Typography>

              <Typography variant="body1" sx={{ mt: 1 }}>
                <strong>Rol:</strong> {user.role || 'No especificado'}
              </Typography>

              <Box sx={{ mt: 1 }}>
                <strong>Estado:</strong>{' '}
                <Chip 
                  label={user.activo ? 'Activo' : 'Inactivo'} 
                  color={user.activo ? 'success' : 'error'}
                  size="small"
                />
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Preferencias
              </Typography>
              
              <Typography variant="body1" sx={{ mt: 1 }}>
                <strong>Tema:</strong> {user.preferences?.theme || 'No especificado'}
              </Typography>
              
              <Typography variant="body1" sx={{ mt: 1 }}>
                <strong>Idioma:</strong> {user.preferences?.language || 'No especificado'}
              </Typography>

              <Typography variant="body1" sx={{ mt: 1 }}>
                <strong>Notificaciones Email:</strong>{' '}
                {user.preferences?.notifications?.email ? 'Activadas' : 'Desactivadas'}
              </Typography>

              <Typography variant="body1" sx={{ mt: 1 }}>
                <strong>Notificaciones Push:</strong>{' '}
                {user.preferences?.notifications?.push ? 'Activadas' : 'Desactivadas'}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Información de la Cuenta
              </Typography>

              <Typography variant="body1" sx={{ mt: 1 }}>
                <strong>Tipo de Cuenta:</strong>{' '}
                {user.googleId ? 'Google' : 'Email y Contraseña'}
              </Typography>

              <Typography variant="body1" sx={{ mt: 1 }}>
                <strong>Último Acceso:</strong>{' '}
                {formatDate(user.lastLogin)}
              </Typography>

              <Typography variant="body1" sx={{ mt: 1 }}>
                <strong>Fecha de Creación:</strong>{' '}
                {formatDate(user.createdAt)}
              </Typography>

              <Typography variant="body1" sx={{ mt: 1 }}>
                <strong>Última Actualización:</strong>{' '}
                {formatDate(user.updatedAt)}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Estado de autenticación: {user ? 'Autenticado' : 'No autenticado'}
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
} 