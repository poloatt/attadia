import React, { useState, useMemo, useEffect, useCallback, useRef, memo } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Collapse,
  Card,
  CardContent,
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
import { iconConfig, getIconByName } from '@shared/utils';
import InlineItemConfigImproved from './InlineItemConfigImproved';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import SettingsIcon from '@mui/icons-material/Settings';
import { useRutinas, useHabits } from '@shared/context';
import HabitFormDialog from '@shared/components/HabitFormDialog';

import { useSnackbar } from 'notistack';
// Importamos las utilidades de cadencia
import { debesMostrarHabitoEnFecha, generarMensajeCadencia, obtenerUltimaCompletacion } from '@shared/utils';
import { getVisibleItemIds } from '@shared/utils/visibilityUtils';
import { getFrecuenciaLabel } from './InlineItemConfigImproved';
// La visibilidad en esta vista extendida no oculta ítems; solo se ocultan completos en vista colapsada
import { startOfWeek, isSameWeek, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
// historial removido del flujo simplificado
import ChecklistItem, { HabitIconButton } from './ChecklistItem';

// Función para capitalizar solo la primera letra
const capitalizeFirstLetter = (string) => {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

// Eliminadas funciones ad-hoc de visibilidad: usamos visibilityUtils centralizado

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

const RutinaCard = ({
  title,
  section,
  data = {},
  config = {},
  onChange,
  onConfigChange,
  readOnly = false
}) => {
  // Contexto de rutinas y hábitos
  const { rutina, markItemComplete, updateItemConfiguration, updateUserHabitPreference } = useRutinas();
  const { habits, updateHabit, deleteHabit, fetchHabits } = useHabits();
  
  // Obtener iconos de hábitos personalizados o usar defaults
  const sectionHabits = habits[section] || [];
  const sectionIcons = useMemo(() => {
    const iconsMap = {};
    sectionHabits
      .filter(h => h.activo !== false)
      .sort((a, b) => (a.orden || 0) - (b.orden || 0))
      .forEach(habit => {
        const Icon = getIconByName(habit.icon);
        if (Icon) {
          iconsMap[habit.id] = Icon;
        }
      });
    
    // Si no hay hábitos personalizados, usar iconConfig como fallback
    if (Object.keys(iconsMap).length === 0 && iconConfig[section]) {
      return iconConfig[section];
    }
    
    return iconsMap;
  }, [section, sectionHabits]);
  
  // IMPORTANTE: Validar que la sección existe ANTES de continuar
  if (!section || Object.keys(sectionIcons).length === 0) {
    console.warn(`[RutinaCard] Sección no válida o sin hábitos: ${section}`);
    return (
      <Box sx={{ mb: 1, bgcolor: '#212121', p: 2 }}>
        <Typography variant="subtitle1" sx={{ color: 'white' }}>
          {capitalizeFirstLetter(title) || 'Sección sin título'} - No hay hábitos configurados
        </Typography>
      </Box>
    );
  }
  
  // Referencia para controlar la actualización de datos
  const dataRef = useRef(data);
  const configRef = useRef(config);
  
  // Determinar si está expandido basado en el estado persistente 
  // almacenado en la rutina o iniciar colapsado por defecto
  const [isExpanded, setIsExpanded] = useState(() => {
    // Comprobar si hay un estado guardado en la rutina
    if (rutina && rutina._expandedSections) {
      return !!rutina._expandedSections[section];
    }
    return false; // Por defecto colapsado
  });

  // Estado para mostrar/ocultar todos los setups
  const [showAllConfig, setShowAllConfig] = useState(false);
  
  const [localData, setLocalData] = useState(data);
  const [configOpen, setConfigOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuItemId, setMenuItemId] = useState(null);
  const [forceUpdate, setForceUpdate] = useState(Date.now()); // Estado para forzar actualización
  
  // Agrega estado para el ítem con setup abierto
  const [openSetupItemId, setOpenSetupItemId] = useState(null);
  
  // Estado para el diálogo de edición de hábito
  const [editingHabitDialog, setEditingHabitDialog] = useState({ open: false, habit: null, section: null });
  
  // Importar el hook de snackbar
  const { enqueueSnackbar } = useSnackbar();
  
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
      // Log eliminado para simplicidad
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
    setIsExpanded(prev => {
      const next = !prev;
      if (next) {
        // Emitir evento global para colapsar otras secciones
        if (typeof window !== 'undefined') {
          const event = new CustomEvent('sectionExpanded', {
            detail: { section, isExpanded: true, rutinaId: rutina?._id }
          });
          window.dispatchEvent(event);
        }
      }
      return next;
    });
  };
  
  // sectionIcons ya está definido arriba en useMemo
  
  // Función helper para determinar si un ítem está completado
  const isItemCompleted = useCallback((itemId) => {
    // MEJORA: Siempre usar el estado local para actualización inmediata
    const completado = localData[itemId] === true;
    
    // DEBUGGING: Mostrar estado actual
    // console.log(`[ChecklistSection] 🔍 Estado de ${section}.${itemId}: ${completado ? 'Completado' : 'Pendiente'}`);
    
    return completado;
  }, [localData, section]); // Dependencias correctas para el useCallback

  // Renderizar los iconos en la vista colapsada - Función sincrónica para mejor rendimiento
  const renderCollapsedIcons = (sectionIcons, section, config, rutina, handleItemClick, readOnly, localData, forceUpdate) => {
    // Renderizar los iconos y aplicar filtros de visibilidad
    return Object.keys(sectionIcons).map((itemId) => {
      const Icon = sectionIcons[itemId];
      
      // Usar estado local para respuesta inmediata
      const isCompletedIcon = localData[itemId] === true;
      
      // Añadir key para forzar actualización cuando cambia forceUpdate
      const renderKey = `${itemId}_${isCompletedIcon}_${forceUpdate}`;
      
      // Lógica simplificada para vista colapsada: mostrar elementos activos
      const cadenciaConfig = config && config[itemId] ? config[itemId] : null;
      
      // Si no hay configuración o no está activa, no mostrar
      if (!cadenciaConfig || !cadenciaConfig.activo) {
        return null;
      }
      
      // Si está completado hoy, siempre mostrar
      if (isCompletedIcon) {
        console.log(`[ChecklistSection] 🔍 Renderizando icono ${section}.${itemId} - Completado hoy`);
        return (
          <Tooltip key={renderKey} title={itemId} arrow placement="top">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                !readOnly && handleItemClick(itemId, e);
              }}
              sx={{
                color: 'primary.main',
                bgcolor: 'action.selected',
                borderRadius: '50%',
                width: 38,
                height: 38,
                p: 0.3,
                transition: 'all 0.2s ease',
                '&:hover': {
                  color: 'primary.main',
                  bgcolor: 'action.selected'
                }
              }}
            >
              {Icon && <Icon fontSize="small" />}
            </IconButton>
          </Tooltip>
        );
      }
      
      // Para elementos no completados, aplicar lógica básica de cadencia
      const tipo = cadenciaConfig.tipo?.toUpperCase() || 'DIARIO';
      const frecuencia = parseInt(cadenciaConfig.frecuencia) || 1;
      
      // Los elementos diarios siempre se muestran si no están completados
      if (tipo === 'DIARIO') {
        console.log(`[ChecklistSection] 🔍 Renderizando icono ${section}.${itemId} - Diario pendiente`);
        return (
          <Tooltip key={renderKey} title={itemId} arrow placement="top">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                !readOnly && handleItemClick(itemId, e);
              }}
              sx={{
                color: 'rgba(255,255,255,0.5)',
                bgcolor: 'transparent',
                borderRadius: '50%',
                width: 38,
                height: 38,
                p: 0.3,
                transition: 'all 0.2s ease',
                '&:hover': {
                  color: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              {Icon && <Icon fontSize="small" />}
            </IconButton>
          </Tooltip>
        );
      }
      
      // Para elementos semanales/mensuales, usar lógica simplificada
      // TODO: Implementar lógica completa de cadencia de forma asíncrona
      console.log(`[ChecklistSection] 🔍 Renderizando icono ${section}.${itemId} - ${tipo} pendiente`);
      return (
        <Tooltip key={renderKey} title={itemId} arrow placement="top">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              !readOnly && handleItemClick(itemId, e);
            }}
            sx={{
              color: 'rgba(255,255,255,0.5)',
              bgcolor: 'transparent',
              borderRadius: '50%',
              width: 38,
              height: 38,
              p: 0.3,
              transition: 'all 0.2s ease',
              '&:hover': {
                color: 'white',
                bgcolor: 'rgba(255,255,255,0.1)'
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
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RutinaCard.jsx:345',message:'handleItemClick called',data:{itemId,section,isCustomHabit:customHabitIds.has(itemId),hasRutina:!!rutina,rutinaId:rutina?._id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'click'})}).catch(()=>{});
    // #endregion
    
    // Verificar si onChange es una función antes de intentar llamarla
    if (typeof onChange !== 'function') {
      console.warn(`[ChecklistSection] onChange no es una función en sección ${section}, itemId ${itemId}`);
      return;
    }
    
    // Verificar si data existe y crear un nuevo objeto con el estado actualizado
    const isCompleted = isItemCompleted(itemId); // Usar la función helper
    const newValue = !isCompleted;
    
    // Datos para actualización local de la UI
    const newData = {
      ...localData,
      [itemId]: newValue
    };
    
    // Actualizar el estado local inmediatamente para una respuesta visual instantánea
    setLocalData(newData);
    
    // Notificar al componente padre del cambio en la UI inmediatamente
    onChange(newData);
    
    // Registrar los últimos cambios en la rutina para mejorar respuesta inmediata
    if (rutina) {
      // Si no existe la propiedad _ultimosCambios, crearla
      if (rutina && !rutina._ultimosCambios) {
        rutina._ultimosCambios = {};
      }
      
      // Si no existe la propiedad para esta sección, crearla
      if (rutina && !rutina._ultimosCambios[section]) {
        rutina._ultimosCambios[section] = {};
      }
      
      // Registrar el cambio con timestamp para saber cuándo ocurrió
      if (rutina && rutina._ultimosCambios) {
        rutina._ultimosCambios[section][itemId] = {
          valor: newValue,
          timestamp: Date.now()
        };
      }
    }
    
    // Eliminar el setTimeout para evitar retrasos y manejar inmediatamente
    if (markItemComplete && typeof markItemComplete === 'function' && rutina && rutina._id) {
      // Crear el formato de datos sencillo esperado por el API
      const itemData = { [itemId]: newValue };
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RutinaCard.jsx:397',message:'Calling markItemComplete',data:{rutinaId:rutina._id,section,itemId,newValue,isCustomHabit:customHabitIds.has(itemId),itemData},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'click'})}).catch(()=>{});
      // #endregion
      
      // Llamar a la función del contexto y manejar resultado
      markItemComplete(rutina._id, section, itemData)
        .then((response) => {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RutinaCard.jsx:403',message:'markItemComplete success',data:{section,itemId,newValue,responseHasSection:!!response?.[section],valorServidor:response?.[section]?.[itemId],isCustomHabit:customHabitIds.has(itemId)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'click'})}).catch(()=>{});
          // #endregion
          
          // Verificar que los datos se actualizaron correctamente
          if (response && response[section]) {
            const valorServidor = response[section][itemId];
            
            // Si el valor del servidor no coincide con nuestro estado local, actualizar
            if (valorServidor !== newValue) {
              // Actualizar estado local con valor del servidor
              setLocalData(prevData => ({
                ...prevData,
                [itemId]: valorServidor
              }));
              
              // Actualizar también _ultimosCambios para mantener coherencia
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
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RutinaCard.jsx:427',message:'markItemComplete error',data:{section,itemId,error:err.message,errorResponse:err.response?.data,isCustomHabit:customHabitIds.has(itemId)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'click'})}).catch(()=>{});
          // #endregion
          
          // Revertir el cambio local en caso de error
          setLocalData(prevData => ({
            ...prevData,
            [itemId]: isCompleted
          }));
          
          // Actualizar también _ultimosCambios en caso de error
          if (rutina && rutina._ultimosCambios && rutina._ultimosCambios[section]) {
            rutina._ultimosCambios[section][itemId] = {
              valor: isCompleted, // Valor original
              timestamp: Date.now(),
              error: true
            };
          }
          
          // Notificar al componente padre del error
          if (typeof onChange === 'function') {
            onChange({
              ...localData,
              [itemId]: isCompleted // Revertir al estado anterior
            });
          }
        });
    } else {
      let reason = "";
      if (!markItemComplete) reason = "markItemComplete no disponible en contexto";
      else if (!rutina) reason = "No hay rutina activa";
      else if (!rutina._id) reason = "La rutina no tiene ID";
    }
  }, [section, onChange, localData, readOnly, rutina, markItemComplete, isItemCompleted]);

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
            const historialResult = await obtenerHistorialCompletaciones(section, itemId, fechaRutina);
            completados = historialResult.total;
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
  const getEstadoCadenciaActual = (itemId, section, rutina) => {
    try {
      // Verificar si el ítem tiene configuración
      if (!rutina?.config?.[section]?.[itemId]) {
        return {
          texto: '',
          completados: 0,
          requeridos: 1,
          completa: false,
          tipo: 'DIARIO',
          porcentaje: 0
        };
      }

      // Obtener la configuración de cadencia
      const itemConfig = rutina.config[section][itemId];
      const tipo = itemConfig?.tipo?.toUpperCase() || 'DIARIO';
      const frecuencia = Number(itemConfig?.frecuencia || 1);
      
      // Verificar si el ítem está completado (usando localData o la rutina directamente)
      const completadoHoy = isItemCompleted(itemId);
      
      // Contar completaciones según el tipo de cadencia
      let completados = 0;
      
      if (tipo === 'DIARIO') {
        completados = completadoHoy ? 1 : 0;
      } else if (tipo === 'SEMANAL') {
        // Para semanal, optimizar conteo considerando duplicados por día
        const hoy = new Date();
        const inicioSemana = startOfWeek(hoy, { locale: es });
        
        // Obtener historial y filtrar por semana actual
        const historial = obtenerHistorialCompletados(itemId, section, rutina);
        
        // Crear un conjunto de fechas únicas en formato YYYY-MM-DD
        const fechasUnicas = new Set();
        
        historial.filter(fecha => 
          isSameWeek(fecha, hoy, { locale: es })
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
      
      // OPTIMIZACIÓN: Verificar límites para consistencia
      const completadosValidos = Math.min(completados, frecuencia);
      
      // Generar texto descriptivo
      let texto = '';
      if (tipo === 'DIARIO') {
        texto = completadosValidos >= frecuencia 
          ? `Completado hoy (${completadosValidos}/${frecuencia})`
          : `${completadosValidos} de ${frecuencia} hoy`;
      } else if (tipo === 'SEMANAL') {
        if (completadosValidos === 0) {
          texto = `0/${frecuencia} veces esta semana`;
        } else if (completadosValidos === 1) {
          texto = `1/${frecuencia} veces esta semana`;
        } else if (completadosValidos < frecuencia) {
          texto = `${completadosValidos}/${frecuencia} veces esta semana`;
        } else {
          texto = `¡Completo! ${completadosValidos}/${frecuencia} esta semana`;
        }
      }
      
      // Calcular porcentaje
      const porcentaje = frecuencia > 0 ? Math.min(100, Math.round((completadosValidos / frecuencia) * 100)) : 0;
      
      return {
        texto,
        completados: completadosValidos,
        requeridos: frecuencia,
        completa: completadosValidos >= frecuencia,
        tipo,
        porcentaje
      };
    } catch (error) {
      console.error(`Error al calcular estado de cadencia para ${section}.${itemId}:`, error);
      return {
        texto: '',
        completados: 0,
        requeridos: 1,
        completa: false,
        tipo: 'DIARIO',
        porcentaje: 0
      };
    }
  };

  // Filtrar ítems según configuración de cadencia (lógica sincrónica)
  const itemsAMostrar = useMemo(() => {
    if (!section || Object.keys(sectionIcons).length === 0) {
      return [];
    }

    // Forzar actualización de la UI cuando cambia la configuración
    const configKeys = config ? Object.keys(config).join(',') : '';
    
    // Incluir forceUpdate para garantizar que se recalcule cuando cambia la configuración
    const refreshTrigger = forceUpdate;

    return Object.keys(sectionIcons)
      .filter(itemId => {
        // Lógica sincrónica simplificada para el filtrado inicial
        const cadenciaConfig = config && config[itemId] ? config[itemId] : null;
        
        // Si no hay configuración, mostrar por defecto
        if (!cadenciaConfig) {
          return true;
        }
        
        // Si la configuración está inactiva, no mostrar
        if (!cadenciaConfig.activo) {
          return false;
        }
        
        // Si estamos en modo edición o no existe rutina, mostrar siempre
        if (!rutina || rutina._id === 'new') {
          return true;
        }
        
        // Para la vista expandida, mostrar todos los elementos activos
        // La lógica completa de cadencia se aplica en `renderItems`
        return true;
      });
  }, [section, config, rutina, forceUpdate, sectionIcons]);

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
  // useEffect eliminado - causa bucles infinitos
  // Los componentes se actualizan automáticamente cuando cambian las props
  
  // Renderizar los iconos colapsados con memorización (pasar localData como prop)
  const renderedCollapsedIcons = (
    <CollapsedIcons
      sectionIcons={sectionIcons}
      section={section} 
      config={config}
      rutina={rutina}
      onItemClick={handleItemClick}
      readOnly={readOnly}
      localData={localData}
    />
  );

  // Obtener IDs de hábitos personalizados para filtrarlos
  const customHabitIds = useMemo(() => {
    return new Set(
      sectionHabits
        .filter(h => h.activo !== false)
        .map(h => h.id || h._id)
        .filter(Boolean)
    );
  }, [sectionHabits]);

  // Renderizar cada ítem con su propio setup (engranaje) que muestra/oculte su InlineItemConfigImproved
  const renderItems = () => {
    const icons = sectionIcons || {};
    // Vista extendida: NO ocultar ítems por visibilidad; mostrar todos los activos
    // Excluir hábitos personalizados que ya se muestran en la sección de configuración
    const orderedKeys = Object.keys(icons)
      .filter(itemId => !customHabitIds.has(itemId)) // Excluir hábitos personalizados
      .sort((a, b) => {
        const labelA = icons[a]?.label?.toLowerCase() || a;
        const labelB = icons[b]?.label?.toLowerCase() || b;
        return labelA.localeCompare(labelB);
      });
    return orderedKeys.map((itemId, index) => {
      const cadenciaConfig = config && config[itemId] ? config[itemId] : null;
      if (!cadenciaConfig) {
        // Ítem sin configuración, mostrar por defecto
      } else if (!cadenciaConfig.activo) {
        return null;
      }
      const Icon = sectionIcons[itemId];
      const isCompleted = isItemCompleted(itemId);
      return (
        <ChecklistItem
          key={`${section}-${itemId}-${index}`}
          itemId={itemId}
          section={section}
          Icon={Icon}
          isCompleted={isCompleted}
          readOnly={readOnly}
          onItemClick={handleItemClick}
          config={config[itemId] || {}}
          onConfigChange={(newConfig, meta) => onConfigChange(itemId, newConfig, meta)}
          isSetupOpen={openSetupItemId === itemId}
          onSetupToggle={() => setOpenSetupItemId(openSetupItemId === itemId ? null : itemId)}
        />
      );
    }).filter(Boolean);
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
        diasSemana: Array.isArray(newConfig.diasSemana) ? [...newConfig.diasSemana] : (Array.isArray(originalConfig.diasSemana) ? [...originalConfig.diasSemana] : []),
        diasMes: Array.isArray(newConfig.diasMes) ? [...newConfig.diasMes] : (Array.isArray(originalConfig.diasMes) ? [...originalConfig.diasMes] : []),
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
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RutinaCard.jsx:813',message:'handleConfigChange called from RutinaCard',data:{section,itemId,cleanConfig,hasUpdateItemConfiguration:!!updateItemConfiguration,hasUpdateUserHabitPreference:!!updateUserHabitPreference,isCustomHabit:!sectionIcons[itemId]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'rutinacard'})}).catch(()=>{});
      // #endregion
      
      // Intentar actualizar en el contexto, con manejo de errores
      // IMPORTANTE: Pasar isGlobal: true para guardar en preferencias globales del usuario
      try {
        if (updateItemConfiguration && typeof updateItemConfiguration === 'function') {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RutinaCard.jsx:820',message:'Calling updateItemConfiguration',data:{section,itemId,isGlobal:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'rutinacard'})}).catch(()=>{});
          // #endregion
          updateItemConfiguration(section, itemId, cleanConfig, { isGlobal: true })
            .then((result) => {
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RutinaCard.jsx:822',message:'updateItemConfiguration result',data:{section,itemId,result,updated:result?.updated},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'rutinacard'})}).catch(()=>{});
              // #endregion
              if (result && result.updated) {
                console.log(`[ChecklistSection] ✅ Configuración guardada en rutina y preferencias globales para ${section}.${itemId}`);
                
                // IMPORTANTE: Actualizar también el prop config localmente para reflejar cambios inmediatamente
                // Esto asegura que los hábitos personalizados muestren los cambios sin necesidad de recargar
                if (onConfigChange && typeof onConfigChange === 'function') {
                  // #region agent log
                  fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RutinaCard.jsx:829',message:'Calling onConfigChange callback',data:{section,itemId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'rutinacard'})}).catch(()=>{});
                  // #endregion
                  // Llamar al callback del padre para actualizar el config en RutinaTable
                  onConfigChange(itemId, cleanConfig, { scope: 'today' });
                }
                
                // Forzar actualización de UI si es necesario
                if (typeof setForceUpdate === 'function') {
                  setForceUpdate(Date.now());
                }
              } else {
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RutinaCard.jsx:838',message:'updateItemConfiguration failed',data:{section,itemId,result},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'rutinacard'})}).catch(()=>{});
                // #endregion
                console.warn(`[ChecklistSection] ⚠️ Configuración no se pudo guardar completamente para ${section}.${itemId}`);
                enqueueSnackbar('Advertencia: La configuración podría no haberse guardado completamente', { variant: 'warning' });
              }
            })
            .catch(error => {
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RutinaCard.jsx:843',message:'updateItemConfiguration error',data:{section,itemId,error:error.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'rutinacard'})}).catch(()=>{});
              // #endregion
              console.error(`[ChecklistSection] ❌ Error al guardar configuración:`, error);
              enqueueSnackbar('Error al guardar configuración', { variant: 'error' });
            });
        } else {
          console.error('[ChecklistSection] ❌ Función updateItemConfiguration no disponible');
          enqueueSnackbar('Error: Función de actualización no disponible', { variant: 'error' });
          throw new Error('Función updateItemConfiguration no disponible');
        }
      } catch (execError) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RutinaCard.jsx:851',message:'handleConfigChange execution error',data:{section,itemId,error:execError.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'rutinacard'})}).catch(()=>{});
        // #endregion
        console.error('[ChecklistSection] ❌ Error en ejecución al guardar configuración:', execError);
        enqueueSnackbar('Error inesperado al guardar', { variant: 'error' });
      }
    } catch (error) {
      console.error('[ChecklistSection] ❌ Error general:', error);
      enqueueSnackbar('Error inesperado', { variant: 'error' });
    }
  };

  // Función para manejar la configuración de un ítem específico
  // const handleExpandConfig = (itemId) => { // Eliminado
  //   if (selectedItemId === itemId) { // Eliminado
  //     // Si ya está seleccionado, lo deseleccionamos // Eliminado
  //     setSelectedItemId(null); // Eliminado
  //   } else { // Eliminado
  //     // Si es diferente, lo seleccionamos // Eliminado
  //     setSelectedItemId(itemId); // Eliminado
  //   } // Eliminado
  // }; // Eliminado

  // Función utilitaria para renderizar los iconos de hábitos de una sección
  // IMPORTANTE: En RutinaCard mostramos TODOS los hábitos (marcados y no marcados)
  // En la vista colapsada, NO aplicamos reglas de cadencia, solo mostramos todos los activos
  const renderHabitIcons = ({
    sectionIcons,
    config,
    localData,
    onItemClick,
    readOnly,
    size = 24,
    iconSize = 'inherit',
    mr = 0.2
  }) => {
    // En RutinaCard colapsado: mostrar TODOS los hábitos activos (marcados y no marcados)
    // NO usar getVisibleItemIds porque filtra por reglas de cadencia que ocultan completados
    // Simplemente iterar sobre todos los iconos y filtrar solo por activo === false
    return Object.keys(sectionIcons).map((itemId) => {
      const Icon = sectionIcons[itemId];
      if (!Icon) return null;
      
      const isCompleted = !!localData[itemId] || !!rutina?.[section]?.[itemId];
      const itemConfig = config[itemId] || {
        tipo: 'DIARIO',
        frecuencia: 1,
        activo: true,
        periodo: 'CADA_DIA'
      };
      
      // Solo filtrar por activo === false, mostrar todos los demás (completados y no completados)
      if (itemConfig.activo === false) return null;
      
      return (
        <HabitIconButton
          key={itemId}
          isCompleted={isCompleted}
          Icon={Icon}
          onClick={(e) => {
            e.stopPropagation();
            !readOnly && onItemClick(itemId, e);
          }}
          readOnly={readOnly}
          size={size}
          iconSize={iconSize}
          mr={mr}
        />
      );
    }).filter(Boolean);
  };

  return (
    <Card sx={{ mb: 1, bgcolor: 'background.paper', borderRadius: 1.5, boxShadow: 'none', border: 'none', overflow: 'visible', position: 'relative' }}>
      {/* Encabezado de la sección */}
      <Box 
        sx={{ 
          p: 0.5,
          minHeight: 32,
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: isExpanded ? theme => `1px solid ${theme.palette.divider}` : 'none',
          cursor: 'pointer'
        }}
        onClick={handleToggle}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'center' }}>
          {/* Label centrado de sección */}
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontWeight: 700,
              fontSize: '0.72rem',
              letterSpacing: 0.2,
              textTransform: 'uppercase',
              pointerEvents: 'none'
            }}
          >
            {capitalizeFirstLetter(title) || section}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          {!isExpanded && (
            <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 0.3, alignItems: 'center' }}>
              {renderHabitIcons({
                sectionIcons: sectionIcons,
                config,
                localData,
                onItemClick: handleItemClick,
                readOnly,
                size: 20,
                iconSize: 'inherit',
                mr: 0.2,
                gap: 0.3
              })}
            </Box>
          )}
          <IconButton 
            size="small" 
            sx={{ color: 'white', opacity: 0.7, width: 24, height: 24, ml: 0.5 }}
          >
            {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        </Box>
      </Box>
      
      {/* Contenido de la sección (colapsable) */}
      <Collapse in={isExpanded} unmountOnExit>
        <CardContent sx={{ p: 0.5, pt: 0, bgcolor: 'background.paper' }}>
          {/* Sección de configuración de hábitos personalizados */}
          {sectionHabits && sectionHabits.length > 0 && (
            <Box sx={{ mb: 1, pb: 1, borderBottom: `1px solid ${alpha('#fff', 0.1)}` }}>
              <List dense disablePadding sx={{ py: 0, my: 0 }}>
                {sectionHabits
                  .filter(h => h.activo !== false)
                  .sort((a, b) => (a.orden || 0) - (b.orden || 0))
                  .map((habit) => {
                    const habitId = habit.id || habit._id;
                    const habitConfig = config[habitId] || {
                      tipo: 'DIARIO',
                      frecuencia: 1,
                      activo: true,
                      periodo: 'CADA_DIA'
                    };
                    const Icon = getIconByName(habit.icon);
                    const isCompleted = isItemCompleted(habitId);
                    
                    return (
                      <HabitItemWithConfig
                        key={habitId}
                        habitId={habitId}
                        section={section}
                        Icon={Icon}
                        isCompleted={isCompleted}
                        readOnly={readOnly}
                        onItemClick={handleItemClick}
                        config={habitConfig}
                        onConfigChange={(newConfig, meta) => onConfigChange(habitId, newConfig, meta)}
                        isSetupOpen={openSetupItemId === habitId}
                        onSetupToggle={() => setOpenSetupItemId(openSetupItemId === habitId ? null : habitId)}
                        isCustomHabit={true}
                        habitLabel={habit.label}
                        habit={habit}
                        onEditHabit={() => {
                          setEditingHabitDialog({ open: true, habit: habit, section: section });
                        }}
                        onDeleteHabit={async () => {
                          if (window.confirm('¿Estás seguro de que deseas eliminar este hábito?')) {
                            try {
                              await deleteHabit(habitId, section);
                              await fetchHabits();
                            } catch (error) {
                              console.error('[RutinaCard] Error al eliminar hábito:', error);
                            }
                          }
                        }}
                      />
                    );
                  })}
              </List>
            </Box>
          )}
          {/* Lista de ítems principales */}
          <List dense disablePadding sx={{ py: 0, my: 0 }}>
            {renderItems()}
          </List>
        </CardContent>
      </Collapse>
      
      {/* Diálogo de edición de hábito */}
      <HabitFormDialog
        open={editingHabitDialog.open}
        onClose={() => setEditingHabitDialog({ open: false, habit: null, section: null })}
        editingHabit={editingHabitDialog.habit}
        editingSection={editingHabitDialog.section}
      />
    </Card>
  );
};

// Si necesitas la versión colapsada en otro lugar, usa renderHabitIcons con los props deseados
const CollapsedIcons = memo(({ 
  sectionIcons, 
  section, 
  config, 
  rutina, 
  onItemClick, 
  readOnly, 
  localData
}) => {
  // Implementación optimizada de renderCollapsedIcons
  // para evitar re-renderizados innecesarios
  if (!rutina) return null;
  
  const itemsParaMostrar = useMemo(() => {
    // En RutinaCard: mostrar TODOS los hábitos activos (marcados y no marcados)
    // NO usar getVisibleItemIds porque filtra por reglas de cadencia que ocultan completados
    // Simplemente iterar sobre todos los iconos y filtrar solo por activo === false
    return Object.keys(sectionIcons).filter(itemId => {
      const itemConfig = config?.[itemId];
      if (!itemConfig) {
        // Si no hay config, asumir activo por defecto
        return true;
      }
      // Solo filtrar por activo === false, mostrar todos los demás
      return itemConfig.activo !== false;
    });
  }, [sectionIcons, section, config, rutina, localData]);
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 1, width: '100%', alignItems: 'center', justifyContent: 'flex-start', px: 1 }}>
      {itemsParaMostrar.length === 0 ? (
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', ml: 1 }}>
          No hay elementos para mostrar
        </Typography>
      ) : (
        itemsParaMostrar.map(itemId => {
          const Icon = sectionIcons[itemId];
          const isCompleted = !!localData[itemId];
          
          // Usar una key compuesta para asegurar unicidad y forzar actualización cuando es necesario
          const keyId = `${section}-${itemId}-${isCompleted ? 'completed' : 'pending'}`;
          
          return (
            <HabitIconButton
              key={keyId}
              isCompleted={isCompleted}
              Icon={props => <Icon {...props} fontSize="inherit" sx={{ fontSize: '1.1rem' }} />}
              onClick={(e) => {
                e.stopPropagation();
                !readOnly && onItemClick(itemId, e);
              }}
              readOnly={readOnly}
              sx={{
                m: 0,
                width: 32,
                height: 32,
                color: isCompleted ? 'primary.main' : 'rgba(255,255,255,0.5)',
                bgcolor: isCompleted ? 'action.selected' : 'transparent',
                borderRadius: '50%',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                '&:hover': {
                  color: isCompleted ? 'primary.main' : 'white',
                  bgcolor: isCompleted ? 'action.selected' : 'rgba(255,255,255,0.1)'
                }
              }}
            />
          );
        })
      )}
    </Box>
  );
});

// Componente wrapper para hábitos con configuración
const HabitItemWithConfig = ({
  habitId,
  section,
  Icon,
  isCompleted,
  readOnly,
  onItemClick,
  config,
  onConfigChange,
  isSetupOpen,
  onSetupToggle,
  isCustomHabit,
  habitLabel,
  habit,
  onEditHabit,
  onDeleteHabit
}) => {
  const [configState, setConfigState] = useState(config);
  
  // Sincronizar configState cuando cambia config desde props
  useEffect(() => {
    if (JSON.stringify(config) !== JSON.stringify(configState)) {
      setConfigState(config);
    }
  }, [config]);
  
  return (
    <Box sx={{ mb: 0.5 }}>
      <ChecklistItem
        itemId={habitId}
        section={section}
        Icon={Icon}
        isCompleted={isCompleted}
        readOnly={readOnly}
        onItemClick={onItemClick}
        config={configState}
        onConfigChange={(newConfig) => {
          setConfigState(newConfig);
        }}
        isSetupOpen={isSetupOpen}
        onSetupToggle={onSetupToggle}
        isCustomHabit={isCustomHabit}
        habitLabel={habitLabel}
        onEditHabit={onEditHabit}
        onDeleteHabit={onDeleteHabit}
      />
      {isSetupOpen && (
        <Box sx={{ width: '100%', mt: 1 }}>
          <InlineItemConfigImproved
            config={configState}
            onConfigChange={async (newConfig, meta) => {
              // Actualizar estado local
              setConfigState(newConfig);
              // Guardar cuando se llama desde handleSave
              if (meta?.scope === 'today') {
                await onConfigChange(newConfig, meta);
              }
            }}
            itemId={habitId}
            sectionId={section}
          />
        </Box>
      )}
    </Box>
  );
};

// Memoizar RutinaCard con comparación optimizada
const MemoizedRutinaCard = memo(RutinaCard, (prevProps, nextProps) => {
  // Comparación optimizada para evitar re-renderizados innecesarios
  return (
    prevProps.section === nextProps.section &&
    prevProps.title === nextProps.title &&
    prevProps.readOnly === nextProps.readOnly &&
    JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data) &&
    JSON.stringify(prevProps.config) === JSON.stringify(nextProps.config)
  );
});

export default MemoizedRutinaCard;
