import React from 'react';
import { useSnackbar } from 'notistack';

/**
 * Hook personalizado para mostrar notificaciones con estilo consistente
 * Reemplaza la funcionalidad básica de enqueueSnackbar con una versión
 * que aplica nuestros estilos personalizados
 */
export const useCustomSnackbar = () => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  
  // Función para mostrar notificaciones con estilo consistente
  const showNotification = (message, options = {}) => {
    // Clase personalizada según el tipo de notificación
    const variant = options.variant || 'default';
    const className = `snackbar-${variant}`;
    
    // Configuración por defecto
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
      anchorOrigin: { 
        vertical: 'top', 
        horizontal: 'center' 
      },
      autoHideDuration: 4000
    };
    
    // Combinar opciones personalizadas con las predeterminadas
    const finalOptions = { ...defaultOptions, ...options };
    
    return enqueueSnackbar(message, finalOptions);
  };
  
  // Funciones específicas para cada tipo de notificación
  const success = (message, options = {}) => 
    showNotification(message, { ...options, variant: 'success' });
  
  const error = (message, options = {}) => 
    showNotification(message, { ...options, variant: 'error' });
  
  const warning = (message, options = {}) => 
    showNotification(message, { ...options, variant: 'warning' });
  
  const info = (message, options = {}) => 
    showNotification(message, { ...options, variant: 'info' });
  
  return {
    showNotification,
    success,
    error,
    warning,
    info,
    closeSnackbar,
    // Mantener la función original por compatibilidad
    enqueueSnackbar: showNotification
  };
};

export default useCustomSnackbar; 