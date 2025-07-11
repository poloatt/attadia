import { useState, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import mercadopagoService from '../services/mercadopagoService';

export const useMercadoPago = () => {
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  /**
   * Inicia el flujo de conexión OAuth con MercadoPago
   */
  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      await mercadopagoService.connect();
    } catch (error) {
      console.error('Error conectando con MercadoPago:', error);
      enqueueSnackbar(error.message, { variant: 'error' });
      setConnecting(false);
    }
  }, [enqueueSnackbar]);

  /**
   * Procesa el callback OAuth de MercadoPago
   */
  const processCallback = useCallback(async (code, state) => {
    setLoading(true);
    try {
      const result = await mercadopagoService.processCallback(code, state);
      enqueueSnackbar('¡Conexión MercadoPago exitosa!', { variant: 'success' });
      return result;
    } catch (error) {
      console.error('Error procesando callback MercadoPago:', error);
      enqueueSnackbar(error.message, { variant: 'error' });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  /**
   * Sincroniza manualmente una conexión MercadoPago
   */
  const syncConnection = useCallback(async (connectionId) => {
    setLoading(true);
    try {
      const result = await mercadopagoService.syncConnection(connectionId);
      enqueueSnackbar('Sincronización completada', { variant: 'success' });
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
      enqueueSnackbar('Conexión verificada exitosamente', { variant: 'success' });
      return result;
    } catch (error) {
      console.error('Error verificando conexión MercadoPago:', error);
      enqueueSnackbar(error.message, { variant: 'error' });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  return {
    loading,
    connecting,
    connect,
    processCallback,
    syncConnection,
    verifyConnection
  };
}; 