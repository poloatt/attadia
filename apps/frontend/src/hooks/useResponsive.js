import { useTheme, useMediaQuery } from '@mui/material';
import { useMemo } from 'react';

/**
 * Hook personalizado para manejar responsive design de forma centralizada
 * Elimina duplicación de media queries en múltiples componentes
 */
export function useResponsive() {
  const theme = useTheme();
  
  // Media queries centralizadas
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true });
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'), { noSsr: true });
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });
  
  // Utilidades derivadas
  const isMobileOrTablet = useMemo(() => isMobile || isTablet, [isMobile, isTablet]);
  const isNotDesktop = useMemo(() => !isDesktop, [isDesktop]);
  
  // Función para detectar mobile por window.innerWidth (backup)
  const detectMobileByWidth = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 600; // breakpoint 'sm' de Material-UI
  }, []);

  return {
    // Estados principales
    isMobile,
    isTablet, 
    isDesktop,
    
    // Utilidades combinadas
    isMobileOrTablet,
    isNotDesktop,
    
    // Backup detection
    detectMobileByWidth,
    
    // Breakpoints para uso directo
    breakpoints: theme.breakpoints,
    
    // Helper functions
    isBreakpoint: (breakpoint) => useMediaQuery(theme.breakpoints.up(breakpoint), { noSsr: true }),
    isBetween: (start, end) => useMediaQuery(theme.breakpoints.between(start, end), { noSsr: true })
  };
}

export default useResponsive; 