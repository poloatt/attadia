import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

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

export const ValuesVisibilityProvider = ({ children }) => {
  const [maskValues, setMaskValues] = useState(false);

  const toggleValuesVisibility = useCallback(() => {
    setMaskValues(prev => !prev);
  }, []);

  const maskText = useCallback((text) => {
    if (!text || !maskValues) return text;
    return typeof text === 'string' ? '••••••' : text;
  }, [maskValues]);

  const maskNumber = useCallback((number) => {
    if (number === undefined || number === null || !maskValues) return number;
    return typeof number === 'number' ? 0 : number;
  }, [maskValues]);

  const value = useMemo(() => ({
    maskValues,
    showValues: !maskValues,
    toggleValuesVisibility,
    maskText,
    maskNumber
  }), [maskValues, toggleValuesVisibility, maskText, maskNumber]);

  return (
    <ValuesVisibilityContext.Provider value={value}>
      {children}
    </ValuesVisibilityContext.Provider>
  );
};

export const useValuesVisibility = () => {
  const context = useContext(ValuesVisibilityContext);
  if (!context) {
    throw new Error('useValuesVisibility debe usarse dentro de ValuesVisibilityProvider');
  }
  return context;
}; 
