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

  // Estado para la selección de subniveles (nivel 2)
  const [selectedSecond, setSelectedSecond] = useState(null);

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

  return (
    <SidebarContext.Provider value={{ 
      isOpen, 
      toggleSidebar,
      closeSidebar,
      openSidebar,
      selectedSecond,
      setSelectedSecond,
      sidebarWidth,
      collapsedWidth,
      handleSidebarResize
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
