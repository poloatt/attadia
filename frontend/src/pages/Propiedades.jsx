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
  Divider,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import BedroomParentIcon from '@mui/icons-material/BedroomParent';
import EntityDetails from '../components/EntityDetails';
import EntityForm from '../components/EntityForm';
import { API_URL } from '../config';
import { useSnackbar } from 'notistack';
import { useAuth } from '../context/AuthContext';

export default function Propiedades() {
  const [propiedades, setPropiedades] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { enqueueSnackbar } = useSnackbar();
  const { getToken } = useAuth();

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

  const fetchPropiedades = async () => {
    try {
      const token = await getToken();
      const response = await fetch('/api/propiedades', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
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

  const handleNewPropiedad = async (newPropiedad) => {
    try {
      const token = await getToken();
      const response = await fetch('/api/propiedades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newPropiedad)
      });

      if (!response.ok) throw new Error('Error al guardar propiedad');

      // Recargar la lista después de guardar
      await fetchPropiedades();
      setIsFormOpen(false); // Cerrar el formulario
      enqueueSnackbar('Propiedad creada exitosamente', { variant: 'success' });
    } catch (error) {
      console.error('Error:', error);
      enqueueSnackbar('Error al guardar propiedad', { variant: 'error' });
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
          onClick={() => setIsFormOpen(true)}
        >
          Nueva Propiedad
        </Button>
      }
    >
      <Box sx={{ width: '100%', height: '100%', overflow: 'auto' }}>
        {isLoading ? (
          <Typography>Cargando...</Typography>
        ) : propiedades.length > 0 ? (
          <List>
            {propiedades.map((propiedad) => (
              <ListItem key={propiedad._id}>
                <ListItemText
                  primary={propiedad.direccion}
                  secondary={`${propiedad.barrio}, ${propiedad.provincia}`}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography>No hay propiedades registradas</Typography>
        )}
      </Box>
      
      {isFormOpen && (
        <EntityForm
          onSubmit={handleNewPropiedad}
          onClose={() => setIsFormOpen(false)}
          title="Nueva Propiedad"
          fields={fields}
        />
      )}
    </EntityDetails>
  );
}
