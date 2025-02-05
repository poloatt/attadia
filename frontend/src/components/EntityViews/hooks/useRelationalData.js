import { useState, useEffect } from 'react';

export const useRelationalData = ({
  open,
  relatedFields = [],
  onFetchRelatedData
}) => {
  const [relatedData, setRelatedData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!open || !relatedFields.length) return;
      
      setIsLoading(true);
      setError(null);

      try {
        const data = await onFetchRelatedData();
        if (isMounted) {
          setRelatedData(data);
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
  }, [open, relatedFields.length, onFetchRelatedData]);

  const refreshData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await onFetchRelatedData();
      setRelatedData(data);
    } catch (error) {
      setError(error.message || 'Error al actualizar datos relacionados');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    relatedData,
    isLoading,
    error,
    refreshData
  };
}; 