import { useState, useEffect, useCallback } from 'react';
import clienteAxios from '../config/axios';
import useCustomSnackbar from '../components/common/CustomSnackbar.jsx';

export function useRutinas() {
  const [rutinas, setRutinas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { enqueueSnackbar } = useCustomSnackbar();

  const fetchRutinas = useCallback(async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      const response = await clienteAxios.get('/api/rutinas', {
        params: {
          page,
          limit,
          sort: '-fecha' // Ordenar por fecha más reciente primero
        }
      });
      
      if (response.data && response.data.docs) {
        setRutinas(response.data.docs || []);
      } else {
        console.error('Respuesta inesperada:', response.data);
        setRutinas([]);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error al cargar rutinas:', error);
      setError('Error al cargar rutinas: ' + (error.message || 'Error desconocido'));
      enqueueSnackbar('Error al cargar rutinas: ' + (error.message || 'Error desconocido'), { 
        variant: 'error',
        autoHideDuration: 4000
      });
      return { docs: [], totalDocs: 0, totalPages: 0 };
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  const getRutinaById = useCallback(async (id) => {
    try {
      setLoading(true);
      const response = await clienteAxios.get(`/api/rutinas/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener rutina por ID:', error);
      setError('Error al obtener rutina: ' + (error.message || 'Error desconocido'));
      enqueueSnackbar('Error al obtener rutina: ' + (error.message || 'Error desconocido'), { 
        variant: 'error',
        autoHideDuration: 4000
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  const createRutina = useCallback(async (rutinaData) => {
    try {
      setLoading(true);
      const response = await clienteAxios.post('/api/rutinas', rutinaData);
      enqueueSnackbar('Rutina creada exitosamente', { 
        variant: 'success',
        autoHideDuration: 3000
      });
      return response.data;
    } catch (error) {
      console.error('Error al crear rutina:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Error desconocido';
      setError('Error al crear rutina: ' + errorMsg);
      enqueueSnackbar('Error al crear rutina: ' + errorMsg, { 
        variant: 'error',
        autoHideDuration: 4000
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  const updateRutina = useCallback(async (id, rutinaData) => {
    try {
      setLoading(true);
      const response = await clienteAxios.put(`/api/rutinas/${id}`, rutinaData);
      enqueueSnackbar('Rutina actualizada exitosamente', { 
        variant: 'success',
        autoHideDuration: 3000
      });
      return response.data;
    } catch (error) {
      console.error('Error al actualizar rutina:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Error desconocido';
      setError('Error al actualizar rutina: ' + errorMsg);
      enqueueSnackbar('Error al actualizar rutina: ' + errorMsg, { 
        variant: 'error',
        autoHideDuration: 4000
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  const deleteRutina = useCallback(async (id) => {
    try {
      setLoading(true);
      await clienteAxios.delete(`/api/rutinas/${id}`);
      enqueueSnackbar('Rutina eliminada exitosamente', { 
        variant: 'success',
        autoHideDuration: 3000
      });
      return true;
    } catch (error) {
      console.error('Error al eliminar rutina:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Error desconocido';
      setError('Error al eliminar rutina: ' + errorMsg);
      enqueueSnackbar('Error al eliminar rutina: ' + errorMsg, { 
        variant: 'error',
        autoHideDuration: 4000
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);
  
  const updateRutinaItem = useCallback(async (rutinaId, sectionId, itemId, isCompleted) => {
    try {
      setLoading(true);
      
      console.log(`Actualizando ítem de rutina: rutina=${rutinaId}, seccion=${sectionId}, item=${itemId}, completado=${isCompleted}`);
      
      const response = await clienteAxios.patch(`/api/rutinas/${rutinaId}/items`, {
        seccion: sectionId,
        item: itemId,
        completado: isCompleted
      });
      
      console.log('Respuesta de actualización de ítem:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error al actualizar ítem de rutina:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Error desconocido';
      setError('Error al actualizar ítem: ' + errorMsg);
      enqueueSnackbar('Error al actualizar ítem: ' + errorMsg, { 
        variant: 'error',
        autoHideDuration: 4000
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);
  
  const updateItemConfig = useCallback(async (rutinaId, sectionId, itemId, config) => {
    try {
      setLoading(true);
      
      console.log(`Actualizando configuración de ítem: rutina=${rutinaId}, seccion=${sectionId}, item=${itemId}`, config);
      
      const normalizedConfig = {
        ...config,
        frecuencia: parseInt(config.frecuencia) || 1,
        tipo: (config.tipo || 'DIARIO').toUpperCase()
      };
      
      const response = await clienteAxios.patch(`/api/rutinas/${rutinaId}/config`, {
        seccion: sectionId,
        item: itemId,
        config: normalizedConfig
      });
      
      console.log('Respuesta de actualización de configuración:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error al actualizar configuración de ítem:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Error desconocido';
      setError('Error al actualizar configuración: ' + errorMsg);
      enqueueSnackbar('Error al actualizar configuración: ' + errorMsg, { 
        variant: 'error',
        autoHideDuration: 4000
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);
  
  const validateRutinaDate = useCallback(async (fecha, rutinaId = null) => {
    try {
      const params = rutinaId ? { excludeId: rutinaId } : {};
      const response = await clienteAxios.get(`/api/rutinas/validate/${fecha}`, { params });
      return response.data;
    } catch (error) {
      console.error('Error al validar fecha de rutina:', error);
      return { error: true, message: error.message };
    }
  }, []);

  const getDefaultConfig = useCallback(async () => {
    try {
      const response = await clienteAxios.get('/api/users/rutinas-config');
      return response.data || {};
    } catch (error) {
      console.error('Error al obtener configuración por defecto:', error);
      return {};
    }
  }, []);

  return {
    rutinas,
    loading,
    error,
    fetchRutinas,
    getRutinaById,
    createRutina,
    updateRutina,
    deleteRutina,
    updateRutinaItem,
    updateItemConfig,
    validateRutinaDate,
    getDefaultConfig
  };
} 