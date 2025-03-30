import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
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
import { obtenerHistorialCompletacionesSemana, esRutinaHistorica } from './utils/historialUtils';

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
const debesMostrarItemEnVistaPrincipal = (itemId, section, config, rutina) => {
  // Si no hay configuración, mostrar por defecto
  if (!config || !itemId || !config[itemId]) {
    return true;
  }

  // Si estamos en modo edición o no existe rutina, mostrar siempre
  if (!rutina || rutina._id === 'new') {
    return true;
  }
  
  // Comprobar explícitamente si está completado hoy (caso prioritario)
  const completadoHoy = rutina[section]?.[itemId] === true;
  
  // Si está completado hoy, siempre mostrar (mejora para UX)
  if (completadoHoy) {
    console.log(`[ChecklistSection] ${section}.${itemId}: Completado HOY, siempre visible`);
    return true;
  }
  
  // Obtener la configuración específica
  const itemConfig = config[itemId];
  
  // Si la configuración está inactiva, no mostrar
  if (itemConfig && itemConfig.activo === false) {
    console.log(`[ChecklistSection] ${section}.${itemId}: Inactivo, no se muestra`);
    return false;
  }
  
  const tipo = itemConfig?.tipo?.toUpperCase() || 'DIARIO';
  
  // Los ítems diarios siempre se muestran si no están completados hoy
  if (tipo === 'DIARIO') {
    console.log(`[ChecklistSection] ${section}.${itemId}: Ítem DIARIO, siempre visible`);
    return true;
  }
  
  // Para otros tipos (SEMANAL, MENSUAL), usar la función especializada
  try {
    // Intentar leer del caché primero (optimización)
    const claveCache = `${section}_${itemId}_${rutina._id}_${Date.now()}`;
    const cacheSsib = window.__cacheShouldShowItemInMainView || {};
    window.__cacheShouldShowItemInMainView = cacheSsib;
    
    // Reducir tiempo de caché a 1 segundo para respuesta más rápida y precisa
    if (cacheSsib[claveCache] && (Date.now() - cacheSsib[claveCache].timestamp < 1000)) {
      const resultado = cacheSsib[claveCache].visible;
      console.log(`[ChecklistSection] ${section}.${itemId}: Usando caché local: ${resultado ? 'Mostrar' : 'Ocultar'}`);
      return resultado;
    }
    
    // IMPORTANTE: Para rutinas históricas (pasadas), mostrar todos los ítems
    const fechaRutina = typeof rutina.fecha === 'string' ? new Date(rutina.fecha) : rutina.fecha;
    const esHistorica = !isToday(fechaRutina);
    
    if (esHistorica) {
      console.log(`[ChecklistSection] ${section}.${itemId}: Rutina histórica (${fechaRutina.toISOString().split('T')[0]}), mostrar todo`);
      return true;
    }
    
    // SIMPLIFICACIÓN: Para rutinas de hoy, verificar si ya se cumplió el objetivo semanal/mensual
    // pero sin usar caché para asegurar datos siempre frescos
    console.log(`[ChecklistSection] ${section}.${itemId}: Verificando requisitos de cadencia ${tipo}...`);
    
    // Programar actualización asíncrona para el futuro
    setTimeout(() => {
      shouldShowItemInMainView(section, itemId, rutina)
        .then(shouldShow => {
          // Guardar resultado en caché local con timestamp reciente
          cacheSsib[claveCache] = {
            visible: shouldShow,
            timestamp: Date.now()
          };
          console.log(`[ChecklistSection] ${section}.${itemId}: Actualización async: ${shouldShow ? 'Mostrar' : 'Ocultar'}`);
          
          // Forzar actualización de la UI si es necesario mediante un evento personalizado
          if (window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('itemVisibilityChanged', {
              detail: { section, itemId, shouldShow }
            }));
          }
        })
        .catch(err => {
          console.error(`[ChecklistSection] Error en determinación asíncrona:`, err);
        });
    }, 0);
    
    // Para asegurar que siempre se muestran los ítems que deberían mostrarse
    // por defecto mostraremos todos y luego la lógica asíncrona ocultará los que no
    return true;
  } catch (error) {
    console.error(`[ChecklistSection] Error determinando visibilidad para ${section}.${itemId}:`, error);
    // En caso de error, mostrar el ítem por defecto
    return true;
  }
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
  // Contexto de rutinas
  const { rutina, markItemComplete, updateItemConfig, updateUserHabitPreference } = useRutinas();
  
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
  const [configOpen, setConfigOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuItemId, setMenuItemId] = useState(null);
  const [forceUpdate, setForceUpdate] = useState(Date.now()); // Estado para forzar actualización
  
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
      
      // Determinar si debe mostrarse usando lógica optimizada
      const shouldShowIcon = debesMostrarItemEnVistaPrincipal(itemId, section, config, rutina);
      
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
              e.stopPropagation();
              !readOnly && handleItemClick(itemId);
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

  const handleItemClick = (itemId) => {
    if (readOnly) return;
    
    // Verificar si onChange es una función antes de intentar llamarla
    if (typeof onChange !== 'function') {
      console.warn(`[ChecklistSection] onChange no es una función en sección ${section}, itemId ${itemId}`);
      return;
    }
    
    // Verificar si data existe y crear un nuevo objeto con el estado actualizado
    const isCompleted = isItemCompleted(itemId); // Usar la función helper
    const newValue = !isCompleted;
    
    // DEBUGGING: Mostrar el estado antes del cambio
    console.log(`[ChecklistSection] 🔄 Cambiando ${section}.${itemId} de ${isCompleted} a ${newValue}`);
    
    // Datos para actualización local de la UI
    const newData = {
      ...localData,
      [itemId]: newValue
    };
    
    // MEJORA: Actualizar el estado local inmediatamente para una respuesta visual instantánea
    console.log(`[ChecklistSection] 🔄 Actualizando estado local inmediatamente`);
    setLocalData(newData);
    
    // MEJORA: Forzar actualización del componente
    setForceUpdate(Date.now());
    
    // Notificar al componente padre del cambio en la UI inmediatamente
    onChange(newData);
    
    // MEJORA: Registrar los últimos cambios en la rutina para mejorar respuesta inmediata
    // Esto es útil para cuando marcamos/desmarcamos varias veces seguidas
    if (rutina) {
      // Si no existe la propiedad _ultimosCambios, crearla
      if (!rutina._ultimosCambios) {
        rutina._ultimosCambios = {};
      }
      
      // Si no existe la propiedad para esta sección, crearla
      if (!rutina._ultimosCambios[section]) {
        rutina._ultimosCambios[section] = {};
      }
      
      // Registrar el cambio con timestamp para saber cuándo ocurrió
      rutina._ultimosCambios[section][itemId] = {
        valor: newValue,
        timestamp: Date.now()
      };
      
      console.log(`[ChecklistSection] ⏱️ Registrando último cambio para ${section}.${itemId}: ${newValue}`);
    }
    
    // Usar setTimeout para asegurar que la UI se actualice antes de la llamada al servidor
    setTimeout(() => {
      // Si tenemos acceso al contexto de rutinas, utilizar markItemComplete
      if (markItemComplete && typeof markItemComplete === 'function' && rutina && rutina._id) {
        // Crear el formato de datos sencillo esperado por el API
        const itemData = { [itemId]: newValue };
        
        console.log(`[ChecklistSection] 🔄 Enviando actualización al servidor para ${section}.${itemId} -> ${newValue ? 'Completado' : 'No completado'}`);
        
        // Llamar a la función del contexto y manejar resultado
        markItemComplete(rutina._id, section, itemData)
          .then((response) => {
            console.log(`[ChecklistSection] ✅ Actualización de ${section}.${itemId} completada con éxito`);
            
            // MEJORA: Verificar que los datos se actualizaron correctamente
            if (response && response[section]) {
              const valorServidor = response[section][itemId];
              console.log(`[ChecklistSection] 🔄 Valor retornado del servidor: ${valorServidor}`);
              
              // Si el valor del servidor no coincide con nuestro estado local, actualizar
              if (valorServidor !== newValue) {
                console.warn(`[ChecklistSection] ⚠️ Inconsistencia: Local=${newValue}, Servidor=${valorServidor}`);
                // Actualizar estado local con valor del servidor
                setLocalData(prevData => ({
                  ...prevData,
                  [itemId]: valorServidor
                }));
                
                // MEJORA: Actualizar también _ultimosCambios para mantener coherencia
                if (rutina && rutina._ultimosCambios && rutina._ultimosCambios[section]) {
                  rutina._ultimosCambios[section][itemId] = {
                    valor: valorServidor,
                    timestamp: Date.now(),
                    fuenteServidor: true
                  };
                }
                
                // Forzar re-renderizado
                setForceUpdate(Date.now());
              }
            }
          })
          .catch(err => {
            console.error(`[ChecklistSection] ❌ Error actualizando ${section}.${itemId}:`, err);
            
            // Revertir el cambio local en caso de error
            setLocalData(prevData => ({
              ...prevData,
              [itemId]: isCompleted
            }));
            
            // MEJORA: Actualizar también _ultimosCambios en caso de error
            if (rutina && rutina._ultimosCambios && rutina._ultimosCambios[section]) {
              rutina._ultimosCambios[section][itemId] = {
                valor: isCompleted, // Valor original
                timestamp: Date.now(),
                error: true
              };
            }
            
            // Forzar re-renderizado en caso de error
            setForceUpdate(Date.now());
            
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
        
        console.warn(`[ChecklistSection] ⚠️ No se pudo usar markItemComplete: ${reason}`);
      }
    }, 0);
  };

  // Función para obtener el estado de cadencia de un ítem
  const getItemCadenciaStatus = async (itemId, section, rutina, config) => {
    // Crear estado local para almacenar el resultado
    // Como no podemos usar hooks dentro de funciones normales, necesitamos
    // un approach diferente para manejar estados asíncronos
    let result = "Cargando...";

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
      
      // Para otros tipos de cadencia, mostrar progreso con conteo
      
      // Paso 1: Verificar si el ítem está completado hoy
      const completadoHoy = isItemCompleted(itemId);
      
      // Paso 2: Contar completaciones según el tipo de cadencia
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
        
        // Debugging específico para fechas 27 y 28 de marzo
        const esFechaRelevante = fechaRutina.getDate() === 27 || fechaRutina.getDate() === 28;
        const esMesRelevante = fechaRutina.getMonth() === 2; // Marzo es mes 2 (0-indexado)
        
        if (esFechaRelevante && esMesRelevante && itemId === 'gym') {
          console.log(`[DEBUG_GYM] ⭐ Analizando gym para fecha ${fechaRutina.toISOString().split('T')[0]}`);
          console.log(`[DEBUG_GYM] ¿Es histórica? ${esHistorica ? 'SÍ' : 'NO'}`);
        }
        
        // Para rutinas históricas, usar el nuevo servicio especializado
        if (esHistorica) {
          try {
            // Obtener historial acumulado hasta la fecha de la rutina
            completados = await obtenerHistorialCompletacionesSemana(section, itemId, fechaRutina);
            
            if (esFechaRelevante && esMesRelevante && itemId === 'gym') {
              console.log(`[DEBUG_GYM] 📊 Conteo desde backend para ${fechaRutina.toISOString().split('T')[0]}: ${completados}/${frecuencia}`);
            }
          } catch (error) {
            console.error(`Error obteniendo historial para ${section}.${itemId}:`, error);
            
            // En caso de error, usar método fallback
            const historial = obtenerHistorialCompletados(itemId, section, rutina);
            completados = historial.filter(fecha => 
              isSameWeek(fecha, fechaRutina, { locale: es })
            ).length;
            
            if (esFechaRelevante && esMesRelevante && itemId === 'gym') {
              console.log(`[DEBUG_GYM] ⚠️ Fallback: Conteo local para ${fechaRutina.toISOString().split('T')[0]}: ${completados}/${frecuencia}`);
            }
          }
        } else {
          // Para la rutina actual, usar el método existente
          const historial = obtenerHistorialCompletados(itemId, section, rutina);
          completados = historial.filter(fecha => 
            isSameWeek(fecha, fechaRutina, { locale: es })
          ).length;
        }
        
        // Si está completado hoy pero no aparece en el historial, sumar 1
        if (completadoHoy && rutina[section]?.[itemId]) {
          // Verificar si la fecha de la rutina es hoy
          const fechaRutinaStr = fechaRutina.toISOString().split('T')[0];
          const fechaHoyStr = new Date().toISOString().split('T')[0];
          const esRutinaDeHoy = fechaRutinaStr === fechaHoyStr;
          
          // Solo sumar si es la rutina de hoy y no está contada ya
          if (esRutinaDeHoy) {
            const yaContabilizado = completados > 0;
            if (!yaContabilizado) {
              completados++;
              
              if (esFechaRelevante && esMesRelevante && itemId === 'gym') {
                console.log(`[DEBUG_GYM] 🔄 Añadiendo +1 al contador porque está completado hoy pero no contabilizado`);
              }
            }
          }
        }
        
        // Asegurar que siempre tengamos un número (no undefined)
        const conteoSeguro = isNaN(completados) ? 0 : completados;
        
        if (esFechaRelevante && esMesRelevante && itemId === 'gym') {
          console.log(`[DEBUG_GYM] 📊 Conteo final para ${fechaRutina.toISOString().split('T')[0]}: ${conteoSeguro}/${frecuencia}`);
        }
        
        // Formato para mostrar
        return `${conteoSeguro}/${frecuencia} veces por semana`;
        
      } else if (tipo === 'MENSUAL') {
        // Implementación similar para cadencia mensual
        // [código para mensual]
        
        return `${completados}/${frecuencia} veces por mes`;
      }
      
      // Valor por defecto si no coincide con ningún tipo conocido
      return getFrecuenciaLabel(cadenciaConfig);
    } catch (error) {
      console.error(`Error en getItemCadenciaStatus para ${section}.${itemId}:`, error);
      return "Error: " + error.message;
    }
  };

  // Función para obtener el estado actual de la cadencia
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
      
      // Obtener el número de completaciones
      let completados = 0;
      
      // Verificar si el ítem está completado hoy
      const completadoHoy = isItemCompleted(itemId);
      
      // Contar completaciones según el tipo de cadencia
      if (tipo === 'DIARIO') {
        completados = completadoHoy ? 1 : 0;
      } else if (tipo === 'SEMANAL') {
        // Para semanal, contar las completaciones en la semana
        const hoy = new Date();
        const inicioSemana = startOfWeek(hoy, { locale: es });
        const historial = obtenerHistorialCompletados(itemId, section, rutina);
        
        completados = historial.filter(fecha => 
          isSameWeek(fecha, hoy, { locale: es })
        ).length;
        
        // Asegurar que si está completado hoy, se cuente al menos 1
        if (completadoHoy && completados === 0) {
          completados = 1;
        }
      }
      
      // Generar texto descriptivo
      let texto = '';
      if (tipo === 'DIARIO') {
        texto = completados >= frecuencia 
          ? `Completado hoy (${completados}/${frecuencia})`
          : `${completados} de ${frecuencia} hoy`;
      } else if (tipo === 'SEMANAL') {
        if (completados === 0) {
          texto = `0/${frecuencia} veces esta semana`;
        } else if (completados === 1) {
          texto = `1/${frecuencia} veces esta semana`;
        } else if (completados < frecuencia) {
          texto = `${completados}/${frecuencia} veces esta semana`;
        } else {
          texto = `¡Completo! ${completados}/${frecuencia} esta semana`;
        }
      }
      
      // Calcular porcentaje
      const porcentaje = frecuencia > 0 ? Math.min(100, Math.round((completados / frecuencia) * 100)) : 0;
      
      return {
        texto,
        completados,
        requeridos: frecuencia,
        completa: completados >= frecuencia,
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

  // Filtrar ítems según configuración de cadencia
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
  
  // Renderizar los iconos colapsados con los parámetros necesarios
  const renderedCollapsedIcons = useMemo(() => {
    return renderCollapsedIcons(
      sectionIcons, 
      section, 
      config, 
      rutina, 
      handleItemClick, 
      readOnly, 
      localData, 
      forceUpdate
    );
  }, [sectionIcons, section, config, rutina, handleItemClick, readOnly, localData, forceUpdate]);

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
      
      // Usar estado local para manejar la cadencia asíncrona
      const [cadenciaStatus, setCadenciaStatus] = useState("Cargando...");
      
      // Efecto para cargar la información de cadencia
      useEffect(() => {
        let isMounted = true;
        
        const cargarCadencia = async () => {
          try {
            const estado = await getItemCadenciaStatus(itemId, section, rutina, config);
            if (isMounted) {
              setCadenciaStatus(estado);
            }
          } catch (error) {
            console.error(`Error cargando cadencia para ${section}.${itemId}:`, error);
            if (isMounted) {
              setCadenciaStatus("Error");
            }
          }
        };
        
        cargarCadencia();
        
        return () => {
          isMounted = false;
        };
      }, [itemId, section, rutina._id, isCompleted]);
      
      // Obtener el icono correcto basado en el ID
      const Icon = sectionIcons[itemId];
      
      return (
        <ListItem 
          key={`${section}-${itemId}-${index}`}
          disablePadding
          sx={{ 
            mb: 0.5,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            bgcolor: 'transparent'
          }}
        >
          <Box sx={{ 
            width: '100%', 
            display: 'flex',
            alignItems: 'center',
            py: 0.5
          }}>
            {!readOnly && (
              <IconButton
                size="small"
                onClick={() => handleItemClick(itemId)}
                sx={{
                  width: 38,
                  height: 38,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 1,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  p: 0.3,
                  color: isCompleted ? 'primary.main' : 'rgba(255,255,255,0.5)',
                  bgcolor: isCompleted ? 'action.selected' : 'transparent',
                  borderRadius: '50%',
                  '&:hover': {
                    color: isCompleted ? 'primary.main' : 'white',
                    bgcolor: isCompleted ? 'action.selected' : 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                {Icon && <Icon fontSize="small" />}
              </IconButton>
            )}
            
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              flexGrow: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: isCompleted ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.9)'
            }}>
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
              }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 400,
                    color: isCompleted ? 'rgba(255,255,255,0.5)' : 'inherit',
                    textDecoration: isCompleted ? 'line-through' : 'none'
                  }}
                >
                  {itemId}
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontSize: '0.7rem',
                    color: 'rgba(255,255,255,0.6)'
                  }}
                >
                  {cadenciaStatus}
                </Typography>
              </Box>
            </Box>
            
            {!readOnly && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleExpandConfig(itemId);
                }}
                sx={{ 
                  color: 'rgba(255,255,255,0.5)',
                  padding: '4px',
                  marginLeft: '4px',
                  borderRadius: '50%',
                  bgcolor: selectedItemId === itemId ? 'action.selected' : 'transparent',
                  '&:hover': { 
                    color: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)' 
                  }
                }}
              >
                <SettingsIcon sx={{ fontSize: '1.1rem' }} />
              </IconButton>
            )}
          </Box>
          
          {/* Mostrar configuración si el ítem está seleccionado */}
          <Collapse 
            in={selectedItemId === itemId}
            sx={{ width: '100%', mt: 1 }}
          >
            <Box sx={{ pl: 1, pr: 1, width: '100%', mb: 2 }}>
              {/* Información detallada de cadencia */}
              <Box sx={{ mb: 2, px: 1 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block', mb: 0.5 }}>
                  Estado de cadencia:
                </Typography>
                {(() => {
                  // Obtener la configuración de cadencia
                  const cadenciaConfig = config && config[itemId] ? config[itemId] : null;
                  
                  return (
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: 0.5, 
                      bgcolor: 'rgba(0,0,0,0.2)', 
                      p: 1, 
                      borderRadius: 1 
                    }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                        <strong>Tipo:</strong> {
                          cadenciaConfig?.tipo?.toUpperCase() === 'DIARIO' ? 'Diario' : 
                          cadenciaConfig?.tipo?.toUpperCase() === 'SEMANAL' ? 'Semanal' : 
                          cadenciaConfig?.tipo?.toUpperCase() === 'MENSUAL' ? 'Mensual' : 'Personalizado'
                        }
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                        <strong>Cadencia:</strong> {cadenciaStatus}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                        <strong>Completado hoy:</strong> {isItemCompleted(itemId) ? 'Sí' : 'No'}
                      </Typography>
                      
                      {/* Barra de progreso */}
                      <Box sx={{ 
                        width: '100%', 
                        height: 4, 
                        borderRadius: 2, 
                        bgcolor: 'rgba(255,255,255,0.1)',
                        mt: 0.5
                      }}>
                        <Box sx={{ 
                          width: '50%', // Valor estático ya que no tenemos el porcentaje
                          height: '100%', 
                          borderRadius: 2, 
                          bgcolor: isItemCompleted(itemId) ? 'success.main' : 'primary.main' 
                        }} />
                      </Box>
                    </Box>
                  );
                })()}
              </Box>
              
              <InlineItemConfig
                config={config[itemId]}
                onConfigChange={(newConfig) => {
                  handleConfigChange(itemId, newConfig);
                }}
                ultimaCompletacion={obtenerUltimaCompletacion(obtenerHistorialCompletados(itemId, section, rutina))}
                isCompleted={isItemCompleted(itemId)}
              />
            </Box>
          </Collapse>
        </ListItem>
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
            {renderItems()}
          </List>
        </Box>
      </Collapse>
    </Box>
  );
};

export default ChecklistSection;