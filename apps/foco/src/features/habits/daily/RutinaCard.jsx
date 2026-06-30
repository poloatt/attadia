import React, { useState, useMemo, useEffect, useCallback, useRef, memo } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Menu,
  MenuItem
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import TuneIcon from '@mui/icons-material/Tune';
import ViewListIcon from '@mui/icons-material/ViewList';
import { iconConfig, getIconByName } from '@shared/utils/iconConfig';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import SettingsIcon from '@mui/icons-material/Settings';
import { useRutinas, useHabits } from '@shared/context';
import HabitFormDialog from '@shared/components/HabitFormDialog';

import { useSnackbar } from 'notistack';
// Importamos las utilidades de cadencia
import {
  obtenerHistorialCompletados,
  contarCompletadosEnPeriodo,
} from '@shared/utils/cadenciaUtils';
import { esRutinaHistorica, obtenerHistorialCompletaciones } from '@shared/utils/rutinaHistorialUtils';
import { getHabitDisplayLabel, getHabitId } from '@shared/utils/habitSectionIcons';
import { resolveRutinaItemConfig } from '@shared/utils/habitVisibilityEngine';
import { resolveHabitConfigApplyFrom } from '@shared/utils/rutinasPageUtils';
import useHabitsPreferences from '@foco/features/habits/carousel/hooks/useHabitsPreferences';
import { getFrecuenciaLabel } from '../templates/InlineItemConfigImproved';
import shouldShowItem from '@shared/utils/shouldShowItem';
import { isHabitCompletedForHistorial } from '@shared/utils/habitCompletionUtils';
// La visibilidad en esta vista extendida no oculta ítems; solo se ocultan completos en vista colapsada
import { startOfWeek, isSameWeek, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
// historial removido del flujo simplificado
import ChecklistItem, { HabitIconButton } from './ChecklistItem';
import RutinaDayGroupList from './RutinaDayGroupList';
import { groupSectionHabitsByDaySchedule } from '@shared/utils/rutinaDesktopUtils';
import { computeRutinaToggleValue } from '@shared/domain/habits';
import { getHabitItemValue } from '@shared/utils/habitCompletionUtils';
import { HabitCounterBadge } from '@shared/components/common/HabitCounterBadge';
import { getCurrentTimeOfDay } from '@shared/utils/timeOfDayUtils';
import HubSectionShell from '@shared/components/hub/HubSectionShell';
import { DynamicIcon } from '@shared/components/common/DynamicIcon';
import { getRutinaSectionIconKey } from '@shared/navigation/rutinaSectionIcons';
import {
  rutinaSectionShellSx,
  rutinaSectionHeaderSx,
  rutinaSectionHeaderTopRowSx,
  rutinaSectionTitleRowSx,
  rutinaSectionTitleSx,
  rutinaSectionHeaderIconSx,
  rutinaSectionBodySx,
  rutinaSectionSubdividerSx,
  rutinaSectionEmptySx,
  rutinaExpandIconSx,
  rutinaBackToListIconSx,
  rutinaCollapsedIconsRowSx,
  getRutinaHabitIconButtonSx,
} from '@shared/styles/rutinaPageStyles';

// Función para capitalizar solo la primera letra
const capitalizeFirstLetter = (string) => {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

// Eliminadas funciones ad-hoc de visibilidad: usamos visibilityUtils centralizado

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
  const { habitsPreferences, prefsReady } = useHabitsPreferences();
  const habitPrefs = prefsReady ? (habitsPreferences || {}) : {};
  
  // Obtener iconos de hábitos personalizados o usar defaults
  const sectionHabits = habits[section] || [];

  const resolvedSectionConfig = useMemo(() => {
    const itemIds = new Set([
      ...Object.keys(config || {}),
      ...sectionHabits.map((h) => h.id || h._id).filter(Boolean),
      ...Object.keys(habitPrefs?.[section] || {}),
    ]);
    const resolved = {};
    itemIds.forEach((itemId) => {
      resolved[itemId] = resolveRutinaItemConfig(section, itemId, rutina, habitPrefs);
    });
    return resolved;
  }, [section, rutina, habitPrefs, config, sectionHabits]);
  
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
      <Box sx={rutinaSectionEmptySx}>
        <Typography variant="subtitle1" color="text.primary">
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

  const [localData, setLocalData] = useState(data);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuItemId, setMenuItemId] = useState(null);
  const [forceUpdate, setForceUpdate] = useState(Date.now()); // Estado para forzar actualización
  
  // Estado para el diálogo de edición de hábito
  const [editingHabitDialog, setEditingHabitDialog] = useState({ open: false, habit: null, section: null });

  const handleEditHabit = useCallback((habit, habitSection) => {
    setEditingHabitDialog({ open: true, habit, section: habitSection });
  }, []);

  const handleDeleteHabit = useCallback(async (habitId, habitSection) => {
    try {
      await deleteHabit(habitId, habitSection);
      setFocusedItemId((prev) => (prev === habitId ? null : prev));
      await fetchHabits();
    } catch (error) {
      console.error('[RutinaCard] Error al eliminar hábito:', error);
    }
  }, [deleteHabit, fetchHabits]);
  
  // Estado para vista individual de un hábito (cuando se hace clic desde la vista colapsada)
  const [focusedItemId, setFocusedItemId] = useState(null);
  
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
  
  // Sincronizar localData cuando rutina cambia desde el contexto
  // Esto asegura que cambios desde otros componentes (HabitCarouselAhora, HabitCarouselLuego) se reflejen
  // Usar useRef para evitar bucles infinitos
  const localDataRef = useRef(localData);
  useEffect(() => {
    localDataRef.current = localData;
  }, [localData]);
  
  useEffect(() => {
    if (rutina && rutina[section]) {
      const sectionData = rutina[section];
      const currentLocalData = localDataRef.current;
      
      // Solo actualizar si hay diferencias significativas
      const hasChanges = Object.keys(sectionData).some(itemId => {
        const serverValue = sectionData[itemId];
        const localValue = currentLocalData[itemId];
        
        // Comparar valores (manejar objetos con comparación profunda)
        if (typeof serverValue === 'object' && serverValue !== null && !Array.isArray(serverValue)) {
          return JSON.stringify(serverValue) !== JSON.stringify(localValue);
        }
        return serverValue !== localValue;
      });
      
      if (hasChanges) {
        // Actualizar solo los items que han cambiado, preservando el estado local optimista
        setLocalData(prevData => {
          const updated = { ...prevData };
          Object.keys(sectionData).forEach(itemId => {
            // Solo actualizar si el valor del servidor es diferente y no hay un cambio pendiente local
            const serverValue = sectionData[itemId];
            const localValue = prevData[itemId];
            
            // Si el valor local es undefined o null, usar el del servidor
            if (localValue === undefined || localValue === null) {
              updated[itemId] = serverValue;
            } else {
              // Comparar valores
              if (typeof serverValue === 'object' && serverValue !== null && !Array.isArray(serverValue)) {
                if (JSON.stringify(serverValue) !== JSON.stringify(localValue)) {
                  updated[itemId] = serverValue;
                }
              } else if (serverValue !== localValue) {
                updated[itemId] = serverValue;
              }
            }
          });
          return updated;
        });
      }
    }
  }, [rutina, section]);

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
  
  // Escuchar cambios en el estado de expansión global (acordeón entre secciones)
  useEffect(() => {
    const handleSectionExpanded = (event) => {
      const { section: expandedSection, isExpanded: expandedState, rutinaId } = event.detail;

      if (rutinaId === rutina?._id && expandedSection !== section && expandedState === true) {
        setIsExpanded(false);
      }
    };

    window.addEventListener('sectionExpanded', handleSectionExpanded);

    return () => {
      window.removeEventListener('sectionExpanded', handleSectionExpanded);
    };
  }, [rutina?._id, section]);

  const notifySectionExpanded = useCallback(() => {
    if (typeof window === 'undefined' || !rutina?._id) return;
    window.dispatchEvent(new CustomEvent('sectionExpanded', {
      detail: { section, isExpanded: true, rutinaId: rutina._id },
    }));
  }, [section, rutina?._id]);

  // Función para cambiar el estado de expansión
  const handleToggle = () => {
    setIsExpanded((prev) => {
      const next = !prev;
      if (next) {
        queueMicrotask(notifySectionExpanded);
      } else {
        queueMicrotask(() => setFocusedItemId(null));
      }
      return next;
    });
  };
  
  // sectionIcons ya está definido arriba en useMemo
  
  // Función helper para determinar si un ítem está completado
  // Soporta dos formatos:
  // 1. Legacy (boolean): { itemId: true/false }
  // 2. Nuevo formato (objeto por horario): { itemId: { MAÑANA: true, NOCHE: false } }
  // Prioriza localData (estado local) sobre rutina (estado del servidor) para respuesta inmediata
  const isItemCompleted = useCallback((itemId, horario = null) => {
    // Priorizar localData para respuesta inmediata, luego rutina como fallback
    const itemValue = localData[itemId] !== undefined ? localData[itemId] : (rutina?.[section]?.[itemId]);
    
    // Si no hay valor, no está completado
    if (itemValue === undefined || itemValue === null) {
      return false;
    }
    
    // Detectar formato: objeto o boolean
    const isObjectFormat = typeof itemValue === 'object' && itemValue !== null && !Array.isArray(itemValue);
    const isBooleanFormat = typeof itemValue === 'boolean';
    
    if (isObjectFormat) {
      // Nuevo formato: objeto con horarios
      if (horario) {
        // Si se especifica un horario, verificar solo ese horario
        const normalizedHorario = String(horario).toUpperCase();
        return itemValue[normalizedHorario] === true;
      } else {
        // Si no se especifica horario, verificar si algún horario está completado
        return Object.values(itemValue).some(Boolean);
      }
    } else if (isBooleanFormat) {
      // Formato legacy: boolean simple
      return itemValue === true;
    }
    
    return false;
  }, [localData, rutina, section]); // Dependencias correctas para el useCallback

  // Renderizar los iconos en la vista colapsada - Función sincrónica para mejor rendimiento
  const renderCollapsedIcons = (sectionIcons, section, config, rutina, handleItemClick, readOnly, localData, forceUpdate) => {
    const currentTimeOfDay = getCurrentTimeOfDay();
    
    // Renderizar los iconos y aplicar filtros de visibilidad
    return Object.keys(sectionIcons)
      .filter((itemId) => {
        const cadenciaConfig = resolvedSectionConfig[itemId] || null;
        if (!cadenciaConfig || cadenciaConfig.activo === false) return false;

        const itemValueLocal = localData[itemId];
        const itemValueRutina = rutina?.[section]?.[itemId];
        const itemValue = itemValueLocal !== undefined ? itemValueLocal : itemValueRutina;
        if (isHabitCompletedForHistorial(itemValue)) return true;

        return shouldShowItem(section, itemId, rutina, { skipHorarioFilter: true });
      })
      .map((itemId) => {
      const Icon = sectionIcons[itemId];
      
      // Usar estado local para respuesta inmediata
      // Puede ser boolean (legacy) u objeto con horarios (nuevo formato)
      const itemValueLocal = localData[itemId];
      const itemValueRutina = rutina?.[section]?.[itemId];
      const itemValue = itemValueLocal !== undefined ? itemValueLocal : itemValueRutina;
      const isObjectFormat = typeof itemValue === 'object' && itemValue !== null && !Array.isArray(itemValue);
      const isCompletedIcon = isObjectFormat 
        ? Object.values(itemValue).some(Boolean) 
        : (itemValue === true);
      
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
        return (
          <Tooltip key={renderKey} title={getHabitDisplayLabel(section, itemId, habits)} arrow placement="top">
              <HabitCounterBadge
                config={cadenciaConfig}
                currentTimeOfDay={currentTimeOfDay}
                size="small"
                rutina={rutina}
                section={section}
                itemId={itemId}
              >
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                !readOnly && handleItemClick(itemId, e);
              }}
              sx={getRutinaHabitIconButtonSx({ isCompleted: true, size: 38 })}
            >
              {Icon && <Icon fontSize="small" />}
            </IconButton>
              </HabitCounterBadge>
          </Tooltip>
        );
      }
      
      // Para elementos no completados, aplicar lógica básica de cadencia
      const tipo = cadenciaConfig.tipo?.toUpperCase() || 'DIARIO';
      const frecuencia = parseInt(cadenciaConfig.frecuencia) || 1;
      
      // Los elementos diarios siempre se muestran si no están completados
      if (tipo === 'DIARIO') {
        return (
          <Tooltip key={renderKey} title={getHabitDisplayLabel(section, itemId, habits)} arrow placement="top">
              <HabitCounterBadge
                config={cadenciaConfig}
                currentTimeOfDay={currentTimeOfDay}
                size="small"
                rutina={rutina}
                section={section}
                itemId={itemId}
              >
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                !readOnly && handleItemClick(itemId, e);
              }}
              sx={getRutinaHabitIconButtonSx({ isCompleted: false, size: 38 })}
            >
              {Icon && <Icon fontSize="small" />}
            </IconButton>
              </HabitCounterBadge>
          </Tooltip>
        );
      }
      
      // Para elementos semanales/mensuales, usar lógica simplificada
      // TODO: Implementar lógica completa de cadencia de forma asíncrona
      return (
        <Tooltip key={renderKey} title={getHabitDisplayLabel(section, itemId, habits)} arrow placement="top">
            <HabitCounterBadge
              config={cadenciaConfig}
              currentTimeOfDay={currentTimeOfDay}
              size="small"
              rutina={rutina}
              section={section}
              itemId={itemId}
            >
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              !readOnly && handleItemClick(itemId, e);
            }}
            sx={getRutinaHabitIconButtonSx({ isCompleted: false, size: 38 })}
          >
            {Icon && <Icon fontSize="small" />}
          </IconButton>
            </HabitCounterBadge>
        </Tooltip>
      );
    }).filter(Boolean); // Filtrar elementos nulos
  };

  // Optimizar handleItemClick para actualización inmediata sin efectos innecesarios
  // Ahora acepta un parámetro opcional 'horario' para marcar horarios específicos
  const handleItemClick = useCallback((itemId, event, horario = null) => {
    // Si se recibe un evento, detener propagación
    if (event) {
      event.stopPropagation();
    }
    
    if (readOnly) return;
    
    // Verificar si onChange es una función antes de intentar llamarla
    if (typeof onChange !== 'function') {
      console.warn(`[RutinaCard] onChange no es una función en sección ${section}, itemId ${itemId}`);
      return;
    }
    
    const itemConfig = config?.[itemId] || {};
    const horariosConfig = Array.isArray(itemConfig.horarios) ? itemConfig.horarios : [];
    const hasMultipleHorarios = horariosConfig.length > 1;

    if (!isExpanded && hasMultipleHorarios && horario) {
      setIsExpanded(true);
      setFocusedItemId(itemId);
    }

    const previousValue = getHabitItemValue(rutina, section, itemId, localData);
    const rutinaForToggle = rutina
      ? { ...rutina, [section]: { ...(rutina[section] || {}), ...localData } }
      : rutina;

    const newValue = computeRutinaToggleValue({
      section,
      itemId,
      rutina: rutinaForToggle,
      habitsPreferences: habitPrefs,
      horario,
      currentTimeOfDay: getCurrentTimeOfDay(),
    });
    
    // Datos para actualización local de la UI
    const newData = {
      ...localData,
      [itemId]: newValue
    };
    
    // Actualizar el estado local inmediatamente para una respuesta visual instantánea
    setLocalData(newData);
    
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
    
    if (markItemComplete && typeof markItemComplete === 'function' && rutina && rutina._id) {
      // Crear el formato de datos sencillo esperado por el API
      const itemData = { [itemId]: newValue };
      
      
      // Llamar a la función del contexto y manejar resultado
      markItemComplete(rutina._id, section, itemData)
        .then((response) => {
          
          // Verificar que los datos se actualizaron correctamente
          if (response && response[section]) {
            const valorServidor = response[section][itemId];
            
            // Si el valor del servidor no coincide con nuestro estado local, actualizar
            // Usar comparación profunda para objetos
            const valoresDiferentes = typeof valorServidor === 'object' && valorServidor !== null && !Array.isArray(valorServidor)
              ? JSON.stringify(valorServidor) !== JSON.stringify(newValue)
              : valorServidor !== newValue;
            
            if (valoresDiferentes) {
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
          
          // Revertir el cambio local en caso de error
          setLocalData(prevData => ({
            ...prevData,
            [itemId]: previousValue
          }));
          
          // Actualizar también _ultimosCambios en caso de error
          if (rutina && rutina._ultimosCambios && rutina._ultimosCambios[section]) {
            rutina._ultimosCambios[section][itemId] = {
              valor: previousValue,
              timestamp: Date.now(),
              error: true
            };
          }
          
          // Notificar al componente padre del error
          if (typeof onChange === 'function') {
            onChange({
              ...localData,
              [itemId]: previousValue
            });
          }
        });
    } else if (typeof onChange === 'function') {
      onChange(newData);
    }
  }, [section, onChange, localData, readOnly, rutina, markItemComplete, config, isExpanded, setFocusedItemId, habitPrefs]);

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
          // Para la rutina actual, usar la función centralizada
          const historial = obtenerHistorialCompletados(itemId, section, rutina);
          completados = contarCompletadosEnPeriodo(fechaRutina, tipo, 'CADA_SEMANA', historial);
          
          // Agregar hoy si está completado y no está en el historial
          if (completadoHoy) {
            const hoyStr = new Date().toISOString().split('T')[0];
            const yaEstaEnHistorial = historial.some(fecha => {
              const fechaStr = fecha.toISOString().split('T')[0];
              return fechaStr === hoyStr;
            });
            
            if (!yaEstaEnHistorial) {
            completados++;
            }
          }
        }
        
        // Asegurar que siempre tengamos un número (no undefined)
        const conteoSeguro = isNaN(completados) ? 0 : completados;
        
        // Formato para mostrar
        return `${conteoSeguro}/${frecuencia} veces por semana`;
        
      } else if (tipo === 'MENSUAL') {
        // Para cadencia mensual, usar la función centralizada
        const fechaRutina = rutina?.fecha ? new Date(rutina.fecha) : new Date();
        const historial = obtenerHistorialCompletados(itemId, section, rutina);
        completados = contarCompletadosEnPeriodo(fechaRutina, tipo, 'CADA_MES', historial);
        
        // Agregar hoy si está completado y no está en el historial
        if (completadoHoy) {
          const hoyStr = new Date().toISOString().split('T')[0];
          const yaEstaEnHistorial = historial.some(fecha => {
            const fechaStr = fecha.toISOString().split('T')[0];
            return fechaStr === hoyStr;
          });
          
          if (!yaEstaEnHistorial) {
            completados++;
          }
        }
        
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
      if (!rutina) {
        return {
          texto: '',
          completados: 0,
          requeridos: 1,
          completa: false,
          tipo: 'DIARIO',
          porcentaje: 0
        };
      }

      const itemConfig = resolveRutinaItemConfig(section, itemId, rutina, habitPrefs);
      if (!itemConfig || itemConfig.activo === false) {
        return {
          texto: '',
          completados: 0,
          requeridos: 1,
          completa: false,
          tipo: 'DIARIO',
          porcentaje: 0
        };
      }

      const tipo = itemConfig?.tipo?.toUpperCase() || 'DIARIO';
      const frecuencia = Number(itemConfig?.frecuencia || 1);
      
      // Verificar si el ítem está completado (usando localData o la rutina directamente)
      const completadoHoy = isItemCompleted(itemId);
      
      // Contar completaciones según el tipo de cadencia
      let completados = 0;
      
      if (tipo === 'DIARIO') {
        completados = completadoHoy ? 1 : 0;
      } else if (tipo === 'SEMANAL') {
        // Para semanal, usar la función centralizada
        const hoy = new Date();
        const historial = obtenerHistorialCompletados(itemId, section, rutina);
        completados = contarCompletadosEnPeriodo(hoy, tipo, 'CADA_SEMANA', historial);
        
        // Agregar hoy si está completado y no está en el historial
        if (completadoHoy) {
          const hoyStr = hoy.toISOString().split('T')[0];
          const yaEstaEnHistorial = historial.some(fecha => {
            const fechaStr = fecha.toISOString().split('T')[0];
            return fechaStr === hoyStr;
        });
        
          if (!yaEstaEnHistorial) {
            completados++;
          }
        }
      } else if (tipo === 'MENSUAL') {
        // Para mensual, usar la función centralizada
        const hoy = new Date();
        const historial = obtenerHistorialCompletados(itemId, section, rutina);
        completados = contarCompletadosEnPeriodo(hoy, tipo, 'CADA_MES', historial);
        
        // Agregar hoy si está completado y no está en el historial
        if (completadoHoy) {
          const hoyStr = hoy.toISOString().split('T')[0];
          const yaEstaEnHistorial = historial.some(fecha => {
            const fechaStr = fecha.toISOString().split('T')[0];
            return fechaStr === hoyStr;
          });
          
          if (!yaEstaEnHistorial) {
          completados++;
          }
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
    const configKeys = Object.keys(resolvedSectionConfig).join(',');
    
    // Incluir forceUpdate para garantizar que se recalcule cuando cambia la configuración
    const refreshTrigger = forceUpdate;

    return Object.keys(sectionIcons)
      .filter(itemId => {
        // Lógica sincrónica simplificada para el filtrado inicial
        const cadenciaConfig = resolvedSectionConfig[itemId] || null;
        
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
  }, [section, resolvedSectionConfig, rutina, forceUpdate, sectionIcons]);

  // Verificar que tenemos iconos para mostrar
  if (Object.keys(sectionIcons).length === 0) {
    console.warn(`[RutinaCard] No hay iconos configurados para la sección: ${section}`);
    return (
      <Box sx={rutinaSectionEmptySx}>
        <Typography variant="subtitle1" color="text.primary">
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
        .map(h => getHabitId(h))
        .filter(Boolean)
    );
  }, [sectionHabits]);

  const habitGroups = useMemo(() => {
    const grouped = groupSectionHabitsByDaySchedule({
      section,
      rutina,
      habits,
      habitsPreferences: habitPrefs,
      localData,
    });

    const withoutCustom = (items) => items.filter((entry) => !customHabitIds.has(entry.itemId));

    if (!focusedItemId) {
      return {
        today: withoutCustom(grouped.today),
        notToday: withoutCustom(grouped.notToday),
      };
    }

    const matchFocused = (items) => items.filter((entry) => entry.itemId === focusedItemId);
    return {
      today: matchFocused(grouped.today),
      notToday: matchFocused(grouped.notToday),
    };
  }, [section, rutina, habits, habitPrefs, localData, focusedItemId, customHabitIds]);

  // Manejar cambios en la configuración de un ítem
  const handleConfigChange = (itemId, newConfig) => {
    try {
      // Verificar que tenemos datos de rutina
      // No necesitamos acceder a contextData, ya tenemos la variable rutina disponible
      // const rutina = contextData?.rutina || {};
      
      // Obtener la configuración original para este ítem
      const originalConfig = resolvedSectionConfig[itemId] || {
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
      
      
      
      // Intentar actualizar en el contexto, con manejo de errores
      // IMPORTANTE: Pasar isGlobal: true para guardar en preferencias globales del usuario
      try {
        if (updateItemConfiguration && typeof updateItemConfiguration === 'function') {
          updateItemConfiguration(section, itemId, cleanConfig, {
            isGlobal: true,
            rutinaId: rutina?._id,
            applyFromDate: resolveHabitConfigApplyFrom(rutina?.fecha),
          })
            .then((result) => {
              if (result && result.updated) {
                
                // IMPORTANTE: Actualizar también el prop config localmente para reflejar cambios inmediatamente
                // Esto asegura que los hábitos personalizados muestren los cambios sin necesidad de recargar
                if (onConfigChange && typeof onConfigChange === 'function') {
                  onConfigChange(itemId, cleanConfig, {
                    scope: 'forward',
                    applyFrom: resolveHabitConfigApplyFrom(rutina?.fecha),
                  });
                }
                
                // Forzar actualización de UI si es necesario
                if (typeof setForceUpdate === 'function') {
                  setForceUpdate(Date.now());
                }
              } else {
                console.warn(`[RutinaCard] ⚠️ Configuración no se pudo guardar completamente para ${section}.${itemId}`);
                enqueueSnackbar('Advertencia: La configuración podría no haberse guardado completamente', { variant: 'warning' });
              }
            })
            .catch(error => {
              console.error(`[RutinaCard] ❌ Error al guardar configuración:`, error);
              enqueueSnackbar('Error al guardar configuración', { variant: 'error' });
            });
        } else {
          console.error('[RutinaCard] ❌ Función updateItemConfiguration no disponible');
          enqueueSnackbar('Error: Función de actualización no disponible', { variant: 'error' });
          throw new Error('Función updateItemConfiguration no disponible');
        }
      } catch (execError) {
        // #endregion
        console.error('[RutinaCard] ❌ Error en ejecución al guardar configuración:', execError);
        enqueueSnackbar('Error inesperado al guardar', { variant: 'error' });
      }
    } catch (error) {
      console.error('[RutinaCard] ❌ Error general:', error);
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
    const currentTimeOfDay = getCurrentTimeOfDay();
    
    // En RutinaCard colapsado: mostrar TODOS los hábitos activos (marcados y no marcados)
    // NO usar getVisibleItemIds porque filtra por reglas de cadencia que ocultan completados
    // Simplemente iterar sobre todos los iconos y filtrar solo por activo === false
    return Object.keys(sectionIcons).map((itemId) => {
      const Icon = sectionIcons[itemId];
      if (!Icon) return null;
      
      // Usar isItemCompleted para calcular correctamente el estado, especialmente para objetos con horarios
      const isCompleted = isItemCompleted(itemId);
      const itemConfig = config[itemId] || {
        tipo: 'DIARIO',
        frecuencia: 1,
        activo: true,
        periodo: 'CADA_DIA'
      };
      
      // Solo filtrar por activo === false, mostrar todos los demás (completados y no completados)
      if (itemConfig.activo === false) return null;
      
      // Detectar si tiene múltiples horarios configurados
      const horariosConfig = Array.isArray(itemConfig.horarios) ? itemConfig.horarios : [];
      const hasMultipleHorarios = horariosConfig.length > 1;
      const isDiario = (itemConfig.tipo || 'DIARIO').toUpperCase() === 'DIARIO';
      
      return (
        <HabitIconButton
          key={itemId}
          isCompleted={isCompleted}
          Icon={Icon}
          onClick={(e) => {
            e.stopPropagation();
            if (!readOnly) {
              // Si es diario con múltiples horarios, solo expandir (no marcar)
              if (hasMultipleHorarios && isDiario) {
                // Solo expandir y enfocar, no marcar
                setIsExpanded(true);
                setFocusedItemId(itemId);
              } else {
                // Para otros casos, marcar normalmente
                if (hasMultipleHorarios) {
                  onItemClick(itemId, e, currentTimeOfDay);
                } else {
                  onItemClick(itemId, e);
                }
              }
            }
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
    <>
    <HubSectionShell
      shellSx={rutinaSectionShellSx}
      hideBody={!isExpanded}
      headerContent={(
        <Box
          sx={rutinaSectionHeaderSx(isExpanded)}
          onClick={handleToggle}
        >
          <Box sx={rutinaSectionHeaderTopRowSx}>
            {focusedItemId && isExpanded && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setFocusedItemId(null);
                }}
                sx={rutinaBackToListIconSx}
                title="Ver todos los hábitos"
              >
                <ViewListIcon fontSize="small" />
              </IconButton>
            )}
            <Box sx={rutinaSectionTitleRowSx}>
              <DynamicIcon
                iconKey={getRutinaSectionIconKey(section)}
                size="small"
                sx={rutinaSectionHeaderIconSx}
              />
              <Typography variant="body2" sx={rutinaSectionTitleSx}>
                {capitalizeFirstLetter(title) || section}
              </Typography>
            </Box>
            <IconButton
              size="small"
              sx={{ ...rutinaExpandIconSx, ml: 'auto', flexShrink: 0 }}
            >
              {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
          </Box>
          {!isExpanded && (
            <Box sx={rutinaCollapsedIconsRowSx}>
              {renderHabitIcons({
                sectionIcons: sectionIcons,
                config: resolvedSectionConfig,
                localData,
                onItemClick: handleItemClick,
                readOnly,
                size: 20,
                iconSize: 'inherit',
                mr: 0,
                gap: 0.25,
              })}
            </Box>
          )}
        </Box>
      )}
      bodySx={rutinaSectionBodySx}
    >
      <Collapse in={isExpanded} unmountOnExit>
        <Box>
          {sectionHabits && sectionHabits.length > 0 && (
            <Box sx={rutinaSectionSubdividerSx}>
              <List dense disablePadding sx={{ py: 0, my: 0 }}>
                {sectionHabits
                  .filter(h => {
                    // Si hay un item enfocado, mostrar solo ese hábito personalizado
                    if (focusedItemId) {
                      const habitId = h.id || h._id;
                      return habitId === focusedItemId;
                    }
                    // Si no hay item enfocado, mostrar todos los activos
                    return h.activo !== false;
                  })
                  .sort((a, b) => (a.orden || 0) - (b.orden || 0))
                  .map((habit) => {
                    const habitId = getHabitId(habit);
                    const habitConfig = resolvedSectionConfig[habitId] || {
                      tipo: 'DIARIO',
                      frecuencia: 1,
                      activo: true,
                      periodo: 'CADA_DIA'
                    };
                    const Icon = getIconByName(habit.icon);
                    const isCompleted = isItemCompleted(habitId);
                    
                    return (
                      <HabitChecklistRow
                        key={habitId}
                        habitId={habitId}
                        section={section}
                        Icon={Icon}
                        isCompleted={isCompleted}
                        readOnly={readOnly}
                        onItemClick={handleItemClick}
                        config={habitConfig}
                        isCustomHabit
                        habitLabel={habit.label}
                        localData={localData}
                        onEditHabit={() => handleEditHabit(habit, section)}
                        onDeleteHabit={() => handleDeleteHabit(habitId, section)}
                      />
                    );
                  })}
              </List>
            </Box>
          )}
          {/* Lista de ítems principales */}
          <List dense disablePadding sx={{ py: 0, my: 0 }}>
            <RutinaDayGroupList
              today={habitGroups.today}
              notToday={habitGroups.notToday}
              section={section}
              rutina={rutina}
              readOnly={readOnly}
              onItemClick={handleItemClick}
              onEditHabit={handleEditHabit}
              onDeleteHabit={handleDeleteHabit}
              localData={localData}
            />
          </List>
        </Box>
      </Collapse>
    </HubSectionShell>

    <HabitFormDialog
      open={editingHabitDialog.open}
      onClose={() => setEditingHabitDialog({ open: false, habit: null, section: null })}
      editingHabit={editingHabitDialog.habit}
      editingSection={editingHabitDialog.section}
    />
  </>
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
  
  // Función helper para verificar si un item está completado (similar a isItemCompleted)
  const checkItemCompleted = (itemId) => {
    const itemValue = localData?.[itemId] !== undefined ? localData[itemId] : (rutina?.[section]?.[itemId]);
    
    if (itemValue === undefined || itemValue === null) {
      return false;
    }
    
    const isObjectFormat = typeof itemValue === 'object' && itemValue !== null && !Array.isArray(itemValue);
    const isBooleanFormat = typeof itemValue === 'boolean';
    
    if (isObjectFormat) {
      // Para objetos, verificar si algún horario está completado
      return Object.values(itemValue).some(Boolean);
    } else if (isBooleanFormat) {
      return itemValue === true;
    }
    
    return false;
  };
  
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
    <Box sx={{ ...rutinaCollapsedIconsRowSx, gap: 1, width: '100%', justifyContent: 'flex-start', px: 1 }}>
      {itemsParaMostrar.length === 0 ? (
        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
          No hay elementos para mostrar
        </Typography>
      ) : (
        itemsParaMostrar.map(itemId => {
          const Icon = sectionIcons[itemId];
          const isCompleted = checkItemCompleted(itemId);
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
              size={32}
              mr={0}
            />
          );
        })
      )}
    </Box>
  );
});

// Wrapper mínimo para filas de hábito con id de scroll
const HabitChecklistRow = ({
  habitId,
  section,
  Icon,
  isCompleted,
  readOnly,
  onItemClick,
  config,
  isCustomHabit,
  habitLabel,
  onEditHabit,
  onDeleteHabit,
  localData = null,
}) => (
  <Box sx={{ mb: 0.5 }} id={`habit-row-${habitId}`}>
    <ChecklistItem
      itemId={habitId}
      section={section}
      Icon={Icon}
      isCompleted={isCompleted}
      readOnly={readOnly}
      onItemClick={onItemClick}
      config={config}
      isCustomHabit={isCustomHabit}
      habitLabel={habitLabel}
      localData={localData}
      onEditHabit={onEditHabit}
      onDeleteHabit={onDeleteHabit}
    />
  </Box>
);

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
