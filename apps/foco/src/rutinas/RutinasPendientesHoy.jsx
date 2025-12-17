import React, { useEffect, useMemo, useRef } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useRutinas } from '@shared/context';
import { iconConfig, iconTooltips } from '@shared/utils/iconConfig';
import { getNormalizedToday, parseAPIDate, toISODateString } from '@shared/utils/dateUtils';
import { getVisibleItemIds } from '@shared/utils/visibilityUtils';
import useHorizontalDragScroll from './hooks/useHorizontalDragScroll';

/**
 * RutinasPendientesHoy
 * - Render compacto para “pendientes de hoy” en formato fila de íconos.
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
}) {
  const theme = useTheme();
  const { rutina, rutinas, loading, fetchRutinas, markItemComplete } = useRutinas();
  const didFetchRef = useRef(false);
  // Umbral un poco mayor para que un "tap" con leve movimiento no se considere drag (especialmente en mobile)
  const { scrollRef, dragRef, isDragging, bind } = useHorizontalDragScroll({
    enabled: enableDragScroll,
    thresholdPx: 12,
  });

  const todayStr = useMemo(() => toISODateString(getNormalizedToday()), []);

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

  useEffect(() => {
    if (didFetchRef.current) return;
    if (rutinaHoy) return;
    if (typeof fetchRutinas !== 'function') return;
    // Importante: no depender de `loading` aquí. En RutinasContext, `loading` puede iniciar en true
    // aun cuando nadie disparó `fetchRutinas()`; si nos bloqueamos, nunca se carga y no se renderiza.
    didFetchRef.current = true;
    fetchRutinas();
  }, [rutinaHoy, fetchRutinas]);

  const itemsHoy = useMemo(() => {
    if (!rutinaHoy) return [];
    const sections = Object.keys(iconConfig || {});
    const items = [];

    sections.forEach((section) => {
      const sectionIcons = iconConfig?.[section] || {};
      const sectionCfg = rutinaHoy?.config?.[section] || {};

      // Reusar la lógica unificada de visibilidad (cadencia + activo)
      const visibleItemIds = getVisibleItemIds(
        sectionIcons,
        section,
        rutinaHoy,
        sectionCfg,
        rutinaHoy?.[section] || {}
      );

      visibleItemIds.forEach((itemId) => {
        const completed = rutinaHoy?.[section]?.[itemId] === true;
        if (completed) return;
        items.push({ section, itemId });
      });
    });

    return items;
  }, [rutinaHoy]);

  // En Agenda “Hoy” queremos el comportamiento tipo TODO: solo pendientes.
  const pendingItems = itemsHoy;

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
      const prev = prevSection?.[itemId] === true;
      // El API espera un payload mínimo: { [itemId]: boolean }
      const itemData = { [itemId]: !prev };
      // Esto actualiza backend + parchea contexto (rutina + rutinas), por lo que Rutinas.jsx queda sincronizado.
      await markItemComplete(rutinaHoy._id, section, itemData);
    } catch {
      // Dejar traza para depurar si el backend/contexto no responde
      console.warn('[RutinasPendientesHoy] No se pudo togglear', { section, itemId });
    }
  };

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
      ref={scrollRef}
      {...bind}
    >
      {pendingItems.map(({ section, itemId }) => {
        const Icon = iconConfig?.[section]?.[itemId];
        const label = iconTooltips?.[section]?.[itemId] || itemId;
        if (!Icon) return null;

        return (
          <Tooltip key={`${section}.${itemId}`} title={label} arrow placement="top">
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

