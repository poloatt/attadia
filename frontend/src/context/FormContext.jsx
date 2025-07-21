import React, { createContext, useContext, useState, useCallback } from 'react';

const FormManagerContext = createContext();

export function FormManagerProvider({ children }) {
  // Estado: { [type]: { open: boolean, initialData: any } }
  const [forms, setForms] = useState({});

  // Abrir formulario de un tipo
  const openForm = useCallback((type, initialData = null) => {
    setForms(prev => ({
      ...prev,
      [type]: { open: true, initialData }
    }));
  }, []);

  // Cerrar formulario de un tipo
  const closeForm = useCallback((type) => {
    setForms(prev => ({
      ...prev,
      [type]: { ...prev[type], open: false }
    }));
  }, []);

  // Resetear formulario de un tipo
  const resetForm = useCallback((type) => {
    setForms(prev => ({
      ...prev,
      [type]: { open: false, initialData: null }
    }));
  }, []);

  // Obtener estado de un formulario
  const getFormState = useCallback((type) => {
    return forms[type] || { open: false, initialData: null };
  }, [forms]);

  return (
    <FormManagerContext.Provider value={{ openForm, closeForm, resetForm, getFormState }}>
      {children}
    </FormManagerContext.Provider>
  );
}

export function useFormManager() {
  const ctx = useContext(FormManagerContext);
  if (!ctx) throw new Error('useFormManager debe usarse dentro de FormManagerProvider');
  return ctx;
} 