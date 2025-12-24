import React, { useEffect, useMemo, useRef } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useRutinas, useHabits } from '@shared/context';
import { iconConfig, iconTooltips, getIconByName } from '@shared/utils/iconConfig';
import { getNormalizedToday, parseAPIDate, toISODateString } from '@shared/utils/dateUtils';
import { getCurrentTimeOfDay } from '@shared/utils/timeOfDayUtils';
import { shouldShowHabitForCurrentTime } from '@shared/utils/habitTimeLogic';
import { HabitCounterBadge } from '@shared/components/common/HabitCounterBadge';
import { isSameWeek, isSameMonth, startOfMonth, endOfMonth, endOfWeek, differenceInDays, startOfWeek, getDay, getDate } from 'date-fns';
import { es } from 'date-fns/locale';
import { contarCompletadosEnPeriodo, obtenerHistorialCompletados } from '@shared/utils/cadenciaUtils';
import useHorizontalDragScroll from './hooks/useHorizontalDragScroll';

/**
 * RutinasLuego
 * - Render compacto para items no diarios pendientes de la rutina de hoy en formato fila de íconos.
 * - Muestra items SEMANALES, MENSUALES y PERSONALIZADO (con periodo CADA_SEMANA o CADA_MES) que aún no han cumplido su cuota.
 * - Los items diarios se muestran en RutinasPendientesHoy para evitar duplicación.
 * - Se apoya en RutinasProvider (App.jsx) y dispara fetchRutinas() si aún no hay datos.
 *
 * Props:
 * - variant: 'iconsRow' (por ahora único soporte)
 * - dense: compacta más los íconos (true/false)
 * - showDividers: añade separación sutil (true/false)
 */
export default function RutinasLuego({
  variant = 'iconsRow',
  dense = true,
  showDividers = true,
  enableDragScroll = true,
  interactive = true,
}) {
  const theme = useTheme();
  const { rutina, rutinas, loading, fetchRutinas, markItemComplete } = useRutinas();
  const { habits, fetchHabits } = useHabits();
  const didFetchRef = useRef(false);
  const didFetchHabitsRef = useRef(false);
  const carouselRef = useRef(null);
  const isScrollingRef = useRef(false);
  // Umbral un poco mayor para que un "tap" con leve movimiento no se considere drag (especialmente en mobile)
  const { scrollRef, dragRef, isDragging, bind } = useHorizontalDragScroll({
    enabled: enableDragScroll,
    thresholdPx: 12,
  });

  const todayStr = useMemo(() => toISODateString(getNormalizedToday()), []);
  // Usar horario actual automáticamente (la lógica acumulativa se aplica en shouldShowItem)
  // Se recalcula en cada render para reflejar el horario actual
  const currentTimeOfDay = getCurrentTimeOfDay();

  const rutinaHoy = useMemo(() => {
    const sameDay = (r) => {
      try {
        return toISODateString(parseAPIDate(r?.fecha)) === todayStr;
      } catch {
        return false;
      }
    };

    // 1) Si la rutina seleccionada en el contexto es hoy, úsala
    if (rutina && sameDay(rutina)) return rutina;

    // 2) Buscar en el listado
    const list = Array.isArray(rutinas) ? rutinas : [];
    const found = list.find(sameDay);
    return found || null;
  }, [rutina, rutinas, todayStr]);

  // Cargar hábitos personalizados al montar
  useEffect(() => {
    if (didFetchHabitsRef.current) return;
    if (typeof fetchHabits !== 'function') return;
    didFetchHabitsRef.current = true;
    fetchHabits();
  }, [fetchHabits]);

  useEffect(() => {
    if (didFetchRef.current) return;
    if (rutinaHoy) return;
    if (typeof fetchRutinas !== 'function') return;
    // Importante: no depender de `loading` aquí. En RutinasContext, `loading` puede iniciar en true
    // aun cuando nadie disparó `fetchRutinas()`; si nos bloqueamos, nunca se carga y no se renderiza.
    didFetchRef.current = true;
    fetchRutinas();
  }, [rutinaHoy, fetchRutinas]);

  // Construir mapa de iconos y labels usando hábitos personalizados o fallback
  const sectionIconsMap = useMemo(() => {
    const iconsMap = {};
    const labelsMap = {};
    const sections = ['bodyCare', 'nutricion', 'ejercicio', 'cleaning'];
    
    sections.forEach((section) => {
      iconsMap[section] = {};
      labelsMap[section] = {};
      
      // Obtener hábitos personalizados de la sección
      const sectionHabits = habits[section] || [];
      
      // Primero agregar hábitos personalizados
      if (sectionHabits.length > 0) {
        sectionHabits
          .filter(h => h.activo !== false)
          .sort((a, b) => (a.orden || 0) - (b.orden || 0))
          .forEach(habit => {
            const Icon = getIconByName(habit.icon);
            if (Icon) {
              iconsMap[section][habit.id] = Icon;
              labelsMap[section][habit.id] = habit.label || habit.name || habit.id;
            }
          });
      }
      
      // Luego agregar iconConfig como complemento (no solo como fallback)
      // Esto asegura que items de iconConfig también estén disponibles
      if (iconConfig[section]) {
        Object.keys(iconConfig[section]).forEach(itemId => {
          // Solo agregar si no existe ya (los hábitos personalizados tienen prioridad)
          if (!iconsMap[section][itemId]) {
            iconsMap[section][itemId] = iconConfig[section][itemId];
            labelsMap[section][itemId] = iconTooltips?.[section]?.[itemId] || itemId;
          }
        });
      }
    });
    
    return { iconsMap, labelsMap };
  }, [habits]);

  const itemsLuego = useMemo(() => {
    if (!rutinaHoy) return [];
    const sections = ['bodyCare', 'nutricion', 'ejercicio', 'cleaning'];
    const items = [];

    sections.forEach((section) => {
      const sectionIcons = sectionIconsMap.iconsMap[section] || {};
      const sectionCfg = rutinaHoy?.config?.[section] || {};

      // Para "RutinasLuego", queremos mostrar TODOS los hábitos periódicos (semanal/mensual)
      // que aún no han cumplido su cuota, independientemente de si están completados hoy.
      // No usar getVisibleItemIds porque puede ocultar items que deberían mostrarse aquí.
      // IMPORTANTE: Incluir tanto items con iconos como items que solo están en config
      // (puede haber hábitos configurados que no tienen icono personalizado)
      const itemIdsFromIcons = Object.keys(sectionIcons);
      const itemIdsFromConfig = Object.keys(sectionCfg);
      // Combinar ambos para asegurar que no se pierda ningún hábito
      const allItemIds = Array.from(new Set([...itemIdsFromIcons, ...itemIdsFromConfig]));
      
      allItemIds.forEach((itemId) => {
        const config = sectionCfg[itemId];
        // Si no hay config, asumir que está activo por defecto (para hábitos sin config explícita)
        if (config && config.activo === false) return;
        
        // Si no hay config y no hay icono, saltar (no podemos mostrar sin icono)
        if (!config && !sectionIcons[itemId]) return;
        
        // Si no hay config, usar valores por defecto para mantener consistencia con RutinaCard
        const tipo = (config?.tipo || 'DIARIO').toUpperCase();
        const periodo = config?.periodo ? (config.periodo).toUpperCase() : 'CADA_DIA';
        const frecuencia = Number(config?.frecuencia || 1);
        const completadoHoy = rutinaHoy?.[section]?.[itemId] === true;
        
        // Excluir items diarios: estos se muestran en "Hoy"
        if (tipo === 'DIARIO') return;
        if (tipo === 'PERSONALIZADO' && periodo === 'CADA_DIA') return;
        
        // Solo procesar SEMANAL, MENSUAL, y PERSONALIZADO con periodo CADA_SEMANA o CADA_MES
        const esPeriodico = tipo === 'SEMANAL' || tipo === 'MENSUAL' || 
          (tipo === 'PERSONALIZADO' && (periodo === 'CADA_SEMANA' || periodo === 'CADA_MES'));
        
        if (!esPeriodico) return;
        
        // IMPORTANTE: Para hábitos periódicos en RutinasLuego, NO aplicar filtro de horarios
        // Los hábitos periódicos (semanal/mensual) deben mostrarse independientemente del horario
        // El filtro de horarios solo aplica para hábitos diarios, no para periódicos
        // #region agent log
        const horarios = Array.isArray(config?.horarios) ? config.horarios : [];
        fetch('http://127.0.0.1:7242/ingest/a059dc4e-4ac4-432b-874b-c0f38a0644eb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RutinasLuego.jsx:177',message:'Hábito periódico - NO aplicar filtro de horarios',data:{section,itemId,tipo,periodo,horarios,currentTimeOfDay,completadoHoy,frecuencia,esPeriodico},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
        // #endregion
        // No aplicar filtro de horarios para hábitos periódicos - continuar con el procesamiento
        
        // Obtener historial usando la función centralizada
        const historial = obtenerHistorialCompletados(itemId, section, rutinaHoy);
        const hoy = new Date();
        
        // Para hábitos con días específicos (diasSemana o diasMes), filtrar el historial primero
        // ya que contarCompletadosEnPeriodo no considera estos filtros
        let historialParaContar = historial;
        let hoyEsValido = true;
        
        if (tipo === 'SEMANAL' || (tipo === 'PERSONALIZADO' && periodo === 'CADA_SEMANA')) {
          const diasSemana = Array.isArray(config.diasSemana) ? config.diasSemana : [];
          if (diasSemana.length > 0) {
            // Filtrar historial por días de la semana
            historialParaContar = historial.filter(fecha => {
              const diaSemana = getDay(fecha);
              return diasSemana.includes(diaSemana);
            });
            
            // Verificar si hoy es un día válido
            const diaHoy = getDay(hoy);
            hoyEsValido = diasSemana.includes(diaHoy);
          }
        } else if (tipo === 'MENSUAL' || (tipo === 'PERSONALIZADO' && periodo === 'CADA_MES')) {
          const diasMes = Array.isArray(config.diasMes) ? config.diasMes : [];
          if (diasMes.length > 0) {
            // Filtrar historial por días del mes
            historialParaContar = historial.filter(fecha => {
              const diaMes = getDate(fecha);
              return diasMes.includes(diaMes);
            });
            
            // Verificar si hoy es un día válido
            const diaHoy = getDate(hoy);
            hoyEsValido = diasMes.includes(diaHoy);
          }
        }
        
        // Calcular completados del período actual usando la función centralizada
        let completadosEnPeriodo = contarCompletadosEnPeriodo(hoy, tipo, periodo, historialParaContar);
        
        // Verificar si el hábito está completado hoy y agregarlo si no está en el historial
        if (completadoHoy && hoyEsValido) {
          const hoyStr = hoy.toISOString().split('T')[0];
          const yaEstaEnHistorial = historialParaContar.some(fecha => {
            const fechaStr = fecha.toISOString().split('T')[0];
            return fechaStr === hoyStr;
          });
          
          // Si no está en el historial, agregarlo al conteo
          if (!yaEstaEnHistorial) {
            completadosEnPeriodo++;
          }
        }
        
        // Mostrar si no se cumplió la cuota máxima
        // Esto incluye:
        // - completadoHoy === true && completadosEnPeriodo < frecuencia (ya cumplió hoy pero no la cuota del período)
        // - completadoHoy === false && completadosEnPeriodo < frecuencia (no cumplió hoy pero tampoco la cuota del período)
        // IMPORTANTE: Para hábitos semanales/mensuales, mostrar aunque estén completados hoy si aún no cumplieron la cuota
        if (completadosEnPeriodo < frecuencia) {
          items.push({ section, itemId });
        }
      });
    });

    return items;
  }, [rutinaHoy, sectionIconsMap, currentTimeOfDay]);

  // En Agenda "Luego" queremos items semanales pendientes de cuota.
  const pendingItems = itemsLuego;

  // Para carrusel infinito: duplicar items al inicio y final
  // Solo activar si hay suficientes items para que tenga sentido
  const shouldUseInfiniteCarousel = pendingItems.length > 8;
  const carouselItems = shouldUseInfiniteCarousel
    ? [...pendingItems, ...pendingItems, ...pendingItems] // [duplicado][original][duplicado]
    : pendingItems;

  // Tamaños más compactos para encajar en headers de tabla
  // Nota UX: 24px en desktop se percibe demasiado chico. Subimos el diámetro para
  // mantener consistencia visual con el tamaño que se siente "correcto" en mobile.
  const size = dense ? 28 : 32;
  // Match del background usado en headers/grupos de TareasTable (look & feel consistente)
  const surfaceBg = theme.palette.mode === 'dark'
    ? alpha(theme.palette.common.white, 0.035)
    : alpha(theme.palette.common.black, 0.03);
  const dividerColor = theme.palette.mode === 'dark'
    ? alpha(theme.palette.common.white, 0.10)
    : alpha(theme.palette.common.black, 0.10);
  const bg = surfaceBg;
  const hoverBg = theme.palette.mode === 'dark'
    ? alpha(theme.palette.common.white, 0.055)
    : alpha(theme.palette.common.black, 0.045);
  // Armonizar con el resto del bloque (mismo gris que dividers)
  const rail = dividerColor;

  const handleToggle = async (section, itemId) => {
    if (!interactive) return;
    if (dragRef.current.moved) return;
    if (!rutinaHoy?._id) return;
    if (!markItemComplete || typeof markItemComplete !== 'function') {
      console.warn('[RutinasLuego] markItemComplete no disponible en contexto');
      return;
    }
    try {
      const prevSection = rutinaHoy?.[section] || {};
      const itemValue = prevSection[itemId];
      const itemConfig = rutinaHoy?.config?.[section]?.[itemId] || {};
      const horariosConfig = Array.isArray(itemConfig.horarios) ? itemConfig.horarios : [];
      
      // Detectar formato actual: objeto o boolean
      const isObjectFormat = typeof itemValue === 'object' && itemValue !== null && !Array.isArray(itemValue);
      const isBooleanFormat = typeof itemValue === 'boolean';
      
      let newValue;
      
      // Si tiene múltiples horarios configurados, usar formato objeto y marcar solo el horario actual
      if (horariosConfig.length > 1) {
        const normalizedHorario = String(currentTimeOfDay).toUpperCase();
        
        if (isObjectFormat) {
          // Ya está en formato objeto, actualizar solo el horario específico
          const horarioActualCompletado = itemValue[normalizedHorario] === true;
          newValue = {
            ...itemValue,
            [normalizedHorario]: !horarioActualCompletado
          };
        } else {
          // Convertir de formato legacy (boolean) a formato objeto
          // IMPORTANTE: Al convertir de legacy, todos los horarios empiezan en false
          // y solo se marca el horario actual (no se propaga el estado legacy a otros horarios)
          const newObject = {};
          horariosConfig.forEach(h => {
            const normalizedH = String(h).toUpperCase();
            if (normalizedH === normalizedHorario) {
              // Toggle del horario actual: si estaba completado en legacy, desmarcar; si no, marcar
              newObject[normalizedH] = !(isBooleanFormat && itemValue === true);
            } else {
              // Los otros horarios siempre empiezan en false al convertir de legacy
              // No se propaga el estado legacy para evitar marcar horarios que no se han hecho
              newObject[normalizedH] = false;
            }
          });
          newValue = newObject;
        }
      } else {
        // Sin múltiples horarios: usar formato legacy (boolean)
        const prev = isBooleanFormat ? itemValue : (isObjectFormat ? Object.values(itemValue).some(Boolean) : false);
        newValue = !prev;
      }
      
      const itemData = { [itemId]: newValue };
      // Esto actualiza backend + parchea contexto (rutina + rutinas), por lo que Rutinas.jsx queda sincronizado.
      await markItemComplete(rutinaHoy._id, section, itemData);
    } catch {
      // Dejar traza para depurar si el backend/contexto no responde
      console.warn('[RutinasLuego] No se pudo togglear', { section, itemId });
    }
  };

  // Efecto para inicializar y manejar el carrusel infinito
  useEffect(() => {
    if (!shouldUseInfiniteCarousel || !carouselRef.current) return;
    
    const container = carouselRef.current;
    
    // Esperar a que el DOM se renderice para obtener el ancho real
    const initCarousel = () => {
      const scrollWidth = container.scrollWidth;
      const setWidth = scrollWidth / 3; // Dividir por 3 sets
      const startPosition = setWidth; // Iniciar en el set del medio (original)
      
      // Inicializar en la posición del medio
      container.scrollLeft = startPosition;
    };
    
    // Usar requestAnimationFrame para asegurar que el DOM esté listo
    requestAnimationFrame(() => {
      setTimeout(initCarousel, 100);
    });

    const handleScroll = () => {
      if (isScrollingRef.current) return;
      
      const scrollLeft = container.scrollLeft;
      const scrollWidth = container.scrollWidth;
      const setWidth = scrollWidth / 3;
      const startPosition = setWidth; // Inicio del set original
      const endPosition = setWidth * 2; // Fin del set original
      
      // Si llegamos al final (tercer set), saltar al inicio del segundo set (original)
      if (scrollLeft >= endPosition - 50) {
        isScrollingRef.current = true;
        container.scrollLeft = startPosition + (scrollLeft - endPosition);
        setTimeout(() => { isScrollingRef.current = false; }, 50);
      }
      // Si llegamos al inicio (primer set), saltar al final del segundo set (original)
      else if (scrollLeft <= 50) {
        isScrollingRef.current = true;
        container.scrollLeft = endPosition - (50 - scrollLeft);
        setTimeout(() => { isScrollingRef.current = false; }, 50);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [shouldUseInfiniteCarousel, pendingItems.length]);

  // IMPORTANTE: a partir de aquí recién retornamos condicionalmente
  // para no romper el orden de Hooks (Rules of Hooks).
  if (variant !== 'iconsRow') return null;
  if (!rutinaHoy) return null;
  if (pendingItems.length === 0) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'nowrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: dense ? 0.25 : 0.5,
        pt: dense ? 0.25 : 0.5,
        pb: dense ? 0.25 : 0,
        overflowX: 'auto',
        overflowY: 'hidden',
        touchAction: 'pan-x',
        cursor: enableDragScroll ? (isDragging ? 'grabbing' : 'grab') : 'auto',
        userSelect: enableDragScroll ? 'none' : 'auto',
        // Scrollbar oculto (minimalista) manteniendo scroll/drag
        scrollbarWidth: 'none', // Firefox
        msOverflowStyle: 'none', // IE/Edge legacy
        '&::-webkit-scrollbar': { display: 'none' }, // WebKit
        ...(showDividers && {
          borderTop: '1px solid',
          borderColor: dividerColor
        })
      }}
      ref={(node) => {
        scrollRef.current = node;
        carouselRef.current = node;
      }}
      {...bind}
    >
      {carouselItems
        .map(({ section, itemId }, index) => {
        const Icon = sectionIconsMap.iconsMap[section]?.[itemId];
        const label = sectionIconsMap.labelsMap[section]?.[itemId] || itemId;
        // Si no hay icono, no podemos renderizar el item
        if (!Icon) return null;

          // Obtener configuración del hábito para el badge
          const itemConfig = rutinaHoy?.config?.[section]?.[itemId] || {};

        return (
          <Tooltip key={`${section}.${itemId}.${index}`} title={label} arrow placement="top">
            {/* Wrapper requerido por MUI: Tooltip no puede escuchar eventos en un button disabled */}
            <span style={{ display: 'inline-flex' }}>
                <HabitCounterBadge
                  config={itemConfig}
                  currentTimeOfDay={currentTimeOfDay}
                  size={dense ? 'small' : 'medium'}
                  rutina={rutinaHoy}
                  section={section}
                  itemId={itemId}
                >
              <IconButton
                size="small"
                disabled={!interactive}
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggle(section, itemId);
                }}
                sx={{
                  width: size,
                  height: size,
                  p: 0,
                  borderRadius: '50%',
                  bgcolor: bg,
                  color: 'text.secondary',
                  border: '1px solid',
                  borderColor: rail,
                  flex: '0 0 auto',
                  // Permitir que un drag horizontal comience encima del botón (mobile/desktop)
                  touchAction: 'pan-x',
                  '&:hover': {
                    bgcolor: hoverBg,
                    color: 'text.primary'
                  }
                }}
              >
                <Icon sx={{ fontSize: dense ? '1.1rem' : '1.2rem' }} />
              </IconButton>
                </HabitCounterBadge>
            </span>
          </Tooltip>
        );
      })}
    </Box>
  );
}

