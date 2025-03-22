import React, { createContext, useContext, useState } from 'react';

// Función de utilidad para ocultar texto
export const maskText = (text) => {
  if (!text) return '';
  const visibleChars = text.slice(0, 5);
  const remainingLength = text.length - 5;
  return remainingLength > 0 ? `${visibleChars}${'*'.repeat(remainingLength)}` : text;
};

// Función para enmascarar valores numéricos
export const maskNumber = (number, symbol = '') => {
  if (number === undefined || number === null) return '0';
  return symbol ? `${symbol} ****` : '****';
};

const ValuesVisibilityContext = createContext();

export function ValuesVisibilityProvider({ children }) {
  const [showValues, setShowValues] = useState(true);

  const toggleValuesVisibility = () => {
    setShowValues(prev => !prev);
  };

  return (
    <ValuesVisibilityContext.Provider value={{ 
      showValues, 
      toggleValuesVisibility,
      maskText,
      maskNumber
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