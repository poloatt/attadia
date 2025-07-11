import clienteAxios from '../config/axios';
import { getRedirectURI } from '../config/mercadopago';

class MercadoPagoService {
  constructor() {
    this.baseURL = '/api/bankconnections/mercadopago';
    this.redirectURI = getRedirectURI();
  }

  /**
   * Obtiene la URL de autorización de MercadoPago
   * @returns {Promise<{authUrl: string, state: string}>} URL de autorización y state
   */
  async getAuthUrl() {
    try {
      const { data } = await clienteAxios.get(`${this.baseURL}/auth-url`, {
        params: { redirect_uri: this.redirectURI }
      });
      return { authUrl: data.authUrl, state: data.state };
    } catch (error) {
      console.error('Error obteniendo URL de autorización:', error);
      throw new Error(
        error.response?.data?.message || 
        'Error obteniendo URL de autorización de MercadoPago'
      );
    }
  }

  /**
   * Procesa el callback OAuth de MercadoPago
   * @param {string} code - Código de autorización
   * @param {string} state - Parámetro state para validación CSRF
   * @returns {Promise<Object>} Resultado de la conexión
   */
  async processCallback(code, state) {
    try {
      const { data } = await clienteAxios.post(`${this.baseURL}/callback`, { code, state });
      return data;
    } catch (error) {
      console.error('Error procesando callback MercadoPago:', error);
      throw new Error(
        error.response?.data?.message || 
        'Error procesando autorización de MercadoPago'
      );
    }
  }

  /**
   * Inicia el flujo de conexión OAuth
   * @returns {Promise<void>}
   */
  async connect() {
    try {
      const { authUrl, state } = await this.getAuthUrl();
      
      // Guardar el state en localStorage para validarlo en el callback
      if (state) {
        localStorage.setItem('mercadopago_state', state);
      }
      
      window.location.href = authUrl;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Sincroniza manualmente una conexión MercadoPago
   * @param {string} connectionId - ID de la conexión
   * @returns {Promise<Object>} Resultado de la sincronización
   */
  async syncConnection(connectionId) {
    try {
      const { data } = await clienteAxios.post(`/api/bankconnections/${connectionId}/sync`);
      return data;
    } catch (error) {
      console.error('Error sincronizando conexión MercadoPago:', error);
      throw new Error(
        error.response?.data?.message || 
        'Error sincronizando conexión MercadoPago'
      );
    }
  }

  /**
   * Verifica el estado de una conexión MercadoPago
   * @param {string} connectionId - ID de la conexión
   * @returns {Promise<Object>} Estado de la conexión
   */
  async verifyConnection(connectionId) {
    try {
      const { data } = await clienteAxios.post(`/api/bankconnections/${connectionId}/verificar`);
      return data;
    } catch (error) {
      console.error('Error verificando conexión MercadoPago:', error);
      throw new Error(
        error.response?.data?.message || 
        'Error verificando conexión MercadoPago'
      );
    }
  }
}

export default new MercadoPagoService(); 