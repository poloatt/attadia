import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  IconButton,
  TextField,
  Button,
  Tooltip,
  Chip,
  Container,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Divider,
  Alert,
  Snackbar
} from '@mui/material';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import AddIcon from '@mui/icons-material/Add';
import { formatDate } from '../../utils/iconConfig';
import ChecklistSection from './ChecklistSection';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import clienteAxios from '../../config/axios';
import { NavigateBefore, NavigateNext, Today as TodayIcon } from '@mui/icons-material';
import { useLocalPreservationState } from '../../hooks';
import { RutinaNavigation } from './RutinaNavigation';
import ItemCadenciaConfig from './ItemCadenciaConfig';
import shouldShowItemUtil from '../../utils/shouldShowItem';
import HistoricalAlert from './HistoricalAlert';
import { useRutinasHistorical } from '../../context/RutinasHistoryContext';
import { getNormalizedToday, toISODateString } from '../../utils/rutinaDateUtils';

// Exportación nombrada para compatibilidad
export const RutinaTable = ({ 
  rutina, 
  onEdit, 
  onDelete, 
  onCheckChange, 
  onRutinaChange = null,
  onAdd
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rutinas, setRutinas] = useState([]);
  const today = useMemo(() => getNormalizedToday(), []);
  const [globalConfig, setGlobalConfig] = useState(null); // Para almacenar la configuración global
  const { enqueueSnackbar } = useSnackbar();
  const historical = useRutinasHistorical();
  
  // Estos valores ahora se obtienen como props del componente padre
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Usar el hook de preservación de cambios locales con soporte para localStorage
  const { 
    registerLocalChange, 
    pendingLocalChanges,
    clearLocalChanges 
  } = useLocalPreservationState({}, { 
    debug: true,
    enableStorage: true,
    storagePrefix: 'rutina_config_changes',
    preserveFields: ['tipo', 'frecuencia', 'periodo']
  });

  // Actualizar valores de navegación cuando la rutina cambia
  useEffect(() => {
    if (rutina?._page) {
      setCurrentPage(rutina._page);
    }
    if (rutina?._totalPages) {
      setTotalPages(rutina._totalPages);
    }
    // console.log('RutinaTable recibió nueva rutina:', rutina);
  }, [rutina]);

  // Actualizar fecha actual para asegurar que coincide con el formato del servidor
  useEffect(() => {
    // Formatear la fecha como "YYYY-MM-DD" para que coincida con las claves en el objeto historial
    const formattedToday = new Date().toISOString().split('T')[0];
    
    // Loguear para debug
    // console.log('Fecha actual formateada:', formattedToday);
    // console.log('Historial disponible:', rutina?.historial);
    // if (rutina?.historial && rutina.historial[formattedToday]) {
    //   console.log('Datos para hoy:', rutina.historial[formattedToday]);
    // } else {
    //   console.log('No hay datos en el historial para hoy');
    // }
  }, [rutina]);

  // Cargar rutinas y configuración global al iniciar
  useEffect(() => {
    // Usar una ref para controlar si el componente está montado
    const isMounted = { current: true };
    
    // Flag para evitar cargar la configuración más de una vez por ciclo
    let configLoaded = false;
    
    const fetchData = async () => {
      if (!isMounted.current) return;
      
      try {
        setLoading(true);
        
        // Obtener rutinas
        try {
          const rutinasResponse = await clienteAxios.get('/api/rutinas');
          
          // Verificar si el componente sigue montado después de la petición
          if (!isMounted.current) return;
          
          setRutinas(Array.isArray(rutinasResponse.data?.docs) ? rutinasResponse.data.docs : []);
          
          // Intentar cargar la configuración global solo si no ha sido cargada aún
          if (!configLoaded && isMounted.current) {
            try {
              const configResponse = await clienteAxios.get('/api/users/rutinas-config');
              
              // Verificar si el componente sigue montado después de la petición
              if (!isMounted.current) return;
              
              configLoaded = true;
              setGlobalConfig(configResponse.data || {});
            } catch (configError) {
              // Ignorar errores de cancelación
              if (configError.cancelado) {
                console.log('Solicitud de configuración global cancelada');
              } else {
                console.warn('No se pudo cargar la configuración global:', configError);
                // Establecer un objeto vacío como configuración por defecto si hay un error
                if (isMounted.current) {
                  setGlobalConfig({});
                }
              }
            }
          }
        } catch (rutinasError) {
          // Ignorar errores de cancelación
          if (rutinasError.cancelado) {
            console.log('Solicitud de rutinas cancelada');
          } else if (isMounted.current) {
            console.error('Error al cargar rutinas:', rutinasError);
            setError('Error al cargar las rutinas. Por favor, intenta de nuevo.');
            enqueueSnackbar('Error al cargar las rutinas', { variant: 'error' });
          }
        }
      } finally {
        // Solo actualizar el estado si el componente sigue montado
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };
    
    fetchData();
    
    // Actualizar la fecha actual a las 12 AM
    const updateDay = () => {
      const now = new Date();
      if (isMounted.current) {
        // Mantener today como objeto Date para otros usos
      }
    };
    
    // Actualizar la fecha cada día a la medianoche
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const timeUntilMidnight = tomorrow - now;
    
    const timerId = setTimeout(updateDay, timeUntilMidnight);
    
    // Limpieza al desmontar el componente
    return () => {
      isMounted.current = false;
      clearTimeout(timerId);
    };
  }, [enqueueSnackbar]);

  const shouldShowItem = (itemId, config, fecha) => {
    // Si estamos en modo vista completa, mostrar todos los ítems
    if (forceShowAll) return true;
    
    // Crear un objeto rutina simplificado para usar con la utilidad
    const rutinaSimulada = {
      fecha: fecha,
      config: {
        [section]: {
          [itemId]: config
        }
      },
      [section]: {
        [itemId]: false
      }
    };
    
    // Usar la nueva utilidad para determinar si debe mostrarse
    return shouldShowItemUtil(section, itemId, rutinaSimulada);
  };

  const handleConfigChange = (seccionId, itemId, newConfig) => {
    if (!rutina || !rutina._id) {
      console.error("[RutinaTable] No hay rutina activa para actualizar configuración");
      enqueueSnackbar('No hay rutina activa', { variant: 'error' });
      return;
    }
    
    // Verificar si la rutina es de una fecha pasada
    const rutinaDate = new Date(rutina.fecha);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalizar a inicio del día
    rutinaDate.setHours(0, 0, 0, 0); // Normalizar a inicio del día
    
    if (rutinaDate < today) {
      console.log(`[RutinaTable] ⚠️ Intento de modificar cadencia en rutina con fecha pasada: ${rutinaDate.toISOString().split('T')[0]}`);
      enqueueSnackbar('La configuración de cadencia no se puede modificar en rutinas de fechas pasadas. Para cambiar la configuración de este hábito, actualiza tus preferencias globales.', { 
        variant: 'warning',
        autoHideDuration: 5000
      });
      return;
    }
    
    console.log(`[RutinaTable] 🚀 Iniciando actualización para ${seccionId}.${itemId}:`, JSON.stringify(newConfig));
    
    // Normalizar la configuración antes de enviarla
    const normalizedConfig = {
      ...newConfig,
      tipo: (newConfig.tipo || 'DIARIO').toUpperCase(),
      frecuencia: Number(newConfig.frecuencia || 1), // Convertir explícitamente a Number
      activo: newConfig.activo !== undefined ? newConfig.activo : true
    };
    
    // Solo asignar periodo por defecto si no está definido
    if (!normalizedConfig.periodo) {
      console.log(`[RutinaTable] 🔧 Periodo no definido, asignando valor por defecto`);
      if (normalizedConfig.tipo === 'DIARIO') {
        normalizedConfig.periodo = 'CADA_DIA';
      } else if (normalizedConfig.tipo === 'SEMANAL') {
        normalizedConfig.periodo = 'CADA_SEMANA';
      } else if (normalizedConfig.tipo === 'MENSUAL') {
        normalizedConfig.periodo = 'CADA_MES';
      } else {
        normalizedConfig.periodo = 'CADA_DIA';
      }
    }
    
    console.log(`[RutinaTable] ✅ Configuración normalizada:`, JSON.stringify(normalizedConfig));
    
    // Registrar el cambio local para preservarlo en futuras actualizaciones
    registerLocalChange(seccionId, itemId, {
      tipo: normalizedConfig.tipo,
      frecuencia: normalizedConfig.frecuencia, 
      periodo: normalizedConfig.periodo
    });
    
    // Crear una copia profunda del objeto rutina para actualización local
    const updatedRutina = JSON.parse(JSON.stringify(rutina));
    
    // Asegurar que existe la estructura de configuración
    if (!updatedRutina.config) updatedRutina.config = {};
    if (!updatedRutina.config[seccionId]) updatedRutina.config[seccionId] = {};
    
    // Actualizar la configuración en la copia local
    updatedRutina.config[seccionId][itemId] = {
      ...updatedRutina.config[seccionId][itemId],
      ...normalizedConfig
    };
    
    // Actualizar inmediatamente la UI
    if (typeof onRutinaChange === 'function') {
      console.log(`[RutinaTable] 🔄 Actualizando UI inmediatamente`);
      // Añadir flag para preservar cambios locales
      onRutinaChange({
        ...updatedRutina,
        _preserve_local_changes: true
      });
    }
    
    // Crear datos para enviar al servidor
    const updateData = {
      config: {
        [seccionId]: {
          [itemId]: normalizedConfig
        }
      }
    };
    
    console.log(`[RutinaTable] 📡 Enviando al servidor:`, JSON.stringify(updateData));
    console.log(`[RutinaTable] 🔍 Tipo de configuración: ${normalizedConfig.tipo}, Periodo: ${normalizedConfig.periodo}, Frecuencia: ${normalizedConfig.frecuencia} (${typeof normalizedConfig.frecuencia})`);
    console.log(`[RutinaTable] 🔍 URL: /api/rutinas/${rutina._id}`);
    
    // Guardar localmente la configuración original para compararla con la respuesta
    const originalConfig = { ...normalizedConfig };
    
    // Enviar actualización al servidor con timeout más largo
    clienteAxios.put(`/api/rutinas/${rutina._id}`, updateData, { timeout: 10000 })
      .then(response => {
        console.log('[RutinaTable] ✅ Respuesta del servidor:', JSON.stringify(response.data));
        
        // Verificar que la configuración se guardó correctamente
        const serverConfig = response.data.config?.[seccionId]?.[itemId];
        if (serverConfig) {
          console.log(`[RutinaTable] 🔍 Comparando configuración enviada vs recibida:`);
          console.log(`- Tipo enviado: ${originalConfig.tipo}, recibido: ${serverConfig.tipo}`);
          console.log(`- Frecuencia enviada: ${originalConfig.frecuencia}, recibida: ${serverConfig.frecuencia}`);
          console.log(`- Tipo de dato recibido: ${typeof serverConfig.frecuencia}`);
          console.log(`- Periodo enviado: ${originalConfig.periodo}, recibido: ${serverConfig.periodo}`);
          
          // Verificar si hay discrepancias entre lo que enviamos y lo que recibimos
          if (originalConfig.frecuencia !== serverConfig.frecuencia || 
              originalConfig.tipo !== serverConfig.tipo ||
              originalConfig.periodo !== serverConfig.periodo) {
            console.warn('[RutinaTable] ⚠️ ¡Hay discrepancias entre la configuración local y la del servidor!');
            
            // Mantener los valores originales en la UI
            const rutinaConValoresLocales = JSON.parse(JSON.stringify(response.data));
            
            // Asegurar la estructura de configuración
            if (!rutinaConValoresLocales.config) rutinaConValoresLocales.config = {};
            if (!rutinaConValoresLocales.config[seccionId]) rutinaConValoresLocales.config[seccionId] = {};
            if (!rutinaConValoresLocales.config[seccionId][itemId]) rutinaConValoresLocales.config[seccionId][itemId] = {};
            
            // Sobrescribir los valores que queremos preservar
            rutinaConValoresLocales.config[seccionId][itemId] = {
              ...rutinaConValoresLocales.config[seccionId][itemId],
              tipo: originalConfig.tipo,
              frecuencia: originalConfig.frecuencia,
              periodo: originalConfig.periodo
            };
            
            if (typeof onRutinaChange === 'function') {
              console.log('[RutinaTable] 🔄 Actualizando UI con valores locales preservados');
              // Aplicar los valores locales a la UI, preservando el flag
              onRutinaChange({
                ...rutinaConValoresLocales,
                _preserve_local_changes: true
              });
            }
          } else {
            console.log('[RutinaTable] ✅ Configuración validada correctamente en el servidor');
          }
        }
        
        enqueueSnackbar('Configuración guardada', { variant: 'success' });
      })
      .catch(error => {
        console.error('[RutinaTable] ❌ Error al actualizar configuración:', error);
        console.log('[RutinaTable] Detalles del error:', error.response?.data || error.message);
        
        // Restaurar estado previo en caso de error
        if (typeof onRutinaChange === 'function') {
          onRutinaChange(rutina);
        }
        
        enqueueSnackbar('Error al actualizar configuración: ' + (error.response?.data?.error || error.message), { 
          variant: 'error',
          autoHideDuration: 5000
        });
      });
  };

  // Obtener la configuración por defecto para un nuevo ítem basado en el tipo
  const getDefaultConfigForItem = (section, itemId) => {
    if (!globalConfig) return null;
    
    // Mapear secciones internas a las secciones de la API
    const sectionMap = {
      bodyCare: 'bodyCare',
      nutricion: 'nutricion',
      ejercicio: 'ejercicio',
      cleaning: 'cleaning'
    };
    
    const apiSection = sectionMap[section];
    
    // Si existe configuración global para esta sección e ítem, usarla
    if (apiSection && globalConfig[apiSection] && globalConfig[apiSection][itemId]) {
      // console.log(`Usando configuración global para ${section}.${itemId}:`, globalConfig[apiSection][itemId]);
      
      // Normalizar la configuración antes de retornarla para mantener los tipos correctos
      const config = globalConfig[apiSection][itemId];
      
      return {
        tipo: (config.tipo || 'DIARIO').toUpperCase(),
        frecuencia: Number(config.frecuencia || 1),
        periodo: config.periodo || 'CADA_DIA',
        diasSemana: Array.isArray(config.diasSemana) ? config.diasSemana : [],
        diasMes: Array.isArray(config.diasMes) ? config.diasMes : [],
        activo: config.activo !== undefined ? config.activo : true
      };
    }
    
    // De lo contrario, retornar configuración por defecto
    return {
      tipo: 'DIARIO',
      frecuencia: 1,
      diasSemana: [],
      diasMes: [],
      activo: true
    };
  };

  const handleItemConfigChange = async (rutinaId, seccionId, itemId, newConfig) => {
    try {
      // console.log(`Actualizando config para ${seccionId}.${itemId} en rutina ${rutinaId}:`, newConfig);
      
      // Normalizar los valores
      const normalizedConfig = {
        ...newConfig,
        frecuencia: Number(newConfig.frecuencia || 1), // Usar Number en lugar de parseInt para mantener precisión
        tipo: (newConfig.tipo || 'DIARIO').toUpperCase()
      };
      
      // console.log(`Configuración normalizada (frecuencia tipo: ${typeof normalizedConfig.frecuencia}):`, normalizedConfig);
      
      await clienteAxios.patch(`/api/rutinas/${rutinaId}/configurar`, {
        seccion: seccionId,
        item: itemId,
        config: normalizedConfig
      });
      
      // Actualizar el estado local
      setRutinas(prevRutinas => prevRutinas.map(rutina => {
        if (rutina._id === rutinaId) {
          // Clonar la rutina para evitar mutar el objeto original
          const updatedRutina = { ...rutina };
          
          // Asegurarse de que la sección existe
          if (!updatedRutina.secciones) {
            updatedRutina.secciones = {};
          }
          
          if (!updatedRutina.secciones[seccionId]) {
            updatedRutina.secciones[seccionId] = {};
          }
          
          // Asegurarse de que el item existe
          if (!updatedRutina.secciones[seccionId][itemId]) {
            updatedRutina.secciones[seccionId][itemId] = {};
          }
          
          // Actualizar la configuración
          updatedRutina.secciones[seccionId][itemId].config = normalizedConfig;
          
          return updatedRutina;
        }
        return rutina;
      }));
      
      enqueueSnackbar('Configuración actualizada', { variant: 'success' });
    } catch (error) {
      // console.error('Error al actualizar configuración:', error);
      enqueueSnackbar('Error al actualizar configuración', { variant: 'error' });
    }
  };

  // Actualizar estado para las comprobaciones con soporte para cambios locales
  const handleMarkComplete = async (rutinaId, seccionId, newData, updateData) => {
    if (!rutinaId) {
      console.error('[RutinaTable] No se proporcionó ID de rutina');
      return;
    }
    
    try {
      // Validar estructura de datos
      if (!updateData || typeof updateData !== 'object') {
        // Si no se proporciona updateData, construirlo a partir de newData
        updateData = {};
        updateData[seccionId] = { ...newData };
      }
      
      // Asegurar que no enviamos información innecesaria
      if (updateData._id) delete updateData._id;
      if (updateData._preserve_local_changes) delete updateData._preserve_local_changes;
      if (updateData._rutina_completa) delete updateData._rutina_completa;
      
      // Crear una copia del objeto de rutina para actualización local
      const updatedRutina = { ...rutina };
      
      // Actualizar la sección en local
      updatedRutina[seccionId] = newData;
      
      // Notificar cambio al componente padre para actualización visual inmediata
      if (typeof onRutinaChange === 'function') {
        onRutinaChange(updatedRutina);
      }
      
      // Log para depuración
      console.log(`[RutinaTable] Enviando PUT a /api/rutinas/${rutinaId}:`, JSON.stringify(updateData));
      
      try {
        // Realizar la actualización en el servidor con error handling mejorado
        const response = await clienteAxios.put(`/api/rutinas/${rutinaId}`, updateData);
        
        // Verificamos si hay diferencias entre lo que enviamos y lo que recibimos
        const serverData = response.data[seccionId] || {};
        const hasDifferences = Object.keys(newData).some(key => 
          newData[key] !== serverData[key]
        );
        
        if (hasDifferences) {
          console.warn('[RutinaTable] Diferencias entre datos enviados y recibidos');
        }
        
        // Actualizar el componente padre usando onCheckChange si está disponible
        if (typeof onCheckChange === 'function') {
          onCheckChange({
            ...response.data,
            _id: rutinaId
          });
        } 
        
        return response.data;
      } catch (apiError) {
        console.error('[RutinaTable] Error HTTP al actualizar rutina:', 
          apiError.response?.status, 
          apiError.response?.data
        );
        
        // Mostrar mensaje de error específico si está disponible
        const errorMsg = apiError.response?.data?.details || 
                        apiError.response?.data?.error || 
                        'Error al comunicarse con el servidor';
                        
        enqueueSnackbar(`Error: ${errorMsg}`, { variant: 'error' });
        
        // Propagar error para manejo adicional
        throw apiError;
      }
    } catch (error) {
      console.error('[RutinaTable] Error general al marcar como completado:', error);
      enqueueSnackbar('Error al actualizar el estado', { variant: 'error' });
      throw error;
    }
  };

  const createNewRutina = async () => {
    try {
      // Crear una nueva rutina con la configuración global si está disponible
      const response = await clienteAxios.post('/api/rutinas', { 
        useGlobalConfig: true 
      });
      
      const newRutina = response.data;
      
      // Añadir la nueva rutina al principio del array (es la más reciente)
      const updatedRutinas = [newRutina, ...rutinas];
      setRutinas(updatedRutinas);
      
      // Notificar al componente padre sobre la nueva rutina seleccionada
      if (onRutinaChange && typeof onRutinaChange === 'function') {
        // Configurar la nueva rutina como la actual con navegación
        onRutinaChange({
          ...newRutina,
          _page: 1,
          _totalPages: updatedRutinas.length
        });
      }
      
      // Actualizar página actual a 1
      setCurrentPage(1);
      setTotalPages(updatedRutinas.length);
      
      enqueueSnackbar('Nueva rutina creada', { variant: 'success' });
    } catch (error) {
      console.error('Error al crear rutina:', error);
      enqueueSnackbar('Error al crear rutina', { variant: 'error' });
    }
  };

  // Función para obtener los datos del historial del día actual
  const getTodayHistorial = (section) => {
    if (!rutina || !rutina.historial) return {};
    
    const formattedToday = today.toISOString().split('T')[0];
    return rutina.historial[formattedToday]?.[section] || {};
  };

  // Limpiar cambios locales cuando se elimina una rutina
  const handleRutinaDelete = (rutinaId) => {
    // Limpiar todos los cambios locales para esta rutina
    clearLocalChanges();
    
    // Llamar al handler original si existe
    if (typeof onDelete === 'function') {
      onDelete(rutinaId);
    }
  };

  const handleNavigatePrev = () => {
    if (currentPage > 1) {
      // console.log('Navegando a la rutina anterior');
      window.dispatchEvent(new CustomEvent('navigate', {
        detail: { direction: 'prev' }
      }));
    }
  };

  const handleNavigateNext = () => {
    if (currentPage < totalPages) {
      // console.log('Navegando a la rutina siguiente');
      window.dispatchEvent(new CustomEvent('navigate', {
        detail: { direction: 'next' }
      }));
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="error" variant="h6" gutterBottom>
          {error}
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => window.location.reload()}
          sx={{ mt: 2 }}
        >
          Reintentar
        </Button>
      </Box>
    );
  }

  if (!rutina || !rutina._id) {
    return (
      <TableContainer 
        component={Paper} 
        elevation={0}
        sx={{ 
          borderRadius: 0,
          bgcolor: 'background.default',
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell 
                colSpan={4} 
                sx={{ 
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  py: 1.5,
                  px: 2
                }}
              >
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between'
                }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                    Sin registro activo
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell 
                colSpan={4} 
                align="center"
                sx={{
                  height: '100%',
                  border: 'none'
                }}
              >
                <Box sx={{ 
                  py: 8, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  gap: 2 
                }}>
                  <CalendarTodayOutlinedIcon 
                    sx={{ 
                      fontSize: 48,
                      color: 'text.disabled'
                    }} 
                  />
                  <Typography color="text.secondary">
                    No hay ninguna rutina para mostrar
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={onEdit}
                    sx={{ 
                      borderRadius: 0,
                      textTransform: 'none',
                      mt: 1
                    }}
                  >
                    Crear una nueva rutina
                  </Button>
                </Box>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ p: 0 }}>
      {/* Navegación y acciones */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 0,
        borderBottom: '1px solid rgba(224, 224, 224, 0.1)',
        paddingBottom: 0
      }}>
        <RutinaNavigation 
          onEdit={onEdit}
          onAdd={onAdd}
        />
      </Box>

      {/* Mostrar alerta de datos históricos si es necesario */}
      {historical?.noHistoryAvailable && (
        <Box sx={{ mt: 2, mx: 'auto', maxWidth: '100%' }}>
          <HistoricalAlert />
        </Box>
      )}

      {/* Contenido principal */}
      <Grid container spacing={1.5} sx={{ mt: 0 }}>
        <Grid item xs={12}>
          <Card variant="outlined" sx={{ boxShadow: 'none', border: 'none', borderRadius: 0 }}>
            <CardContent sx={{ p: 0 }}>
              <Grid container spacing={1.5}>
                {/* Body Care */}
                <Grid item xs={12} md={6}>
                  <ChecklistSection
                    title="Cuidado Personal"
                    section="bodyCare"
                    data={rutina.bodyCare || {}}
                    config={rutina.config?.bodyCare || {}}
                    onChange={(newData) => 
                      handleMarkComplete(rutina._id, 'bodyCare', newData)
                    }
                    onConfigChange={(itemId, newConfig) => 
                      handleConfigChange('bodyCare', itemId, newConfig)
                    }
                    readOnly={false}
                  />
                </Grid>
                
                {/* Nutrición */}
                <Grid item xs={12} md={6}>
                  <ChecklistSection
                    title="Nutrición"
                    section="nutricion"
                    data={rutina.nutricion || {}}
                    config={rutina.config?.nutricion || {}}
                    onChange={(newData) => 
                      handleMarkComplete(rutina._id, 'nutricion', newData)
                    }
                    onConfigChange={(itemId, newConfig) => 
                      handleConfigChange('nutricion', itemId, newConfig)
                    }
                    readOnly={false}
                  />
                </Grid>
                
                {/* Ejercicio */}
                <Grid item xs={12} md={6}>
                  <ChecklistSection
                    title="Ejercicio"
                    section="ejercicio"
                    data={rutina.ejercicio || {}}
                    config={rutina.config?.ejercicio || {}}
                    onChange={(newData) => 
                      handleMarkComplete(rutina._id, 'ejercicio', newData)
                    }
                    onConfigChange={(itemId, newConfig) => 
                      handleConfigChange('ejercicio', itemId, newConfig)
                    }
                    readOnly={false}
                  />
                </Grid>
                
                {/* Limpieza */}
                <Grid item xs={12} md={6}>
                  <ChecklistSection
                    title="Limpieza"
                    section="cleaning"
                    data={rutina.cleaning || {}}
                    config={rutina.config?.cleaning || {}}
                    onChange={(newData) => 
                      handleMarkComplete(rutina._id, 'cleaning', newData)
                    }
                    onConfigChange={(itemId, newConfig) => 
                      handleConfigChange('cleaning', itemId, newConfig)
                    }
                    readOnly={false}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

// Exportación por defecto para importación directa
export default RutinaTable; 
