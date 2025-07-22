import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useMediaQuery, useTheme } from '@mui/material';
import { menuItems } from '../navigation/menuStructure';
import { useLocation } from 'react-router-dom';

const SidebarContext = createContext();

export function SidebarProvider({ children }) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('sm'));
  const location = useLocation();
  // Inicializar isOpen basado en el tamaño de pantalla
  const [isOpen, setIsOpen] = useState(isDesktop);
  const [expandedSections, setExpandedSections] = useState(new Set()); // Todas las secciones colapsadas por defecto
  const [selectedMain, setSelectedMain] = useState(null);
  const [selectedSecond, setSelectedSecond] = useState(null);
  
  // Estado para el ancho dinámico de la sidebar
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const savedWidth = localStorage.getItem('sidebarWidth');
    return savedWidth ? parseInt(savedWidth, 10) : 280;
  });

  // Obtener las secciones principales (excluyendo setup) - estabilizado con useMemo
  const mainSections = useMemo(() => menuItems.filter(item => item.id !== 'setup'), []);

  // Efecto para ajustar la sidebar cuando cambie el tamaño de pantalla
  useEffect(() => {
    if (isDesktop) {
      // En desktop, abrir por defecto si no está explícitamente cerrada
      const userPreference = localStorage.getItem('sidebarDesktopOpen');
      if (userPreference === null) {
        setIsOpen(true);
      } else {
        setIsOpen(userPreference === 'true');
      }
    } else {
      // En móvil, mantener colapsada por defecto pero visible
      const userPreference = localStorage.getItem('sidebarMobileOpen');
      if (userPreference === null) {
        setIsOpen(false); // Colapsada por defecto
      } else {
        setIsOpen(userPreference === 'true');
      }
    }
  }, [isDesktop]);

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

  const toggleSidebar = useCallback(() => {
    const newState = !isOpen;
    setIsOpen(newState);
    // Guardar preferencia del usuario para desktop y móvil
    if (isDesktop) {
      localStorage.setItem('sidebarDesktopOpen', newState.toString());
    } else {
      localStorage.setItem('sidebarMobileOpen', newState.toString());
    }
  }, [isOpen, isDesktop]);

  const closeSidebar = useCallback(() => {
    setIsOpen(false);
    if (isDesktop) {
      localStorage.setItem('sidebarDesktopOpen', 'false');
    } else {
      localStorage.setItem('sidebarMobileOpen', 'false');
    }
  }, [isDesktop]);

  const openSidebar = useCallback(() => {
    // Mejora de transición: en móvil, abrir con retardo para animación suave si thirdLevelItems aparece
    if (!isDesktop) {
      setTimeout(() => {
        setIsOpen(true);
        localStorage.setItem('sidebarMobileOpen', 'true');
      }, 80); // 80ms para permitir animación
    } else {
      setIsOpen(true);
      localStorage.setItem('sidebarDesktopOpen', 'true');
    }
  }, [isDesktop]);

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
    if (isDesktop) {
      setExpandedSections(new Set([sectionId])); // Solo una expandida en desktop
    } else {
      setExpandedSections(prev => new Set([...prev, sectionId])); // Comportamiento actual en móvil
    }
  }, [isDesktop]);

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
      isDesktop,
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
