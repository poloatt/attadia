import React, { useEffect, useState, useMemo, useCallback, useRef, memo } from 'react';
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
import { formatDate } from '@shared/utils/iconConfig';
import RutinaCard from './RutinaCard';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import clienteAxios from '@shared/config/axios';
import { useSnackbar } from 'notistack';
import { NavigateBefore, NavigateNext, Today as TodayIcon } from '@mui/icons-material';
import { useRutinas } from '@shared/context';

// Visibilidad centralizada gestionada en subcomponentes mediante visibilityUtils
import { getNormalizedToday, toISODateString, parseAPIDate } from '@shared/utils/dateUtils';

// Exportación nombrada para compatibilidad
export const RutinaTable = ({ 
  rutina, 
  rutinas = [], 
  onEdit, 
  onDelete, 
  onCheckChange, 
  onRutinaChange = null,
  onAdd,
  currentPage: currentPageProp,
  totalPages: totalPagesProp,
  loading: loadingProp
}) => {
  // Usar loading prop directamente para evitar estados duplicados y parpadeos
  const [error, setError] = useState(null);
  // rutinas viene del contexto padre, no necesitamos estado local
  const today = useMemo(() => getNormalizedToday(), []);
  const [globalConfig, setGlobalConfig] = useState(null); // Para almacenar la configuración global
  const { enqueueSnackbar } = useSnackbar();
  
  // Estos valores ahora se obtienen como props del componente padre
  const [currentPage, setCurrentPage] = useState(currentPageProp || 1);
  const [totalPages, setTotalPages] = useState(totalPagesProp || 1);
  // Key estable basada en fecha (modelo único por día)
  const rutinaDateKey = useMemo(() => {
    try {
      return rutina?.fecha ? toISODateString(parseAPIDate(rutina.fecha)) : 'no-rutina';
    } catch {
      return rutina?._id || 'no-rutina';
    }
  }, [rutina?.fecha]);

  // Funciones del contexto para guardar y enviar configuración
  const { updateItemConfiguration, patchRutinaItemConfig, patchRutinaSection } = useRutinas();

  // Sincronizar estados con props cuando cambian
  // Consolidar múltiples useEffect para evitar cascadas de re-renders
  useEffect(() => {
    // Actualizar páginas desde props
    if (typeof currentPageProp === 'number' && currentPageProp > 0) setCurrentPage(currentPageProp);
    if (typeof totalPagesProp === 'number' && totalPagesProp >= 1) setTotalPages(totalPagesProp);
    
    // Actualizar valores desde rutina
    if (rutina?._page) setCurrentPage(rutina._page);
    if (rutina?._totalPages) setTotalPages(rutina._totalPages);
  }, [currentPageProp, totalPagesProp, rutina?._page, rutina?._totalPages]);


  // Cargar rutinas y configuración global al iniciar
  useEffect(() => {
    // Usar una ref para controlar si el componente está montado
    const isMounted = { current: true };
    
    // Flag para evitar cargar la configuración más de una vez por ciclo
    let configLoaded = false;
    
    const fetchData = async () => {
      if (!isMounted.current) return;
      
      try {
        // Loading manejado por contexto padre
        
        // Los datos de rutinas vienen del contexto, no necesitamos cargar aquí
          
        // Intentar cargar la configuración global solo si no ha sido cargada aún
        if (!configLoaded && isMounted.current) {
          try {
            const configResponse = await clienteAxios.get('/api/users/rutinas-config');
            
            // Verificar si el componente sigue montado después de la petición
            if (!isMounted.current) return;
            
            configLoaded = true;
            setGlobalConfig(configResponse.data || {});
          } catch (configError) {
            if (!configError.cancelado) {
              if (import.meta.env.DEV) {
                console.warn('[RutinaTable] No se pudo cargar la configuración global:', configError);
              }
              if (isMounted.current) {
                setGlobalConfig({});
              }
            }
          }
        }
      } catch (error) {
        // Manejo general de errores
        if (!error.cancelado && isMounted.current) {
          console.error('[RutinaTable] Error en fetchData:', error);
          setError('Error al cargar los datos. Por favor, intenta de nuevo.');
          enqueueSnackbar('Error al cargar los datos', { variant: 'error' });
        }
      } finally {
        // Solo actualizar el estado si el componente sigue montado
        if (isMounted.current) {
          // Loading manejado por contexto padre
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
  }, []);

  // Lógica de visibilidad unificada: se delega a RutinaCard/ChecklistSection vía visibilityUtils

  const handleConfigChange = (seccionId, itemId, newConfig, meta = {}) => {
    if (!rutina || !rutina._id) {
      console.error("[RutinaTable] No hay rutina activa para actualizar configuración");
      enqueueSnackbar('No hay rutina activa', { variant: 'error' });
      return;
    }

    const scope = (meta?.scope || 'today').toString(); // 'today' | 'day'
    
    // Verificar si la rutina es de una fecha pasada usando dateUtils
    const rutinaDate = parseAPIDate(rutina.fecha);
    const today = getNormalizedToday();
    
    if (rutinaDate < today && scope === 'day') {
      enqueueSnackbar('No se puede modificar la cadencia en días pasados. Usa “Aplicar desde hoy”.', { 
        variant: 'warning',
        autoHideDuration: 5000
      });
      return;
    }
    
    
    // Normalizar la configuración antes de enviarla
    const normalizedConfig = {
      ...newConfig,
      tipo: (newConfig.tipo || 'DIARIO').toUpperCase(),
      frecuencia: Number(newConfig.frecuencia || 1), // Convertir explícitamente a Number
      activo: newConfig.activo !== undefined ? newConfig.activo : true
    };
    
    // Normalizar periodo SIEMPRE para DIARIO/SEMANAL/MENSUAL (evita casos tipo=SEMANAL + periodo=CADA_DIA)
    if (normalizedConfig.tipo === 'DIARIO') normalizedConfig.periodo = 'CADA_DIA';
    else if (normalizedConfig.tipo === 'SEMANAL') normalizedConfig.periodo = 'CADA_SEMANA';
    else if (normalizedConfig.tipo === 'MENSUAL') normalizedConfig.periodo = 'CADA_MES';
    else if (!normalizedConfig.periodo) normalizedConfig.periodo = 'CADA_DIA';
    

    // Si estamos en una fecha pasada y el scope es "today", solo actualizamos la plantilla
    // (y rutinas desde hoy) pero NO tocamos este día pasado.
    if (rutinaDate < today && scope === 'today') {
      clienteAxios.put('/api/users/preferences/habits', {
        habits: { [seccionId]: { [itemId]: normalizedConfig } },
        applyFrom: 'today'
      }, { params: { applyFrom: 'today' } })
        .then(() => {
          // Refrescar solo este ítem en UI (sin recargar toda la página)
          // IMPORTANTE: Actualizar el config de la rutina actual para reflejar cambios inmediatamente
          if (rutina?._id) {
            patchRutinaItemConfig(rutina._id, seccionId, itemId, normalizedConfig);
            // También actualizar la rutina localmente para que se refleje en RutinaCard
            if (typeof onRutinaChange === 'function') {
              const updatedRutina = { ...rutina };
              if (!updatedRutina.config) updatedRutina.config = {};
              if (!updatedRutina.config[seccionId]) updatedRutina.config[seccionId] = {};
              updatedRutina.config[seccionId][itemId] = normalizedConfig;
              onRutinaChange(updatedRutina);
            }
          }
          enqueueSnackbar('Configuración aplicada desde hoy (el pasado no se modifica)', { variant: 'success' });
        })
        .catch((error) => {
          console.error('[RutinaTable] ❌ Error al aplicar preferencia desde hoy:', error);
          enqueueSnackbar('Error al aplicar desde hoy', { variant: 'error' });
        });
      return;
    }
    
    // Registrar el cambio local a nivel de contexto
    try {
      // saveLocalChangesForRutina(rutina._id, seccionId, itemId, normalizedConfig); // Eliminado
    } catch {}
    
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
      // Añadir flag para preservar cambios locales
      onRutinaChange({
        ...updatedRutina,
        _preserve_local_changes: true
      });
    }
    
    // Persistencia según alcance:
    // - day: solo esta rutina (PUT /api/rutinas/:id vía updateItemConfiguration)
    // - today: actualizar plantilla del usuario y aplicar a rutinas desde hoy (incluye la de hoy)
    if (scope === 'today') {
      clienteAxios.put('/api/users/preferences/habits', {
        habits: { [seccionId]: { [itemId]: normalizedConfig } },
        applyFrom: 'today'
      }, { params: { applyFrom: 'today' } })
        .then(() => {
          // IMPORTANTE: Actualizar el config de la rutina actual para reflejar cambios inmediatamente
          if (rutina?._id) {
            patchRutinaItemConfig(rutina._id, seccionId, itemId, normalizedConfig);
            // También actualizar la rutina localmente para que se refleje en RutinaCard
            if (typeof onRutinaChange === 'function') {
              const updatedRutina = { ...rutina };
              if (!updatedRutina.config) updatedRutina.config = {};
              if (!updatedRutina.config[seccionId]) updatedRutina.config[seccionId] = {};
              updatedRutina.config[seccionId][itemId] = normalizedConfig;
              onRutinaChange(updatedRutina);
            }
          }
          enqueueSnackbar('Configuración aplicada desde hoy', { variant: 'success' });
        })
        .catch((error) => {
          console.error('[RutinaTable] ❌ Error al aplicar preferencia desde hoy:', error);
          enqueueSnackbar('Error al aplicar desde hoy', { variant: 'error' });
          if (typeof onRutinaChange === 'function') onRutinaChange(rutina);
        });
    } else {
      // Enviar actualización a través del contexto (gestiona recarga silenciosa)
      updateItemConfiguration(seccionId, itemId, normalizedConfig, { isGlobal: true })
        .then((ok) => {
          if (ok) {
            // IMPORTANTE: Actualizar también la rutina localmente para reflejar cambios inmediatamente
            if (rutina?._id && typeof onRutinaChange === 'function') {
              const updatedRutina = { ...rutina };
              if (!updatedRutina.config) updatedRutina.config = {};
              if (!updatedRutina.config[seccionId]) updatedRutina.config[seccionId] = {};
              updatedRutina.config[seccionId][itemId] = normalizedConfig;
              onRutinaChange(updatedRutina);
            }
            enqueueSnackbar('Configuración guardada', { variant: 'success' });
          }
        })
        .catch(error => {
          console.error('[RutinaTable] ❌ Error al actualizar configuración:', error);
          if (typeof onRutinaChange === 'function') {
            onRutinaChange(rutina);
          }
          enqueueSnackbar('Error al actualizar configuración: ' + (error?.message || 'Error desconocido'), { 
            variant: 'error',
            autoHideDuration: 5000
          });
        });
    }
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
      const normalizedConfig = {
        ...newConfig,
        frecuencia: Number(newConfig.frecuencia || 1),
        tipo: (newConfig.tipo || 'DIARIO').toUpperCase()
      };
      await updateItemConfiguration(seccionId, itemId, normalizedConfig);
      enqueueSnackbar('Configuración actualizada', { variant: 'success' });
    } catch (error) {
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
      // Siempre parchear en el contexto para que la navegación (% completion) se actualice sin refresh
      patchRutinaSection(rutinaId, seccionId, newData);
      
      // Log para depuración
      // Log eliminado - rutinasService ya muestra tick/cross
      
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
      // Revertir parche local en caso de error
      if (rutina && rutina._id === rutinaId) {
        try { patchRutinaSection(rutinaId, seccionId, rutina?.[seccionId] || {}); } catch {}
      }
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
      const totalRutinas = rutinas.length + 1;
      
      // La actualización de rutinas se maneja en el contexto padre
      
      // Notificar al componente padre sobre la nueva rutina seleccionada
      if (onRutinaChange && typeof onRutinaChange === 'function') {
        // Configurar la nueva rutina como la actual con navegación
        onRutinaChange({
          ...newRutina,
          _page: 1,
          _totalPages: totalRutinas
        });
      }
      
      // Actualizar página actual a 1
      setCurrentPage(1);
      setTotalPages(totalRutinas);
      
      enqueueSnackbar('Nueva rutina creada', { variant: 'success' });
    } catch (error) {
      console.error('Error al crear rutina:', error);
      enqueueSnackbar('Error al crear rutina', { variant: 'error' });
    }
  };

  // Limpiar cambios locales cuando se elimina una rutina
  const handleRutinaDelete = (rutinaId) => {
    // Llamar al handler original si existe
    if (typeof onDelete === 'function') {
      onDelete(rutinaId);
    }
  };

  const handleNavigatePrev = () => {
    if (currentPage > 1) {
      window.dispatchEvent(new CustomEvent('navigate', {
        detail: { direction: 'prev' }
      }));
    }
  };

  const handleNavigateNext = () => {
    if (currentPage < totalPages) {
      window.dispatchEvent(new CustomEvent('navigate', {
        detail: { direction: 'next' }
      }));
    }
  };

  if (loadingProp) {
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
    <Box key={rutinaDateKey} sx={{ 
      width: '100%',
      maxWidth: 900,
      mx: 'auto',
      px: { xs: 1, sm: 2, md: 3 },
      py: 3,
      boxSizing: 'border-box'
    }}>
      {/* Navegación y acciones */}




      {/* Contenido principal */}
      <Grid container spacing={0} sx={{ mt: 0 }}>
        <Grid item xs={12}>
          <Card variant="outlined" sx={{ boxShadow: 'none', border: 'none', borderRadius: 0 }}>
            <CardContent sx={{ p: 0.5 }}>
              <Grid container spacing={1}>
                {/* Body Care */}
                <Grid item xs={12} md={6}>
                  <RutinaCard
                    key={`card-bodyCare-${rutinaDateKey}`}
                    title="Cuidado Personal"
                    section="bodyCare"
                    data={rutina.bodyCare || {}}
                    config={rutina.config?.bodyCare || {}}
                    onChange={(newData) => 
                      handleMarkComplete(rutina._id, 'bodyCare', newData)
                    }
                    onConfigChange={(itemId, newConfig, meta) => 
                      handleConfigChange('bodyCare', itemId, newConfig, meta)
                    }
                    readOnly={false}
                  />
                </Grid>
                
                {/* Nutrición */}
                <Grid item xs={12} md={6}>
                  <RutinaCard
                    key={`card-nutricion-${rutinaDateKey}`}
                    title="Nutrición"
                    section="nutricion"
                    data={rutina.nutricion || {}}
                    config={rutina.config?.nutricion || {}}
                    onChange={(newData) => 
                      handleMarkComplete(rutina._id, 'nutricion', newData)
                    }
                    onConfigChange={(itemId, newConfig, meta) => 
                      handleConfigChange('nutricion', itemId, newConfig, meta)
                    }
                    readOnly={false}
                  />
                </Grid>
                
                {/* Ejercicio */}
                <Grid item xs={12} md={6}>
                  <RutinaCard
                    key={`card-ejercicio-${rutinaDateKey}`}
                    title="Ejercicio"
                    section="ejercicio"
                    data={rutina.ejercicio || {}}
                    config={rutina.config?.ejercicio || {}}
                    onChange={(newData) => 
                      handleMarkComplete(rutina._id, 'ejercicio', newData)
                    }
                    onConfigChange={(itemId, newConfig, meta) => 
                      handleConfigChange('ejercicio', itemId, newConfig, meta)
                    }
                    readOnly={false}
                  />
                </Grid>
                
                {/* Limpieza */}
                <Grid item xs={12} md={6}>
                  <RutinaCard
                    key={`card-cleaning-${rutinaDateKey}`}
                    title="Limpieza"
                    section="cleaning"
                    data={rutina.cleaning || {}}
                    config={rutina.config?.cleaning || {}}
                    onChange={(newData) => 
                      handleMarkComplete(rutina._id, 'cleaning', newData)
                    }
                    onConfigChange={(itemId, newConfig, meta) => 
                      handleConfigChange('cleaning', itemId, newConfig, meta)
                    }
                    readOnly={false}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

// Memoizar RutinaTable sin bloquear updates de configuración:
// - El comparador debe detectar cambios en rutina.config para sincronizar con HabitsManager
// - Comparar rutina.config usando JSON.stringify para detectar cambios profundos
const MemoizedRutinaTable = memo(RutinaTable, (prevProps, nextProps) => {
  // Comparar config usando JSON.stringify para detectar cambios profundos
  const prevConfig = JSON.stringify(prevProps.rutina?.config || {});
  const nextConfig = JSON.stringify(nextProps.rutina?.config || {});
  const configChanged = prevConfig !== nextConfig;
  
  // Si la config cambió, forzar re-render
  if (configChanged) {
    return false; // false = no son iguales, debe re-renderizar
  }
  
  // Comparar otras props normalmente
  return (
    prevProps.loading === nextProps.loading &&
    prevProps.currentPage === nextProps.currentPage &&
    prevProps.totalPages === nextProps.totalPages &&
    prevProps.rutina?._id === nextProps.rutina?._id &&
    prevProps.rutina?.fecha === nextProps.rutina?.fecha &&
    prevProps.rutinas === nextProps.rutinas
  );
});

// Exportación por defecto para importación directa
export default MemoizedRutinaTable; 
