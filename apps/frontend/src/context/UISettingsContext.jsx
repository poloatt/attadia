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
  // Valores por defecto - solo configuraciones de UI móvil
  return {
    showEntityToolbarNavigation: !isMobileDevice(),
    showSidebarCollapsed: true // Por defecto visible en móvil
  };
}

export function UISettingsProvider({ children }) {
  const initial = getInitialSettings();
  const [showEntityToolbarNavigation, setShowEntityToolbarNavigation] = useState(
    typeof initial.showEntityToolbarNavigation === 'boolean' ? initial.showEntityToolbarNavigation : false
  );
  const [showSidebarCollapsed, setShowSidebarCollapsed] = useState(
    typeof initial.showSidebarCollapsed === 'boolean' ? initial.showSidebarCollapsed : false
  );

  useEffect(() => {
    localStorage.setItem(UI_SETTINGS_KEY, JSON.stringify({
      showEntityToolbarNavigation,
      showSidebarCollapsed
    }));
  }, [showEntityToolbarNavigation, showSidebarCollapsed]);

  const toggleEntityToolbarNavigation = () => {
    if (isMobileDevice()) {
      setShowEntityToolbarNavigation(prev => !prev);
    }
  };

  const toggleSidebarCollapsed = () => {
    if (isMobileDevice()) {
      setShowSidebarCollapsed(prev => !prev);
    }
  };

  return (
    <UISettingsContext.Provider
      value={{
        showEntityToolbarNavigation,
        toggleEntityToolbarNavigation,
        setShowEntityToolbarNavigation,
        showSidebarCollapsed,
        toggleSidebarCollapsed,
        setShowSidebarCollapsed,
        isMobile: isMobileDevice()
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
