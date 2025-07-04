import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { setUserTimezone } from '../utils/dateUtils';

/**
 * Hook para manejar el timezone del usuario
 * Configura automáticamente el timezone basado en las preferencias del usuario
 */
export const useTimezone = () => {
  const { user } = useAuth();

  useEffect(() => {
    // Configurar el timezone del usuario cuando se carga la información del usuario
    if (user?.preferences?.timezone) {
      console.log('[useTimezone] Configurando timezone del usuario:', user.preferences.timezone);
      setUserTimezone(user.preferences.timezone);
    } else {
      // Si no hay timezone configurado, usar el timezone del navegador como fallback
      const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      console.log('[useTimezone] Usando timezone del navegador:', browserTimezone);
      setUserTimezone(browserTimezone);
    }
  }, [user]);

  return {
    timezone: user?.preferences?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    setTimezone: (timezone) => {
      // Aquí podrías hacer una llamada a la API para actualizar el timezone del usuario
      // Por ahora solo lo configuramos localmente
      setUserTimezone(timezone);
    }
  };
}; 