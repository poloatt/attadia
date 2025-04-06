import { useState } from 'react';
import clienteAxios from '../config/axios';
import { useSnackbar } from 'notistack';

/**
 * Hook para operaciones básicas CRUD de rutinas
 * NOTA: Este hook ha sido renombrado de useRutinas a useRutinasCRUD para evitar
 * conflictos con el hook useRutinas del contexto en components/rutinas/context/RutinasContext.jsx
 */
export const useRutinasCRUD = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);

  const createRutina = async (rutinaData) => {
    try {
      setLoading(true);
      const response = await clienteAxios.post('/api/rutinas', rutinaData);
      enqueueSnackbar('Rutina creada exitosamente', { variant: 'success' });
      return response.data;
    } catch (error) {
      console.error('Error al crear rutina:', error);
      enqueueSnackbar(
        error.response?.data?.error || 'Error al crear la rutina',
        { variant: 'error' }
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateRutina = async (id, rutinaData) => {
    try {
      setLoading(true);
      const response = await clienteAxios.put(`/api/rutinas/${id}`, rutinaData);
      enqueueSnackbar('Rutina actualizada exitosamente', { variant: 'success' });
      return response.data;
    } catch (error) {
      console.error('Error al actualizar rutina:', error);
      enqueueSnackbar(
        error.response?.data?.error || 'Error al actualizar la rutina',
        { variant: 'error' }
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getRutinaById = async (id) => {
    try {
      setLoading(true);
      const response = await clienteAxios.get(`/api/rutinas/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener rutina:', error);
      enqueueSnackbar(
        error.response?.data?.error || 'Error al obtener la rutina',
        { variant: 'error' }
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const verifyDate = async (fecha) => {
    try {
      const response = await clienteAxios.get('/api/rutinas/verify', {
        params: { fecha }
      });
      return response.data.exists;
    } catch (error) {
      console.error('Error al verificar fecha:', error);
      enqueueSnackbar(
        error.response?.data?.error || 'Error al verificar la fecha',
        { variant: 'error' }
      );
      throw error;
    }
  };

  const getAllFechas = async () => {
    try {
      const response = await clienteAxios.get('/api/rutinas/fechas');
      return response.data.fechas;
    } catch (error) {
      console.error('Error al obtener fechas:', error);
      enqueueSnackbar(
        error.response?.data?.error || 'Error al obtener las fechas',
        { variant: 'error' }
      );
      throw error;
    }
  };

  // Sincronizar una rutina con la configuración global
  const syncRutinaWithGlobal = async (rutinaId, overwriteAll = false) => {
    try {
      setLoading(true);
      const response = await clienteAxios.post(
        `/api/rutinas/${rutinaId}/sync-from-global`, 
        {}, 
        { params: { overwriteAll } }
      );
      enqueueSnackbar('Configuración sincronizada exitosamente', { variant: 'success' });
      return response.data;
    } catch (error) {
      console.error('Error al sincronizar con configuración global:', error);
      enqueueSnackbar(
        error.response?.data?.error || 'Error al sincronizar con configuración global',
        { variant: 'error' }
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Actualizar la configuración global basada en una rutina
  const updateGlobalFromRutina = async (rutinaId, sections = null, items = null) => {
    try {
      setLoading(true);
      const response = await clienteAxios.post(`/api/rutinas/${rutinaId}/sync-to-global`, {
        sections,
        items
      });
      enqueueSnackbar('Configuración global actualizada exitosamente', { variant: 'success' });
      return response.data;
    } catch (error) {
      console.error('Error al actualizar configuración global:', error);
      enqueueSnackbar(
        error.response?.data?.error || 'Error al actualizar configuración global',
        { variant: 'error' }
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    createRutina,
    updateRutina,
    getRutinaById,
    verifyDate,
    getAllFechas,
    syncRutinaWithGlobal,
    updateGlobalFromRutina
  };
}; 