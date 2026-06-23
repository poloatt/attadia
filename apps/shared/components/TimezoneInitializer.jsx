import { useTimezone } from '../hooks/useTimezone.js';

/**
 * Configura el timezone del usuario al montar la app.
 */
export default function TimezoneInitializer() {
  useTimezone();
  return null;
}
