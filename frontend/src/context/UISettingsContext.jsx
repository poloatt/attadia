import React, { createContext, useContext, useState, useEffect } from 'react';

const UISettingsContext = createContext();
const UI_SETTINGS_KEY = 'uiSettings';

// Función para detectar si es mobile
const isMobileDevice = () => {
  return window.innerWidth < 600; // breakpoint 'sm' de Material-UI
};

function getInitialSettings() {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(UI_SETTINGS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
  }
  // Valores por defecto
  return {
    showSidebar: !isMobileDevice(),
    showEntityToolbarNavigation: !isMobileDevice()
  };
}

export function UISettingsProvider({ children }) {
  const initial = getInitialSettings();
  const [showEntityToolbarNavigation, setShowEntityToolbarNavigation] = useState(initial.showEntityToolbarNavigation);
  const [showSidebar, setShowSidebar] = useState(initial.showSidebar);

  // Guardar configuraciones en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem(UI_SETTINGS_KEY, JSON.stringify({
      showSidebar,
      showEntityToolbarNavigation
    }));
  }, [showSidebar, showEntityToolbarNavigation]);

  // Actualizar valores por defecto cuando cambie el tamaño de pantalla SOLO si no hay config guardada
  useEffect(() => {
    const handleResize = () => {
      const currentIsMobile = isMobileDevice();
      const saved = localStorage.getItem(UI_SETTINGS_KEY);
      if (!saved) {
        setShowEntityToolbarNavigation(!currentIsMobile);
        setShowSidebar(!currentIsMobile);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
