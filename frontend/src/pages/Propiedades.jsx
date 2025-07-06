import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
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
  HomeWork,
  AccountBalanceWalletOutlined as WalletIcon
} from '@mui/icons-material';
import { snackbar } from '../components/common/snackbarUtils';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '@mui/material/styles';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SquareFootIcon from '@mui/icons-material/SquareFoot';
import BathtubOutlinedIcon from '@mui/icons-material/BathtubOutlined';
import EntityForm from '../components/EntityViews/EntityForm';
import { useNavigate } from 'react-router-dom';
import clienteAxios from '../config/axios';

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
  // Usar snackbar unificado
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
  
  // Referencia estable para fetchPropiedades
  const fetchPropiedadesRef = useRef();
  
  // Cache y control de requests
  const requestCacheRef = useRef(new Map());
  const debounceTimerRef = useRef(null);

  const handleBack = () => {
    navigate('/');
  };

  // Función auxiliar para hacer requests con cache
  const getCachedRequest = useCallback((url) => {
    const cache = requestCacheRef.current;
    
    if (cache.has(url)) {
      // console.log(`🎯 Cache HIT para: ${url}`);
      return cache.get(url);
    }
    
    // console.log(`🔄 Cache MISS para: ${url}`);
    const request = clienteAxios.get(url).finally(() => {
      // Limpiar cache después de 3 segundos
      setTimeout(() => {
        cache.delete(url);
        // console.log(`🗑️ Cache limpiado para: ${url}`);
      }, 3000);
    });
    
    cache.set(url, request);
    return request;
  }, []);

  // Función para cargar propiedades con debouncing y cache
  const fetchPropiedades = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await clienteAxios.get('/api/propiedades');
      
      const propiedadesData = response.data.docs || [];
      // OPTIMIZACIÓN: Procesar todas las propiedades en paralelo
      const propiedadesEnriquecidas = await Promise.all(propiedadesData.map(async (propiedad) => {
        try {
          const propiedadId = propiedad._id || propiedad.id;

          // Todas las requests en paralelo con cache
          const [
            inquilinosResponse,
            habitacionesResponse,
            contratosResponse,
            inventarioResponse
          ] = await Promise.all([
            getCachedRequest(`/api/inquilinos/propiedad/${propiedadId}`),
            getCachedRequest(`/api/habitaciones/propiedad/${propiedadId}`),
            getCachedRequest(`/api/contratos/propiedad/${propiedadId}`),
            getCachedRequest(`/api/inventarios/propiedad/${propiedadId}`)
          ]);

          const habitaciones = habitacionesResponse.data.docs || [];
          const inquilinos = Array.isArray(inquilinosResponse.data.docs) 
            ? inquilinosResponse.data.docs 
            : [];
          const contratos = contratosResponse.data.docs || [];
          const inventario = inventarioResponse.data.docs || [];



          return {
            ...propiedad,
            inquilinos,
            habitaciones,
            contratos,
            inventario
          };
        } catch (error) {
          // Solo mostrar error si no es por cancelación de request
          if (error.name !== 'CanceledError' && !error.message?.includes('cancelada')) {
            console.error(`Error al cargar datos relacionados para propiedad ${propiedad._id || propiedad.id}:`, error.message);
          }
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

      setPropiedades(propiedadesEnriquecidas);
      setFilteredPropiedades(propiedadesEnriquecidas);

    } catch (error) {
      console.error('Error al cargar propiedades:', error);
      setError(error.message || 'Error al cargar propiedades');
      snackbar.error('Error al cargar propiedades');
    } finally {
      setLoading(false);
    }
  }, [getCachedRequest]);

  // Función con debouncing para evitar llamadas múltiples
  const debouncedFetchPropiedades = useCallback(() => {
    // Limpiar timer anterior
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Configurar nuevo timer
    debounceTimerRef.current = setTimeout(() => {
      // console.log('🔄 Ejecutando fetchPropiedades con debounce');
      fetchPropiedades();
    }, 300); // 300ms de debounce
  }, [fetchPropiedades]);
  
  // Mantener referencia actualizada
  fetchPropiedadesRef.current = debouncedFetchPropiedades;

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
      snackbar.error('Error al cargar datos relacionados');
    } finally {
      setLoadingRelated(false);
    }
  }, []);

  // Cargar datos iniciales (sin debounce para carga inmediata)
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchPropiedades(), // Llamada directa sin debounce
          fetchRelatedData()
        ]);
      } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialData();
    
    // Cleanup al desmontar
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      requestCacheRef.current.clear();
    };
  }, []); // Solo ejecutar una vez al montar

  // Escuchar evento del Header para abrir formulario cuando EntityToolbar esté oculto
  useEffect(() => {
    const handleHeaderAddButton = (event) => {
      if (event.detail.type === 'propiedad') {
        setEditingPropiedad(null);
        setIsFormOpen(true);
      }
    };

    window.addEventListener('headerAddButtonClicked', handleHeaderAddButton);
    return () => {
      window.removeEventListener('headerAddButtonClicked', handleHeaderAddButton);
    };
  }, []);

  // Efecto para escuchar eventos de actualización
  useEffect(() => {
    const handleEntityUpdate = (event) => {
      if (event.detail.type === 'propiedad' || event.detail.type === 'propiedades') {
        fetchPropiedadesRef.current?.();
      }
    };

    window.addEventListener('entityUpdated', handleEntityUpdate);

    return () => {
      window.removeEventListener('entityUpdated', handleEntityUpdate);
    };
  }, []); // Sin dependencias para evitar re-registros

  const handleEdit = useCallback((propiedad) => {
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
      await clienteAxios.delete(`/api/propiedades/${id}`);
      snackbar.success('Propiedad eliminada exitosamente');
      
      // Disparar evento de actualización en lugar de llamada directa
      window.dispatchEvent(new CustomEvent('entityUpdated', {
        detail: { 
          type: 'propiedades', 
          action: 'delete',
          id: id
        }
      }));
          } catch (error) {
        console.error('Error al eliminar propiedad:', error);
        snackbar.error('Error al eliminar la propiedad');
      }
    }, []);

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
        snackbar.success('Propiedad actualizada exitosamente');
      } else {
        console.log('Propiedades - Creando nueva propiedad');
        response = await clienteAxios.post('/api/propiedades', dataToSend);
        console.log('Propiedades - Respuesta de creación:', response.data);
        snackbar.success('Propiedad creada exitosamente');
      }
      
      // Cerrar el formulario solo si la operación fue exitosa
      setIsFormOpen(false);
      setEditingPropiedad(null);

      // Disparar evento de actualización (esto actualizará la lista automáticamente)
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
      snackbar.error(errorMessage);
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
      snackbar.success(`${ids.length} propiedades eliminadas`);
    } catch (error) {
      console.error('Error al eliminar múltiples propiedades:', error);
      snackbar.error('Error al eliminar propiedades');
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
      <Box sx={{ px: 0, py: 1 }}>
        <Grid container spacing={4}>
          {[1, 2, 3, 4].map((item) => (
            <Grid item key={item} xs={12} sm={6} md={4} lg={3}>
              <Skeleton variant="rectangular" height={200} />
              <Skeleton />
              <Skeleton width="60%" />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ px: 0, py: 1 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ px: 0, width: '100%' }}>


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
        onSubmit={() => {
          // PropiedadForm maneja la creación internamente y dispara evento 'entityUpdated'
          // El listener 'entityUpdated' se encarga de actualizar la lista
          // Solo cerrar el formulario
          setIsFormOpen(false);
          setEditingPropiedad(null);
        }}
        initialData={editingPropiedad || {}}
        isEditing={!!editingPropiedad}
      />
    </Box>
  );
}

// También mantenemos la exportación por defecto
export default Propiedades;
