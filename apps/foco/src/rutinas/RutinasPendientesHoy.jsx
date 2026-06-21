import React, { useEffect, useMemo, useRef } from 'react';
import { Box, IconButton, Tooltip, CircularProgress } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useRutinas, useHabits } from '@shared/context';
import {
  HABIT_SECTIONS,
  DEFAULT_HABIT_ITEM_CONFIG,
  buildHabitSectionIconsMap,
  getCarouselSectionItemIds,
  resolveRutinaForDate,
} from '@shared/utils/habitSectionIcons';
import { getNormalizedToday } from '@shared/utils/dateUtils';
import { getCurrentTimeOfDay } from '@shared/utils/timeOfDayUtils';
import { getHorarioToShow } from '@shared/utils/habitTimeLogic';
import { HabitCounterBadge } from '@shared/components/common/HabitCounterBadge';
import { isSameDay, isSameWeek, isSameMonth, startOfWeek, endOfWeek, startOfMonth, endOfMonth, differenceInDays, getDay, getDate } from 'date-fns';
import { es } from 'date-fns/locale';
import { contarCompletadosEnPeriodo, obtenerHistorialCompletados } from '@shared/utils/cadenciaUtils';
import { isHabitCompletedForHistorial } from '@shared/utils/habitCompletionUtils';
import useHorizontalDragScroll from './hooks/useHorizontalDragScroll';
import useCarouselRutinaBoot from './hooks/useCarouselRutinaBoot';

/**
 * RutinasPendientesHoy
 * - Render compacto para "pendientes de hoy" en formato fila de íconos.
 * - Muestra items DIARIOS activos (completados y pendientes), igual que RutinaCard colapsado.
 * - También muestra items SEMANALES/MENSUALES cuando faltan completados y los días restantes
 *   no alcanzan para cumplir la cuota (necesita hacer al menos 1 por día).
 * - Los items semanales/mensuales que no requieren acción diaria se muestran solo en RutinasLuego.
 * - Se apoya en RutinasProvider (App.jsx) y dispara fetchRutinas() si aún no hay datos.
 *
 * Props:
 * - variant: 'iconsRow' (por ahora único soporte)
 * - dense: compacta más los íconos (true/false)
 * - showDividers: añade separación sutil (true/false)
 */
export default function RutinasPendientesHoy({
  variant = 'iconsRow',
  dense = true,
  showDividers = true,
  enableDragScroll = true,
  interactive = true,
  targetDate,
}) {
  const theme = useTheme();
  const { rutina, rutinas, loading: rutinasLoading, markItemComplete } = useRutinas();
  const { habits, loading: habitsLoading } = useHabits();
  const carouselRef = useRef(null);
  const isScrollingRef = useRef(false);
  // Umbral un poco mayor para que un "tap" con leve movimiento no se considere drag (especialmente en mobile)
  const { scrollRef, dragRef, isDragging, bind } = useHorizontalDragScroll({
    enabled: enableDragScroll,
    thresholdPx: 12,
  });

  const resolvedTargetDate = useMemo(
    () => targetDate || getNormalizedToday(),
    [targetDate],
  );
  const targetDateStr = useMemo(
    () => formatDateForAPI(resolvedTargetDate),
    [resolvedTargetDate],
  );
  const isTargetToday = useMemo(
    () => isSameDay(resolvedTargetDate, getNormalizedToday()),
    [resolvedTargetDate],
  );
  // Usar horario actual solo cuando la fecha seleccionada es hoy
  const currentTimeOfDay = isTargetToday ? getCurrentTimeOfDay() : 'MAÑANA';

  const rutinaHoy = useMemo(
    () => resolveRutinaForDate({ rutina, rutinas, targetDate: resolvedTargetDate }),
    [rutina, rutinas, resolvedTargetDate],
  );

  useCarouselRutinaBoot(resolvedTargetDate);

  const sectionIconsMap = useMemo(
    () => buildHabitSectionIconsMap(habits),
    [habits],
  );

  const itemsHoy = useMemo(() => {
    const items = [];
    const itemsSet = new Set();

    HABIT_SECTIONS.forEach((section) => {
      const sectionIcons = sectionIconsMap.iconsMap[section] || {};
      const sectionCfg = rutinaHoy?.config?.[section] || {};
      const itemIds = getCarouselSectionItemIds(section, sectionIconsMap.iconsMap, habits);

      itemIds.forEach((itemId) => {
        if (!sectionIcons[itemId]) return;

        const itemConfig = sectionCfg[itemId] || DEFAULT_HABIT_ITEM_CONFIG;
        if (itemConfig.activo === false) return;

        const itemValue = rutinaHoy?.[section]?.[itemId];
        const horarios = Array.isArray(itemConfig.horarios) ? itemConfig.horarios : [];
        const completadoHoy = isHabitCompletedForHistorial(itemValue);
        const tipo = (itemConfig.tipo || 'DIARIO').toUpperCase();
        const periodo = (itemConfig.periodo || 'CADA_DIA').toUpperCase();
        const frecuencia = Number(itemConfig.frecuencia || 1);

        const itemKey = `${section}.${itemId}`;
        if (itemsSet.has(itemKey)) return;
        
        // Incluir items diarios siempre
        if (tipo === 'DIARIO' || (tipo === 'PERSONALIZADO' && periodo === 'CADA_DIA')) {
          items.push({ section, itemId });
          itemsSet.add(itemKey);
          return;
        }
        
        // Para items semanales/mensuales: verificar si es necesario mostrarlos en "Hoy"
        // Si faltan completados y los días restantes no alcanzan para cumplir la cuota,
        // entonces debe aparecer también en "Hoy" (además de "Luego")
        if (tipo === 'SEMANAL' || tipo === 'MENSUAL' || 
            (tipo === 'PERSONALIZADO' && (periodo === 'CADA_SEMANA' || periodo === 'CADA_MES'))) {
          if (!rutinaHoy) return;
          
          const historial = obtenerHistorialCompletados(itemId, section, rutinaHoy);
          const hoy = new Date();
          let completadosEnPeriodo = 0;
          let diasRestantes = 0;
          
          if (tipo === 'SEMANAL' || (tipo === 'PERSONALIZADO' && periodo === 'CADA_SEMANA')) {
            const diasSemana = Array.isArray(itemConfig.diasSemana) ? itemConfig.diasSemana : [];
            
            // Filtrar historial por días de la semana si están configurados
            const historialFiltrado = diasSemana.length > 0
              ? historial.filter(fecha => {
                  const diaSemana = getDay(fecha);
                  return diasSemana.includes(diaSemana);
                })
              : historial;
            
            // Calcular completados usando la función centralizada
            completadosEnPeriodo = contarCompletadosEnPeriodo(hoy, tipo, periodo, historialFiltrado);
            
            // Verificar si el hábito está completado hoy y agregarlo si no está en el historial
            if (completadoHoy) {
              const diaHoy = getDay(hoy);
              const hoyEsValido = diasSemana.length === 0 || diasSemana.includes(diaHoy);
              if (hoyEsValido) {
                const hoyStr = hoy.toISOString().split('T')[0];
                const yaEstaEnHistorial = historialFiltrado.some(fecha => {
                  const fechaStr = fecha.toISOString().split('T')[0];
                  return fechaStr === hoyStr;
                });
                
                if (!yaEstaEnHistorial) {
                  completadosEnPeriodo++;
                }
              }
            }
            
            // Calcular días restantes: solo días válidos que aún no han pasado
            if (diasSemana.length > 0) {
              const diaHoy = getDay(hoy);
              diasRestantes = diasSemana.filter(dia => {
                // Solo contar días que aún no han pasado esta semana
                // Si hoy es lunes (1) y diasSemana es [1, 3, 5], contar 1, 3, 5
                // Si hoy es miércoles (3) y diasSemana es [1, 3, 5], contar solo 3, 5
                return dia >= diaHoy;
              }).length;
            } else {
              // Sin días específicos: contar todos los días restantes
            const finSemana = endOfWeek(hoy, { locale: es });
            diasRestantes = Math.max(0, differenceInDays(finSemana, hoy) + 1); // +1 para incluir hoy
            }
          } else if (tipo === 'MENSUAL' || (tipo === 'PERSONALIZADO' && periodo === 'CADA_MES')) {
            const diasMes = Array.isArray(itemConfig.diasMes) ? itemConfig.diasMes : [];
            
            // Filtrar historial por días del mes si están configurados
            const historialFiltrado = diasMes.length > 0
              ? historial.filter(fecha => {
                  const diaMes = getDate(fecha); // 1-31
                  return diasMes.includes(diaMes);
                })
              : historial;
            
            // Calcular completados usando la función centralizada
            completadosEnPeriodo = contarCompletadosEnPeriodo(hoy, tipo, periodo, historialFiltrado);
            
            // Verificar si el hábito está completado hoy y agregarlo si no está en el historial
            if (completadoHoy) {
              const diaHoy = getDate(hoy);
              const hoyEsValido = diasMes.length === 0 || diasMes.includes(diaHoy);
              if (hoyEsValido) {
                const hoyStr = hoy.toISOString().split('T')[0];
                const yaEstaEnHistorial = historialFiltrado.some(fecha => {
                  const fechaStr = fecha.toISOString().split('T')[0];
                  return fechaStr === hoyStr;
                });
                
                if (!yaEstaEnHistorial) {
                  completadosEnPeriodo++;
                }
              }
            }
            
            // Calcular días restantes: solo días válidos que aún no han pasado
            if (diasMes.length > 0) {
              const diaHoy = getDate(hoy);
              diasRestantes = diasMes.filter(dia => {
                // Solo contar días que aún no han pasado este mes
                // Si hoy es día 5 y diasMes es [5, 15, 25], contar 5, 15, 25
                // Si hoy es día 20 y diasMes es [5, 15, 25], contar solo 25
                return dia >= diaHoy;
              }).length;
            } else {
              // Sin días específicos: contar todos los días restantes
            const finMes = endOfMonth(hoy);
            diasRestantes = Math.max(0, differenceInDays(finMes, hoy) + 1); // +1 para incluir hoy
            }
          }
          
          // Si faltan completados y los días restantes no alcanzan para cumplir la cuota,
          // entonces debe aparecer en "Hoy" también (necesita hacer al menos 1 por día)
          const completadosFaltantes = frecuencia - completadosEnPeriodo;
          if (completadosFaltantes > 0 && diasRestantes > 0) {
            const completadosPorDiaNecesarios = completadosFaltantes / diasRestantes;
            if (completadosPorDiaNecesarios >= 1) {
              // Necesita hacer al menos 1 por día, mostrar en "Hoy"
              // Verificar nuevamente para evitar duplicados
              if (!itemsSet.has(itemKey)) {
              items.push({ section, itemId });
                itemsSet.add(itemKey);
              }
            }
          }
        }
      });
    });

    return items;
  }, [rutinaHoy, sectionIconsMap, habits, currentTimeOfDay]);

  // En Agenda "Ahora": todos los hábitos diarios activos (el estado completado se refleja en el ícono).
  const pendingItems = itemsHoy;

  // Para carrusel infinito: duplicar items al inicio y final
  // DESACTIVADO temporalmente para evitar duplicados visibles
  // El carrusel infinito solo funciona bien cuando hay scroll real, no cuando todos los items caben en pantalla
  // TODO: Implementar detección de scroll real antes de activar
  const shouldUseInfiniteCarousel = false; // pendingItems.length > 15 && /* verificar que realmente hay scroll */
  const carouselItems = pendingItems; // Sin duplicación para evitar duplicados visibles

  // Tamaños más compactos para encajar en headers de tabla
  // Nota UX: 24px en desktop se percibe demasiado chico. Subimos el diámetro para
  // mantener consistencia visual con el tamaño que se siente “correcto” en mobile.
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
      console.warn('[RutinasPendientesHoy] markItemComplete no disponible en contexto');
      return;
    }
    try {
      const prevSection = rutinaHoy?.[section] || {};
      const itemValue = prevSection[itemId];
      const itemConfig = rutinaHoy?.config?.[section]?.[itemId] || {};
      const horariosConfig = Array.isArray(itemConfig.horarios) ? itemConfig.horarios : [];
      
      // Determinar el horario específico que se debe marcar
      const completadoHoy = itemValue !== undefined ? itemValue : false;
      const tipo = (itemConfig.tipo || 'DIARIO').toUpperCase();
      const frecuencia = Number(itemConfig.frecuencia || 1);
      const horarioToMark = getHorarioToShow(horariosConfig, currentTimeOfDay, completadoHoy, tipo, frecuencia) || currentTimeOfDay;
      const normalizedHorario = String(horarioToMark).toUpperCase();
      
      // Detectar formato actual: objeto o boolean
      const isObjectFormat = typeof itemValue === 'object' && itemValue !== null && !Array.isArray(itemValue);
      const isBooleanFormat = typeof itemValue === 'boolean';
      
      let newValue;
      
      // Si tiene múltiples horarios configurados, usar formato objeto y marcar solo el horario específico
      if (horariosConfig.length > 1) {
        if (isObjectFormat) {
          // Ya está en formato objeto, actualizar solo el horario específico
          const horarioEspecificoCompletado = itemValue[normalizedHorario] === true;
          newValue = {
            ...itemValue,
            [normalizedHorario]: !horarioEspecificoCompletado
          };
        } else {
          // Convertir de formato legacy (boolean) a formato objeto
          // IMPORTANTE: Al convertir de legacy, todos los horarios empiezan en false
          // y solo se marca el horario específico (no se propaga el estado legacy a otros horarios)
          const newObject = {};
          horariosConfig.forEach(h => {
            const normalizedH = String(h).toUpperCase();
            if (normalizedH === normalizedHorario) {
              // Toggle del horario específico: si estaba completado en legacy, desmarcar; si no, marcar
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
      console.warn('[RutinasPendientesHoy] No se pudo togglear', { section, itemId });
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
  if (carouselItems.length === 0) {
    if (rutinasLoading || habitsLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 36 }}>
          <CircularProgress size={18} />
        </Box>
      );
    }
    return null;
  }

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
        if (!Icon) return null;

          // Obtener configuración del hábito para el badge
          const itemConfig = rutinaHoy?.config?.[section]?.[itemId] || {};
          
          // Determinar el horario específico que se debe mostrar
          const horariosConfig = Array.isArray(itemConfig.horarios) ? itemConfig.horarios : [];
          const itemValue = rutinaHoy?.[section]?.[itemId];
          const completadoHoy = itemValue !== undefined ? itemValue : false;
          const tipo = (itemConfig.tipo || 'DIARIO').toUpperCase();
          const frecuencia = Number(itemConfig.frecuencia || 1);
          
          // Obtener el horario específico que debe mostrarse
          const horarioToShow = getHorarioToShow(horariosConfig, currentTimeOfDay, completadoHoy, tipo, frecuencia);
          
          // Calcular si el hábito está completado (sincronizado con RutinaCard.jsx)
          // Verificar si está completado: puede ser boolean (legacy) u objeto con horarios (nuevo formato)
          const isObjectFormat = typeof itemValue === 'object' && itemValue !== null && !Array.isArray(itemValue);
          const isBooleanFormat = typeof itemValue === 'boolean';
          
          // Para hábitos con múltiples horarios, verificar si el horario específico a mostrar está completado
          const hasMultipleHorarios = horariosConfig.length > 1;
          
          let isCompleted = false;
          if (hasMultipleHorarios && isObjectFormat && horarioToShow) {
            // Si tiene múltiples horarios y está en formato objeto, verificar el horario específico a mostrar
            isCompleted = itemValue[horarioToShow] === true;
          } else if (hasMultipleHorarios && isObjectFormat) {
            // Si no hay horario específico a mostrar, verificar si algún horario está completado
            isCompleted = Object.values(itemValue).some(Boolean);
          } else if (isObjectFormat) {
            // Si está en formato objeto pero no tiene múltiples horarios, verificar si algún horario está completado
            isCompleted = Object.values(itemValue).some(Boolean);
          } else if (isBooleanFormat) {
            // Formato legacy: boolean simple
            isCompleted = itemValue === true;
          }

          // Key único basado en section e itemId (sin index para evitar problemas con duplicados)
          const uniqueKey = `${section}.${itemId}`;

        return (
            <Tooltip key={uniqueKey} title={label} arrow placement="top">
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
                  bgcolor: isCompleted ? 'action.selected' : bg,
                  color: isCompleted ? 'primary.main' : 'text.secondary',
                  border: '1px solid',
                  borderColor: isCompleted ? 'primary.main' : rail,
                  flex: '0 0 auto',
                  // Permitir que un drag horizontal comience encima del botón (mobile/desktop)
                  touchAction: 'pan-x',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: isCompleted ? 'action.selected' : hoverBg,
                    color: isCompleted ? 'primary.main' : 'text.primary'
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

