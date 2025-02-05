import { useState, useCallback } from 'react';

export const useFormFields = (initialData = {}) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});

  const handleChange = useCallback((event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? null : value
    }));
    
    // Limpiar error del campo cuando cambia
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  }, [errors]);

  const resetForm = useCallback((data = {}) => {
    setFormData(data);
    setErrors({});
  }, []);

  const validateForm = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    // Validar campos requeridos
    Object.entries(formData).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        newErrors[key] = 'Este campo es requerido';
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [formData]);

  return {
    formData,
    errors,
    handleChange,
    resetForm,
    validateForm,
    setFormData
  };
}; 