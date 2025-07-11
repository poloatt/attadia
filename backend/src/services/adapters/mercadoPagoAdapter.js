import fetch from 'node-fetch';
import mercadopago from 'mercadopago';

export class MercadoPagoAdapter {
  constructor({ accessToken, refreshToken, userId }) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.userId = userId;
    this.maxRetries = 3;
    this.timeout = 10000; // 10 segundos
    
    // Configurar el singleton de mercadopago
    mercadopago.configure({ access_token: accessToken });
  }

  // Método helper para retry con exponential backoff
  async withRetry(operation, retries = this.maxRetries) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await Promise.race([
          operation(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), this.timeout)
          )
        ]);
      } catch (error) {
        console.error(`Intento ${attempt} falló:`, {
          error: error.message,
          userId: this.userId,
          attempt,
          maxRetries: retries
        });

        if (attempt === retries) {
          throw error;
        }

        // Exponential backoff: esperar 2^attempt * 1000ms
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        console.log(`Reintentando en ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  async getUserInfo() {
    return this.withRetry(async () => {
      console.log('Obteniendo información de usuario MercadoPago...');
      
      // Usar la API de singleton
      const res = await mercadopago.users.getMe();
      
      if (!res || !res.body || !res.body.id) {
        throw new Error('No se pudo obtener info de usuario MercadoPago');
      }
      
      console.log('Información de usuario obtenida:', {
        userId: res.body.id,
        email: res.body.email,
        nickname: res.body.nickname
      });
      
      return res.body;
    });
  }

  async getMovimientos({ since }) {
    return this.withRetry(async () => {
      console.log('Obteniendo movimientos de MercadoPago...', {
        since: since || 'sin filtro de fecha',
        userId: this.userId
      });
      
      // since: fecha ISO para filtrar movimientos recientes
      const filters = since
        ? { 'date_created': { gte: since } }
        : {};
      
      const pagos = await mercadopago.payment.search({ filters });
      const results = pagos.body.results || [];
      
      console.log(`Movimientos obtenidos: ${results.length}`, {
        userId: this.userId,
        since,
        totalResults: results.length
      });
      
      return results;
    });
  }

  // Método para verificar la salud de la conexión
  async healthCheck() {
    try {
      const userInfo = await this.getUserInfo();
      const recentMovements = await this.getMovimientos({ 
        since: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() 
      });
      
      return {
        status: 'healthy',
        userInfo: {
          id: userInfo.id,
          email: userInfo.email,
          nickname: userInfo.nickname
        },
        recentMovements: recentMovements.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Health check falló:', error);
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
} 