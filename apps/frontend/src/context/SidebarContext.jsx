import React, { createContext, useContext, useState, useCallback } from 'react';
import { useMediaQuery, useTheme } from '@mui/material';

const SidebarContext = createContext();

export function SidebarProvider({ children }) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });

  // Estado inicial de apertura/cierre
  const getInitialSidebarState = () => {
    if (typeof window === 'undefined') return true;
    const pref = localStorage.getItem('sidebarOpen');
    return pref === null ? true : pref === 'true';
  };
  const [isOpen, setIsOpen] = useState(getInitialSidebarState);

  // Ancho de la sidebar
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const savedWidth = localStorage.getItem('sidebarWidth');
    return savedWidth ? parseInt(savedWidth, 10) : 280;
  });
  const collapsedWidth = 56;

  // Estado para la selección de niveles principales y subniveles
  const [selectedMain, setSelectedMain] = useState(null);
  const [selectedSecond, setSelectedSecond] = useState(null);
  
  // Estado para sidebar pinned (para el resizer)
  const [isPinned, setIsPinned] = useState(false);

  // Cambiar estado y persistir
  const toggleSidebar = useCallback(() => {
    setIsOpen(prev => {
      const newState = !prev;
      localStorage.setItem('sidebarOpen', newState.toString());
      return newState;
    });
  }, []);

  const closeSidebar = useCallback(() => {
    setIsOpen(false);
    localStorage.setItem('sidebarOpen', 'false');
  }, []);

  const openSidebar = useCallback(() => {
    setIsOpen(true);
    localStorage.setItem('sidebarOpen', 'true');
  }, []);

  // Función para manejar el resize de la sidebar
  const handleSidebarResize = useCallback((newWidth) => {
    setSidebarWidth(newWidth);
    localStorage.setItem('sidebarWidth', newWidth.toString());
  }, []);

  // Función utilitaria para calcular mainMargin (evita duplicación)
  const getMainMargin = useCallback((isMobile, isTablet) => {
    return (!isMobile && !isTablet)
      ? (isOpen ? sidebarWidth : collapsedWidth)
      : 0;
  }, [isOpen, sidebarWidth, collapsedWidth]);

  // Configuración centralizada para alineación de elementos child
  const SIDEBAR_CONFIG = {
    parent: {
      padding: 16,        // 2 * 8px (theme spacing unit)
      iconWidth: 36,      // Ancho estándar de ícono parent
      iconMinWidth: 36    // minWidth del ListItemIcon
    },
    child: {
      collapsedPadding: 2,    // Padding cuando sidebar está colapsada
      alignmentOffset: 0,     // Offset adicional para ajuste fino
      iconSize: 'small'       // Tamaño de íconos child
    }
  };

  // Función modular para calcular padding de elementos child (nivel 2)
  const getChildPadding = useCallback((isOpen) => {
    if (!isOpen) return SIDEBAR_CONFIG.child.collapsedPadding;
    
         // Cálculo preciso: donde termina el ícono parent + offset
     const alignmentPoint = SIDEBAR_CONFIG.parent.padding + 
                           SIDEBAR_CONFIG.parent.iconWidth + 
                           SIDEBAR_CONFIG.child.alignmentOffset;
     
     return `${alignmentPoint}px`;
   }, []);

  // Función para acceder a la configuración desde otros componentes
  const getSidebarConfig = useCallback(() => SIDEBAR_CONFIG, []);

  return (
    <SidebarContext.Provider value={{ 
      isOpen, 
      isDesktop,
      isPinned,
      setIsPinned,
      toggleSidebar,
      closeSidebar,
      openSidebar,
      selectedMain,
      setSelectedMain,
      selectedSecond,
      setSelectedSecond,
      sidebarWidth,
      collapsedWidth,
      handleSidebarResize,
      getMainMargin,
      getChildPadding,
      getSidebarConfig
    }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
} 
