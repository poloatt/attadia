import React, { useEffect, useMemo, useRef, useCallback } from 'react';
import { Box, Typography, IconButton, Tooltip, Divider, CircularProgress } from '@mui/material';
import { useRutinas } from '@shared/context';
import { iconConfig } from '@shared/utils';
import shouldShowItem from '@shared/utils/shouldShowItem';
import { contarCompletadosEnPeriodo } from '@shared/utils/cadenciaUtils';
import { getNormalizedToday, parseAPIDate, toISODateString } from '@shared/utils/dateUtils';

const sections = ['bodyCare', 'nutricion', 'ejercicio', 'cleaning'];

const getHistorialDates = (rutina, section, itemId) => {
  // RutinasContext adjunta historial en forma: historial[section][itemId][YYYY-MM-DD] = true
  const sectionHist = rutina?.historial?.[section];
  const itemHist = sectionHist?.[itemId];
  let historial = [];

  if (Array.isArray(itemHist)) {
    historial = itemHist.map(d => new Date(d));
  } else if (itemHist && typeof itemHist === 'object') {
    historial = Object.entries(itemHist)
      .filter(([, completed]) => completed === true)
      .map(([dateStr]) => new Date(dateStr));
  } else if (sectionHist && typeof sectionHist === 'object') {
    historial = Object.entries(sectionHist)
      .filter(([, items]) => items && items[itemId] === true)
      .map(([dateStr]) => new Date(dateStr));
  }

  // Incluir hoy si el logger diario marca completado
  if (rutina?.[section]?.[itemId] === true) {
    historial.push(parseAPIDate(rutina.fecha) || new Date());
  }

  return historial;
};

export default function RutinasPendientesHoy() {
  const { rutinas, loading, fetchRutinas, markItemComplete } = useRutinas();
  const attemptedFetchRef = useRef(false);

  // Asegurar que haya datos (y que exista rutina de hoy vía auto-create en fetchRutinas)
  useEffect(() => {
    if (attemptedFetchRef.current) return;
    if (loading) return;
    if (Array.isArray(rutinas) && rutinas.length > 0) return;
    attemptedFetchRef.current = true;
    fetchRutinas();
  }, [rutinas, loading, fetchRutinas]);

  const todayKey = useMemo(() => toISODateString(getNormalizedToday()), []);

  const rutinaHoy = useMemo(() => {
    const list = Array.isArray(rutinas) ? rutinas : [];
    return list.find(r => {
      try {
        return toISODateString(parseAPIDate(r.fecha)) === todayKey;
      } catch {
        return false;
      }
    }) || null;
  }, [rutinas, todayKey]);

  const pendientes = useMemo(() => {
    if (!rutinaHoy) return [];

    const out = [];
    sections.forEach(section => {
      const sectionIcons = iconConfig?.[section] || {};
      const sectionConfig = rutinaHoy?.config?.[section] || {};

      Object.entries(sectionIcons).forEach(([itemId, Icon]) => {
        const cfg = sectionConfig?.[itemId];
        if (cfg && cfg.activo === false) return;

        // shouldShowItem ya contempla cuota cumplida (progresoActual/ultimoPeriodo o historial)
        const visible = shouldShowItem(section, itemId, rutinaHoy, { historial: rutinaHoy?.historial || {} });
        if (!visible) return;

        const isCompletedToday = rutinaHoy?.[section]?.[itemId] === true;
        const frecuencia = Number(cfg?.frecuencia || 1);
        const tipo = String(cfg?.tipo || 'DIARIO').toUpperCase();
        const periodo = cfg?.periodo || (tipo === 'SEMANAL' ? 'CADA_SEMANA' : tipo === 'MENSUAL' ? 'CADA_MES' : 'CADA_DIA');

        const historial = getHistorialDates(rutinaHoy, section, itemId);
        const completadosEnPeriodo = contarCompletadosEnPeriodo(getNormalizedToday(), tipo, periodo, historial);
        const completadosDisplay = tipo === 'DIARIO' ? (isCompletedToday ? 1 : 0) : completadosEnPeriodo;

        out.push({
          section,
          itemId,
          Icon,
          frecuencia,
          completados: Math.min(frecuencia, Math.max(0, Number(completadosDisplay || 0))),
          isCompletedToday
        });
      });
    });

    return out;
  }, [rutinaHoy]);

  const handleToggle = useCallback(async (p) => {
    if (!rutinaHoy?._id) return;
    // Toggle simple del logger diario (1 check por día)
    await markItemComplete(rutinaHoy._id, p.section, { [p.itemId]: !p.isCompletedToday });
  }, [rutinaHoy?._id, markItemComplete]);

  // UI minimalista
  if (loading && (!Array.isArray(rutinas) || rutinas.length === 0)) {
    return (
      <Box sx={{ mb: 2, px: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
          <CircularProgress size={18} />
          <Typography variant="body2" sx={{ opacity: 0.8 }}>Cargando rutinas…</Typography>
        </Box>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
      </Box>
    );
  }

  if (!rutinaHoy || pendientes.length === 0) {
    return (
      <Box sx={{ mb: 2, px: 1 }}>
        <Typography variant="caption" sx={{ opacity: 0.6 }}>
          Rutinas: sin pendientes para hoy
        </Typography>
        <Divider sx={{ mt: 1, borderColor: 'rgba(255,255,255,0.06)' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Box
        sx={{
          mt: 0.5,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 0.75,
          px: 1,
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        {pendientes.map((p) => (
          <Tooltip key={`${p.section}:${p.itemId}`} title={`${p.itemId} • ${p.completados}/${p.frecuencia}`} arrow placement="top">
            <IconButton
              size="small"
              onClick={() => handleToggle(p)}
              sx={{
                width: 38,
                height: 38,
                borderRadius: '50%', // match look&feel de Rutinas (iconos circulares)
                bgcolor: 'transparent',
                color: 'rgba(255,255,255,0.5)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  color: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              {p.Icon ? <p.Icon fontSize="small" /> : <span />}
            </IconButton>
          </Tooltip>
        ))}
      </Box>
      <Divider sx={{ mt: 1.25, borderColor: 'rgba(255,255,255,0.06)' }} />
    </Box>
  );
}


