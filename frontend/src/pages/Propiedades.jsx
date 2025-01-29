import { useState, useEffect } from 'react';
import { 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  CardActions,
  Typography,
  Chip,
  Box,
  Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import BedroomParentIcon from '@mui/icons-material/BedroomParent';
import EntityDetails from '../components/EntityDetails';
import EntityForm from '../components/EntityForm';
import { API_URL } from '../config';
import { useSnackbar } from 'notistack';

export default function Propiedades() {
  const [propiedades, setPropiedades] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const fields = [
    {
      name: 'direccion',
      label: 'Dirección',
      type: 'text',
      required: true
    },
    {
      name: 'barrio',
      label: 'Barrio',
      type: 'text',
      required: true
    },
    {
      name: 'provincia',
      label: 'Provincia',
      type: 'text',
      required: true
    },
    {
      name: 'pais',
      label: 'País',
      type: 'text',
      required: true
    },
    {
      name: 'cuentas',
      label: 'Cuenta',
      type: 'array'
    }
  ];

  // Datos de prueba mientras se implementa el backend
  useEffect(() => {
    // Cuando el backend esté listo, descomentar esto:
    // fetchPropiedades();
  }, []);

  const fetchPropiedades = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/propiedades`);
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

  const handleSubmit = async (data) => {
    try {
      console.log('Enviando datos:', data); // Para debugging

      const response = await fetch('/api/propiedades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.details || responseData.error || 'Error al crear la propiedad');
      }

      console.log('Propiedad creada:', responseData);
      setPropiedades(prev => [...prev, responseData]);
      enqueueSnackbar('Propiedad creada exitosamente', { variant: 'success' });
      setOpenForm(false);
    } catch (error) {
      console.error('Error completo:', error);
      // Aquí puedes mostrar un mensaje de error al usuario
      throw new Error(error.message);
    }
  };

  return (
    <EntityDetails 
      title="Propiedades"
      action={
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          size="small"
          onClick={() => setOpenForm(true)}
        >
          Nueva Propiedad
        </Button>
      }
    >
      <Box sx={{ width: '100%', height: '100%', overflow: 'auto' }}>
        <Grid container spacing={2} sx={{ p: 1 }}>
          {propiedades.map((prop) => (
            <Grid item xs={12} sm={6} md={4} key={prop.id}>
              <Card 
                elevation={0} 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: 'background.paper',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                    cursor: 'pointer'
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <HomeWorkIcon sx={{ mr: 1 }} />
                    <Typography variant="h6" component="div">
                      {prop.direccion}
                    </Typography>
                  </Box>
                  
                  <Typography color="text.secondary" gutterBottom>
                    {prop.barrio}, {prop.provincia}
                  </Typography>
                  <Typography color="text.secondary" gutterBottom>
                    {prop.pais}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <AccountBalanceIcon sx={{ fontSize: 20, mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Cuentas:
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                    {prop.cuentas.map((cuenta, index) => (
                      <Chip 
                        key={index}
                        label={cuenta}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <BedroomParentIcon sx={{ fontSize: 20, mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Habitaciones: {prop.habitaciones?.length || 0}
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button size="small" color="primary">
                    Ver Detalles
                  </Button>
                  <Button size="small" color="primary">
                    Editar
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
      
      <EntityForm
        open={openForm}
        onClose={() => setOpenForm(false)}
        onSubmit={handleSubmit}
        title="Nueva Propiedad"
        fields={fields}
      />
    </EntityDetails>
  );
}
