import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useMediaQuery, useTheme } from '@mui/material';
import { menuItems } from '../navigation/menuStructure';
import { useLocation } from 'react-router-dom';

const SidebarContext = createContext();

// Función para detectar si es mobile (consistente con UISettingsContext)
const isMobileDevice = () => {
  return window.innerWidth < 600; // breakpoint 'sm' de Material-UI
};

export function SidebarProvider({ children }) {
  const theme = useTheme();
  // Solo un breakpoint: desktop (>= md)
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });
  const location = useLocation();
  
  // Estado para el pin manual de la sidebar (solo desktop)
  // Elimina isPinned, togglePin, y cualquier lógica relacionada con el pin manual
  // Elimina del provider y del value del contexto
  // Elimina cualquier uso en efectos, callbacks y retornos
  
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

  // Estado para la selección de secciones
  const [expandedSections, setExpandedSections] = useState(new Set());
  const [selectedMain, setSelectedMain] = useState(null);
  const [selectedSecond, setSelectedSecond] = useState(null);
  
  // Secciones principales (excluyendo setup)
  const mainSections = useMemo(() => menuItems.filter(item => item.id !== 'setup'), []);

  // Sincronizar expansión y selección con la ruta actual
  useEffect(() => {
    // Buscar la sección principal activa
    const mainSection = menuItems.find(section => {
      if (section.path && (location.pathname === section.path || location.pathname.startsWith(section.path + '/'))) {
        return true;
      }
      if (!section.subItems) return false;
      return section.subItems.some(sub => {
        if (sub.path && (location.pathname === sub.path || location.pathname.startsWith(sub.path + '/'))) return true;
        if (sub.hasSubItems && sub.subItems) {
          return sub.subItems.some(sub2 => location.pathname === sub2.path || location.pathname.startsWith(sub2.path + '/'));
        }
        return false;
      });
    });

    if (mainSection) {
      if (mainSection.id !== selectedMain) {
        setSelectedMain(mainSection.id);
        setExpandedSections(new Set([mainSection.id]));
      }
      // Si estamos exactamente en la ruta principal, limpiar selección de segundo nivel
      if (location.pathname === mainSection.path) {
        if (selectedSecond !== null) setSelectedSecond(null);
      } else if (mainSection.subItems) {
        // Buscar segundo nivel seleccionado
        const second = mainSection.subItems.find(sub => {
          if (sub.path && (location.pathname === sub.path || location.pathname.startsWith(sub.path + '/'))) return true;
          if (sub.hasSubItems && sub.subItems) {
            return sub.subItems.some(sub2 => location.pathname === sub2.path || location.pathname.startsWith(sub2.path + '/'));
          }
          return false;
        });
        if (second && second.id !== selectedSecond) {
          setSelectedSecond(second.id);
        } else if (!second && selectedSecond !== null) {
          setSelectedSecond(null);
        }
      }
    } else if (!selectedMain && mainSections.length > 0) {
      setSelectedMain(mainSections[0].id);
      setSelectedSecond(null);
    }
  }, [location.pathname, selectedMain, selectedSecond, mainSections]);

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

  // Permitir múltiples secciones expandidas de forma consistente
  const toggleSection = useCallback((sectionId) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  const isSectionExpanded = useCallback((sectionId) => {
    return expandedSections.has(sectionId);
  }, [expandedSections]);

  const expandSection = useCallback((sectionId) => {
    setExpandedSections(prev => new Set([...prev, sectionId]));
  }, []);

  const collapseSection = useCallback((sectionId) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      newSet.delete(sectionId);
      return newSet;
    });
  }, []);

  const handleSetSelectedMain = useCallback((id) => {
    setSelectedMain(id);
  }, []);

  const handleSetSelectedSecond = useCallback((id) => {
    setSelectedSecond(id);
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
      menuItems,
      mainSections,
      expandedSections,
      toggleSection,
      isSectionExpanded,
      expandSection,
      collapseSection,
      selectedMain,
      setSelectedMain: handleSetSelectedMain,
      selectedSecond,
      setSelectedSecond: handleSetSelectedSecond,
      sidebarWidth,
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
