import fetch from 'node-fetch';
import mercadopago from 'mercadopago';

export class MercadoPagoAdapter {
  constructor({ accessToken, refreshToken, userId }) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.userId = userId;
    // Configurar el singleton de mercadopago
    mercadopago.configure({ access_token: accessToken });
  }

  async getUserInfo() {
    // Usar la API de singleton
    const res = await mercadopago.users.getMe();
    if (!res || !res.body || !res.body.id) {
      throw new Error('No se pudo obtener info de usuario MercadoPago');
    }
    return res.body;
  }

  async getMovimientos({ since }) {
    // since: fecha ISO para filtrar movimientos recientes
    const filters = since
      ? { 'date_created': { gte: since } }
      : {};
    
    const pagos = await mercadopago.payment.search({ filters });
    return pagos.body.results || [];
  }
} 