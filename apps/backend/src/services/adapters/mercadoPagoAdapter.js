import fetch from 'node-fetch';

export class MercadoPagoAdapter {
  constructor({ accessToken, refreshToken, userId }) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.userId = userId;
    this.maxRetries = 3;
    this.timeout = 10000; // 10 segundos
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
      
      const response = await fetch('https://api.mercadopago.com/users/me', {
        headers: { 
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'PresentApp/1.0' // Identificar la aplicación (buena práctica)
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response from MercadoPago:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          userId: this.userId
        });
        
        // Manejar errores específicos de MercadoPago
        if (response.status === 401) {
          throw new Error('Token de acceso expirado o inválido');
        } else if (response.status === 403) {
          throw new Error('Acceso denegado - verificar permisos de la aplicación');
        } else if (response.status === 429) {
          throw new Error('Rate limit excedido - intentar más tarde');
        }
        
        throw new Error(`Error obteniendo información del usuario: ${response.status} - ${errorText}`);
      }
      
      const userInfo = await response.json();
      
      if (!userInfo || !userInfo.id) {
        throw new Error('No se pudo obtener info de usuario MercadoPago');
      }
      
      console.log('Información de usuario obtenida:', {
        userId: userInfo.id,
        email: userInfo.email,
        nickname: userInfo.nickname
      });
      
      return userInfo;
    });
  }

  async getMovimientos({ since, limit = 100 }) {
    return this.withRetry(async () => {
      console.log('Obteniendo movimientos de MercadoPago...', {
        since: since || 'sin filtro de fecha',
        limit,
        userId: this.userId
      });
      
      // Construir URL con filtros de fecha si se proporciona
      let url = 'https://api.mercadopago.com/v1/payments/search';
      const params = new URLSearchParams();
      
      if (since) {
        // Usar los parámetros correctos para el endpoint /v1/payments/search
        // Según la documentación oficial de Mercado Pago
        params.append('range', 'date_created');
        params.append('begin_date', since);
        // end_date se puede omitir para obtener hasta la fecha actual
      }
      
      // Agregar límite para evitar respuestas muy grandes
      params.append('limit', limit.toString());
      
      // Ordenar por fecha de creación descendente (más recientes primero)
      params.append('sort', 'date_created.desc');
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      console.log('URL de consulta MercadoPago:', url);
      
      const response = await fetch(url, {
        headers: { 
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'PresentApp/1.0'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response from MercadoPago payments:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          userId: this.userId,
          url
        });
        
        // Manejar errores específicos de MercadoPago
        if (response.status === 401) {
          throw new Error('Token de acceso expirado o inválido');
        } else if (response.status === 403) {
          throw new Error('Acceso denegado - verificar permisos de la aplicación');
        } else if (response.status === 429) {
          throw new Error('Rate limit excedido - intentar más tarde');
        }
        
        throw new Error(`Error obteniendo movimientos: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      const results = data.results || [];
      
      console.log(`Movimientos obtenidos: ${results.length}`, {
        userId: this.userId,
        since,
        limit,
        totalResults: results.length,
        hasPaging: !!data.paging
      });
      
      return results;
    });
  }

  // Método para obtener movimientos usando el endpoint de account/movements (alternativo)
  async getAccountMovements({ since, limit = 100 }) {
    return this.withRetry(async () => {
      console.log('Obteniendo movimientos de cuenta MercadoPago...', {
        since: since || 'sin filtro de fecha',
        limit,
        userId: this.userId
      });
      
      // Construir URL para el endpoint de movimientos de cuenta
      let url = 'https://api.mercadopago.com/v1/account/movements/search';
      const params = new URLSearchParams();
      
      if (since) {
        // Para este endpoint usamos date_created_from y date_created_to
        params.append('date_created_from', since);
        // end_date se puede omitir para obtener hasta la fecha actual
      }
      
      // Agregar límite para evitar respuestas muy grandes
      params.append('limit', limit.toString());
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      console.log('URL de consulta movimientos de cuenta:', url);
      
      const response = await fetch(url, {
        headers: { 
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'PresentApp/1.0'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response from MercadoPago account movements:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          userId: this.userId,
          url
        });
        
        // Manejar errores específicos de MercadoPago
        if (response.status === 401) {
          throw new Error('Token de acceso expirado o inválido');
        } else if (response.status === 403) {
          throw new Error('Acceso denegado - verificar permisos de la aplicación');
        } else if (response.status === 429) {
          throw new Error('Rate limit excedido - intentar más tarde');
        }
        
        throw new Error(`Error obteniendo movimientos de cuenta: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      const results = data.results || [];
      
      console.log(`Movimientos de cuenta obtenidos: ${results.length}`, {
        userId: this.userId,
        since,
        limit,
        totalResults: results.length,
        hasPaging: !!data.paging
      });
      
      return results;
    });
  }

  // Método para obtener transacciones usando el endpoint de merchant_orders
  async getMerchantOrders({ since, limit = 100 }) {
    return this.withRetry(async () => {
      console.log('Obteniendo órdenes de comerciante MercadoPago...', {
        since: since || 'sin filtro de fecha',
        limit,
        userId: this.userId
      });
      
      // Construir URL para el endpoint de merchant_orders
      let url = 'https://api.mercadopago.com/v1/merchant_orders/search';
      const params = new URLSearchParams();
      
      if (since) {
        // Para este endpoint usamos date_created_from y date_created_to
        params.append('date_created_from', since);
        // end_date se puede omitir para obtener hasta la fecha actual
      }
      
      // Agregar límite para evitar respuestas muy grandes
      params.append('limit', limit.toString());
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      console.log('URL de consulta órdenes de comerciante:', url);
      
      const response = await fetch(url, {
        headers: { 
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'PresentApp/1.0'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response from MercadoPago merchant orders:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          userId: this.userId,
          url
        });
        
        // Manejar errores específicos de MercadoPago
        if (response.status === 401) {
          throw new Error('Token de acceso expirado o inválido');
        } else if (response.status === 403) {
          throw new Error('Acceso denegado - verificar permisos de la aplicación');
        } else if (response.status === 429) {
          throw new Error('Rate limit excedido - intentar más tarde');
        }
        
        throw new Error(`Error obteniendo órdenes de comerciante: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      const results = data.results || [];
      
      console.log(`Órdenes de comerciante obtenidas: ${results.length}`, {
        userId: this.userId,
        since,
        limit,
        totalResults: results.length,
        hasPaging: !!data.paging
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