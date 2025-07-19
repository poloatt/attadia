import React, { createContext, useContext, useState, useEffect } from 'react';

const UISettingsContext = createContext();

// Función para detectar si es mobile
const isMobileDevice = () => {
  return window.innerWidth < 600; // breakpoint 'sm' de Material-UI
};

export function UISettingsProvider({ children }) {
  // Valores por defecto según dispositivo
  const defaultToolbarNavigation = !isMobileDevice(); // true en desktop, false en mobile
  const defaultSidebar = !isMobileDevice(); // true en desktop, false en mobile
  
  const [showEntityToolbarNavigation, setShowEntityToolbarNavigation] = useState(defaultToolbarNavigation);
  const [showSidebar, setShowSidebar] = useState(defaultSidebar);

  // Cargar configuraciones desde localStorage al inicializar
  useEffect(() => {
    const savedToolbarNavigation = localStorage.getItem('showEntityToolbarNavigation');
    const savedSidebar = localStorage.getItem('showSidebar');
    
    if (savedToolbarNavigation !== null) {
      setShowEntityToolbarNavigation(savedToolbarNavigation === 'true');
    } else {
      // Si no hay valor guardado, usar el valor por defecto según dispositivo
      setShowEntityToolbarNavigation(defaultToolbarNavigation);
    }
    
    if (savedSidebar !== null) {
      setShowSidebar(savedSidebar === 'true');
    } else {
      // Si no hay valor guardado, usar el valor por defecto según dispositivo
      setShowSidebar(defaultSidebar);
    }
  }, [defaultToolbarNavigation, defaultSidebar]);

  // Actualizar valores por defecto cuando cambie el tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      const currentIsMobile = isMobileDevice();
      const savedToolbarNavigation = localStorage.getItem('showEntityToolbarNavigation');
      const savedSidebar = localStorage.getItem('showSidebar');
      
      // Solo actualizar si no hay valores guardados en localStorage
      if (savedToolbarNavigation === null) {
        setShowEntityToolbarNavigation(!currentIsMobile);
      }
      
      if (savedSidebar === null) {
        setShowSidebar(!currentIsMobile);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Guardar configuraciones en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem('showEntityToolbarNavigation', showEntityToolbarNavigation.toString());
  }, [showEntityToolbarNavigation]);

  useEffect(() => {
    localStorage.setItem('showSidebar', showSidebar.toString());
  }, [showSidebar]);

  const toggleEntityToolbarNavigation = () => {
    setShowEntityToolbarNavigation(prev => !prev);
  };

  const toggleSidebar = () => {
    setShowSidebar(prev => !prev);
  };

  return (
    <UISettingsContext.Provider
      value={{
        showEntityToolbarNavigation,
        showSidebar,
        toggleEntityToolbarNavigation,
        toggleSidebar,
        setShowEntityToolbarNavigation,
        setShowSidebar
      }}
    >
      {children}
    </UISettingsContext.Provider>
  );
}

export function useUISettings() {
  const context = useContext(UISettingsContext);
  if (!context) {
    throw new Error('useUISettings must be used within a UISettingsProvider');
  }
  return context;
}
