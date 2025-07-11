import fetch from 'node-fetch';
import mercadopago from 'mercadopago';

export class MercadoPagoAdapter {
  constructor({ accessToken, refreshToken, userId }) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.userId = userId;
    mercadopago.configure({ access_token: accessToken });
  }

  async getUserInfo() {
    const res = await fetch('https://api.mercadopago.com/users/me', {
      headers: { Authorization: `Bearer ${this.accessToken}` }
    });
    if (!res.ok) throw new Error('No se pudo obtener info de usuario MercadoPago');
    return await res.json();
  }

  async getMovimientos({ since }) {
    // since: fecha ISO para filtrar movimientos recientes
    const filters = since
      ? { 'date_created': `[${since},NOW]` }
      : {};
    return new Promise((resolve, reject) => {
      mercadopago.payment.search({ filters }, (error, response) => {
        if (error) return reject(error);
        resolve(response.body.results || []);
      });
    });
  }

  // Puedes agregar métodos para refrescar token, etc.
} 