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
  Collapse,
  Paper
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
import { snackbar } from '@shared/components/common';
import { useAuth } from '@shared/context/AuthContext';

import LocationOnIcon from '@mui/icons-material/LocationOn';
import SquareFootIcon from '@mui/icons-material/SquareFoot';
import BathtubOutlinedIcon from '@mui/icons-material/BathtubOutlined';
import { useNavigate, useLocation } from 'react-router-dom';
import clienteAxios from '@shared/config/axios';
import { EmptyState } from '@shared/components/common';
import PropiedadForm from '../propiedades/PropiedadForm';
import PropiedadList from '../propiedades/PropiedadList';
import { usePageWithHistory } from '@shared/hooks/useGlobalActionHistory';
import { Toolbar } from '@shared/navigation';
import { CommonForm, CommonDetails, CommonActions } from '@shared/components/common';
import { usePropiedadesOptimizadas } from '@shared/hooks/useStatusOptimizer.js';
import useResponsive from '@shared/hooks/useResponsive';

// Cambiamos a exportación nombrada para coincidir con App.jsx
export function Propiedades() {
  const [propiedades, setPropiedades] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Usar snackbar unificado
  const { user } = useAuth();
  const { theme } = useResponsive();
  const [selectedPropiedad, setSelectedPropiedad] = useState(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    montoMensual: '',
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
  const location = useLocation();
  const [selectedItems, setSelectedItems] = useState([]);
  const [filteredPropiedades, setFilteredPropiedades] = useState([]);
  const [monedas, setMonedas] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(true);
  const [editingPropiedad, setEditingPropiedad] = useState(null);
  
  // Referencia estable para fetchPropiedades
  const fetchPropiedadesRef = useRef();
  
  // Control de debounce
  const debounceTimerRef = useRef(null);
  
  // Hook para optimizar propiedades
  const propiedadesOptimizadas = usePropiedadesOptimizadas(propiedades);

  // Hook automático de historial
  const { createWithHistory, updateWithHistory, deleteWithHistory } = usePageWithHistory(
    async () => {
      await fetchPropiedades();
    },
    (error) => {
      snackbar.error('Error al revertir la acción');
      console.error('Error al revertir acción:', error);
    }
  );



  const handleBack = () => {
    navigate('/');
  };



  // Función para cargar propiedades con debouncing y cache
  const fetchPropiedades = useCallback(async () => {
    try {
      setLoading(true);
      
      // Usar el endpoint optimizado que trae todos los datos relacionados
      const response = await clienteAxios.get('/api/propiedades?withRelated=true');
      
      const propiedadesData = response.data.docs || [];
      

      
      // Los datos ya vienen con todos los relacionados
      const propiedadesEnriquecidas = propiedadesData.map(propiedad => ({
        ...propiedad,
        inquilinos: propiedad.inquilinos || [],
        habitaciones: propiedad.habitaciones || [],
        contratos: propiedad.contratos || [],
        inventario: propiedad.inventario || []
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
  }, []);

  // Función con debouncing para evitar llamadas múltiples
  const debouncedFetchPropiedades = useCallback(() => {
    // Limpiar timer anterior
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Configurar nuevo timer
    debounceTimerRef.current = setTimeout(() => {
      fetchPropiedades();
    }, 150); // Reducido a 150ms para respuesta más rápida
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
    };
  }, []); // Solo ejecutar una vez al montar

  // Abrir formulario automáticamente si viene de navegación con openAdd
  useEffect(() => {
    if (location.state?.openAdd) {
      setEditingPropiedad(null);
      setIsFormOpen(true);
      // Limpiar el estado para evitar abrirlo de nuevo al navegar
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Listener local para abrir el formulario si ya estamos en la ruta
  useEffect(() => {
    const openLocal = () => {
      setEditingPropiedad(null);
      setIsFormOpen(true);
    };
    window.addEventListener('openAddFormLocal', openLocal);
    return () => window.removeEventListener('openAddFormLocal', openLocal);
  }, []);

  // Escuchar evento del Header para abrir formulario cuando Toolbar esté oculta o visible
  useEffect(() => {
    const handleHeaderAddButton = (event) => {
      const isSamePath = event.detail?.path && event.detail.path === window.location.pathname;
      const isPropiedadType = event.detail?.type === 'propiedad' || event.detail?.type === 'propiedades';
      if (isSamePath || isPropiedadType) {
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

  // Usar deleteWithHistory para eliminar y registrar en historial
  const handleDelete = useCallback(async (id) => {
    try {
      await deleteWithHistory(id);
      snackbar.success('Propiedad eliminada exitosamente');
      await fetchPropiedades();
    } catch (error) {
      console.error('Error al eliminar propiedad:', error);
      snackbar.error('Error al eliminar la propiedad');
    }
  }, [deleteWithHistory, fetchPropiedades]);

  // Usar createWithHistory/updateWithHistory para registrar en historial
  const handleFormSubmit = async (formData) => {
    try {
      // Asegurarnos que los campos numéricos son números y no strings
      const dataToSend = {
        ...formData,
        montoMensual: formData.montoMensual ? Number(formData.montoMensual) : 0,
        metrosCuadrados: formData.metrosCuadrados ? Number(formData.metrosCuadrados) : 0,
        numDormitorios: formData.numDormitorios ? Number(formData.numDormitorios) : 0,
        banos: formData.banos ? Number(formData.banos) : 0,
        caracteristicas: Array.isArray(formData.caracteristicas) ? formData.caracteristicas : [],
        moneda: formData.moneda || null,
        cuenta: formData.cuenta || null,
        usuario: user.id
      };
      
      let response;
      if (editingPropiedad) {
        const id = editingPropiedad._id || editingPropiedad.id;
        response = await updateWithHistory(id, dataToSend, editingPropiedad);
        snackbar.success('Propiedad actualizada exitosamente');
      } else {
        response = await createWithHistory(dataToSend);
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
      {/* Eliminar <Toolbar /> */}
      
      <Box sx={{
        width: '100%',
        maxWidth: 900,
        mx: 'auto',
        px: { xs: 1, sm: 2, md: 3 },
        py: 2,
        pb: { xs: 10, sm: 4 },
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: 0
      }}>
        <CommonDetails 
          title="Propiedades"
        >
          <Paper sx={{ backgroundColor: (theme) => theme.palette.section.background, boxShadow: 'none', p: 0 }}>
            <PropiedadList
              propiedades={propiedadesOptimizadas}
              filteredPropiedades={filteredPropiedades}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAdd={() => setIsFormOpen(true)}
            />
          </Paper>
        </CommonDetails>

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
          createWithHistory={createWithHistory}
          updateWithHistory={updateWithHistory}
        />
      </Box>
    </Box>
  );
}

// También mantenemos la exportación por defecto
export default Propiedades;
