// Importar iconos
import BathtubOutlinedIcon from '@mui/icons-material/BathtubOutlined';
import BathtubIcon from '@mui/icons-material/Bathtub';
import FaceOutlinedIcon from '@mui/icons-material/FaceOutlined';
import FaceIcon from '@mui/icons-material/Face';
import NightlightOutlinedIcon from '@mui/icons-material/NightlightOutlined';
import NightlightIcon from '@mui/icons-material/Nightlight';
import SpaOutlinedIcon from '@mui/icons-material/SpaOutlined';
import SpaIcon from '@mui/icons-material/Spa';
import RestaurantOutlinedIcon from '@mui/icons-material/RestaurantOutlined';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import FitnessCenterOutlinedIcon from '@mui/icons-material/FitnessCenterOutlined';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import MedicationOutlinedIcon from '@mui/icons-material/MedicationOutlined';
import MedicationIcon from '@mui/icons-material/Medication';
import SelfImprovementOutlinedIcon from '@mui/icons-material/SelfImprovementOutlined';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import DirectionsRunOutlinedIcon from '@mui/icons-material/DirectionsRunOutlined';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import DirectionsBikeOutlinedIcon from '@mui/icons-material/DirectionsBikeOutlined';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import BedOutlinedIcon from '@mui/icons-material/BedOutlined';
import BedIcon from '@mui/icons-material/Bed';
import LocalLaundryServiceOutlinedIcon from '@mui/icons-material/LocalLaundryServiceOutlined';
import LocalLaundryServiceIcon from '@mui/icons-material/LocalLaundryService';
import CleaningServicesOutlinedIcon from '@mui/icons-material/CleaningServicesOutlined';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import DiningOutlinedIcon from '@mui/icons-material/DiningOutlined';
import DiningIcon from '@mui/icons-material/Dining';
import SetMealOutlinedIcon from '@mui/icons-material/SetMealOutlined';
import SetMealIcon from '@mui/icons-material/SetMeal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Configuración de iconos para las diferentes secciones
export const iconConfig = {
  bodyCare: {
    bath: BathtubOutlinedIcon,
    skinCareDay: FaceOutlinedIcon,
    skinCareNight: NightlightOutlinedIcon,
    bodyCream: SpaOutlinedIcon
  },
  nutricion: {
    cocinar: RestaurantOutlinedIcon,
    agua: WaterDropOutlinedIcon,
    protein: SetMealOutlinedIcon,
    meds: MedicationOutlinedIcon
  },
  ejercicio: {
    meditate: SelfImprovementOutlinedIcon,
    stretching: DirectionsRunOutlinedIcon,
    gym: FitnessCenterOutlinedIcon,
    cardio: DirectionsBikeOutlinedIcon
  },
  cleaning: {
    bed: BedOutlinedIcon,
    platos: DiningOutlinedIcon,
    piso: CleaningServicesOutlinedIcon,
    ropa: LocalLaundryServiceOutlinedIcon
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
  fecha: new Date().toISOString().split('T')[0]
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
    
    // Usar la fecha local en lugar de UTC para evitar problemas de zona horaria
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
    // Obtener solo la parte de la fecha en UTC
    const fechaUTC = new Date(fechaStr).toISOString().split('T')[0];
    const hoyUTC = new Date().toISOString().split('T')[0];

    // Calcular diferencia de días en UTC
    const diffDays = (
      new Date(hoyUTC).getTime() - new Date(fechaUTC).getTime()
    ) / (1000 * 60 * 60 * 24);

    if (diffDays === 0) return 'Hoy';
    else if (diffDays === 1) return 'Ayer';
    else if (diffDays === -1) return 'Mañana';
    else return format(new Date(fechaStr), "d 'de' MMMM", { locale: es });
  } catch (error) {
    console.error('[iconConfig] Error al formatear fecha para mostrar:', error);
    return 'Fecha inválida';
  }
}; 