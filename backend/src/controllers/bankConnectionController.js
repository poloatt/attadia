import { BaseController } from './BaseController.js';
import { BankConnection } from '../models/BankConnection.js';
import { BankSyncService } from '../services/bankSyncService.js';
import crypto from 'crypto';
import { getAuthUrl, exchangeCodeForToken } from '../oauth/mercadoPagoOAuth.js';
import { BankIntegrationService } from '../services/bankIntegrationService.js';
import fetch from 'node-fetch';
import logger from '../utils/logger.js';
import { Monedas, ISO_4217 } from '../models/Monedas.js';
import { Cuentas } from '../models/Cuentas.js';
import config from '../config/config.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

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
      // Verificar que tenemos el access token
      if (!credenciales.accessToken) {
        return {
          exito: false,
          mensaje: 'Access token de MercadoPago requerido'
        };
      }

      // Obtener información del usuario usando la API REST directamente
      const userRes = await fetch('https://api.mercadopago.com/users/me', {
        headers: { 
          'Authorization': `Bearer ${credenciales.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!userRes.ok) {
        throw new Error(`Error obteniendo información del usuario: ${userRes.status}`);
      }

      const userInfo = await userRes.json();

            // Importar el adaptador de MercadoPago
      const { MercadoPagoAdapter } = await import('../services/adapters/mercadoPagoAdapter.js');
      
      // Crear instancia del adaptador
      const mpAdapter = new MercadoPagoAdapter({
        accessToken: credenciales.accessToken,
        refreshToken: null,
        userId: null
      });

      // Obtener algunos pagos recientes para verificar el token
      const fechaDesde = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const paymentsData = await mpAdapter.getMovimientos({
        since: fechaDesde.toISOString(),
        limit: 10
      });

      return {
        exito: true,
        mensaje: 'Conexión con MercadoPago verificada exitosamente',
        datos: {
          usuario: userInfo,
          pagosRecientes: paymentsData.length || 0
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
      
      const { authUrl, state } = getAuthUrl(redirectUri);
      
      // Guardar el state en la sesión para validarlo en el callback
      if (req.session) {
        req.session.mercadopagoState = state;
      }
      
      res.json({ authUrl, state });
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
      const { code, state } = req.body;
      if (!code) {
        return res.status(400).json({ message: 'Código de autorización requerido' });
      }

      // Validar el parámetro state para prevenir CSRF (recomendado por MercadoPago)
      if (req.session && req.session.mercadopagoState && state !== req.session.mercadopagoState) {
        logger.error('State validation failed', null, {
          receivedState: state,
          expectedState: req.session.mercadopagoState,
          userId: req.user?.id
        });
        return res.status(400).json({ message: 'Parámetro state inválido' });
      }

      // Intercambiar código por token
      const redirectUri = `${config.frontendUrl}/mercadopago/callback`;
      const { accessToken, refreshToken, userId } = await exchangeCodeForToken({ code, redirectUri });

      // Obtener información del usuario de MercadoPago
      const userInfo = await this.obtenerInformacionUsuarioMercadoPago(accessToken);

      // Obtener país del usuario (por defecto Argentina)
      const pais = userInfo.country_id || 'AR';
      
      // Obtener moneda asociada al país
      const moneda = await this.obtenerMonedaPorPais(pais);

      // Crear cuenta para MercadoPago
      const cuenta = new Cuentas({
        nombre: `MercadoPago - ${userInfo.nickname || userInfo.email}`,
        tipo: 'DIGITAL',
        moneda: moneda._id,
        usuario: req.user.id,
        saldo: 0,
        activa: true,
        configuracion: {
          categorizacionAutomatica: true,
          sincronizacionAutomatica: true
        }
      });

      await cuenta.save();

      // Crear conexión bancaria
      const conexion = new BankConnection({
        nombre: `MercadoPago - ${userInfo.nickname || userInfo.email}`,
        tipo: 'MERCADOPAGO',
        usuario: req.user.id,
        cuenta: cuenta._id,
        credenciales: {
          accessToken: this.encrypt(accessToken),
          refreshToken: this.encrypt(refreshToken),
          userId: this.encrypt(userId.toString())
        },
        configuracion: {
          categorizacionAutomatica: true,
          sincronizacionAutomatica: true,
          sincronizacionIntervalo: 3600 // 1 hora
        },
        estado: 'ACTIVA',
        ultimaSincronizacion: new Date(),
        proximaSincronizacion: new Date(Date.now() + 3600 * 1000)
      });

      await conexion.save();

      // Limpiar el state de la sesión
      if (req.session) {
        delete req.session.mercadopagoState;
      }

      logger.mercadopago('CONNECTION_CREATED', 'Conexión MercadoPago creada exitosamente', {
        userId: req.user.id,
        mercadopagoUserId: userId,
        cuentaId: cuenta._id,
        conexionId: conexion._id
      });

      res.json({
        message: 'Conexión con MercadoPago establecida exitosamente',
        conexion: {
          id: conexion._id,
          nombre: conexion.nombre,
          tipo: conexion.tipo,
          estado: conexion.estado
        },
        cuenta: {
          id: cuenta._id,
          nombre: cuenta.nombre,
          moneda: {
            codigo: moneda.codigo,
            simbolo: moneda.simbolo
          }
        }
      });
    } catch (error) {
      console.error('Error en callback MercadoPago:', error);
      res.status(500).json({ 
        message: 'Error procesando autorización de MercadoPago',
        error: error.message 
      });
    }
  }

  // GET /api/bankconnections/mercadopago/datos-completos/:conexionId
  async obtenerDatosCompletosMercadoPago(req, res) {
    try {
      const { conexionId } = req.params;
      const { fechaDesde, limit = 100 } = req.query;

      // Verificar que la conexión existe y pertenece al usuario
      const conexion = await BankConnection.findOne({
        _id: conexionId,
        usuario: req.user.id,
        tipo: 'MERCADOPAGO'
      });

      if (!conexion) {
        return res.status(404).json({ message: 'Conexión no encontrada' });
      }

      // Importar el servicio de datos completos
      const { MercadoPagoDataService } = await import('../services/mercadoPagoDataService.js');

      // Desencriptar credenciales
      const accessToken = this.decrypt(conexion.credenciales.accessToken);
      const refreshToken = this.decrypt(conexion.credenciales.refreshToken);
      const userId = this.decrypt(conexion.credenciales.userId);

      // Crear instancia del servicio
      const mpDataService = new MercadoPagoDataService({
        accessToken,
        refreshToken,
        userId,
        usuarioId: req.user.id
      });

      // Obtener datos completos
      const datosCompletos = await mpDataService.obtenerDatosCompletos({
        fechaDesde: fechaDesde || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        limit: parseInt(limit)
      });

      res.json({
        message: 'Datos completos obtenidos exitosamente',
        datos: datosCompletos,
        resumen: {
          totalPagos: datosCompletos.pagos.length,
          totalMovimientos: datosCompletos.movimientosCuenta.length,
          totalOrdenes: datosCompletos.ordenesComerciante.length,
          errores: datosCompletos.errores.length
        }
      });

    } catch (error) {
      console.error('Error obteniendo datos completos de MercadoPago:', error);
      res.status(500).json({ 
        message: 'Error obteniendo datos completos',
        error: error.message 
      });
    }
  }

  // POST /api/bankconnections/mercadopago/procesar-datos/:conexionId
  async procesarDatosMercadoPago(req, res) {
    try {
      const { conexionId } = req.params;
      const { procesarPagos = true, procesarMovimientos = true } = req.body;

      // Verificar que la conexión existe y pertenece al usuario
      const conexion = await BankConnection.findOne({
        _id: conexionId,
        usuario: req.user.id,
        tipo: 'MERCADOPAGO'
      });

      if (!conexion) {
        return res.status(404).json({ message: 'Conexión no encontrada' });
      }

      // Importar el servicio de datos completos
      const { MercadoPagoDataService } = await import('../services/mercadoPagoDataService.js');

      // Desencriptar credenciales
      const accessToken = this.decrypt(conexion.credenciales.accessToken);
      const refreshToken = this.decrypt(conexion.credenciales.refreshToken);
      const userId = this.decrypt(conexion.credenciales.userId);

      // Crear instancia del servicio
      const mpDataService = new MercadoPagoDataService({
        accessToken,
        refreshToken,
        userId,
        usuarioId: req.user.id
      });

      // Obtener datos completos (últimos 30 días)
      const fechaDesde = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const datosCompletos = await mpDataService.obtenerDatosCompletos({
        fechaDesde: fechaDesde.toISOString(),
        limit: 100
      });

      const resultados = {
        pagos: { nuevas: 0, actualizadas: 0 },
        movimientos: { nuevas: 0, actualizadas: 0 },
        errores: datosCompletos.errores
      };

      // Procesar pagos si se solicita
      if (procesarPagos) {
        const resultadoPagos = await mpDataService.procesarPagos(
          datosCompletos.pagos, 
          conexion.cuenta
        );
        resultados.pagos = resultadoPagos;
      }

      // Procesar movimientos si se solicita
      if (procesarMovimientos) {
        const resultadoMovimientos = await mpDataService.procesarMovimientosCuenta(
          datosCompletos.movimientosCuenta, 
          conexion.cuenta
        );
        resultados.movimientos = resultadoMovimientos;
      }

      // Actualizar estado de la conexión
      const totalNuevas = resultados.pagos.nuevas + resultados.movimientos.nuevas;
      const totalActualizadas = resultados.pagos.actualizadas + resultados.movimientos.actualizadas;

      await conexion.actualizarSincronizacion(
        'EXITOSA',
        totalNuevas,
        totalActualizadas
      );

      res.json({
        message: 'Datos procesados exitosamente',
        resultados,
        resumen: {
          totalNuevas,
          totalActualizadas,
          totalErrores: datosCompletos.errores.length
        }
      });

    } catch (error) {
      console.error('Error procesando datos de MercadoPago:', error);
      res.status(500).json({ 
        message: 'Error procesando datos',
        error: error.message 
      });
    }
  }

  /**
   * Crea una preferencia de pago de prueba usando el SDK de MercadoPago v2.8.0
   * Sintaxis compatible con require/configure/preferences.create
   */
  async pagoPrueba(req, res) {
    try {
      const mercadopago = require('mercadopago');
      mercadopago.configure({
        access_token: process.env.MERCADOPAGO_ACCESS_TOKEN || config.mercadopago.accessToken
      });

      const result = await mercadopago.preferences.create({
        items: [
          {
            title: 'Pago de prueba - Validación app MercadoPago',
            quantity: 1,
            currency_id: 'ARS',
            unit_price: 1000
          }
        ]
      });

      res.json({
        success: true,
        init_point: result.body.init_point,
        message: 'Preferencia creada exitosamente'
      });
    } catch (error) {
      console.error('Error creando preferencia de pago:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Error al crear preferencia de pago'
      });
    }
  }

  // Método para obtener información del usuario de MercadoPago
  async obtenerInformacionUsuarioMercadoPago(accessToken) {
    const response = await fetch('https://api.mercadopago.com/users/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error(`Error obteniendo información del usuario de MercadoPago: ${response.status}`);
    }
    return await response.json();
  }
}

export default BankConnectionController; 