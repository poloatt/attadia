import { useState, useEffect, useRef } from 'react';
import clienteAxios from '../config/axios';

export const useRelationalData = ({
  open,
  relatedFields = []
}) => {
  const [relatedData, setRelatedData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const fieldsRef = useRef([]);

  useEffect(() => {
    fieldsRef.current = relatedFields;
  }, [relatedFields]);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!open || !fieldsRef.current.length) return;
      
      setIsLoading(true);
      setError(null);

      try {
        const relatedDataPromises = fieldsRef.current
          .filter(field => field.type === 'relational' && field.endpoint)
          .map(async field => {
            try {
              const response = await clienteAxios.get(field.endpoint);
              const data = response.data.docs || response.data || [];
              
              // Transformar los datos para asegurar consistencia
              const transformedData = data.map(item => ({
                id: item._id || item.id,
                ...item,
                label: item[field.labelField] || item.nombre || 'Sin nombre',
                value: item._id || item.id
              }));

              return {
                field: field.name,
                data: transformedData
              };
            } catch (error) {
              console.error(`Error al cargar datos para ${field.name}:`, error);
              return {
                field: field.name,
                data: []
              };
            }
          });

        const results = await Promise.all(relatedDataPromises);
        
        if (isMounted) {
          const newRelatedData = results.reduce((acc, result) => {
            if (result) {
              acc[result.field] = result.data;
            }
            return acc;
          }, {});
          
          setRelatedData(newRelatedData);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error al cargar datos relacionados:', error);
          setError(error.message || 'Error al cargar datos relacionados');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [open]);

  const refreshField = async (fieldName) => {
    const field = fieldsRef.current.find(f => f.name === fieldName && f.type === 'relational');
    if (!field?.endpoint) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await clienteAxios.get(field.endpoint);
      const data = response.data.docs || response.data || [];
      
      // Transformar los datos para asegurar consistencia
      const transformedData = data.map(item => ({
        id: item._id || item.id,
        ...item,
        label: item[field.labelField] || item.nombre || 'Sin nombre',
        value: item._id || item.id
      }));

      setRelatedData(prev => ({
        ...prev,
        [fieldName]: transformedData
      }));
    } catch (error) {
      console.error(`Error al actualizar ${fieldName}:`, error);
      setError(error.message || `Error al actualizar ${fieldName}`);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    relatedData,
    isLoading,
    error,
    refreshField
  };
}; 