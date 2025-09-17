import React, { createContext, useContext, useState } from 'react';

const NavigationBarContext = createContext();

export const useNavigationBar = () => {
  const context = useContext(NavigationBarContext);
  if (!context) {
    throw new Error('useNavigationBar debe ser usado dentro de un NavigationBarProvider');
  }
  return context;
};

export const NavigationBarProvider = ({ children }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [title, setTitle] = useState('');
  const [actions, setActions] = useState([]);

  const value = {
    isVisible,
    setIsVisible,
    title,
    setTitle,
    actions,
    setActions,
  };

  return (
    <NavigationBarContext.Provider value={value}>
      {children}
    </NavigationBarContext.Provider>
  );
};

export default NavigationBarProvider; 
