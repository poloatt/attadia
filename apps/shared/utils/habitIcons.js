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
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FavoriteIcon from '@mui/icons-material/Favorite';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import BedtimeIcon from '@mui/icons-material/Bedtime';
import ShowerIcon from '@mui/icons-material/Shower';
import FaceIcon from '@mui/icons-material/Face';
import EmojiFoodBeverageIcon from '@mui/icons-material/EmojiFoodBeverage';
import LocalDrinkIcon from '@mui/icons-material/LocalDrink';
import SportsGymnasticsIcon from '@mui/icons-material/SportsGymnastics';
import PoolIcon from '@mui/icons-material/Pool';
import HomeIcon from '@mui/icons-material/Home';
import KitchenIcon from '@mui/icons-material/Kitchen';
import HomeRepairServiceIcon from '@mui/icons-material/HomeRepairService';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import FaceRetouchingNaturalIcon from '@mui/icons-material/FaceRetouchingNatural';
import GrassIcon from '@mui/icons-material/Grass';
import YardIcon from '@mui/icons-material/Yard';
import MedicationLiquidIcon from '@mui/icons-material/MedicationLiquid';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import StyleIcon from '@mui/icons-material/Style';
import CreateIcon from '@mui/icons-material/Create';
import DrawIcon from '@mui/icons-material/Draw';
import StickyNote2Icon from '@mui/icons-material/StickyNote2';
import NotesIcon from '@mui/icons-material/Notes';
import EditNoteIcon from '@mui/icons-material/EditNote';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import BlenderIcon from '@mui/icons-material/Blender';
import EggAltIcon from '@mui/icons-material/EggAlt';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import SoapIcon from '@mui/icons-material/Soap';
import BrushIcon from '@mui/icons-material/Brush';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PetsIcon from '@mui/icons-material/Pets';
import RecyclingIcon from '@mui/icons-material/Recycling';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import HealingIcon from '@mui/icons-material/Healing';
import SvgIcon from '@mui/material/SvgIcon';
import { createElement } from 'react';

const TOOTH_ICON_PATH = 'M12 2C9.1 2 6.8 3.8 5.7 6.4 5.1 7.8 4.8 9.4 4.8 11c0 2.2 1 4.1 2.4 5.3.3 1.9.9 3.7 1.6 5.1.3.6.9 1 1.6 1h.8c.7 0 1.3-.4 1.6-1 .7-1.4 1.3-3.2 1.6-5.1 1.4-1.2 2.4-3.1 2.4-5.3 0-1.6-.3-3.2-.9-4.6C17.2 3.8 14.9 2 12 2zm-1.2 14.5c-.4 1.1-.8 2.2-1.2 3h2.8c-.4-.8-.8-1.9-1.2-3-.6.1-1 .1-1.6 0z';

/** Icono de diente (no disponible en @mui/icons-material). */
function ToothIcon(props) {
  return createElement(
    SvgIcon,
    { ...props, viewBox: '0 0 24 24' },
    createElement('path', { d: TOOTH_ICON_PATH }),
  );
}

/** Nombres reservados (fallback UI), no mostrados en el picker. */
export const HABIT_ICON_PICKER_EXCLUDED = new Set(['Add']);

/** Etiquetas para tooltips y accesibilidad (no se muestran en el picker). */
export const HABIT_ICON_LABELS = {
  Bathtub: 'Bañera',
  Person: 'Persona',
  PersonOutline: 'Cuidado personal',
  Nightlight: 'Rutina nocturna',
  Spa: 'Spa / bienestar',
  Restaurant: 'Cocinar',
  WaterDrop: 'Beber agua',
  FitnessCenter: 'Gimnasio',
  Medication: 'Medicamentos',
  SelfImprovement: 'Meditación',
  DirectionsRun: 'Correr',
  DirectionsBike: 'Bicicleta',
  Hotel: 'Hacer la cama',
  LocalLaundryService: 'Lavar ropa',
  CleaningServices: 'Limpieza',
  Dining: 'Lavar platos',
  SetMeal: 'Comida',
  CheckCircle: 'Completado',
  Favorite: 'Favorito',
  LocalFireDepartment: 'Energía',
  WbSunny: 'Mañana / sol',
  Bedtime: 'Dormir',
  Shower: 'Ducha',
  Face: 'Cuidado facial',
  EmojiFoodBeverage: 'Bebida caliente',
  LocalDrink: 'Bebida',
  SportsGymnastics: 'Gimnasia',
  Pool: 'Natación / piscina',
  Home: 'Hogar',
  Kitchen: 'Cocina',
  Vacuum: 'Aspirar',
  DryCleaning: 'Lavado en seco',
  Add: 'Agregar',
  ContentCut: 'Tijera',
  Salon: 'Peluquería',
  Grass: 'Cortar el pasto',
  Yard: 'Jardín',
  Cream: 'Crema',
  Perfume: 'Perfume',
  Razor: 'Afeitado / Gillette',
  Create: 'Lápiz',
  Draw: 'Escritura',
  StickyNote2: 'Notas',
  Notes: 'Lista de notas',
  EditNote: 'Diario',
  ContentPaste: 'Apuntes',
  Blender: 'Scoop de proteína',
  EggAlt: 'Proteína',
  DeleteOutline: 'Basura',
  LocalFlorist: 'Regar plantas',
  Soap: 'Jabón',
  Brush: 'Cepillo',
  MenuBook: 'Lectura',
  Pets: 'Mascotas',
  Recycling: 'Reciclar',
  ElectricBolt: 'Energía',
  Healing: 'Cuidados / salud',
  Tooth: 'Diente / dental',
};

export const iconMap = {
  Bathtub: BathtubIcon,
  Person: PersonIcon,
  PersonOutline: PersonOutlineIcon,
  Nightlight: NightlightIcon,
  Spa: SpaIcon,
  Restaurant: RestaurantIcon,
  WaterDrop: WaterDropIcon,
  FitnessCenter: FitnessCenterIcon,
  Medication: MedicationIcon,
  SelfImprovement: SelfImprovementIcon,
  DirectionsRun: DirectionsRunIcon,
  DirectionsBike: DirectionsBikeIcon,
  Hotel: HotelIcon,
  LocalLaundryService: LocalLaundryServiceIcon,
  CleaningServices: CleaningServicesIcon,
  Dining: DiningIcon,
  SetMeal: SetMealIcon,
  Add: AddIcon,
  CheckCircle: CheckCircleIcon,
  Favorite: FavoriteIcon,
  LocalFireDepartment: LocalFireDepartmentIcon,
  WbSunny: WbSunnyIcon,
  Bedtime: BedtimeIcon,
  Shower: ShowerIcon,
  Face: FaceIcon,
  EmojiFoodBeverage: EmojiFoodBeverageIcon,
  LocalDrink: LocalDrinkIcon,
  SportsGymnastics: SportsGymnasticsIcon,
  Pool: PoolIcon,
  Home: HomeIcon,
  Kitchen: KitchenIcon,
  Vacuum: HomeRepairServiceIcon,
  DryCleaning: LocalLaundryServiceIcon,
  ContentCut: ContentCutIcon,
  Salon: FaceRetouchingNaturalIcon,
  Grass: GrassIcon,
  Yard: YardIcon,
  Cream: MedicationLiquidIcon,
  Perfume: AutoAwesomeIcon,
  Razor: StyleIcon,
  Create: CreateIcon,
  Draw: DrawIcon,
  StickyNote2: StickyNote2Icon,
  Notes: NotesIcon,
  EditNote: EditNoteIcon,
  ContentPaste: ContentPasteIcon,
  Blender: BlenderIcon,
  EggAlt: EggAltIcon,
  DeleteOutline: DeleteOutlineIcon,
  LocalFlorist: LocalFloristIcon,
  Soap: SoapIcon,
  Brush: BrushIcon,
  MenuBook: MenuBookIcon,
  Pets: PetsIcon,
  Recycling: RecyclingIcon,
  ElectricBolt: ElectricBoltIcon,
  Healing: HealingIcon,
  Tooth: ToothIcon,
};

export function getIconByName(iconName) {
  if (!iconName || typeof iconName !== 'string') return null;
  return iconMap[iconName] || null;
}

export function getHabitIconLabel(iconName) {
  return HABIT_ICON_LABELS[iconName] || iconName;
}

/** Lista completa para picker, derivada de iconMap (sin drift manual). */
export function getHabitIconOptions() {
  return Object.keys(iconMap)
    .filter((name) => !HABIT_ICON_PICKER_EXCLUDED.has(name))
    .map((name) => ({ name, label: getHabitIconLabel(name) }))
    .sort((a, b) => a.label.localeCompare(b.label, 'es'));
}

export const availableIcons = getHabitIconOptions();

export const DEFAULT_HABIT_ICON = 'Bathtub';
