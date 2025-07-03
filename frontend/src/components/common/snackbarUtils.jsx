import React, { createRef } from 'react';
import { SnackbarProvider, useSnackbar } from 'notistack';

/**
 * Referencia al proveedor SnackbarProvider para usar en utilidades globales
 */
const notistackRef = createRef();

/**
 * Acciones personalizadas por defecto para las notificaciones
 * @returns Componente de acción de cierre para todas las notificaciones
 */
const onSnackbarDismiss = key => () => {
  notistackRef.current.closeSnackbar(key);
};

/**
 * Objeto de utilidades para mostrar notificaciones desde cualquier parte de la aplicación
 * sin necesidad de usar el hook useSnackbar
 */
export const SnackbarUtilsConfigurator = () => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  /**
   * Función para mostrar una notificación con estilo personalizado
   * @param {string} message Mensaje a mostrar
   * @param {object} options Opciones adicionales
   * @returns ID de la notificación
   */
  const showNotification = (message, options = {}) => {
    const variant = options.variant || 'default';
    const className = `snackbar-${variant}`;
    
    // Opciones por defecto
    const defaultOptions = {
      className,
      style: {
        backgroundColor: variant === 'success' ? '#424242' : 
                        variant === 'error' ? '#3a3a3a' : 
                        variant === 'warning' ? '#484848' : 
                        variant === 'info' ? '#424242' : '#333333',
        color: '#f5f5f5',
        fontWeight: 300,
        borderLeft: '4px solid #757575',
        borderRadius: 0,
        clipPath: 'polygon(0% 0%, 100% 0%, 98% 100%, 2% 100%)',
        boxShadow: '0 3px 8px rgba(0, 0, 0, 0.15)'
      },
      preventDuplicate: true,
      autoHideDuration: 4000
    };
    
    // Combinar opciones
    const finalOptions = { ...defaultOptions, ...options };
    
    return enqueueSnackbar(message, finalOptions);
  };
  
  // Asignar funciones a la utilidad global
  window.snackbar = {
    success: (msg, options) => showNotification(msg, { ...options, variant: 'success' }),
    warning: (msg, options) => showNotification(msg, { ...options, variant: 'warning' }),
    info: (msg, options) => showNotification(msg, { ...options, variant: 'info' }),
    error: (msg, options) => showNotification(msg, { ...options, variant: 'error' }),
    show: showNotification,
    close: closeSnackbar
  };
  
  return null;
};

/**
 * Componente SnackbarProvider personalizado con referencia configurada
 * @param {object} props Propiedades del componente
 * @returns Componente SnackbarProvider personalizado
 */
export const CustomSnackbarProvider = props => {
  return (
    <SnackbarProvider
      ref={notistackRef}
      maxSnack={3}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      autoHideDuration={4000}
      style={{ marginBottom: '72px' }}
      dense
      preventDuplicate
      classes={{
        variantSuccess: 'snackbar-success',
        variantError: 'snackbar-error',
        variantWarning: 'snackbar-warning',
        variantInfo: 'snackbar-info',
        variantDefault: 'snackbar-default',
        contentRoot: 'snackbar-content-root'
      }}
      {...props}
    >
      {props.children}
      <SnackbarUtilsConfigurator />
    </SnackbarProvider>
  );
};

// Exportar funciones de utilidad global para usar en archivos que no tienen acceso a hooks
export const snackbar = {
  success: (msg, options = {}) => {
    if (window.snackbar) window.snackbar.success(msg, options);
  },
  warning: (msg, options = {}) => {
    if (window.snackbar) window.snackbar.warning(msg, options);
  },
  info: (msg, options = {}) => {
    if (window.snackbar) window.snackbar.info(msg, options);
  },
  error: (msg, options = {}) => {
    if (window.snackbar) window.snackbar.error(msg, options);
  },
  show: (msg, options = {}) => {
    if (window.snackbar) window.snackbar.show(msg, options);
  },
  close: key => {
    if (window.snackbar) window.snackbar.close(key);
  }
}; 