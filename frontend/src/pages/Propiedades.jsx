import React, { useState, useEffect, useCallback } from 'react';
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
  MenuItem,
  Collapse
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  BedOutlined as BedIcon, 
  PeopleOutlined as PeopleIcon, 
  DescriptionOutlined as DescriptionIcon, 
  AttachMoneyOutlined as AttachMoneyIcon, 
  AccountBalanceWalletOutlined as AccountBalanceWalletIcon, 
  Inventory2Outlined as InventoryIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  HomeWork
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '@mui/material/styles';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SquareFootIcon from '@mui/icons-material/SquareFoot';
import BathtubOutlinedIcon from '@mui/icons-material/BathtubOutlined';
import EntityForm from '../components/EntityViews/EntityForm';
import { useNavigate } from 'react-router-dom';
import clienteAxios from '../config/axios';
import EntityToolbar from '../components/EntityToolbar';
import EntityDetails from '../components/EntityViews/EntityDetails';
import EntityCards from '../components/EntityViews/EntityCards';
import EmptyState from '../components/EmptyState';
import { EntityActions } from '../components/EntityViews/EntityActions';
import PropiedadForm from '../components/propiedades/PropiedadForm';
import PropiedadList from '../components/propiedades/PropiedadList';

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
    estado: 'DISPONIBLE',
    tipo: 'CASA',
    numDormitorios: '',
    banos: '',
    metrosCuadrados: '',
    imagen: '',
    monedaId: '',
    cuentaId: ''
  });
  const navigate = useNavigate();
  const [selectedItems, setSelectedItems] = useState([]);
  const [filteredPropiedades, setFilteredPropiedades] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(true);
  const [editingPropiedad, setEditingPropiedad] = useState(null);

  const handleBack = () => {
    navigate('/');
  };

  // Función para cargar propiedades
  const fetchPropiedades = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Solicitando propiedades...');
      
      const response = await clienteAxios.get('/api/propiedades');
      console.log('Respuesta recibida:', response.data);
      
      const propiedadesData = response.data.docs || [];
      // OPTIMIZACIÓN: Procesar todas las propiedades en paralelo
      const propiedadesEnriquecidas = await Promise.all(propiedadesData.map(async (propiedad) => {
        try {
          const propiedadId = propiedad._id || propiedad.id;
          console.log(`Obteniendo datos relacionados para propiedad ${propiedadId} (${propiedad.titulo})`);

          // Todas las requests en paralelo
          const [
            inquilinosResponse,
            habitacionesResponse,
            contratosResponse,
            inventarioResponse
          ] = await Promise.all([
            clienteAxios.get(`/api/inquilinos/propiedad/${propiedadId}`),
            clienteAxios.get(`/api/habitaciones/propiedad/${propiedadId}`),
            clienteAxios.get(`/api/contratos/propiedad/${propiedadId}`),
            clienteAxios.get(`/api/inventarios/propiedad/${propiedadId}`)
          ]);

          const habitaciones = habitacionesResponse.data.docs || [];
          const inquilinos = Array.isArray(inquilinosResponse.data.docs) 
            ? inquilinosResponse.data.docs 
            : [];
          const contratos = contratosResponse.data.docs || [];
          const inventario = inventarioResponse.data.docs || [];

          if (inquilinos.length > 0) {
            console.log(`Datos de inquilinos para propiedad ${propiedadId}:`, 
              inquilinos.map(i => ({
                id: i._id || i.id,
                nombre: i.nombre,
                apellido: i.apellido
              }))
            );
          }

          return {
            ...propiedad,
            inquilinos,
            habitaciones,
            contratos,
            inventario
          };
        } catch (error) {
          console.error(`Error al cargar datos relacionados para propiedad ${propiedad._id || propiedad.id}:`, error);
          // Si hay error, agregamos la propiedad con arrays vacíos
          return {
            ...propiedad,
            inquilinos: [],
            habitaciones: [],
            contratos: [],
            inventario: []
          };
        }
      }));

      console.log('Propiedades enriquecidas:', propiedadesEnriquecidas);
      setPropiedades(propiedadesEnriquecidas);
      setFilteredPropiedades(propiedadesEnriquecidas);

    } catch (error) {
      console.error('Error al cargar propiedades:', error);
      setError(error.message || 'Error al cargar propiedades');
      enqueueSnackbar('Error al cargar propiedades', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  // Función para cargar datos relacionados
  const fetchRelatedData = useCallback(async () => {
    try {
      setLoadingRelated(true);
      const [monedasRes, cuentasRes] = await Promise.all([
        clienteAxios.get('/api/monedas'),
        clienteAxios.get('/api/cuentas')
      ]);

      setMonedas(monedasRes.data.docs || []);
      setCuentas(cuentasRes.data.docs || []);
    } catch (error) {
      console.error('Error al cargar datos relacionados:', error);
      enqueueSnackbar('Error al cargar datos relacionados', { variant: 'error' });
    } finally {
      setLoadingRelated(false);
    }
  }, [enqueueSnackbar]);

  // Modificar el useEffect para agregar un delay inicial
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPropiedades();
      fetchRelatedData();
    }, 500);

    return () => clearTimeout(timer);
  }, [fetchPropiedades, fetchRelatedData]);

  // Efecto para escuchar eventos de actualización
  useEffect(() => {
    const handleEntityUpdate = (event) => {
      if (event.detail.type === 'propiedad' || event.detail.type === 'propiedades') {
        fetchPropiedades();
      }
    };

    window.addEventListener('entityUpdated', handleEntityUpdate);

    return () => {
      window.removeEventListener('entityUpdated', handleEntityUpdate);
    };
  }, [fetchPropiedades]);

  const handleEdit = useCallback((propiedad) => {
    console.log('Editando propiedad:', propiedad);
    setEditingPropiedad({
      ...propiedad,
      _id: propiedad._id || propiedad.id,
      moneda: propiedad.moneda?._id || propiedad.moneda?.id || propiedad.moneda,
      cuenta: propiedad.cuenta?._id || propiedad.cuenta?.id || propiedad.cuenta,
      caracteristicas: propiedad.caracteristicas || []
    });
    setIsFormOpen(true);
  }, []);

  const handleDelete = useCallback(async (id) => {
    try {
      console.log('Eliminando propiedad:', id);
      await clienteAxios.delete(`/api/propiedades/${id}`);
      enqueueSnackbar('Propiedad eliminada exitosamente', { variant: 'success' });
      fetchPropiedades();
    } catch (error) {
      console.error('Error al eliminar propiedad:', error);
      enqueueSnackbar('Error al eliminar la propiedad', { variant: 'error' });
    }
  }, [enqueueSnackbar, fetchPropiedades]);

  const handleFormSubmit = async (formData) => {
    try {
      console.log('Propiedades - Enviando datos:', formData);
      
      // Asegurarnos que los campos numéricos son números y no strings
      const dataToSend = {
        ...formData,
        precio: formData.precio ? Number(formData.precio) : 0,
        metrosCuadrados: formData.metrosCuadrados ? Number(formData.metrosCuadrados) : 0,
        numDormitorios: formData.numDormitorios ? Number(formData.numDormitorios) : 0,
        banos: formData.banos ? Number(formData.banos) : 0,
        caracteristicas: Array.isArray(formData.caracteristicas) ? formData.caracteristicas : [],
        moneda: formData.moneda || null,
        cuenta: formData.cuenta || null,
        usuario: user.id
      };
      
      console.log('Propiedades - Datos procesados para enviar:', dataToSend);
      
      let response;
      if (editingPropiedad) {
        const id = editingPropiedad._id || editingPropiedad.id;
        console.log('Propiedades - Actualizando propiedad con ID:', id);
        response = await clienteAxios.put(`/api/propiedades/${id}`, dataToSend);
        enqueueSnackbar('Propiedad actualizada exitosamente', { variant: 'success' });
      } else {
        console.log('Propiedades - Creando nueva propiedad');
        response = await clienteAxios.post('/api/propiedades', dataToSend);
        console.log('Propiedades - Respuesta de creación:', response.data);
        enqueueSnackbar('Propiedad creada exitosamente', { variant: 'success' });
      }

      // Actualizar la lista de propiedades
      await fetchPropiedades();
      
      // Cerrar el formulario solo si la operación fue exitosa
      setIsFormOpen(false);
      setEditingPropiedad(null);

      // Disparar evento de actualización
      window.dispatchEvent(new CustomEvent('entityUpdated', {
        detail: { 
          type: 'propiedades', 
          action: editingPropiedad ? 'edit' : 'create',
          data: response.data
        }
      }));

      return response.data;
    } catch (error) {
      console.error('Propiedades - Error al guardar propiedad:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.response?.data?.details || 
                          'Error al guardar la propiedad';
      console.log('Propiedades - Mensaje de error:', errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
      throw error;
    }
  };

  const handleSearch = (searchTerm) => {
    if (!searchTerm) {
      setFilteredPropiedades(propiedades);
      return;
    }
    
    const filtered = propiedades.filter(prop => 
      prop.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prop.direccion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prop.ciudad.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPropiedades(filtered);
  };

  const handleMultipleDelete = async (ids) => {
    try {
      await Promise.all(ids.map(id => handleDelete(id)));
      enqueueSnackbar(`${ids.length} propiedades eliminadas`, { variant: 'success' });
    } catch (error) {
      console.error('Error al eliminar múltiples propiedades:', error);
      enqueueSnackbar('Error al eliminar propiedades', { variant: 'error' });
    }
  };

  const handleCreateMoneda = async (data) => {
    const response = await clienteAxios.post('/api/monedas', data);
    setMonedas([...monedas, response.data]);
    return response.data;
  };

  const handleCreateCuenta = async (data) => {
    const response = await clienteAxios.post('/api/cuentas', {
      ...data,
      usuarioId: user.id
    });
    setCuentas([...cuentas, response.data]);
    return response.data;
  };

  if (loading) {
    return (
      <Container sx={{ py: 4 }}>
        <Grid container spacing={4}>
          {[1, 2, 3, 4].map((item) => (
            <Grid item key={item} xs={12} sm={6} md={4} lg={3}>
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
      <EntityToolbar
        onAdd={() => {
          setEditingPropiedad(null);
          setIsFormOpen(true);
        }}
        onBack={handleBack}
        searchPlaceholder="Buscar propiedades..."
        onSearch={handleSearch}
        navigationItems={[
          {
            icon: <BedIcon sx={{ fontSize: 21.6 }} />,
            label: 'Habitaciones',
            to: '/habitaciones'
          },
          {
            icon: <PeopleIcon sx={{ fontSize: 21.6 }} />,
            label: 'Inquilinos',
            to: '/inquilinos'
          },
          {
            icon: <DescriptionIcon sx={{ fontSize: 21.6 }} />,
            label: 'Contratos',
            to: '/contratos'
          },
          {
            icon: <InventoryIcon sx={{ fontSize: 21.6 }} />,
            label: 'Inventario',
            to: '/inventario'
          }
        ]}
      />

      <EntityDetails 
        title="Propiedades"
        action={
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            size="small"
            onClick={() => {
              setEditingPropiedad(null);
              setIsFormOpen(true);
            }}
            sx={{ borderRadius: 0 }}
          >
            Nueva Propiedad
          </Button>
        }
      >
        <PropiedadList
          propiedades={propiedades}
          filteredPropiedades={filteredPropiedades}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdd={() => setIsFormOpen(true)}
        />
      </EntityDetails>

      <PropiedadForm
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingPropiedad(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingPropiedad || {}}
        isEditing={!!editingPropiedad}
      />
    </Container>
  );
}

// También mantenemos la exportación por defecto
export default Propiedades;
