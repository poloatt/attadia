import React, { createContext, useContext, useState } from 'react';

const ValuesVisibilityContext = createContext();

export function ValuesVisibilityProvider({ children }) {
  const [showValues, setShowValues] = useState(true);

  const toggleValuesVisibility = () => {
    setShowValues(prev => !prev);
  };

  return (
    <ValuesVisibilityContext.Provider value={{ 
      showValues, 
      toggleValuesVisibility 
    }}>
      {children}
    </ValuesVisibilityContext.Provider>
  );
}

export function useValuesVisibility() {
  const context = useContext(ValuesVisibilityContext);
  if (!context) {
    throw new Error('useValuesVisibility must be used within a ValuesVisibilityProvider');
  }
  return context;
} 