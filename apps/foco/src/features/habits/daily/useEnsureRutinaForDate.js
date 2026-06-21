import { useEffect, useRef } from 'react';
import { useRutinas, useHabits } from '@shared/context';
import { formatDateForAPI } from '@shared/utils/dateUtils';
import { ensureRutinaForDate } from './ensureRutinaForDate';

const ensuredDates = new Set();
const bootInFlight = new Map();

/**
 * Carga hábitos/rutinas y asegura el log del día una sola vez por fecha (sesión).
 */
export default function useEnsureRutinaForDate(targetDate) {
  const { rutinas, fetchRutinas, getRutinaById } = useRutinas();
  const { fetchHabits } = useHabits();
  const rutinasRef = useRef(rutinas);

  const targetDateStr = formatDateForAPI(targetDate);

  useEffect(() => {
    rutinasRef.current = rutinas;
  }, [rutinas]);

  useEffect(() => {
    if (!targetDateStr) return undefined;

    let cancelled = false;

    const boot = async () => {
      if (ensuredDates.has(targetDateStr)) return;

      const inFlight = bootInFlight.get(targetDateStr);
      if (inFlight) {
        await inFlight.catch(() => {});
        return;
      }

      const run = (async () => {
        await Promise.all([
          typeof fetchHabits === 'function' ? fetchHabits().catch(() => {}) : undefined,
          typeof fetchRutinas === 'function' ? fetchRutinas().catch(() => {}) : undefined,
        ]);

        if (cancelled || typeof getRutinaById !== 'function') return;

        await ensureRutinaForDate(targetDate, {
          rutinas: rutinasRef.current,
          getRutinaById,
          fetchRutinas,
        }).catch(() => null);

        if (!cancelled) {
          ensuredDates.add(targetDateStr);
        }
      })();

      bootInFlight.set(targetDateStr, run);
      try {
        await run;
      } finally {
        bootInFlight.delete(targetDateStr);
      }
    };

    boot();
    return () => { cancelled = true; };
  }, [fetchRutinas, fetchHabits, getRutinaById, targetDate, targetDateStr]);
}
