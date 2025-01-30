import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAuth } from '../context/AuthContext';

// Cambiamos a exportación nombrada para coincidir con App.jsx
export function Propiedades() {
  const [propiedades, setPropiedades] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();

  const fetchPropiedades = async () => {
    try {
      const response = await fetch('/api/propiedades', {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Error al cargar propiedades');
      
      const data = await response.json();
      setPropiedades(data);
    } catch (error) {
      console.error('Error:', error);
      enqueueSnackbar('Error al cargar propiedades', { variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPropiedades();
  }, []);

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/propiedades/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Error al eliminar propiedad');
      
      setPropiedades(propiedades.filter(prop => prop.id !== id));
      enqueueSnackbar('Propiedad eliminada con éxito', { variant: 'success' });
    } catch (error) {
      console.error('Error:', error);
      enqueueSnackbar('Error al eliminar propiedad', { variant: 'error' });
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Typography>Cargando propiedades...</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h1">
          Propiedades
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsFormOpen(true)}
        >
          Nueva Propiedad
        </Button>
      </Box>

      <Grid container spacing={3}>
        {propiedades.map((propiedad) => (
          <Grid item xs={12} sm={6} md={4} key={propiedad.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="h2">
                  {propiedad.direccion}
                </Typography>
                <Typography color="textSecondary" gutterBottom>
                  {propiedad.barrio}
                </Typography>
                <Typography variant="body2">
                  {propiedad.provincia}, {propiedad.pais}
                </Typography>
              </CardContent>
              <CardActions>
                <IconButton 
                  size="small" 
                  onClick={() => handleEdit(propiedad.id)}
                >
                  <EditIcon />
                </IconButton>
                <IconButton 
                  size="small" 
                  onClick={() => handleDelete(propiedad.id)}
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Aquí iría el modal o drawer para el formulario */}
    </Container>
  );
}

// También mantenemos la exportación por defecto
export default Propiedades;
