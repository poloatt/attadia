import React, { createContext, useContext, useState, useEffect } from 'react';

const UISettingsContext = createContext();

export function UISettingsProvider({ children }) {
  const [showEntityToolbarNavigation, setShowEntityToolbarNavigation] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  // Cargar configuraciones desde localStorage al inicializar
  useEffect(() => {
    const savedToolbarNavigation = localStorage.getItem('showEntityToolbarNavigation');
    const savedSidebar = localStorage.getItem('showSidebar');
    
    if (savedToolbarNavigation !== null) {
      setShowEntityToolbarNavigation(savedToolbarNavigation === 'true');
    }
    
    if (savedSidebar !== null) {
      setShowSidebar(savedSidebar === 'true');
    }
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
