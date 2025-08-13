import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { parseAPIDate } from './dateUtils';

export const getPeriodBounds = (tipo, refDate) => {
  const date = refDate instanceof Date ? refDate : (parseAPIDate(refDate) || new Date());
  const upperTipo = (tipo || 'DIARIO').toUpperCase();
  if (upperTipo === 'SEMANAL') {
    return {
      inicio: startOfWeek(date, { weekStartsOn: 1 }),
      fin: endOfWeek(date, { weekStartsOn: 1 })
    };
  }
  if (upperTipo === 'MENSUAL') {
    return {
      inicio: startOfMonth(date),
      fin: endOfMonth(date)
    };
  }
  // Diario
  return {
    inicio: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0),
    fin: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
  };
};

export const computeItemProgressFromRecords = (rutinas, section, itemId, refDate, tipo) => {
  try {
    if (!Array.isArray(rutinas)) return 0;
    const { inicio, fin } = getPeriodBounds(tipo, refDate);
    const uniques = new Set();
    rutinas.forEach(r => {
      if (!r || !r.fecha) return;
      const d = parseAPIDate(r.fecha) || new Date(r.fecha);
      if (d >= inicio && d <= fin) {
        if (r?.[section]?.[itemId] === true) {
          const key = d.toISOString().split('T')[0];
          uniques.add(key);
        }
      }
    });
    return uniques.size;
  } catch {
    return 0;
  }
};

export const reconcileRoutineProgressFromRecords = (rutina, rutinas) => {
  try {
    if (!rutina || !rutina.config) return rutina;
    const refDate = parseAPIDate(rutina.fecha) || new Date();
    const sections = ['bodyCare', 'nutricion', 'ejercicio', 'cleaning'];
    const updated = { ...rutina, config: { ...(rutina.config || {}) } };
    sections.forEach(section => {
      const secCfg = updated.config[section] || {};
      const newSec = { ...secCfg };
      Object.entries(secCfg).forEach(([itemId, cfg]) => {
        const tipo = (cfg?.tipo || 'DIARIO').toUpperCase();
        const freq = Number(cfg?.frecuencia || 1);
        const { inicio, fin } = getPeriodBounds(tipo, refDate);
        let progreso = 0;
        if (tipo === 'DIARIO') {
          progreso = updated?.[section]?.[itemId] ? 1 : 0;
        } else {
          progreso = computeItemProgressFromRecords(rutinas || [], section, itemId, refDate, tipo);
        }
        newSec[itemId] = {
          ...cfg,
          progresoActual: Math.min(freq, Math.max(0, Number(progreso)) ),
          ultimoPeriodo: { inicio: inicio.toISOString(), fin: fin.toISOString() }
        };
      });
      updated.config[section] = newSec;
    });
    return updated;
  } catch {
    return rutina;
  }
};




