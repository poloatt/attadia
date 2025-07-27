import React, { createContext, useContext, useState, useCallback } from 'react';
import useResponsive from '../hooks/useResponsive';
import { SIDEBAR_CONFIG, STORAGE_KEYS, calculateMainMargin, getChildPadding } from '../config/uiConstants';

const SidebarContext = createContext();

export function SidebarProvider({ children }) {
  const { isDesktop } = useResponsive();

  // Estado inicial de apertura/cierre
  const getInitialSidebarState = () => {
    if (typeof window === 'undefined') return true;
    const pref = localStorage.getItem(STORAGE_KEYS.sidebarOpen);
    return pref === null ? true : pref === 'true';
  };
  const [isOpen, setIsOpen] = useState(getInitialSidebarState);

  // Ancho de la sidebar
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const savedWidth = localStorage.getItem(STORAGE_KEYS.sidebarWidth);
    return savedWidth ? parseInt(savedWidth, 10) : SIDEBAR_CONFIG.defaultWidth;
  });
  const collapsedWidth = SIDEBAR_CONFIG.collapsedWidth;

  // Estado para la selección de niveles principales 
  const [selectedMain, setSelectedMain] = useState(null);
  // selectedSecond eliminado - la ruta actual es la única fuente de verdad
  
  // Estado para sidebar pinned (para el resizer)
  const [isPinned, setIsPinned] = useState(false);

  // Cambiar estado y persistir
  const toggleSidebar = useCallback(() => {
    setIsOpen(prev => {
      const newState = !prev;
      localStorage.setItem(STORAGE_KEYS.sidebarOpen, newState.toString());
      return newState;
    });
  }, []);

  const closeSidebar = useCallback(() => {
    setIsOpen(false);
    localStorage.setItem(STORAGE_KEYS.sidebarOpen, 'false');
  }, []);

  const openSidebar = useCallback(() => {
    setIsOpen(true);
    localStorage.setItem(STORAGE_KEYS.sidebarOpen, 'true');
  }, []);

  // Función para manejar el resize de la sidebar
  const handleSidebarResize = useCallback((newWidth) => {
    setSidebarWidth(newWidth);
    localStorage.setItem(STORAGE_KEYS.sidebarWidth, newWidth.toString());
  }, []);

  // Función utilitaria para calcular mainMargin (usa utilidad centralizada)
  const getMainMargin = useCallback((isMobileOrTablet, showSidebarCollapsed = false) => {
    return calculateMainMargin(isOpen, sidebarWidth, isMobileOrTablet, showSidebarCollapsed);
  }, [isOpen, sidebarWidth]);

  // Eliminado: getChildPaddingCallback redundante - usar directamente getChildPadding de uiConstants

  // Función para acceder a la configuración desde otros componentes - usa configuración centralizada
  const getSidebarConfig = useCallback(() => SIDEBAR_CONFIG, []);

  // Función para ajustar dinámicamente el offset de alineación (debugging/fine-tuning)
  const adjustChildAlignment = useCallback((offset) => {
    SIDEBAR_CONFIG.child.alignmentOffset = offset;
            // console.log(`🔧 Child alignment offset ajustado a: ${offset}px`);
        // console.log(`📏 Nuevo padding calculado: ${SIDEBAR_CONFIG.calculateChildPadding()}`);
  }, []);

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
     sidebarWidth,
      collapsedWidth,
             handleSidebarResize,
       getMainMargin,
       getSidebarConfig,
       adjustChildAlignment
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
