import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

/**
 * Hook personalizado para gestionar documentos de una propiedad
 * @param {string} propiedadId - ID de la propiedad
 * @returns {object} - Estado y funciones para gestionar documentos
 */
export const useDocumentosPropiedad = (propiedadId) => {
  const [documentos, setDocumentos] = useState([]);
  const [estadisticas, setEstadisticas] = useState({
    total: 0,
    porCategoria: {},
    tamanoTotal: 0,
    sincronizados: 0,
    manuales: 0
  });
  const [configuracion, setConfiguracion] = useState({
    carpetaId: null,
    carpetaNombre: null,
    ultimaSincronizacion: null,
    sincronizacionAutomatica: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar documentos de la propiedad
  const cargarDocumentos = useCallback(async () => {
    if (!propiedadId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.getDocumentosPropiedad(propiedadId);
      setDocumentos(response.data.documentos || []);
      setEstadisticas(response.data.estadisticas || {});
      setConfiguracion(response.data.configuracion || {});
    } catch (err) {
      console.error('Error al cargar documentos:', err);
      setError(err.response?.data?.error || 'Error al cargar documentos');
    } finally {
      setLoading(false);
    }
  }, [propiedadId]);

  // Sincronizar documentos con Google Drive
  const sincronizarDocumentos = useCallback(async () => {
    if (!propiedadId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.sincronizarDocumentos(propiedadId);
      await cargarDocumentos(); // Recargar documentos después de sincronizar
      return response.data;
    } catch (err) {
      console.error('Error al sincronizar documentos:', err);
      setError(err.response?.data?.error || 'Error al sincronizar documentos');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [propiedadId, cargarDocumentos]);

  // Agregar documento manualmente
  const agregarDocumento = useCallback(async (documentoData) => {
    if (!propiedadId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.agregarDocumento(propiedadId, documentoData);
      await cargarDocumentos(); // Recargar documentos después de agregar
      return response.data.documento;
    } catch (err) {
      console.error('Error al agregar documento:', err);
      setError(err.response?.data?.error || 'Error al agregar documento');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [propiedadId, cargarDocumentos]);

  // Eliminar documento
  const eliminarDocumento = useCallback(async (googleDriveId) => {
    if (!propiedadId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.eliminarDocumento(propiedadId, googleDriveId);
      await cargarDocumentos(); // Recargar documentos después de eliminar
      return response.data.documento;
    } catch (err) {
      console.error('Error al eliminar documento:', err);
      setError(err.response?.data?.error || 'Error al eliminar documento');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [propiedadId, cargarDocumentos]);

  // Obtener documentos por categoría
  const getDocumentosPorCategoria = useCallback(async (categoria) => {
    if (!propiedadId) return [];
    
    try {
      const response = await api.getDocumentosPorCategoria(propiedadId, categoria);
      return response.data.documentos || [];
    } catch (err) {
      console.error('Error al obtener documentos por categoría:', err);
      setError(err.response?.data?.error || 'Error al obtener documentos por categoría');
      return [];
    }
  }, [propiedadId]);

  // Crear carpeta en Google Drive
  const crearCarpetaGoogleDrive = useCallback(async () => {
    if (!propiedadId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.crearCarpetaGoogleDrive(propiedadId);
      await cargarDocumentos(); // Recargar configuración después de crear carpeta
      return response.data;
    } catch (err) {
      console.error('Error al crear carpeta en Google Drive:', err);
      setError(err.response?.data?.error || 'Error al crear carpeta en Google Drive');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [propiedadId, cargarDocumentos]);

  // Filtrar documentos por categoría
  const filtrarPorCategoria = useCallback((categoria) => {
    return documentos.filter(doc => doc.categoria === categoria);
  }, [documentos]);

  // Obtener documentos agrupados por categoría
  const getDocumentosAgrupados = useCallback(() => {
    const grupos = {
      GASTO_FIJO: [],
      GASTO_VARIABLE: [],
      MANTENIMIENTO: [],
      ALQUILER: [],
      CONTRATO: [],
      PAGO: [],
      COBRO: []
    };
    
    documentos.forEach(doc => {
      if (grupos[doc.categoria]) {
        grupos[doc.categoria].push(doc);
      }
    });
    
    return grupos;
  }, [documentos]);

  // Cargar documentos al montar el componente o cambiar propiedadId
  useEffect(() => {
    cargarDocumentos();
  }, [cargarDocumentos]);

  return {
    // Estado
    documentos,
    estadisticas,
    configuracion,
    loading,
    error,
    
    // Funciones
    cargarDocumentos,
    sincronizarDocumentos,
    agregarDocumento,
    eliminarDocumento,
    getDocumentosPorCategoria,
    crearCarpetaGoogleDrive,
    filtrarPorCategoria,
    getDocumentosAgrupados,
    
    // Utilidades
    limpiarError: () => setError(null)
  };
}; 