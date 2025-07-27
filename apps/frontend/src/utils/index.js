/**
 * Exportaciones unificadas para utilidades y hooks centralizados
 * Elimina duplicación de imports en componentes
 */

// Hooks personalizados
export { default as useResponsive } from '../hooks/useResponsive';

// Utilidades de navegación
export {
  findActiveModule,
  findActiveLevel1,
  getLevel2Children,
  useNavigationState,
  getMainModules,
  reorderModulesWithActiveFirst,
  isRouteActive,
  getBreadcrumbInfo
} from './navigationUtils';

// Constantes y configuraciones UI
export {
  SIDEBAR_CONFIG,
  HEADER_CONFIG,
  TOOLBAR_CONFIG,
  FOOTER_CONFIG,
  Z_INDEX,
  TRANSITIONS,
  UI_COLORS,
  BREAKPOINTS,
  SPACING,
  STORAGE_KEYS,
  ICON_SIZES,
  BORDER_RADIUS,
  calculateMainMargin,
  calculateTopPadding,
  getChildPadding
} from '../config/uiConstants';

// Componentes reutilizables de iconos
export {
  DynamicIcon,
  ClickableIcon,
  IconWithText,
  useIconExists
} from '../components/common/DynamicIcon';

// Re-exportar iconos y utilidades de navegación originales para compatibilidad
export { icons, getIconByKey } from '../navigation/menuIcons';
export { modulos } from '../navigation/menuStructure'; 