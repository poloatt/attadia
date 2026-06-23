import { useEffect, useState } from 'react';
import clienteAxios from '@shared/config/axios';

let cachedHabitsPreferences;

/**
 * Preferencias de hábitos del usuario (plantilla).
 * Cache en memoria para evitar parpadeos al cambiar Ahora/Luego.
 */
export default function useHabitsPreferences() {
  const [habitsPreferences, setHabitsPreferences] = useState(
    () => (cachedHabitsPreferences !== undefined ? cachedHabitsPreferences : null),
  );

  useEffect(() => {
    if (cachedHabitsPreferences !== undefined) {
      setHabitsPreferences(cachedHabitsPreferences);
      return undefined;
    }

    let cancelled = false;

    clienteAxios.get('/api/users/preferences/habits')
      .then((response) => {
        const prefs = response.data?.habits || {};
        cachedHabitsPreferences = prefs;
        if (!cancelled) setHabitsPreferences(prefs);
      })
      .catch(() => {
        cachedHabitsPreferences = {};
        if (!cancelled) setHabitsPreferences({});
      });

    return () => { cancelled = true; };
  }, []);

  return {
    habitsPreferences,
    prefsReady: habitsPreferences !== null,
  };
}
