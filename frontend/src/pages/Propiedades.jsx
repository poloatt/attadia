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
  MenuItem
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, BedOutlined as BedIcon, PeopleOutlined as PeopleIcon, DescriptionOutlined as DescriptionIcon, AttachMoneyOutlined as AttachMoneyIcon, AccountBalanceWalletOutlined as AccountBalanceWalletIcon, Inventory2Outlined as InventoryIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '@mui/material/styles';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SquareFootIcon from '@mui/icons-material/SquareFoot';
import EntityForm from '../components/EntityViews/EntityForm';
import { useNavigate } from 'react-router-dom';
import clienteAxios from '../config/axios';
import EntityToolbar from '../components/EntityToolbar';
import EntityDetails from '../components/EntityViews/EntityDetails';
import EntityCards from '../components/EntityViews/EntityCards';
import EmptyState from '../components/EmptyState';
import { EntityActions } from '../components/EntityViews/EntityActions';

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

  // Función para cargar propiedades
  const fetchPropiedades = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Solicitando propiedades...');
      
      const response = await clienteAxios.get('/propiedades');
      console.log('Respuesta recibida:', response.data);
      setPropiedades(response.data.docs || []);
      setFilteredPropiedades(response.data.docs || []);
      
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
        clienteAxios.get('/monedas'),
        clienteAxios.get('/cuentas')
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

  // Efecto para cargar datos iniciales
  useEffect(() => {
    fetchPropiedades();
    fetchRelatedData();
  }, [fetchPropiedades, fetchRelatedData]);

  const handleDelete = useCallback(async (id) => {
    try {
      await clienteAxios.delete(`/propiedades/${id}`);
      enqueueSnackbar('Propiedad eliminada exitosamente', { variant: 'success' });
      fetchPropiedades();
    } catch (error) {
      console.error('Error al eliminar propiedad:', error);
      enqueueSnackbar('Error al eliminar la propiedad', { variant: 'error' });
    }
  }, [enqueueSnackbar, fetchPropiedades]);

  const handleEdit = useCallback((propiedad) => {
    setFormData({
      ...propiedad,
      precio: propiedad.precio.toString(),
      numHabitaciones: propiedad.numHabitaciones.toString(),
      banos: propiedad.banos.toString(),
      metrosCuadrados: propiedad.metrosCuadrados.toString(),
      monedaId: propiedad.monedaId.toString(),
      cuentaId: propiedad.cuentaId.toString()
    });
    setEditingPropiedad(propiedad);
    setIsFormOpen(true);
  }, []);

  const handleFormSubmit = async (formData) => {
    try {
      console.log('Enviando datos:', formData);
      
      // Convertir campos numéricos
      const dataToSend = {
        ...formData,
        precio: Number(formData.precio),
        numHabitaciones: Number(formData.numHabitaciones),
        banos: Number(formData.banos),
        metrosCuadrados: Number(formData.metrosCuadrados)
      };
      
      let response;
      if (editingPropiedad) {
        response = await clienteAxios.put(`/propiedades/${editingPropiedad.id}`, dataToSend);
        setPropiedades(prev => prev.map(p => p.id === editingPropiedad.id ? response.data : p));
        enqueueSnackbar('Propiedad actualizada exitosamente', { variant: 'success' });
      } else {
        response = await clienteAxios.post('/propiedades', dataToSend);
        setPropiedades(prev => [...prev, response.data]);
        enqueueSnackbar('Propiedad creada exitosamente', { variant: 'success' });
      }
      setIsFormOpen(false);
      setEditingPropiedad(null);
      fetchPropiedades();
    } catch (error) {
      console.error('Error al crear propiedad:', error);
      enqueueSnackbar(error.response?.data?.error || 'Error al guardar la propiedad', { variant: 'error' });
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
    const response = await clienteAxios.post('/monedas', data);
    setMonedas([...monedas, response.data]);
    return response.data;
  };

  const handleCreateCuenta = async (data) => {
    const response = await clienteAxios.post('/cuentas', {
      ...data,
      usuarioId: user.id
    });
    setCuentas([...cuentas, response.data]);
    return response.data;
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
      type: 'select',
      required: true,
      value: formData.tipo || 'CASA',
      options: ['CASA', 'DEPARTAMENTO', 'OFICINA', 'LOCAL', 'TERRENO'].map(t => ({
        value: t,
        label: t
      }))
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
    },
    {
      name: 'monedaId',
      label: 'Moneda',
      type: 'select',
      required: true,
      options: monedas.map(m => ({
        value: m.id,
        label: `${m.nombre} (${m.simbolo})`
      }))
    },
    {
      name: 'cuentaId',
      label: 'Cuenta',
      type: 'select',
      required: true,
      options: cuentas.map(c => ({
        value: c.id,
        label: c.nombre
      }))
    }
  ];

  const cardConfig = {
    getTitle: (item) => item.titulo,
    getDescription: (item) => item.descripcion,
    getType: (item) => item.tipo,
    getImage: (item) => item.imagen,
    getAmount: (item) => item.precio,
    getSubtitle: (item) => item.direccion,
    getExtra: (item) => `${item.ciudad}, ${item.estado}`,
    getStatus: (item) => item.estado || 'ACTIVO',
    // Campos específicos para propiedades
    getMetrosCuadrados: (item) => item.metrosCuadrados,
    getHabitaciones: (item) => item.numHabitaciones,
    getBanos: (item) => item.banos
  };

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
      <EntityToolbar
        onAdd={() => {
          setEditingPropiedad(null);
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
            imagen: '',
            monedaId: '',
            cuentaId: ''
          });
          setIsFormOpen(true);
        }}
        searchPlaceholder="Buscar propiedades..."
        navigationItems={[
          {
            icon: <BedIcon sx={{ fontSize: 20 }} />,
            label: 'Habitaciones',
            to: '/habitaciones'
          },
          {
            icon: <PeopleIcon sx={{ fontSize: 20 }} />,
            label: 'Inquilinos',
            to: '/inquilinos'
          },
          {
            icon: <DescriptionIcon sx={{ fontSize: 20 }} />,
            label: 'Contratos',
            to: '/contratos'
          },
          {
            icon: <InventoryIcon sx={{ fontSize: 20 }} />,
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
                imagen: '',
                monedaId: '',
                cuentaId: ''
              });
              setIsFormOpen(true);
            }}
          >
            Nueva Propiedad
          </Button>
        }
      >
        {propiedades.length === 0 ? (
          <EmptyState onAdd={() => setIsFormOpen(true)} />
        ) : (
          <EntityCards
            data={filteredPropiedades.length > 0 ? filteredPropiedades : propiedades}
            cardConfig={cardConfig}
            onEdit={handleEdit}
            onDelete={handleDelete}
            actions={(item) => (
              <EntityActions
                onEdit={() => handleEdit(item)}
                onDelete={() => handleDelete(item.id)}
                itemName={`la propiedad ${item.titulo}`}
              />
            )}
          />
        )}
      </EntityDetails>

      <EntityForm
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingPropiedad(null);
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
            imagen: '',
            monedaId: '',
            cuentaId: ''
          });
        }}
        onSubmit={handleFormSubmit}
        entity={formData}
        title={editingPropiedad ? 'Editar Propiedad' : 'Nueva Propiedad'}
        fields={formFields}
        initialData={editingPropiedad || {}}
        isEditing={!!editingPropiedad}
      />
    </Container>
  );
}

// También mantenemos la exportación por defecto
export default Propiedades;
