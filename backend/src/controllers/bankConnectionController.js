import { BaseController } from './BaseController.js';
import { BankConnection } from '../models/BankConnection.js';
import { BankSyncService } from '../services/bankSyncService.js';
import crypto from 'crypto';
import { getAuthUrl, exchangeCodeForToken } from '../oauth/mercadoPagoOAuth.js';
import { BankIntegrationService } from '../services/bankIntegrationService.js';
import mercadopago from 'mercadopago';

class BankConnectionController extends BaseController {
  constructor() {
    super(BankConnection, {
      searchFields: ['nombre', 'banco']
    });

    this.bankSyncService = new BankSyncService();
    
    // Bind de los métodos al contexto de la instancia
    this.verificarConexion = this.verificarConexion.bind(this);
    this.sincronizarConexion = this.sincronizarConexion.bind(this);
    this.sincronizarTodas = this.sincronizarTodas.bind(this);
  }

  // Sobrescribir getAll para filtrar por usuario
  async getAll(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        sort = '-createdAt',
        search,
        filter
      } = req.query;

      const query = {
        usuario: req.user.id
      };

      if (search) {
        query.$or = this.options.searchFields.map(field => ({
          [field]: { $regex: search, $options: 'i' }
        }));
      }

      if (filter) {
        Object.assign(query, JSON.parse(filter));
      }

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort,
        populate: 'cuenta'
      };

      const result = await this.Model.paginate(query, options);
      res.json(result);
    } catch (error) {
      console.error('Error en getAll:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // POST /api/bankconnections/verify
  async verificarConexion(req, res) {
    try {
      const { tipo, credenciales } = req.body;

      if (!tipo || !credenciales) {
        return res.status(400).json({ 
          message: 'Tipo de conexión y credenciales son requeridos' 
        });
      }

      let resultado = { exito: false, mensaje: '' };

      switch (tipo) {
        case 'MERCADOPAGO':
          resultado = await this.verificarMercadoPago(credenciales);
          break;
        case 'PLAID':
          resultado = await this.verificarPlaid(credenciales);
          break;
        case 'OPEN_BANKING':
          resultado = await this.verificarOpenBanking(credenciales);
          break;
        case 'API_DIRECTA':
          resultado = await this.verificarAPIDirecta(credenciales);
          break;
        default:
          return res.status(400).json({ 
            message: 'Tipo de conexión no soportado' 
          });
      }

      if (resultado.exito) {
        res.json({ 
          message: 'Conexión verificada exitosamente',
          datos: resultado.datos 
        });
      } else {
        res.status(400).json({ 
          message: resultado.mensaje 
        });
      }

    } catch (error) {
      console.error('Error verificando conexión:', error);
      res.status(500).json({ 
        message: 'Error interno del servidor' 
      });
    }
  }

  // Verificar conexión con MercadoPago
  async verificarMercadoPago(credenciales) {
    try {
      // Configurar el singleton de mercadopago
      mercadopago.configure({ access_token: credenciales.accessToken });
      // Obtener información del usuario
      const userInfo = await mercadopago.users.getMe();
      // Obtener algunos pagos recientes para verificar el token
      const pagos = await mercadopago.payment.search({ 
        filters: { 
          'date_created': { 
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() 
          } 
        } 
      });
      return {
        exito: true,
        mensaje: 'Conexión con MercadoPago verificada exitosamente',
        datos: {
          usuario: userInfo.body,
          pagosRecientes: pagos.body.results.length
        }
      };
    } catch (error) {
      console.error('Error verificando MercadoPago:', error);
      return {
        exito: false,
        mensaje: 'Error verificando conexión con MercadoPago: ' + error.message
      };
    }
  }

  // Verificar conexión con Plaid (simulado)
  async verificarPlaid(credenciales) {
    // Simulación de verificación de Plaid
    return {
      exito: true,
      mensaje: 'Conexión con Plaid verificada exitosamente',
      datos: {
        institution: 'Banco Simulado',
        accounts: 1
      }
    };
  }

  // Verificar conexión con Open Banking (simulado)
  async verificarOpenBanking(credenciales) {
    // Simulación de verificación de Open Banking
    return {
      exito: true,
      mensaje: 'Conexión con Open Banking verificada exitosamente',
      datos: {
        bank: 'Banco Open Banking',
        accounts: 1
      }
    };
  }

  // Verificar conexión con API Directa (simulado)
  async verificarAPIDirecta(credenciales) {
    // Simulación de verificación de API Directa
    return {
      exito: true,
      mensaje: 'Conexión con API Directa verificada exitosamente',
      datos: {
        bank: 'Banco API Directa',
        accounts: 1
      }
    };
  }

  // POST /api/bankconnections/:id/sync
  async sincronizarConexion(req, res) {
    try {
      const { id } = req.params;
      
      const conexion = await this.Model.findOne({
        _id: id,
        usuario: req.user.id
      });

      if (!conexion) {
        return res.status(404).json({ 
          message: 'Conexión bancaria no encontrada' 
        });
      }

      const resultado = await this.bankSyncService.sincronizarConexion(conexion);

      res.json({
        message: 'Sincronización completada',
        resultado
      });

    } catch (error) {
      console.error('Error sincronizando conexión:', error);
      res.status(500).json({ 
        message: 'Error interno del servidor' 
      });
    }
  }

  // POST /api/bankconnections/sync-all
  async sincronizarTodas(req, res) {
    try {
      const resultado = await this.bankSyncService.sincronizarTodasLasConexiones();

      res.json({
        message: 'Sincronización de todas las conexiones completada',
        resultado
      });

    } catch (error) {
      console.error('Error sincronizando todas las conexiones:', error);
      res.status(500).json({ 
        message: 'Error interno del servidor' 
      });
    }
  }

  // Sobrescribir el método create para encriptar credenciales
  async create(req, res) {
    try {
      const datosConexion = { ...req.body, usuario: req.user.id };

      // Validaciones específicas por tipo
      if (datosConexion.tipo === 'MERCADOPAGO') {
        if (!datosConexion.credenciales?.userId) {
          return res.status(400).json({ message: 'User ID de MercadoPago requerido.' });
        }
        if (!datosConexion.nombre || datosConexion.nombre.trim() === '') {
          return res.status(400).json({ message: 'El nombre de la conexión MercadoPago no puede estar vacío.' });
        }
      } else if (datosConexion.tipo !== 'MANUAL') {
        if (!datosConexion.banco) {
          return res.status(400).json({ message: 'Banco requerido.' });
        }
        if (!datosConexion.cuenta) {
          return res.status(400).json({ message: 'Cuenta requerida.' });
        }
      }

      // Encriptar credenciales sensibles
      if (datosConexion.credenciales) {
        const credencialesEncriptadas = {};
        for (const [key, value] of Object.entries(datosConexion.credenciales)) {
          if (value) {
            credencialesEncriptadas[key] = this.bankSyncService.encrypt(value);
          }
        }
        datosConexion.credenciales = credencialesEncriptadas;
      }

      const conexion = new this.Model(datosConexion);
      await conexion.save();

      // Si es MercadoPago, sincronizar inmediatamente
      if (conexion.tipo === 'MERCADOPAGO') {
        try {
          await this.bankSyncService.sincronizarConexion(conexion);
          // Recargar la conexión para devolver el estado actualizado
          await conexion.reload();
        } catch (syncError) {
          console.error('Error sincronizando MercadoPago al crear:', syncError);
        }
      }

      res.status(201).json(conexion);
    } catch (error) {
      console.error('Error creando conexión bancaria:', error);
      res.status(500).json({ 
        message: error.message 
      });
    }
  }

  // Sobrescribir el método update para encriptar credenciales
  async update(req, res) {
    try {
      const { id } = req.params;
      const datosActualizacion = { ...req.body };

      // Encriptar credenciales sensibles si se están actualizando
      if (datosActualizacion.credenciales) {
        const credencialesEncriptadas = {};
        
        for (const [key, value] of Object.entries(datosActualizacion.credenciales)) {
          if (value) {
            credencialesEncriptadas[key] = this.bankSyncService.encrypt(value);
          }
        }
        
        datosActualizacion.credenciales = credencialesEncriptadas;
      }

      const conexion = await this.Model.findOneAndUpdate(
        { _id: id, usuario: req.user.id },
        datosActualizacion,
        { new: true, runValidators: true }
      );

      if (!conexion) {
        return res.status(404).json({ 
          message: 'Conexión bancaria no encontrada' 
        });
      }

      res.json(conexion);
    } catch (error) {
      console.error('Error actualizando conexión bancaria:', error);
      res.status(500).json({ 
        message: error.message 
      });
    }
  }

  // GET /api/bankconnections/mercadopago/auth-url
  async getMercadoPagoAuthUrl(req, res) {
    try {
      const redirectUri = req.query.redirect_uri;
      if (!redirectUri) {
        return res.status(400).json({ message: 'redirect_uri es requerido' });
      }
      const authUrl = getAuthUrl(redirectUri);
      res.json({ authUrl });
    } catch (error) {
      console.error('Error generando URL de autorización MercadoPago:', error);
      res.status(500).json({ 
        message: 'Error generando URL de autorización',
        error: error.message 
      });
    }
  }

  // POST /api/bankconnections/mercadopago/callback
  async mercadoPagoCallback(req, res) {
    try {
      const { code } = req.body;
      if (!code) {
        return res.status(400).json({ message: 'Código de autorización requerido' });
      }
      // Usar la redirect_uri EXACTA registrada en MercadoPago
      const redirectUri = 'https://admin.attadia.com/mercadopago/callback';
      // Intercambiar code por token y userId
      const tokenData = await exchangeCodeForToken({ code, redirectUri });
      const userRes = await fetch('https://api.mercadopago.com/users/me', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });
      if (!userRes.ok) {
        throw new Error(`Error obteniendo información del usuario: ${userRes.status}`);
      }
      const userData = await userRes.json();
      // Modular: usar BankIntegrationService
      const connection = await BankIntegrationService.connect({
        tipo: 'MERCADOPAGO',
        usuario: req.user.id,
        credenciales: {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          userId: userData.id?.toString() || ''
        },
        moneda: undefined // Puedes mejorar para detectar la moneda
      });
      res.json({
        message: 'Conexión MercadoPago creada y sincronizada',
        conexion: connection
      });
    } catch (error) {
      console.error('Error en callback MercadoPago:', error);
      res.status(500).json({
        message: 'Error conectando con MercadoPago',
        error: error.message
      });
    }
  }
}

export default BankConnectionController; 