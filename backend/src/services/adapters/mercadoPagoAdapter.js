import fetch from 'node-fetch';
import Mercadopago from 'mercadopago';

export class MercadoPagoAdapter {
  constructor({ accessToken, refreshToken, userId }) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.userId = userId;
    this.mp = new Mercadopago({ access_token: accessToken });
  }

  async getUserInfo() {
    // Usar la nueva API de instancia
    const res = await this.mp.users.getMe();
    if (!res || !res.id) throw new Error('No se pudo obtener info de usuario MercadoPago');
    return res;
  }

  async getMovimientos({ since }) {
    // since: fecha ISO para filtrar movimientos recientes
    const filters = since
      ? { 'date_created': { gte: since } }
      : {};
    const pagos = await this.mp.payment.search({ filters });
    return pagos.results || [];
  }
} 