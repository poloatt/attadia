import React, { useState, useMemo, useEffect, useCallback, useRef, memo } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Collapse,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  alpha,
  Chip,
  Menu,
  MenuItem
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import TuneIcon from '@mui/icons-material/Tune';
import { iconConfig } from './utils/iconConfig';
import ItemCadenciaConfig from './ItemCadenciaConfig';
import InlineItemConfig from './InlineItemConfig';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import SettingsIcon from '@mui/icons-material/Settings';
import { useRutinas } from './context/RutinasContext';
import { logSaveOperation, logObjectChanges } from './DEBUG.js';
import { useSnackbar } from 'notistack';
// Importamos las utilidades de cadencia
import { debesMostrarHabitoEnFecha, generarMensajeCadencia, getFrecuenciaLabel, obtenerUltimaCompletacion } from './utils/cadenciaUtils';
// Importar la nueva función shouldShowItem
import shouldShowItem, { shouldShowItemInMainView, calcularEstadoCadencia } from './utils/shouldShowItem';
import { startOfWeek, isSameWeek, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { obtenerHistorialCompletaciones, esRutinaHistorica } from './utils/historialUtils';
import rutinasService from './services/rutinasService';
import { useRutinasHistorical } from './context/rutinasHistoricalContext';
import ChecklistItem from './ChecklistItem';
import { 
  calcularDiasConsecutivos,
  normalizarFecha,
  obtenerRangoFechas,
  calcularProgresoPeriodo
} from './utils/historialUtils';

// Función para capitalizar solo la primera letra
const capitalizeFirstLetter = (string) => {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

// Función para determinar si un ítem debe mostrarse según su configuración de cadencia
const debesMostrarItem = (itemId, section, config, rutina) => {
  if (!config || !itemId || !config[itemId]) {
    // Si no hay configuración, mostrar por defecto
    return true;
  }

  const cadenciaConfig = config[itemId];

  // Si la configuración está inactiva, no mostrar
  if (!cadenciaConfig.activo) {
    return false;
  }

  // Si estamos en modo edición o no existe rutina, mostrar siempre
  if (!rutina || rutina._id === 'new') {
    return true;
  }

  // Usar la función shouldShowItem del módulo importado
  return shouldShowItem(section, itemId, rutina);
};

// Función para determinar si un ítem debe mostrarse en la vista principal (no colapsable)
const debesMostrarItemEnVistaPrincipal = (itemId, section, config, rutina, localData = {}) => {
  // Si no hay configuración, mostrar por defecto
  if (!config || !itemId || !config[itemId]) {
    return true;
  }

  // Si estamos en modo edición o no existe rutina, mostrar siempre
  if (!rutina || rutina._id === 'new') {
    return true;
  }
  
  // Verificar si está completado usando los datos locales o la rutina
  const completadoHoy = localData[itemId] === true || rutina?.[section]?.[itemId] === true;
  
  // Si está completado hoy, siempre mostrar 
  if (completadoHoy) {
    return true;
  }
  
  // Obtener la configuración específica
  const itemConfig = config[itemId];
  
  // Si la configuración está inactiva, no mostrar
  if (itemConfig && itemConfig.activo === false) {
    return false;
  }
  
  const tipo = itemConfig?.tipo?.toUpperCase() || 'DIARIO';
  
  // Los ítems diarios siempre se muestran si no están completados hoy
  if (tipo === 'DIARIO') {
    return true;
  }
  
  // Para otros tipos (SEMANAL, MENSUAL), simplificar la lógica para mostrar siempre
  // hasta que tengan datos reales (evitando así errores)
  return true;
};

// Función para obtener el historial de completados de un ítem
const obtenerHistorialCompletados = (itemId, section, rutina) => {
  if (!rutina || !rutina.historial || !rutina.historial[section]) {
    return [];
  }

  const historial = rutina.historial[section];
  
  // Filtrar entradas del historial donde el ítem esté completado
  return Object.entries(historial)
    .filter(([fecha, items]) => items && items[itemId] === true)
    .map(([fecha]) => new Date(fecha));
};

const ChecklistSection = ({
  title,
  section,
  data = {},
  config = {},
  onChange,
  onConfigChange,
  readOnly = false
}) => {
  // Contexto de rutinas - DEBE IR PRIMERO
  const { rutina, markItemComplete, updateItemConfig, updateUserHabitPreference } = useRutinas();
  const { enqueueSnackbar } = useSnackbar();
  const { obtenerHistorialCompletaciones: obtenerHistorialCompletacionesHistorical } = useRutinasHistorical();

  // Referencias - SEGUNDO
  const dataRef = useRef(data);
  const configRef = useRef(config);
  const historialCacheRef = useRef({});
  const mountedRef = useRef(true);

  // Estados - TERCERO
  const [localData, setLocalData] = useState(data);
  const [historialCache, setHistorialCache] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [configOpen, setConfigOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuItemId, setMenuItemId] = useState(null);
  const [forceUpdate, setForceUpdate] = useState(Date.now());
  const [isExpanded, setIsExpanded] = useState(() => {
    if (rutina && rutina._expandedSections) {
      return !!rutina._expandedSections[section];
    }
    return false;
  });
  const [historialItems, setHistorialItems] = useState({});
  const [error, setError] = useState(null);

  // Cleanup effect
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Cargar historial para un ítem específico
  const cargarHistorialItem = useCallback(async (itemId) => {
    try {
      if (!rutina?.fecha) return null;

      // En lugar de usar obtenerConfigItem, usamos directamente el config que recibimos como prop
      const itemConfig = config[itemId];
      if (!itemConfig) return null;

      const fechaRutina = normalizarFecha(rutina.fecha);
      const { inicio, fin } = obtenerRangoFechas(itemConfig.tipo || 'DIARIO', fechaRutina);

      const historial = await rutinasService.obtenerHistorialCompletaciones(
        section,
        itemId,
        inicio,
        fin
      );

      if (!Array.isArray(historial)) return null;

      return {
        completados: historial,
        diasConsecutivos: calcularDiasConsecutivos(historial),
        progreso: calcularProgresoPeriodo(historial, itemConfig)
      };
    } catch (error) {
      console.error(`[ChecklistSection] Error al cargar historial para ${section}.${itemId}:`, error);
      return null;
    }
  }, [rutina, section, config]);

  // Cargar historial para todos los ítems
  const cargarHistorialItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const promesas = Object.keys(config || {}).map(async itemId => {
        const historial = await cargarHistorialItem(itemId);
        return [itemId, historial];
      });

      const resultados = await Promise.all(promesas);
      const nuevoHistorial = Object.fromEntries(
        resultados.filter(([, historial]) => historial !== null)
      );

      setHistorialItems(nuevoHistorial);
    } catch (error) {
      console.error(`[ChecklistSection] Error al cargar historial:`, error);
      setError(error.message || 'Error al cargar historial');
    } finally {
      setLoading(false);
    }
  }, [config, cargarHistorialItem]);

  // Efecto para cargar historial inicial
  useEffect(() => {
    if (rutina?.fecha) {
      cargarHistorialItems();
    }
  }, [rutina?.fecha, cargarHistorialItems]);

  // Actualizar los datos locales cuando cambian las props
  useEffect(() => {
    // Solo actualizar si los datos han cambiado
    if (JSON.stringify(dataRef.current) !== JSON.stringify(data)) {
      dataRef.current = data;
      setLocalData(data);
    }
  }, [data, section]);

  // Forzar actualización cuando cambia la configuración
  useEffect(() => {
    // Detectar cambios en la configuración
    if (JSON.stringify(configRef.current) !== JSON.stringify(config)) {
      console.log(`[ChecklistSection] Configuración actualizada para sección ${section}`, config);
      configRef.current = config;
      // Forzar re-renderizado
      setForceUpdate(Date.now());
    }
  }, [config, section]);
  
  // Guardar el estado de expansión cuando cambia
  useEffect(() => {
    if (rutina && rutina._id) {
      // Actualizar el estado de expansión en la rutina sin recargar la página
      const updateExpandedState = async () => {
        // Actualizar el estado local de la rutina sin tocar el resto de la UI
        if (typeof window !== 'undefined') {
          // Usar un evento personalizado para comunicar el cambio de estado
          // sin causar un re-renderizado completo
          const event = new CustomEvent('sectionExpanded', {
            detail: { section, isExpanded, rutinaId: rutina._id }
          });
          window.dispatchEvent(event);
        }
      };
      
      updateExpandedState();
    }
  }, [isExpanded, section, rutina]);
  
  // Escuchar cambios en el estado de expansión global
  useEffect(() => {
    const handleSectionExpanded = (event) => {
      const { section: expandedSection, isExpanded: expandedState, rutinaId } = event.detail;
      
      // Solo actualizar si la rutina coincide y no es esta sección
      if (rutinaId === rutina?._id && expandedSection !== section && expandedState === true) {
        // Cuando otra sección se expande, colapsar esta sección
        setIsExpanded(false);
      }
    };
    
    window.addEventListener('sectionExpanded', handleSectionExpanded);
    
    return () => {
      window.removeEventListener('sectionExpanded', handleSectionExpanded);
    };
  }, [rutina, section]);
  
  // Función para cambiar el estado de expansión
  const handleToggle = () => {
    setIsExpanded(prev => !prev);
  };
  
  // Validar que la sección existe antes de intentar acceder a los iconos
  if (!section || !iconConfig[section]) {
    console.warn(`[ChecklistSection] Sección no válida o sin configuración de iconos: ${section}`);
    return (
      <Box sx={{ mb: 1, bgcolor: '#212121', p: 2 }}>
        <Typography variant="subtitle1" sx={{ color: 'white' }}>
          {capitalizeFirstLetter(title) || 'Sección sin título'} - Configuración no disponible
        </Typography>
      </Box>
    );
  }
  
  const sectionIcons = iconConfig[section] || {};
  
  // Función helper para determinar si un ítem está completado
  const isItemCompleted = useCallback((itemId) => {
    // MEJORA: Siempre usar el estado local para actualización inmediata
    const completado = localData[itemId] === true;
    
    // DEBUGGING: Mostrar estado actual
    // console.log(`[ChecklistSection] 🔍 Estado de ${section}.${itemId}: ${completado ? 'Completado' : 'Pendiente'}`);
    
    return completado;
  }, [localData, section]); // Dependencias correctas para el useCallback

  // Renderizar los iconos en la vista colapsada
  const renderCollapsedIcons = (sectionIcons, section, config, rutina, handleItemClick, readOnly, localData, forceUpdate) => {
    // Renderizar los iconos y aplicar filtros de visibilidad
    return Object.keys(sectionIcons).map((itemId) => {
      const Icon = sectionIcons[itemId];
      
      // Usar estado local para respuesta inmediata
      const isCompletedIcon = localData[itemId] === true;
      
      // Añadir key para forzar actualización cuando cambia forceUpdate
      const renderKey = `${itemId}_${isCompletedIcon}_${forceUpdate}`;
      
      // Determinar si debe mostrarse usando lógica optimizada (pasando localData)
      const shouldShowIcon = debesMostrarItemEnVistaPrincipal(itemId, section, config, rutina, localData);
      
      // Si no debe mostrarse, omitir completamente
      if (!shouldShowIcon) {
        console.log(`[ChecklistSection] 🔍 Ocultando icono ${section}.${itemId} por cadencia`);
        return null;
      }
      
      // Debugging: mostrar qué iconos se están renderizando
      console.log(`[ChecklistSection] 🔍 Renderizando icono ${section}.${itemId}, estado: ${isCompletedIcon ? 'Completado' : 'Pendiente'}`);
      
      return (
        <Tooltip key={renderKey} title={itemId} arrow placement="top">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation(); // Detener propagación para evitar que se abra/cierre la sección
              !readOnly && handleItemClick(itemId, e);
            }}
            sx={{
              color: isCompletedIcon ? 'primary.main' : 'rgba(255,255,255,0.5)',
              bgcolor: isCompletedIcon ? 'action.selected' : 'transparent',
              borderRadius: '50%',
              width: 38,
              height: 38,
              p: 0.3,
              transition: 'all 0.2s ease',
              '&:hover': {
                color: isCompletedIcon ? 'primary.main' : 'white',
                bgcolor: isCompletedIcon ? 'action.selected' : 'rgba(255,255,255,0.1)'
              }
            }}
          >
            {Icon && <Icon fontSize="small" />}
          </IconButton>
        </Tooltip>
      );
    }).filter(Boolean); // Filtrar elementos nulos
  };

  // Optimizar handleItemClick para actualización inmediata sin efectos innecesarios
  const handleItemClick = useCallback((itemId, event) => {
    // Si se recibe un evento, detener propagación
    if (event) {
      event.stopPropagation();
    }
    
    if (readOnly) return;
    
    // Verificar si onChange es una función antes de intentar llamarla
    if (typeof onChange !== 'function') {
      console.warn(`[ChecklistSection] onChange no es una función en sección ${section}, itemId ${itemId}`);
      return;
    }
    
    // Verificar si data existe y crear un nuevo objeto con el estado actualizado
    const isCompleted = isItemCompleted(itemId);
    const newValue = !isCompleted;
    
    // Datos para actualización local de la UI
    const newData = {
      ...localData,
      [itemId]: newValue
    };
    
    // Actualizar el estado local inmediatamente para una respuesta visual instantánea
    setLocalData(newData);
    
    // Actualizar el historial en el cache
    const fechaActual = new Date().toISOString();
    const fechaActualCorta = fechaActual.split('T')[0];
    
    if (newValue) {
      const historialActual = historialCache[itemId] || {
        total: 0,
        completacionesPorDia: {},
        periodoActual: {
          tipo: config?.[itemId]?.tipo || 'DIARIO',
          inicio: fechaActual,
          fin: fechaActual
        },
        diasCompletados: 0,
        diasConsecutivos: 0,
        ultimaCompletacion: null
      };

      // Actualizar completaciones para el día actual
      const completacionesDia = historialActual.completacionesPorDia[fechaActualCorta] || [];
      completacionesDia.push(fechaActual);

      const nuevoHistorial = {
        ...historialActual,
        total: historialActual.total + 1,
        completacionesPorDia: {
          ...historialActual.completacionesPorDia,
          [fechaActualCorta]: completacionesDia
        },
        ultimaCompletacion: fechaActual
      };

      setHistorialCache(prev => ({
        ...prev,
        [itemId]: nuevoHistorial
      }));
    }
    
    // Notificar al componente padre del cambio en la UI inmediatamente
    onChange(newData);
    
    // Registrar los últimos cambios en la rutina para mejorar respuesta inmediata
    if (rutina) {
      if (!rutina._ultimosCambios) {
        rutina._ultimosCambios = {};
      }
      
      if (!rutina._ultimosCambios[section]) {
        rutina._ultimosCambios[section] = {};
      }
      
      rutina._ultimosCambios[section][itemId] = {
        valor: newValue,
        timestamp: Date.now()
      };
    }
    
    if (markItemComplete && typeof markItemComplete === 'function' && rutina && rutina._id) {
      const itemData = { [itemId]: newValue };
      
      markItemComplete(rutina._id, section, itemData)
        .then((response) => {
          if (response && response[section]) {
            const valorServidor = response[section][itemId];
            
            if (valorServidor !== newValue) {
              setLocalData(prevData => ({
                ...prevData,
                [itemId]: valorServidor
              }));
              
              if (rutina && rutina._ultimosCambios && rutina._ultimosCambios[section]) {
                rutina._ultimosCambios[section][itemId] = {
                  valor: valorServidor,
                  timestamp: Date.now(),
                  fuenteServidor: true
                };
              }
            }
          }
        })
        .catch(err => {
          setLocalData(prevData => ({
            ...prevData,
            [itemId]: isCompleted
          }));
          
          if (rutina && rutina._ultimosCambios && rutina._ultimosCambios[section]) {
            rutina._ultimosCambios[section][itemId] = {
              valor: isCompleted,
              timestamp: Date.now(),
              error: true
            };
          }
          
          if (typeof onChange === 'function') {
            onChange({
              ...localData,
              [itemId]: isCompleted
            });
          }
        });
    }
  }, [section, onChange, localData, readOnly, rutina, markItemComplete, isItemCompleted, historialCache, config]);

  // Función para obtener el estado de cadencia de un ítem
  const getItemCadenciaStatus = async (itemId, section, rutina, config) => {
    try {
      // Obtener la configuración de cadencia del ítem
      const cadenciaConfig = config && config[itemId] ? config[itemId] : null;
      
      // Si no hay configuración o no está activa, mostrar un mensaje de inactivo
      if (!cadenciaConfig || !cadenciaConfig.activo) {
        return "Inactivo";
      }
      
      // Extraer información básica de cadencia
      const tipo = cadenciaConfig.tipo?.toUpperCase() || 'DIARIO';
      const frecuencia = Number(cadenciaConfig.frecuencia || 1);
      
      // Para cadencia diaria simple (1 vez), usar formato simple
      if (tipo === 'DIARIO' && frecuencia === 1) {
        const completadoHoy = isItemCompleted(itemId);
        return completadoHoy ? "Completado hoy" : "1 vez por día";
      }
      
      // Verificar si el ítem está completado hoy (usar datos MÁS recientes)
      const completadoHoy = isItemCompleted(itemId);
      
      // Usar estrategia diferente según el tipo de cadencia
      let completados = 0;
      
      if (tipo === 'DIARIO') {
        // Para cadencia diaria, solo importa si se completó hoy
        completados = completadoHoy ? 1 : 0;
        
        // Formato para mostrar (asegurando que no es undefined)
        return `${completados}/${frecuencia} por día`;
        
      } else if (tipo === 'SEMANAL') {
        // Determinar si la rutina es histórica
        const fechaRutina = rutina?.fecha ? new Date(rutina.fecha) : new Date();
        const esHistorica = esRutinaHistorica(rutina);
        
        // Para rutinas históricas, usar el servicio especializado
        if (esHistorica) {
          try {
            // Obtener historial acumulado hasta la fecha de la rutina
            const datosCompletacion = await obtenerHistorialCompletacionesHistorical(
              section, 
              itemId, 
              fechaRutina, 
              true,
              cadenciaConfig // Pasar la configuración del ítem
            );
            completados = datosCompletacion.total;
          } catch (error) {
            // En caso de error, usar método fallback
            const historial = obtenerHistorialCompletados(itemId, section, rutina);
            completados = historial.filter(fecha => 
              isSameWeek(fecha, fechaRutina, { locale: es })
            ).length;
          }
        } else {
          // Para la rutina actual, OPTIMIZACIÓN:
          // 1. Considerar el estado local (más reciente) antes que el del historial
          // 2. Incluir solo registros ÚNICOS por día en el conteo semanal

          // Obtener historial y filtrar por semana actual
          const historial = obtenerHistorialCompletados(itemId, section, rutina);
          
          // Crear un conjunto de fechas únicas en formato YYYY-MM-DD
          const fechasUnicas = new Set();
          
          historial.filter(fecha => 
            isSameWeek(fecha, fechaRutina, { locale: es })
          ).forEach(fecha => {
            fechasUnicas.add(fecha.toISOString().split('T')[0]);
          });
          
          // Contar días únicos completados
          completados = fechasUnicas.size;
          
          // Comprobar si está completado hoy y no está en el conjunto
          const fechaHoyStr = new Date().toISOString().split('T')[0];
          if (completadoHoy && !fechasUnicas.has(fechaHoyStr)) {
            completados++;
          }
        }
        
        // Asegurar que siempre tengamos un número (no undefined)
        const conteoSeguro = isNaN(completados) ? 0 : completados;
        
        // Formato para mostrar
        return `${conteoSeguro}/${frecuencia} veces por semana`;
        
      } else if (tipo === 'MENSUAL') {
        // Implementación similar para cadencia mensual
        return `${completados}/${frecuencia} veces por mes`;
      }
      
      // Valor por defecto si no coincide con ningún tipo conocido
      return getFrecuenciaLabel(cadenciaConfig);
    } catch (error) {
      console.error(`Error en getItemCadenciaStatus para ${section}.${itemId}:`, error);
      return "Error: " + error.message;
    }
  };

  // Optimizar getEstadoCadenciaActual para cálculos precisos
  const getEstadoCadenciaActual = async (itemId, section, rutina) => {
    try {
      // Verificar si el ítem tiene configuración
      if (!rutina?.config?.[section]?.[itemId]) {
        return {
          texto: '',
          completados: 0,
          requeridos: 1,
          completa: false,
          tipo: 'DIARIO',
          porcentaje: 0,
          periodoActual: null
        };
      }

      // Obtener la configuración de cadencia
      const itemConfig = rutina.config[section][itemId];
      const tipo = itemConfig?.tipo?.toUpperCase() || 'DIARIO';
      const periodo = itemConfig?.periodo || 'CADA_DIA';
      const frecuencia = Number(itemConfig?.frecuencia || 1);
      
      // Verificar si el ítem está completado (usando localData o la rutina directamente)
      const completadoHoy = isItemCompleted(itemId);
      
      // Obtener el historial completo con la nueva función
      const esCompletacionHistorica = !isToday(new Date(rutina.fecha));
      const datosCompletacion = await obtenerHistorialCompletaciones(
        section, 
        itemId, 
        rutina.fecha,
        esCompletacionHistorica,
        itemConfig // Pasar la configuración del ítem
      );
      
      const { total: completados, completacionesPorDia, periodoActual } = datosCompletacion;
      
      console.log(`[ChecklistSection] Completaciones para ${section}.${itemId}:`, {
        total: completados,
        porDia: completacionesPorDia,
        periodo: periodoActual
      });
      
      // OPTIMIZACIÓN: Verificar límites para consistencia
      const completadosValidos = Math.min(completados, frecuencia);
      
      // Generar texto descriptivo según el tipo de período
      let texto = '';
      switch (periodo) {
        case 'CADA_DIA':
          texto = completadosValidos >= frecuencia 
            ? `Completado hoy (${completadosValidos}/${frecuencia})`
            : `${completadosValidos} de ${frecuencia} hoy`;
          break;
          
        case 'CADA_SEMANA':
          const fechasOrdenadas = Object.keys(completacionesPorDia).sort();
          const detallesDias = fechasOrdenadas.map(fecha => {
            const completacionesDia = completacionesPorDia[fecha];
            return `${fecha}: ${completacionesDia.length}`;
          }).join(', ');
          
          if (completadosValidos === 0) {
            texto = `0/${frecuencia} veces esta semana`;
          } else if (completadosValidos >= frecuencia) {
            texto = `¡Completo! ${completadosValidos}/${frecuencia} veces esta semana (${detallesDias})`;
          } else {
            texto = `${completadosValidos}/${frecuencia} veces esta semana (${detallesDias})`;
          }
          break;
          
        case 'CADA_MES':
          texto = completadosValidos >= frecuencia
            ? `¡Completo! ${completadosValidos}/${frecuencia} veces este mes`
            : `${completadosValidos}/${frecuencia} veces este mes`;
          break;
          
        case 'DIAS_ESPECIFICOS_SEMANA':
          const diasSemana = itemConfig.diasSemana || [];
          const diasTexto = diasSemana.join(', ');
          texto = completadosValidos >= frecuencia
            ? `¡Completo! ${completadosValidos}/${frecuencia} veces (${diasTexto})`
            : `${completadosValidos}/${frecuencia} veces (${diasTexto})`;
          break;
          
        case 'DIAS_ESPECIFICOS_MES':
          const diasMes = itemConfig.diasMes || [];
          const diasMesTexto = diasMes.join(', ');
          texto = completadosValidos >= frecuencia
            ? `¡Completo! ${completadosValidos}/${frecuencia} veces (días ${diasMesTexto})`
            : `${completadosValidos}/${frecuencia} veces (días ${diasMesTexto})`;
          break;
          
        case 'PERSONALIZADO':
          const { intervalo = 1 } = itemConfig;
          texto = completadosValidos >= frecuencia
            ? `¡Completo! ${completadosValidos}/${frecuencia} veces en ${intervalo} días`
            : `${completadosValidos}/${frecuencia} veces en ${intervalo} días`;
          break;
          
        default:
          texto = `${completadosValidos}/${frecuencia}`;
      }
      
      // Calcular porcentaje
      const porcentaje = frecuencia > 0 ? Math.min(100, Math.round((completadosValidos / frecuencia) * 100)) : 0;
      
      return {
        texto,
        completados: completadosValidos,
        requeridos: frecuencia,
        completa: completadosValidos >= frecuencia,
        tipo,
        porcentaje,
        completacionesPorDia,
        periodoActual
      };
    } catch (error) {
      console.error(`Error al calcular estado de cadencia para ${section}.${itemId}:`, error);
      return {
        texto: '',
        completados: 0,
        requeridos: 1,
        completa: false,
        tipo: 'DIARIO',
        porcentaje: 0,
        completacionesPorDia: {},
        periodoActual: null
      };
    }
  };

  // Filtrar ítems según configuración de cadencia (pasando localData)
  const itemsAMostrar = useMemo(() => {
    if (!section || !iconConfig[section]) {
      return [];
    }

    // Forzar actualización de la UI cuando cambia la configuración
    const configKeys = config ? Object.keys(config).join(',') : '';
    
    // Incluir forceUpdate para garantizar que se recalcule cuando cambia la configuración
    const refreshTrigger = forceUpdate;

    return Object.keys(iconConfig[section])
      .filter(itemId => debesMostrarItem(itemId, section, config, rutina));
  }, [section, config, rutina, forceUpdate]);

  // Verificar que tenemos iconos para mostrar
  if (Object.keys(sectionIcons).length === 0) {
    console.warn(`[ChecklistSection] No hay iconos configurados para la sección: ${section}`);
    return (
      <Box sx={{ mb: 1, bgcolor: '#212121', p: 2 }}>
        <Typography variant="subtitle1" sx={{ color: 'white' }}>
          {capitalizeFirstLetter(title)} - No hay elementos configurados
        </Typography>
      </Box>
    );
  }

  // Escuchar cambios en los datos de completitud para forzar actualización
  useEffect(() => {
    // Cuando cambian los datos de completitud, forzar actualización
    // para garantizar que los iconos se muestren u oculten correctamente
    setForceUpdate(Date.now());
    
    // Log para depuración
    if (Object.keys(localData).length > 0) {
      console.log(`[ChecklistSection] Datos actualizados para ${section}, forzando actualización`);
    }
  }, [localData, section]);
  
  // Renderizar los iconos colapsados con memorización
  const renderedCollapsedIcons = (
    <CollapsedIcons
      sectionIcons={sectionIcons}
      section={section} 
      config={config}
      rutina={rutina}
      onItemClick={handleItemClick}
      readOnly={readOnly}
      localData={localData}
      historialCache={historialCache}
    />
  );

  // Renderizar cada ítem
  const renderItems = () => {
    const icons = sectionIcons || {};
    
    // Obtener las keys ordenadas alfabéticamente
    const orderedKeys = Object.keys(icons).sort((a, b) => {
      const labelA = icons[a]?.label?.toLowerCase() || a;
      const labelB = icons[b]?.label?.toLowerCase() || b;
      return labelA.localeCompare(labelB);
    });
    
    return orderedKeys.map((itemId, index) => {
      // Determinar si se debe mostrar este ítem según su cadencia
      const shouldShow = debesMostrarItem(itemId, section, config, rutina);
      
      // Si no debe mostrarse, saltarlo
      if (!shouldShow) {
        return null;
      }
      
      const iconData = icons[itemId] || {};
      const isCompleted = isItemCompleted(itemId);
      
      // Obtener el icono correcto basado en el ID
      const Icon = sectionIcons[itemId];
      
      // Determinar si el ítem está expandido para configuración
      const isConfigOpen = selectedItemId === itemId;
      
      // Crear menú contextual si es necesario (opcional)
      const contextMenu = null; // Implementar si es necesario

      // Retornar el componente optimizado de ítem
      return (
        <React.Fragment key={`${section}-${itemId}-${index}`}>
          <ChecklistItem
            itemId={itemId}
            section={section}
            Icon={Icon}
            isCompleted={isCompleted}
            readOnly={readOnly}
            onItemClick={handleItemClick}
            contextMenu={contextMenu}
            handleConfigItem={handleExpandConfig}
            isConfigOpen={isConfigOpen}
            historialData={historialCache[itemId] || {
              total: 0,
              completacionesPorDia: {},
              periodoActual: {
                tipo: config?.[itemId]?.tipo || 'DIARIO',
                inicio: new Date().toISOString(),
                fin: new Date().toISOString()
              },
              diasCompletados: 0,
              diasConsecutivos: 0,
              ultimaCompletacion: null
            }}
            config={config}
            rutina={rutina}
            getItemCadenciaStatus={getItemCadenciaStatus}
          />
          
          {isConfigOpen && (
            <Box sx={{ width: '100%', mt: 1 }}>
              <Box
                sx={{
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  px: 2,
                  py: 1,
                  mb: 2
                }}
              >
                <InlineItemConfig
                  section={section}
                  itemId={itemId}
                  config={config[itemId] || {}}
                  onConfigChange={(newConfig) => handleConfigChange(itemId, newConfig)}
                  ultimaCompletacion={obtenerUltimaCompletacion(obtenerHistorialCompletados(itemId, section, rutina))}
                  isCompleted={localData[itemId] === true}
                  historialData={historialCache[itemId]}
                />
              </Box>
            </Box>
          )}
        </React.Fragment>
      );
    }).filter(Boolean); // Filtrar elementos nulos
  };

  // Manejar cambios en la configuración de un ítem
  const handleConfigChange = (itemId, newConfig) => {
    try {
      // Verificar que tenemos datos de rutina
      // No necesitamos acceder a contextData, ya tenemos la variable rutina disponible
      // const rutina = contextData?.rutina || {};
      
      // Obtener la configuración original para este ítem
      const originalConfig = (config && config[itemId]) || {
        tipo: 'DIARIO',
        diasSemana: [],
        diasMes: [],
        activo: true,
        periodo: 'CADA_DIA',
        frecuencia: 1
      };
      
      // Crear copia limpia sin referencias para evitar efectos secundarios
      const cleanConfig = {
        tipo: (newConfig.tipo || originalConfig.tipo || 'DIARIO').toUpperCase(),
        frecuencia: Number(newConfig.frecuencia || originalConfig.frecuencia || 1),
        periodo: newConfig.periodo || originalConfig.periodo || 'CADA_DIA',
        diasSemana: Array.isArray(newConfig.diasSemana) ? [...newConfig.diasSemana] : [],
        diasMes: Array.isArray(newConfig.diasMes) ? [...newConfig.diasMes] : [],
        activo: newConfig.activo !== undefined ? Boolean(newConfig.activo) : true,
        esPreferenciaUsuario: true,
        ultimaActualizacion: new Date().toISOString(),
        diasCompletados: originalConfig.diasCompletados || 0,
        diasConsecutivos: originalConfig.diasConsecutivos || 0
      };
      
      // Asegurar que el periodo coincida con el tipo
      if (cleanConfig.tipo === 'DIARIO' && cleanConfig.periodo !== 'CADA_DIA') {
        cleanConfig.periodo = 'CADA_DIA';
      } else if (cleanConfig.tipo === 'SEMANAL' && cleanConfig.periodo !== 'CADA_SEMANA') {
        cleanConfig.periodo = 'CADA_SEMANA';
      } else if (cleanConfig.tipo === 'MENSUAL' && cleanConfig.periodo !== 'CADA_MES') {
        cleanConfig.periodo = 'CADA_MES';
      }
      
      console.log(`[ChecklistSection] 🔄 Actualizando configuración para ${section}.${itemId}:`, cleanConfig);
      
      // Intentar actualizar en el contexto, con manejo de errores
      try {
        if (updateItemConfig && typeof updateItemConfig === 'function') {
          updateItemConfig(section, itemId, cleanConfig)
            .then(() => {
              console.log(`[ChecklistSection] ✅ Configuración guardada y sincronizada con backend para ${section}.${itemId}`);
              
              // Muy importante: actualizar también las preferencias globales del usuario
              // Verificamos si tenemos la función en el contexto (updateUserHabitPreference)
              if (updateUserHabitPreference && typeof updateUserHabitPreference === 'function') {
                updateUserHabitPreference(section, itemId, cleanConfig)
                  .then(result => {
                    if (result && result.updated) {
                      console.log(`[ChecklistSection] ✅ Preferencia de usuario actualizada correctamente para ${section}.${itemId}`);
                    } else {
                      console.warn(`[ChecklistSection] ⚠️ No se pudo actualizar preferencia de usuario para ${section}.${itemId}`);
                    }
                  })
                  .catch(prefError => {
                    console.error(`[ChecklistSection] ❌ Error al actualizar preferencia de usuario:`, prefError);
                  });
              }
              
              // Cerrar configurador una vez guardados los cambios
              if (typeof setSelectedItemId === 'function') {
                setSelectedItemId(null);
              }
              
              // Forzar actualización de UI si es necesario
              if (typeof setForceUpdate === 'function') {
                setForceUpdate(Date.now());
              }
            })
            .catch(error => {
              console.error(`[ChecklistSection] ❌ Error al guardar configuración:`, error);
              enqueueSnackbar('Error al guardar configuración', { variant: 'error' });
            });
        } else {
          console.error('[ChecklistSection] ❌ Función updateItemConfig no disponible');
          enqueueSnackbar('No se puede guardar la configuración', { variant: 'error' });
        }
      } catch (execError) {
        console.error('[ChecklistSection] ❌ Error en ejecución al guardar configuración:', execError);
        enqueueSnackbar('Error inesperado al guardar', { variant: 'error' });
      }
    } catch (error) {
      console.error('[ChecklistSection] ❌ Error general:', error);
      enqueueSnackbar('Error inesperado', { variant: 'error' });
    }
  };

  // Función para manejar la configuración de un ítem específico
  const handleExpandConfig = (itemId) => {
    if (selectedItemId === itemId) {
      // Si ya está seleccionado, lo deseleccionamos
      setSelectedItemId(null);
    } else {
      // Si es diferente, lo seleccionamos
      setSelectedItemId(itemId);
    }
  };

  useEffect(() => {
    if (!itemsAMostrar?.length || !rutina) return;
    
    const cargarHistorialItems = async () => {
      const promesas = itemsAMostrar.map(itemId => cargarHistorialItem(itemId));
      await Promise.all(promesas);
    };

    cargarHistorialItems();
  }, [itemsAMostrar, rutina, cargarHistorialItem]);

  const renderItem = useCallback((itemId) => {
    const defaultHistorial = {
      total: 0,
      completacionesPorDia: {},
      periodoActual: {
        tipo: config?.[itemId]?.tipo || 'DIARIO',
        inicio: new Date().toISOString(),
        fin: new Date().toISOString()
      },
      diasCompletados: 0,
      diasConsecutivos: 0,
      ultimaCompletacion: null
    };

    // Usar el historial del cache o el valor por defecto
    const historialData = historialCache[itemId] || historialCacheRef.current[itemId] || defaultHistorial;

    return (
      <div key={itemId} className="checklist-item">
        <ChecklistItem
          itemId={itemId}
          section={section}
          Icon={sectionIcons[itemId]}
          isCompleted={isItemCompleted(itemId)}
          readOnly={readOnly}
          onItemClick={handleItemClick}
          handleConfigItem={handleExpandConfig}
          isConfigOpen={selectedItemId === itemId}
          historialData={historialData}
          config={config}
          rutina={rutina}
          getItemCadenciaStatus={getItemCadenciaStatus}
        />
        
        {selectedItemId === itemId && (
          <Box sx={{ width: '100%', mt: 1 }}>
            <Box
              sx={{
                bgcolor: 'background.paper',
                borderRadius: 1,
                px: 2,
                py: 1,
                mb: 2
              }}
            >
              <InlineItemConfig
                section={section}
                itemId={itemId}
                config={config[itemId] || {}}
                onConfigChange={(newConfig) => handleConfigChange(itemId, newConfig)}
                ultimaCompletacion={historialData.ultimaCompletacion}
                isCompleted={localData[itemId] === true}
                historialData={historialData}
              />
            </Box>
          </Box>
        )}
      </div>
    );
  }, [
    historialCache,
    historialCacheRef,
    sectionIcons,
    isItemCompleted,
    readOnly,
    handleItemClick,
    handleExpandConfig,
    selectedItemId,
    section,
    config,
    handleConfigChange,
    localData,
    rutina
  ]);

  return (
    <Box sx={{ mb: 1, bgcolor: '#212121', borderRadius: 1, overflow: 'hidden' }}>
      {/* Encabezado de la sección */}
      <Box 
        sx={{ 
          p: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: isExpanded ? '1px solid rgba(255,255,255,0.1)' : 'none',
          cursor: 'pointer'
        }}
        onClick={handleToggle}
      >
        <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'bold' }}>
          {capitalizeFirstLetter(title) || section}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* Mostrar los iconos en una fila solo cuando la sección está colapsada */}
          {!isExpanded && (
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'nowrap', 
              gap: 0.5, 
              mr: 1,
              alignItems: 'center' 
            }}>
              {renderedCollapsedIcons}
            </Box>
          )}
          <IconButton 
            size="small" 
            sx={{ color: 'white', opacity: 0.7 }}
          >
            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      </Box>
      
      {/* Contenido de la sección (colapsable) */}
      <Collapse in={isExpanded} unmountOnExit>
        <Box sx={{ p: 1, pt: 0 }}>
          <List dense disablePadding>
            {loading ? (
              <div className="checklist-section__loading">Cargando...</div>
            ) : (
              renderItems()
            )}
          </List>
        </Box>
      </Collapse>
    </Box>
  );
};

// Renderizar los iconos colapsados con memorización
const CollapsedIcons = memo(({ 
  sectionIcons, 
  section, 
  config, 
  rutina, 
  onItemClick, 
  readOnly, 
  localData,
  historialCache = {} 
}) => {
  // Implementación optimizada de renderCollapsedIcons
  // para evitar re-renderizados innecesarios
  if (!rutina) return null;
  
  const itemsParaMostrar = useMemo(() => {
    return Object.keys(sectionIcons).filter(itemId => {
      // Usar una comprobación rápida en lugar de la función más lenta
      if (!rutina?.config?.[section]?.[itemId]) {
        return true;
      }
      
      const itemConfig = rutina.config[section][itemId];
      if (itemConfig && itemConfig.activo === false) {
        return false;
      }
      
      return debesMostrarItemEnVistaPrincipal(itemId, section, config, rutina, localData);
    });
  }, [sectionIcons, section, config, rutina, localData]);
  
  return (
    <div className="collapsed-icons-container">
      {itemsParaMostrar.length === 0 ? (
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', ml: 1 }}>
          No hay elementos para mostrar
        </Typography>
      ) : (
        itemsParaMostrar.map(itemId => {
          const Icon = sectionIcons[itemId];
          const isCompleted = !!localData[itemId];
          const historialData = historialCache[itemId] || {
            total: 0,
            completacionesPorDia: {},
            periodoActual: {
              tipo: config?.[itemId]?.tipo || 'DIARIO',
              inicio: new Date().toISOString(),
              fin: new Date().toISOString()
            },
            diasCompletados: 0,
            diasConsecutivos: 0,
            ultimaCompletacion: null
          };
          
          // Usar una key compuesta para asegurar unicidad y forzar actualización cuando es necesario
          const keyId = `${section}-${itemId}-${isCompleted ? 'completed' : 'pending'}`;
          
          return (
            <IconButton
              key={keyId}
              size="small"
              onClick={(e) => {
                e.stopPropagation(); // Prevenir que el evento se propague al contenedor
                !readOnly && onItemClick(itemId, e);
              }}
              disabled={readOnly}
              sx={{
                m: 0.5,
                color: isCompleted ? 'primary.main' : 'rgba(255,255,255,0.5)',
                bgcolor: isCompleted ? 'action.selected' : 'transparent',
                '&:hover': {
                  bgcolor: isCompleted ? 'action.selected' : 'rgba(255,255,255,0.1)'
                }
              }}
            >
              {Icon && <Icon />}
            </IconButton>
          );
        })
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.section === nextProps.section &&
    JSON.stringify(prevProps.localData) === JSON.stringify(nextProps.localData) &&
    JSON.stringify(prevProps.config) === JSON.stringify(nextProps.config) &&
    JSON.stringify(prevProps.historialCache) === JSON.stringify(nextProps.historialCache)
  );
});

// Exportar el componente con memorización para prevenir re-renderizados innecesarios
export const MemoizedChecklistSection = memo(ChecklistSection);
export default ChecklistSection;