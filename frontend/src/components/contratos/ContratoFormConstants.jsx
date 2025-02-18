import {
  House,
  Apartment,
  Business,
  Warehouse,
  LocationOn,
  Home,
  MeetingRoom
} from '@mui/icons-material';

export const TIPOS_PROPIEDAD = [
  { valor: 'CASA', icon: <House />, label: 'Casa', color: '#4caf50' },
  { valor: 'DEPARTAMENTO', icon: <Apartment />, label: 'Departamento', color: '#2196f3' },
  { valor: 'OFICINA', icon: <Business />, label: 'Oficina', color: '#9c27b0' },
  { valor: 'LOCAL', icon: <Warehouse />, label: 'Local', color: '#ff9800' },
  { valor: 'TERRENO', icon: <LocationOn />, label: 'Terreno', color: '#795548' }
];

export const TIPO_ALQUILER = [
  { valor: false, icon: <Home />, label: 'Propiedad', color: '#4caf50' },
  { valor: true, icon: <MeetingRoom />, label: 'Habitación', color: '#2196f3' }
]; 