import { useState } from 'react';
import clienteAxios from '../config/axios';
import { formatDateForAPI, getNormalizedToday } from '../utils/dateUtils';

/**
 * Hook para operaciones básicas CRUD de rutinas
 * NOTA: Este hook ha sido renombrado de useRutinas a useRutinasCRUD para evitar
 * conflictos con el hook useRutinas del contexto en components/rutinas/context/RutinasContext.jsx
 */
export const useRutinasCRUD = () => {
  const [loading, setLoading] = useState(false);

  const createRutina = async (rutinaData) => {
    try {
      setLoading(true);
      // Normalizar fecha a YYYY-MM-DD
      const payload = { ...rutinaData };
      if (payload.fecha) {
        const ymd = formatDateForAPI(payload.fecha);
        if (ymd) payload.fecha = ymd;
      } else {
        payload.fecha = formatDateForAPI(getNormalizedToday());
      }
      const response = await clienteAxios.post('/api/rutinas', payload);
      return response.data;
    } catch (error) {
      console.error('Error al crear rutina:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateRutina = async (id, rutinaData) => {
    try {
      setLoading(true);
      const payload = { ...rutinaData };
      if (payload.fecha) {
        const ymd = formatDateForAPI(payload.fecha);
        if (ymd) payload.fecha = ymd;
      }
      const response = await clienteAxios.put(`/api/rutinas/${id}`, payload);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar rutina:', error);
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
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const verifyDate = async (fecha) => {
    try {
      const ymd = formatDateForAPI(fecha || getNormalizedToday());
      const response = await clienteAxios.get('/api/rutinas/verify', {
        params: { fecha: ymd }
      });
      return response.data.exists;
    } catch (error) {
      console.error('Error al verificar fecha:', error);
      throw error;
    }
  };

  const getAllFechas = async () => {
    try {
      const response = await clienteAxios.get('/api/rutinas/fechas');
      return response.data.fechas;
    } catch (error) {
      console.error('Error al obtener fechas:', error);
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
      return response.data;
    } catch (error) {
      console.error('Error al sincronizar con configuración global:', error);
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
      return response.data;
    } catch (error) {
      console.error('Error al actualizar configuración global:', error);
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