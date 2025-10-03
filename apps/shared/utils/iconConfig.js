// Importar iconos
import BathtubIcon from '@mui/icons-material/Bathtub';
import PersonIcon from '@mui/icons-material/Person';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import NightlightIcon from '@mui/icons-material/Nightlight';
import SpaIcon from '@mui/icons-material/Spa';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import MedicationIcon from '@mui/icons-material/Medication';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import HotelIcon from '@mui/icons-material/Hotel';
import LocalLaundryServiceIcon from '@mui/icons-material/LocalLaundryService';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import DiningIcon from '@mui/icons-material/Dining';
import SetMealIcon from '@mui/icons-material/SetMeal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Configuración de iconos para las diferentes secciones
export const iconConfig = {
  bodyCare: {
    bath: BathtubIcon,
    skinCareDay: PersonOutlineIcon,
    skinCareNight: NightlightIcon,
    bodyCream: SpaIcon
  },
  nutricion: {
    cocinar: RestaurantIcon,
    agua: WaterDropIcon,
    protein: SetMealIcon,
    meds: MedicationIcon
  },
  ejercicio: {
    meditate: SelfImprovementIcon,
    stretching: DirectionsRunIcon,
    gym: FitnessCenterIcon,
    cardio: DirectionsBikeIcon
  },
  cleaning: {
    bed: HotelIcon,
    platos: DiningIcon,
    piso: CleaningServicesIcon,
    ropa: LocalLaundryServiceIcon
  }
};

// Tooltips para los iconos (guardados por separado)
export const iconTooltips = {
  bodyCare: {
    bath: 'Ducha',
    skinCareDay: 'Cuidado facial día',
    skinCareNight: 'Cuidado facial noche',
    bodyCream: 'Crema corporal'
  },
  nutricion: {
    cocinar: 'Cocinar',
    agua: 'Beber agua',
    protein: 'Proteína',
    meds: 'Medicamentos'
  },
  ejercicio: {
    meditate: 'Meditar',
    stretching: 'Correr',
    gym: 'Gimnasio',
    cardio: 'Bicicleta'
  },
  cleaning: {
    bed: 'Hacer la cama',
    platos: 'Lavar platos',
    piso: 'Limpiar piso',
    ropa: 'Lavar ropa'
  }
};

// Datos por defecto para una nueva rutina
export const defaultFormData = {
  fecha: (() => {
    // Obtener la fecha actual en la zona horaria del usuario
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
  })()
};

// Exportamos una función para dar formato a las fechas de forma consistente
export const formatDate = (fecha) => {
  try {
    // Si es un string ISO, crear un objeto Date
    const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
    
    // Si no es una fecha válida, usar la fecha actual
    if (!(date instanceof Date) || isNaN(date)) {
      console.warn(`[iconConfig] Fecha inválida: ${fecha}, usando fecha actual.`);
      return new Date().toISOString().split('T')[0];
    }
    
    // Normalizar la fecha para evitar problemas con zonas horarias
    // Al usar UTC, aseguramos que la fecha se mantiene constante independientemente de la zona horaria
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    console.log(`[iconConfig] Formato de fecha: ${fecha} -> ${year}-${month}-${day}`);
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error(`[iconConfig] Error al formatear fecha: ${fecha}`, error);
    // En caso de error, devolver la fecha actual
    return new Date().toISOString().split('T')[0];
  }
};

// Función para formatear la fecha en formato corto (mantener compatibilidad con código existente)
export const formatDateLong = (date) => {
  if (!date) return 'Desconocido';
  
  try {
    return format(new Date(date), "d 'de' MMMM", { locale: es });
  } catch (error) {
    console.error('[iconConfig] Error al formatear fecha en formato largo:', error);
    return 'Fecha inválida';
  }
};

// Función para mostrar la fecha en la UI de navegación
export const formatFechaDisplay = (fechaStr) => {
  if (!fechaStr) return 'Sin fecha';
  
  try {
    const fecha = new Date(fechaStr);
    if (isNaN(fecha.getTime())) {
      return 'Fecha inválida';
    }
    
    // Determinar si es hoy, ayer o mostrar la fecha completa
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const fechaCompare = new Date(fecha);
    fechaCompare.setHours(0, 0, 0, 0);
    
    const diffTime = hoy.getTime() - fechaCompare.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Hoy';
    } else if (diffDays === 1) {
      return 'Ayer';
    } else if (diffDays === -1) {
      return 'Mañana';
    } else {
      return format(fecha, "d 'de' MMMM", { locale: es });
    }
  } catch (error) {
    console.error('[iconConfig] Error al formatear fecha para mostrar:', error);
    return 'Fecha inválida';
  }
}; 