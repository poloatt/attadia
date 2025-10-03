/**
 * Configuración de timezones disponibles para la aplicación
 * Incluye los timezones más comunes organizados por región
 */

export const timezoneOptions = [
  // América del Sur
  {
    label: 'América del Sur',
    value: null,
    disabled: true,
    isGroup: true
  },
  {
    label: 'Santiago, Chile (CLT)',
    value: 'America/Santiago',
    offset: 'UTC-3/-4',
    country: 'Chile'
  },
  {
    label: 'Buenos Aires, Argentina (ART)',
    value: 'America/Argentina/Buenos_Aires',
    offset: 'UTC-3',
    country: 'Argentina'
  },
  {
    label: 'São Paulo, Brasil (BRT)',
    value: 'America/Sao_Paulo',
    offset: 'UTC-3',
    country: 'Brasil'
  },
  {
    label: 'Bogotá, Colombia (COT)',
    value: 'America/Bogota',
    offset: 'UTC-5',
    country: 'Colombia'
  },
  {
    label: 'Lima, Perú (PET)',
    value: 'America/Lima',
    offset: 'UTC-5',
    country: 'Perú'
  },
  {
    label: 'Caracas, Venezuela (VET)',
    value: 'America/Caracas',
    offset: 'UTC-4',
    country: 'Venezuela'
  },
  {
    label: 'La Paz, Bolivia (BOT)',
    value: 'America/La_Paz',
    offset: 'UTC-4',
    country: 'Bolivia'
  },
  {
    label: 'Asunción, Paraguay (PYT)',
    value: 'America/Asuncion',
    offset: 'UTC-3/-4',
    country: 'Paraguay'
  },
  {
    label: 'Montevideo, Uruguay (UYT)',
    value: 'America/Montevideo',
    offset: 'UTC-3',
    country: 'Uruguay'
  },
  {
    label: 'Quito, Ecuador (ECT)',
    value: 'America/Guayaquil',
    offset: 'UTC-5',
    country: 'Ecuador'
  },

  // América del Norte
  {
    label: 'América del Norte',
    value: null,
    disabled: true,
    isGroup: true
  },
  {
    label: 'Nueva York, Estados Unidos (EST)',
    value: 'America/New_York',
    offset: 'UTC-5/-4',
    country: 'Estados Unidos'
  },
  {
    label: 'Los Ángeles, Estados Unidos (PST)',
    value: 'America/Los_Angeles',
    offset: 'UTC-8/-7',
    country: 'Estados Unidos'
  },
  {
    label: 'Chicago, Estados Unidos (CST)',
    value: 'America/Chicago',
    offset: 'UTC-6/-5',
    country: 'Estados Unidos'
  },
  {
    label: 'Ciudad de México, México (CST)',
    value: 'America/Mexico_City',
    offset: 'UTC-6',
    country: 'México'
  },
  {
    label: 'Toronto, Canadá (EST)',
    value: 'America/Toronto',
    offset: 'UTC-5/-4',
    country: 'Canadá'
  },

  // Europa
  {
    label: 'Europa',
    value: null,
    disabled: true,
    isGroup: true
  },
  {
    label: 'Madrid, España (CET)',
    value: 'Europe/Madrid',
    offset: 'UTC+1/+2',
    country: 'España'
  },
  {
    label: 'Londres, Reino Unido (GMT)',
    value: 'Europe/London',
    offset: 'UTC+0/+1',
    country: 'Reino Unido'
  },
  {
    label: 'París, Francia (CET)',
    value: 'Europe/Paris',
    offset: 'UTC+1/+2',
    country: 'Francia'
  },
  {
    label: 'Roma, Italia (CET)',
    value: 'Europe/Rome',
    offset: 'UTC+1/+2',
    country: 'Italia'
  },
  {
    label: 'Berlín, Alemania (CET)',
    value: 'Europe/Berlin',
    offset: 'UTC+1/+2',
    country: 'Alemania'
  },

  // Asia
  {
    label: 'Asia',
    value: null,
    disabled: true,
    isGroup: true
  },
  {
    label: 'Tokio, Japón (JST)',
    value: 'Asia/Tokyo',
    offset: 'UTC+9',
    country: 'Japón'
  },
  {
    label: 'Seúl, Corea del Sur (KST)',
    value: 'Asia/Seoul',
    offset: 'UTC+9',
    country: 'Corea del Sur'
  },
  {
    label: 'Shangai, China (CST)',
    value: 'Asia/Shanghai',
    offset: 'UTC+8',
    country: 'China'
  },
  {
    label: 'Nueva Delhi, India (IST)',
    value: 'Asia/Kolkata',
    offset: 'UTC+5:30',
    country: 'India'
  },

  // Oceanía
  {
    label: 'Oceanía',
    value: null,
    disabled: true,
    isGroup: true
  },
  {
    label: 'Sídney, Australia (AEST)',
    value: 'Australia/Sydney',
    offset: 'UTC+10/+11',
    country: 'Australia'
  },
  {
    label: 'Auckland, Nueva Zelanda (NZST)',
    value: 'Pacific/Auckland',
    offset: 'UTC+12/+13',
    country: 'Nueva Zelanda'
  }
];

/**
 * Obtiene el timezone por defecto basado en la configuración del navegador
 * @returns {string} Timezone detectado o por defecto
 */
export const getDefaultTimezone = () => {
  try {
    const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Verificar si el timezone del navegador está en nuestra lista
    const found = timezoneOptions.find(tz => tz.value === browserTimezone);
    
    if (found) {
      return browserTimezone;
    }
    
    // Si no está en la lista, usar Chile como por defecto
    return 'America/Santiago';
  } catch (error) {
    console.warn('Error al detectar timezone del navegador:', error);
    return 'America/Santiago';
  }
};

/**
 * Obtiene información detallada de un timezone
 * @param {string} timezone - Timezone a buscar
 * @returns {Object|null} Información del timezone o null si no se encuentra
 */
export const getTimezoneInfo = (timezone) => {
  return timezoneOptions.find(tz => tz.value === timezone) || null;
};

/**
 * Valida si un timezone es válido
 * @param {string} timezone - Timezone a validar
 * @returns {boolean} True si es válido
 */
export const isValidTimezone = (timezone) => {
  try {
    Intl.DateTimeFormat('en', { timeZone: timezone });
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Formatea un timezone para mostrar en la UI
 * @param {string} timezone - Timezone a formatear
 * @returns {string} Timezone formateado
 */
export const formatTimezone = (timezone) => {
  const info = getTimezoneInfo(timezone);
  if (info) {
    return `${info.label} (${info.offset})`;
  }
  return timezone;
}; 