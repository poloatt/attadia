import { useState, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import mercadopagoService from '../services/mercadopagoService';

export const useMercadoPago = () => {
  if (!import.meta.env.PROD) {
    // Mock para desarrollo: no hacer nada
    return {
      loading: false,
      connecting: false,
      processing: false,
      connectionStatus: 'disconnected',
      connect: () => { throw new Error('Mercado Pago solo disponible en producción'); },
      processCallback: () => { throw new Error('Mercado Pago solo disponible en producción'); },
      syncConnection: () => { throw new Error('Mercado Pago solo disponible en producción'); },
      verifyConnection: () => { throw new Error('Mercado Pago solo disponible en producción'); },
      getCompleteData: () => { throw new Error('Mercado Pago solo disponible en producción'); },
      processData: () => { throw new Error('Mercado Pago solo disponible en producción'); },
      validateState: () => false,
      clearState: () => {},
      getConnectionStatus: () => 'disconnected'
    };
  }

  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(mercadopagoService.getConnectionStatus());
  const { enqueueSnackbar } = useSnackbar();

  /**
   * Inicia el flujo de conexión OAuth con MercadoPago
   */
  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      await mercadopagoService.connect();
      setConnectionStatus('connecting');
    } catch (error) {
      console.error('Error conectando con MercadoPago:', error);
      enqueueSnackbar(error.message, { variant: 'error' });
      setConnectionStatus('error');
      setConnecting(false);
    }
  }, [enqueueSnackbar]);

  /**
   * Procesa el callback OAuth de MercadoPago
   */
  const processCallback = useCallback(async (code, state) => {
    setLoading(true);
    try {
      // Validar el state antes de procesar
      if (!mercadopagoService.validateState(state)) {
        throw new Error('Error de seguridad: parámetro state inválido o expirado');
      }

      const result = await mercadopagoService.processCallback(code, state);
      
      // Limpiar el state después de procesar exitosamente
      mercadopagoService.clearState();
      setConnectionStatus('connected');
      
      enqueueSnackbar('¡Conexión MercadoPago exitosa!', { variant: 'success' });
      return result;
    } catch (error) {
      console.error('Error procesando callback MercadoPago:', error);
      enqueueSnackbar(error.message, { variant: 'error' });
      setConnectionStatus('error');
      mercadopagoService.clearState();
      throw error;
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  /**
   * Sincroniza manualmente una conexión MercadoPago
   */
  const syncConnection = useCallback(async (connectionId, options = {}) => {
    setLoading(true);
    try {
      const result = await mercadopagoService.syncConnection(connectionId, options);
      enqueueSnackbar('Sincronización completada exitosamente', { variant: 'success' });
      return result;
    } catch (error) {
      console.error('Error sincronizando conexión MercadoPago:', error);
      enqueueSnackbar(error.message, { variant: 'error' });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  /**
   * Verifica el estado de una conexión MercadoPago
   */
  const verifyConnection = useCallback(async (connectionId) => {
    setLoading(true);
    try {
      const result = await mercadopagoService.verifyConnection(connectionId);
      enqueueSnackbar('Verificación completada', { variant: 'success' });
      return result;
    } catch (error) {
      console.error('Error verificando conexión MercadoPago:', error);
      enqueueSnackbar(error.message, { variant: 'error' });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  /**
   * Obtiene datos completos de una conexión MercadoPago
   */
  const getCompleteData = useCallback(async (connectionId, options = {}) => {
    setLoading(true);
    try {
      const result = await mercadopagoService.getCompleteData(connectionId, options);
      enqueueSnackbar('Datos obtenidos exitosamente', { variant: 'success' });
      return result;
    } catch (error) {
      console.error('Error obteniendo datos completos de MercadoPago:', error);
      enqueueSnackbar(error.message, { variant: 'error' });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  /**
   * Procesa datos de una conexión MercadoPago
   */
  const processData = useCallback(async (connectionId, options = {}) => {
    setProcessing(true);
    try {
      const result = await mercadopagoService.processData(connectionId, options);
      enqueueSnackbar('Datos procesados exitosamente', { variant: 'success' });
      return result;
    } catch (error) {
      console.error('Error procesando datos de MercadoPago:', error);
      enqueueSnackbar(error.message, { variant: 'error' });
      throw error;
    } finally {
      setProcessing(false);
    }
  }, [enqueueSnackbar]);

  /**
   * Valida el state guardado en localStorage
   */
  const validateState = useCallback((receivedState) => {
    return mercadopagoService.validateState(receivedState);
  }, []);

  /**
   * Limpia el state guardado en localStorage
   */
  const clearState = useCallback(() => {
    mercadopagoService.clearState();
    setConnectionStatus('disconnected');
  }, []);

  /**
   * Obtiene el estado actual de la conexión
   */
  const getConnectionStatus = useCallback(() => {
    const status = mercadopagoService.getConnectionStatus();
    setConnectionStatus(status);
    return status;
  }, []);

  return {
    loading,
    connecting,
    processing,
    connectionStatus,
    connect,
    processCallback,
    syncConnection,
    verifyConnection,
    getCompleteData,
    processData,
    validateState,
    clearState,
    getConnectionStatus
  };
}; 