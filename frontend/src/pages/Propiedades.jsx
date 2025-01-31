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
  IconButton,
  CardMedia,
  Skeleton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '@mui/material/styles';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BedIcon from '@mui/icons-material/Bed';
import BathtubIcon from '@mui/icons-material/Bathtub';
import SquareFootIcon from '@mui/icons-material/SquareFoot';
import EntityForm from '../components/EntityForm';
import EntityDetails from '../components/EntityDetails';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Cambiamos a exportación nombrada para coincidir con App.jsx
export function Propiedades() {
  const [propiedades, setPropiedades] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();
  const theme = useTheme();
  const [selectedPropiedad, setSelectedPropiedad] = useState(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    precio: '',
    direccion: '',
    ciudad: '',
    estado: '',
    tipo: 'CASA',
    numHabitaciones: '',
    banos: '',
    metrosCuadrados: '',
    imagen: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPropiedades = async () => {
      try {
        console.log('Iniciando fetch de propiedades...');
        const response = await axios.get('/api/propiedades', {
          withCredentials: true,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        console.log('Respuesta de propiedades:', response.data);
        setPropiedades(response.data);
      } catch (error) {
        console.error('Error completo:', error);
        if (error.response) {
          console.error('Status:', error.response.status);
          console.error('Headers:', error.response.headers);
          console.error('Data:', error.response.data);
        } else if (error.request) {
          console.error('Request:', error.request);
        } else {
          console.error('Error:', error.message);
        }
      } finally {
        setLoading(false);
      }
    };

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

  const handleEdit = (id) => {
    const propiedad = propiedades.find(p => p.id === id);
    setSelectedPropiedad(propiedad);
    setFormData(propiedad);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    try {
      const method = selectedPropiedad ? 'PUT' : 'POST';
      const url = selectedPropiedad 
        ? `/api/propiedades/${selectedPropiedad.id}`
        : '/api/propiedades';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Error al guardar propiedad');

      const data = await response.json();
      
      if (selectedPropiedad) {
        setPropiedades(propiedades.map(p => 
          p.id === selectedPropiedad.id ? data : p
        ));
        enqueueSnackbar('Propiedad actualizada con éxito', { variant: 'success' });
      } else {
        setPropiedades([...propiedades, data]);
        enqueueSnackbar('Propiedad creada con éxito', { variant: 'success' });
      }

      setIsFormOpen(false);
      setSelectedPropiedad(null);
      setFormData({
        titulo: '',
        descripcion: '',
        precio: '',
        direccion: '',
        ciudad: '',
        estado: '',
        tipo: 'CASA',
        numHabitaciones: '',
        banos: '',
        metrosCuadrados: '',
        imagen: ''
      });
    } catch (error) {
      console.error('Error:', error);
      enqueueSnackbar('Error al guardar propiedad', { variant: 'error' });
    }
  };

  const formFields = [
    {
      name: 'titulo',
      label: 'Título',
      required: true,
      onChange: (value) => setFormData({...formData, titulo: value})
    },
    {
      name: 'descripcion',
      label: 'Descripción',
      multiline: true,
      rows: 3,
      required: true,
      onChange: (value) => setFormData({...formData, descripcion: value})
    },
    {
      name: 'precio',
      label: 'Precio',
      type: 'number',
      required: true,
      onChange: (value) => setFormData({...formData, precio: value})
    },
    {
      name: 'direccion',
      label: 'Dirección',
      required: true,
      onChange: (value) => setFormData({...formData, direccion: value})
    },
    {
      name: 'ciudad',
      label: 'Ciudad',
      required: true,
      onChange: (value) => setFormData({...formData, ciudad: value})
    },
    {
      name: 'estado',
      label: 'Estado',
      required: true,
      onChange: (value) => setFormData({...formData, estado: value})
    },
    {
      name: 'tipo',
      label: 'Tipo',
      select: true,
      required: true,
      options: ['CASA', 'DEPARTAMENTO', 'TERRENO', 'LOCAL', 'OFICINA'],
      onChange: (value) => setFormData({...formData, tipo: value})
    },
    {
      name: 'numHabitaciones',
      label: 'Número de Habitaciones',
      type: 'number',
      required: true,
      onChange: (value) => setFormData({...formData, numHabitaciones: value})
    },
    {
      name: 'banos',
      label: 'Número de Baños',
      type: 'number',
      required: true,
      onChange: (value) => setFormData({...formData, banos: value})
    },
    {
      name: 'metrosCuadrados',
      label: 'Metros Cuadrados',
      type: 'number',
      required: true,
      onChange: (value) => setFormData({...formData, metrosCuadrados: value})
    },
    {
      name: 'imagen',
      label: 'Imagen',
      onChange: (value) => setFormData({...formData, imagen: value})
    }
  ];

  if (loading) {
    return (
      <Container sx={{ py: 4 }}>
        <Grid container spacing={4}>
          {[1, 2, 3, 4].map((item) => (
            <Grid item key={item} xs={12} sm={6} md={4}>
              <Skeleton variant="rectangular" height={200} />
              <Skeleton />
              <Skeleton width="60%" />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" component="h1">
          Propiedades
        </Typography>
        {loading && <Typography color="textSecondary">Cargando propiedades...</Typography>}
        {error && <Alert severity="error">{error}</Alert>}
        {!loading && !error && propiedades.length === 0 && (
          <Typography color="textSecondary">No hay propiedades para mostrar</Typography>
        )}
      </Box>

      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
            <EntityDetails
              entity={propiedad}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </Grid>
        ))}
      </Grid>

      <EntityForm
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedPropiedad(null);
          setFormData({
            titulo: '',
            descripcion: '',
            precio: '',
            direccion: '',
            ciudad: '',
            estado: '',
            tipo: 'CASA',
            numHabitaciones: '',
            banos: '',
            metrosCuadrados: '',
            imagen: ''
          });
        }}
        onSubmit={handleFormSubmit}
        entity={formData}
        title={selectedPropiedad ? 'Editar Propiedad' : 'Nueva Propiedad'}
        fields={formFields}
      />
    </Container>
  );
}

// También mantenemos la exportación por defecto
export default Propiedades;
