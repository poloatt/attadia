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

export default function Propiedades() {
  // Datos de prueba mientras se implementa el backend
  const [propiedades, setPropiedades] = useState([
    {
      id: '1',
      direccion: 'Calle Falsa 123',
      barrio: 'Springfield',
      provincia: 'Buenos Aires',
      pais: 'Argentina',
      cuentas: ['Cuenta 1', 'Cuenta 2'],
      habitaciones: [{ id: '1', nombre: 'Habitación 1' }]
    },
    {
      id: '2',
      direccion: 'Avenida Siempreviva 742',
      barrio: 'Palermo',
      provincia: 'CABA',
      pais: 'Argentina',
      cuentas: ['Cuenta Principal'],
      habitaciones: [
        { id: '2', nombre: 'Habitación 1' },
        { id: '3', nombre: 'Habitación 2' }
      ]
    },
    {
      id: '3',
      direccion: 'Baker Street 221B',
      barrio: 'Recoleta',
      provincia: 'CABA',
      pais: 'Argentina',
      cuentas: ['Cuenta Ahorro', 'Cuenta Corriente', 'Caja de Ahorro'],
      habitaciones: [
        { id: '4', nombre: 'Habitación 1' },
        { id: '5', nombre: 'Habitación 2' },
        { id: '6', nombre: 'Habitación 3' }
      ]
    }
  ]);

  useEffect(() => {
    // Cuando el backend esté listo, descomentar esto:
    // fetchPropiedades();
  }, []);

  const fetchPropiedades = async () => {
    try {
      const response = await fetch('/api/propiedades');
      const data = await response.json();
      setPropiedades(data);
    } catch (error) {
      console.error('Error al cargar propiedades:', error);
    }
  };

  return (
    <EntityDetails 
      title="Propiedades"
      action={
        <Button variant="contained" startIcon={<AddIcon />} size="small">
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
    </EntityDetails>
  );
}
