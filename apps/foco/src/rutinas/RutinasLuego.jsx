import React, { useEffect, useMemo, useRef } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useRutinas, useHabits } from '@shared/context';
import { iconConfig, iconTooltips, getIconByName } from '@shared/utils/iconConfig';
import { getNormalizedToday, parseAPIDate, toISODateString } from '@shared/utils/dateUtils';
import { getVisibleItemIds } from '@shared/utils/visibilityUtils';
import { getCurrentTimeOfDay } from '@shared/utils/timeOfDayUtils';
import { isSameWeek, isSameMonth, startOfMonth, endOfMonth, endOfWeek, differenceInDays, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import useHorizontalDragScroll from './hooks/useHorizontalDragScroll';

/**
 * Función para obtener el historial de completados de un ítem
 */
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
      
      if (sectionHabits.length > 0) {
        // Usar hábitos personalizados
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
      
      // Si no hay hábitos personalizados, usar iconConfig como fallback
      if (Object.keys(iconsMap[section]).length === 0 && iconConfig[section]) {
        Object.keys(iconConfig[section]).forEach(itemId => {
          iconsMap[section][itemId] = iconConfig[section][itemId];
          labelsMap[section][itemId] = iconTooltips?.[section]?.[itemId] || itemId;
        });
      }
    });
    
    return { iconsMap, labelsMap };
  }, [habits]);

  const itemsLuego = useMemo(() => {
    if (!rutinaHoy) return [];
    const sections = Object.keys(sectionIconsMap.iconsMap || {});
    const items = [];

    sections.forEach((section) => {
      const sectionIcons = sectionIconsMap.iconsMap[section] || {};
      const sectionCfg = rutinaHoy?.config?.[section] || {};

      // Usar getVisibleItemIds para obtener items visibles según las reglas de cadencia y horario
      const visibleItemIds = getVisibleItemIds(
        sectionIcons,
        section,
        rutinaHoy,
        sectionCfg,
        rutinaHoy?.[section] || {},
        currentTimeOfDay
      );

      visibleItemIds.forEach((itemId) => {
        const config = sectionCfg[itemId];
        if (!config || config.activo === false) return;
        
        // Ocultar items completados hoy (solo mostrar pendientes)
        const completadoHoy = rutinaHoy?.[section]?.[itemId] === true;
        if (completadoHoy) return; // Ocultar completados
        
        const tipo = (config.tipo || 'DIARIO').toUpperCase();
        const periodo = config?.periodo ? (config.periodo).toUpperCase() : 'CADA_DIA';
        
        // Excluir items diarios: estos se muestran en "Hoy"
        if (tipo === 'DIARIO') return;
        if (tipo === 'PERSONALIZADO' && periodo === 'CADA_DIA') return;
        
        // Incluir: SEMANAL, MENSUAL, y PERSONALIZADO con periodo CADA_SEMANA o CADA_MES
        const frecuencia = Number(config.frecuencia || 1);
        
        // Calcular completados según el tipo de cadencia
        const historial = obtenerHistorialCompletados(itemId, section, rutinaHoy);
        const hoy = new Date();
        const fechasUnicas = new Set();
        let completadosEnPeriodo = 0;
        
        if (tipo === 'SEMANAL' || (tipo === 'PERSONALIZADO' && periodo === 'CADA_SEMANA')) {
          // Para semanal: contar días únicos completados en la semana actual
          historial.filter(fecha => 
            isSameWeek(fecha, hoy, { locale: es })
          ).forEach(fecha => {
            fechasUnicas.add(fecha.toISOString().split('T')[0]);
          });
          
          const fechaHoyStr = hoy.toISOString().split('T')[0];
          if (completadoHoy && !fechasUnicas.has(fechaHoyStr)) {
            fechasUnicas.add(fechaHoyStr);
          }
          
          completadosEnPeriodo = fechasUnicas.size;
        } else if (tipo === 'MENSUAL' || (tipo === 'PERSONALIZADO' && periodo === 'CADA_MES')) {
          // Para mensual: contar días únicos completados en el mes actual
          const inicioMes = startOfMonth(hoy);
          const finMes = endOfMonth(hoy);
          
          historial.filter(fecha => 
            isSameMonth(fecha, hoy)
          ).forEach(fecha => {
            fechasUnicas.add(fecha.toISOString().split('T')[0]);
          });
          
          const fechaHoyStr = hoy.toISOString().split('T')[0];
          if (completadoHoy && !fechasUnicas.has(fechaHoyStr)) {
            fechasUnicas.add(fechaHoyStr);
          }
          
          completadosEnPeriodo = fechasUnicas.size;
        }
        
        // Mostrar si no se cumplió la cuota máxima
        // Esto incluye:
        // - completadoHoy === true && completadosEnPeriodo < frecuencia (ya cumplió hoy pero no la cuota del período)
        // - completadoHoy === false && completadosEnPeriodo < frecuencia (no cumplió hoy pero tampoco la cuota del período)
        if (completadosEnPeriodo < frecuencia) {
          items.push({ section, itemId });
        }
      });
    });

    return items;
  }, [rutinaHoy, sectionIconsMap]);

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
      const prev = prevSection?.[itemId] === true;
      // El API espera un payload mínimo: { [itemId]: boolean }
      const itemData = { [itemId]: !prev };
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
      {carouselItems.map(({ section, itemId }, index) => {
        const Icon = sectionIconsMap.iconsMap[section]?.[itemId];
        const label = sectionIconsMap.labelsMap[section]?.[itemId] || itemId;
        if (!Icon) return null;

        return (
          <Tooltip key={`${section}.${itemId}.${index}`} title={label} arrow placement="top">
            {/* Wrapper requerido por MUI: Tooltip no puede escuchar eventos en un button disabled */}
            <span style={{ display: 'inline-flex' }}>
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
            </span>
          </Tooltip>
        );
      })}
    </Box>
  );
}

