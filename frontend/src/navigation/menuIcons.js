import {
  TrendingUpOutlined,
  AccountBalanceWalletOutlined,
  CurrencyExchangeOutlined,
  RepeatOutlined,
  PersonSearchOutlined,
  ApartmentOutlined,
  PersonOutlined,
  DescriptionOutlined,
  HotelOutlined,
  LocalHospitalOutlined,
  MonitorHeartOutlined,
  ScienceOutlined,
  RestaurantOutlined,
  AccessTimeOutlined,
  FolderOutlined,
  TaskOutlined,
  ArchiveOutlined,
  SettingsOutlined,
  ManageAccountsOutlined,
  AccountCircleOutlined,
  AccountBalanceOutlined,
  DirectionsCarOutlined, // auto
  Inventory2Outlined, // inventario
  AttachMoneyOutlined, // bolsa de dinero (finanzas)
  FitnessCenterOutlined, // pesa de gym para rutinas
  ExpandLess,
  ExpandMore,
  FiberManualRecordOutlined,
  KeyboardBackspaceOutlined,
  MonetizationOnOutlined, // icono "$" dentro de círculo para assets
  AddCircleOutline // cruz médica dentro de círculo para salud
} from '@mui/icons-material';

export const icons = {
  trendingUp: TrendingUpOutlined,
  wallet: AccountBalanceWalletOutlined,
  currency: CurrencyExchangeOutlined,
  repeat: RepeatOutlined,
  personSearch: PersonSearchOutlined,
  apartment: ApartmentOutlined,
  person: PersonOutlined,
  description: DescriptionOutlined,
  hotel: HotelOutlined,
  health: AddCircleOutline, // cruz médica dentro de círculo para la sección salud
  monitorHeart: MonitorHeartOutlined, // monitor heart para data corporal
  science: ScienceOutlined,
  restaurant: RestaurantOutlined,
  accessTime: AccessTimeOutlined,
  folder: FolderOutlined,
  task: TaskOutlined,
  archive: ArchiveOutlined,
  settings: SettingsOutlined,
  manageAccounts: ManageAccountsOutlined,
  accountCircle: AccountCircleOutlined,
  accountBalance: AccountBalanceOutlined,
  auto: DirectionsCarOutlined, // auto
  inversiones: TrendingUpOutlined, // flecha hacia arriba
  inventario: Inventory2Outlined, // caja de inventario
  moneyBag: AttachMoneyOutlined, // bolsa de dinero (finanzas)
  fitnessCenter: FitnessCenterOutlined, // pesa de gym para rutinas
  bankConnections: AccountBalanceWalletOutlined, // billetera digital
  expandLess: ExpandLess,
  expandMore: ExpandMore,
  fiberManualRecord: FiberManualRecordOutlined,
  arrowBack: KeyboardBackspaceOutlined,
  dollarSign: MonetizationOnOutlined // icono "$" dentro de círculo para assets
};

// Función helper para obtener el icono por clave
export const getIconByKey = (iconKey) => {
  return icons[iconKey] || icons.folder; // fallback a folder si no existe
};

// Función helper para verificar si una ruta está activa
export const isRouteActive = (currentPath, activePaths) => {
  if (Array.isArray(activePaths)) {
    return activePaths.some(path => {
      if (path === '/') {
        return currentPath === '/' || currentPath.startsWith('/assets/');
      }
      return currentPath === path || currentPath.startsWith(path + '/');
    });
  }
  return currentPath === activePaths || currentPath.startsWith(activePaths + '/');
}; 