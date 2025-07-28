/**
 * Constantes centralizadas de UI para eliminar duplicación
 * Usado en: SidebarContext.jsx, Sidebar.jsx, SidebarResizer.jsx, Layout.jsx
 */

// ===== SIDEBAR CONFIGURATION =====
export const SIDEBAR_CONFIG = {
  // Dimensiones principales
  collapsedWidth: 56,
  defaultWidth: 280,
  minWidth: 200,
  maxWidth: 400,
  
  // Configuración de parents (nivel 1)
  parent: {
    paddingUnits: 2,        // Theme spacing units (2 * 8px = 16px)
    paddingPx: 16,          // Equivalente en píxeles
    iconWidth: 36,          // Ancho real del ícono parent
    iconMinWidth: 36,       // minWidth del ListItemIcon parent
    iconMarginRight: 0,     // Margen derecho del ícono (si existe)
    minHeight: 36,          // Altura mínima del ListItemButton
    borderRadius: '12px',   // Border radius de los botones
    marginBottom: 0.25      // Margen inferior entre items
  },
  
  // Configuración de children (nivel 2)
  child: {
    collapsedPadding: 2,    // Theme units cuando colapsada
    baseAlignment: 52,      // 16px (parent) + 36px (icon) = punto base de alineación
    additionalGap: 0,       // Gap adicional si es necesario
    alignmentOffset: 0,     // Offset fino para ajustes
    iconSize: 'small',      // Tamaño de íconos child
    minHeight: 32,          // Altura mínima del ListItemButton child
    marginBottom: 0.15      // Margen inferior entre items child
  },
  
  // Función helper para calcular padding child
  calculateChildPadding() {
    return `${this.child.baseAlignment + this.child.additionalGap + this.child.alignmentOffset}px`;
  }
};

// ===== HEADER AND TOOLBAR CONFIGURATION =====
export const HEADER_CONFIG = {
  height: 40,
  zIndex: 1400
};

export const TOOLBAR_CONFIG = {
  height: 40,
  zIndex: 1399
};

// ===== FORM AND COMPONENT HEIGHTS =====
export const FORM_HEIGHTS = {
  input: 40,           // Altura estándar para inputs y campos de formulario
  button: 40,          // Altura estándar para botones
  iconButton: 40,      // Altura estándar para icon buttons
  toolbar: 40,         // Altura estándar para toolbars
  header: 40,          // Altura estándar para headers
  minHeight: 40,       // Altura mínima estándar
  tableRow: 40,        // Altura estándar para filas de tabla
  chip: 32,            // Altura para chips
  small: 32,           // Altura pequeña
  medium: 40,          // Altura media (estándar)
  large: 48            // Altura grande
};

// ===== FOOTER CONFIGURATION =====
export const FOOTER_CONFIG = {
  height: 48,
  zIndex: 1300
};

// ===== Z-INDEX HIERARCHY =====
export const Z_INDEX = {
  header: 1400,
  toolbar: 1399,
  footer: 1300,
  sidebarResizer: 1300,
  sidebar: 1100,
  main: 1
};

// ===== TRANSITIONS =====
export const TRANSITIONS = {
  sidebarWidth: 'width 0.3s ease',
  colorChange: 'color 0.2s',
  backgroundChange: 'background 0.2s',
  default: '0.2s ease'
};

// ===== COLORS AND BORDERS =====
export const UI_COLORS = {
  border: '1.5px solid #232323',
  backgroundActive: {
    parent: '#323232',
    child: '#232323'
  },
  backgroundHover: {
    parent: '#3a3a3a',
    child: '#232323',
    default: '#232323'
  },
  backgroundDefault: 'background.default'
};

// ===== BREAKPOINTS (Material-UI equivalents) =====
export const BREAKPOINTS = {
  mobile: 600,    // sm breakpoint
  tablet: 960,    // md breakpoint
  desktop: 1280   // lg breakpoint
};

// ===== SPACING =====
export const SPACING = {
  bottomNavigationHeight: 88, // Para mobile
  sidebarPadding: {
    xs: '88px',
    sm: '88px', 
    md: 0
  }
};

// ===== LOCAL STORAGE KEYS =====
export const STORAGE_KEYS = {
  sidebarOpen: 'sidebarOpen',
  sidebarWidth: 'sidebarWidth',
  uiSettings: 'uiSettings'
};

// ===== ICON SIZES =====
export const ICON_SIZES = {
  small: 'small',
  medium: 'medium',
  large: 'large'
};

// ===== BORDER RADIUS =====
export const BORDER_RADIUS = {
  button: '12px',
  small: 1,
  medium: 4,
  circle: '50%'
};

// ===== UTILITY FUNCTIONS =====

/**
 * Calcula el margen principal basado en el estado de la sidebar
 * @param {boolean} isOpen - Estado de apertura de la sidebar
 * @param {number} sidebarWidth - Ancho de la sidebar expandida
 * @param {boolean} isMobileOrTablet - Si es mobile o tablet
 * @param {boolean} showSidebarCollapsed - Si mostrar sidebar colapsada en mobile
 * @returns {number} - Margen calculado
 */
export function calculateMainMargin(isOpen, sidebarWidth, isMobileOrTablet, showSidebarCollapsed = false) {
  if (isMobileOrTablet) {
    return (showSidebarCollapsed && isOpen) ? sidebarWidth : 0;
  }
  return isOpen ? sidebarWidth : SIDEBAR_CONFIG.collapsedWidth;
}

/**
 * Calcula el padding total superior (header + toolbar)
 * @param {boolean} showToolbar - Si mostrar toolbar
 * @returns {number} - Padding total superior
 */
export function calculateTopPadding(showToolbar) {
  return HEADER_CONFIG.height + (showToolbar ? TOOLBAR_CONFIG.height : 0);
}

/**
 * Obtiene la configuración de padding para children
 * @param {boolean} isOpen - Estado de apertura de la sidebar
 * @returns {string|number} - Padding calculado
 */
export function getChildPadding(isOpen) {
  if (!isOpen) return SIDEBAR_CONFIG.child.collapsedPadding;
  return SIDEBAR_CONFIG.calculateChildPadding();
} 