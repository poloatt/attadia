/**
 * Estilos personalizados para las notificaciones (snackbars)
 * Siguen la estética geométrica de la aplicación
 */

// Estilos base para todas las notificaciones
const baseStyle = {
  padding: '10px 16px',
  fontWeight: 300,
  fontSize: '0.875rem',
  lineHeight: '1.5',
  letterSpacing: '0.01em',
  boxShadow: '0 3px 8px rgba(0, 0, 0, 0.15)',
  borderRadius: 0,
  clipPath: 'polygon(0% 0%, 100% 0%, 98% 100%, 2% 100%)',
  maxWidth: '380px',
  minWidth: '280px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  margin: '4px 0'
};

// Estilos por tipo de notificación (escala de grises)
const variantStyles = {
  success: {
    backgroundColor: '#424242',
    color: '#f5f5f5',
    borderLeft: '4px solid #757575',
  },
  error: {
    backgroundColor: '#3a3a3a',
    color: '#f5f5f5',
    borderLeft: '4px solid #757575',
  },
  warning: {
    backgroundColor: '#484848',
    color: '#f5f5f5',
    borderLeft: '4px solid #757575',
  },
  info: {
    backgroundColor: '#424242',
    color: '#f5f5f5',
    borderLeft: '4px solid #757575',
  },
  default: {
    backgroundColor: '#333333',
    color: '#f5f5f5',
    borderLeft: '4px solid #757575',
  }
};

/**
 * Configuración de estilos para notistack
 * Exportamos configuraciones y clases CSS para aplicar a las notificaciones
 */
const snackbarConfig = {
  // Configuraciones generales
  maxSnack: 3,
  anchorOrigin: { 
    vertical: 'top', 
    horizontal: 'center' 
  },
  autoHideDuration: 4000,
  style: { marginBottom: '120px' },
  
  // Clases CSS personalizadas (se pueden usar con className en el componente)
  classes: {
    variantSuccess: 'snackbar-success',
    variantError: 'snackbar-error',
    variantWarning: 'snackbar-warning',
    variantInfo: 'snackbar-info',
    variantDefault: 'snackbar-default',
    contentRoot: 'snackbar-content-root'
  },
  
  // Estilos para insertar en el head del documento
  styles: `
    /* Resetear estilos de notistack */
    .SnackbarContent-root {
      background-color: transparent !important;
      padding: 0 !important;
      min-width: unset !important;
      box-shadow: none !important;
    }
    
    /* Estilos base para todos los snackbars */
    .snackbar-base, 
    .MuiSnackbarContent-root, 
    .SnackbarItem-contentRoot, 
    .SnackbarContent-root, 
    .MuiPaper-root.MuiSnackbarContent-root {
      padding: 10px 16px !important;
      font-weight: 300 !important;
      font-size: 0.875rem !important;
      line-height: 1.5 !important;
      letter-spacing: 0.01em !important;
      box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15) !important;
      border-radius: 0 !important;
      clip-path: polygon(0% 0%, 100% 0%, 98% 100%, 2% 100%) !important;
      max-width: 380px !important;
      min-width: 280px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      margin: 4px 0 !important;
    }
    
    /* Variantes de color - escala de grises */
    /* Success */
    .snackbar-success,
    .SnackbarItem-variantSuccess,
    .MuiAlert-standardSuccess,
    .MuiSnackbarContent-root[class*="SnackbarItem-variantSuccess"] {
      background-color: #424242 !important;
      color: #f5f5f5 !important;
      border-left: 4px solid #757575 !important;
    }
    
    /* Error */
    .snackbar-error,
    .SnackbarItem-variantError,
    .MuiAlert-standardError,
    .MuiSnackbarContent-root[class*="SnackbarItem-variantError"] {
      background-color: #3a3a3a !important;
      color: #f5f5f5 !important;
      border-left: 4px solid #757575 !important;
    }
    
    /* Warning */
    .snackbar-warning,
    .SnackbarItem-variantWarning,
    .MuiAlert-standardWarning,
    .MuiSnackbarContent-root[class*="SnackbarItem-variantWarning"] {
      background-color: #484848 !important;
      color: #f5f5f5 !important;
      border-left: 4px solid #757575 !important;
    }
    
    /* Info */
    .snackbar-info,
    .SnackbarItem-variantInfo,
    .MuiAlert-standardInfo,
    .MuiSnackbarContent-root[class*="SnackbarItem-variantInfo"] {
      background-color: #424242 !important;
      color: #f5f5f5 !important;
      border-left: 4px solid #757575 !important;
    }
    
    /* Default */
    .snackbar-default,
    .SnackbarItem-variantDefault,
    .MuiAlert-standardDefault,
    .MuiSnackbarContent-root[class*="SnackbarItem-variantDefault"] {
      background-color: #333333 !important;
      color: #f5f5f5 !important;
      border-left: 4px solid #757575 !important;
    }

    /* Override para iconos */
    .MuiAlert-icon, .MuiSnackbarContent-action {
      color: #f5f5f5 !important;
    }
  `
};

export { baseStyle, variantStyles, snackbarConfig };
export default snackbarConfig; 