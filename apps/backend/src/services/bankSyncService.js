import { BankConnection } from '../models/BankConnection.js';
import { Transacciones } from '../models/Transacciones.js';
import { Cuentas } from '../models/Cuentas.js';
import crypto from 'crypto';
import { refreshAccessToken } from '../oauth/mercadoPagoOAuth.js';
import fetch from 'node-fetch';
import config from '../config/config.js';

export class BankSyncService {
  constructor() {
    this.encryptionKey = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
  }

  // Encriptar credenciales sensibles (Node.js moderno - usa createCipheriv)
  encrypt(text) {
    try {
      const iv = crypto.randomBytes(16);
      const key = crypto.createHash('sha256').update(this.encryptionKey).digest();
      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.error('Error encriptando:', error);
      throw new Error('Error al encriptar credenciales');
    }
  }

  // Desencriptar credenciales (Node.js moderno - usa createDecipheriv)
  decrypt(encryptedText) {
    try {
      if (encryptedText.includes(':')) {
        const parts = encryptedText.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];
        const key = crypto.createHash('sha256').update(this.encryptionKey).digest();
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
      } else {
        console.warn('⚠️ Detectado formato de encriptación antiguo');
        throw new Error('Formato de encriptación antiguo no soportado. Por favor, reconecta la cuenta.');
      }
    } catch (error) {
      console.error('Error desencriptando:', error);
      throw new Error('Error al desencriptar credenciales');
    }
  }

  // Categorizar transacción automáticamente basado en descripción
  categorizarTransaccion(descripcion) {
    const descripcionLower = descripcion.toLowerCase();
    
    const categorias = {
      'Salud y Belleza': ['farmacia', 'medico', 'doctor', 'hospital', 'clinica', 'salud', 'belleza', 'cosmeticos'],
      'Contabilidad y Facturas': ['factura', 'impuesto', 'servicio', 'luz', 'agua', 'gas', 'internet', 'telefono'],
      'Transporte': ['uber', 'taxi', 'bus', 'metro', 'combustible', 'gasolina', 'nafta', 'estacionamiento'],
      'Comida y Mercado': ['supermercado', 'restaurante', 'cafe', 'comida', 'mercado', 'verduleria', 'carniceria'],
      'Fiesta': ['bar', 'pub', 'discoteca', 'fiesta', 'evento', 'entrada', 'ticket'],
      'Ropa': ['ropa', 'zapatillas', 'calzado', 'tienda', 'shopping', 'moda'],
      'Tecnología': ['tecnologia', 'electronica', 'computadora', 'celular', 'software', 'app'],
      'Otro': []
    };

    for (const [categoria, palabras] of Object.entries(categorias)) {
      if (palabras.some(palabra => descripcionLower.includes(palabra))) {
        return categoria;
      }
    }

    return 'Otro';
  }

  // Sincronizar transacciones usando Plaid
  async sincronizarConPlaid(bankConnection) {
    try {
      console.log(`Sincronizando con Plaid para conexión: ${bankConnection.nombre}`);
      
      // Aquí iría la lógica real de Plaid
      // Por ahora simulamos la sincronización
      const transaccionesSimuladas = await this.simularTransaccionesPlaid(bankConnection);
      
      let transaccionesNuevas = 0;
      let transaccionesActualizadas = 0;

      for (const transaccionBanco of transaccionesSimuladas) {
        // Verificar si la transacción ya existe
        const transaccionExistente = await Transacciones.findOne({
          cuenta: bankConnection.cuenta,
          fecha: transaccionBanco.fecha,
          monto: transaccionBanco.monto,
          descripcion: transaccionBanco.descripcion
        });

        if (!transaccionExistente) {
          // Crear nueva transacción
          const nuevaTransaccion = new Transacciones({
            descripcion: transaccionBanco.descripcion,
            monto: transaccionBanco.monto,
            fecha: transaccionBanco.fecha,
            categoria: bankConnection.configuracion.categorizacionAutomatica ? 
              this.categorizarTransaccion(transaccionBanco.descripcion) : 'Otro',
            estado: 'COMPLETADA', // Las transacciones bancarias vienen como completadas
            tipo: transaccionBanco.monto > 0 ? 'INGRESO' : 'EGRESO',
            usuario: bankConnection.usuario,
            cuenta: bankConnection.cuenta,
            origen: {
              tipo: 'BANCARIO',
              conexionId: bankConnection._id,
              transaccionId: transaccionBanco.id
            }
          });

          await nuevaTransaccion.save();
          transaccionesNuevas++;
        }
      }

      // Actualizar estado de la conexión
      await bankConnection.actualizarSincronizacion(
        'EXITOSA',
        transaccionesNuevas,
        transaccionesActualizadas
      );

      return {
        exito: true,
        transaccionesNuevas,
        transaccionesActualizadas
      };

    } catch (error) {
      console.error('Error en sincronización Plaid:', error);
      
      await bankConnection.actualizarSincronizacion(
        'ERROR',
        0,
        0,
        error.message
      );

      return {
        exito: false,
        error: error.message
      };
    }
  }

  // Sincronizar transacciones usando Open Banking
  async sincronizarConOpenBanking(bankConnection) {
    try {
      console.log(`Sincronizando con Open Banking para conexión: ${bankConnection.nombre}`);
      
      // Aquí iría la lógica real de Open Banking
      // Por ahora simulamos la sincronización
      const transaccionesSimuladas = await this.simularTransaccionesOpenBanking(bankConnection);
      
      let transaccionesNuevas = 0;
      let transaccionesActualizadas = 0;

      for (const transaccionBanco of transaccionesSimuladas) {
        const transaccionExistente = await Transacciones.findOne({
          cuenta: bankConnection.cuenta,
          fecha: transaccionBanco.fecha,
          monto: transaccionBanco.monto,
          descripcion: transaccionBanco.descripcion
        });

        if (!transaccionExistente) {
          const nuevaTransaccion = new Transacciones({
            descripcion: transaccionBanco.descripcion,
            monto: transaccionBanco.monto,
            fecha: transaccionBanco.fecha,
            categoria: bankConnection.configuracion.categorizacionAutomatica ? 
              this.categorizarTransaccion(transaccionBanco.descripcion) : 'Otro',
            estado: 'COMPLETADA',
            tipo: transaccionBanco.monto > 0 ? 'INGRESO' : 'EGRESO',
            usuario: bankConnection.usuario,
            cuenta: bankConnection.cuenta,
            origen: {
              tipo: 'BANCARIO',
              conexionId: bankConnection._id,
              transaccionId: transaccionBanco.id
            }
          });

          await nuevaTransaccion.save();
          transaccionesNuevas++;
        }
      }

      await bankConnection.actualizarSincronizacion(
        'EXITOSA',
        transaccionesNuevas,
        transaccionesActualizadas
      );

      return {
        exito: true,
        transaccionesNuevas,
        transaccionesActualizadas
      };

    } catch (error) {
      console.error('Error en sincronización Open Banking:', error);
      
      await bankConnection.actualizarSincronizacion(
        'ERROR',
        0,
        0,
        error.message
      );

      return {
        exito: false,
        error: error.message
      };
    }
  }

  // Sincronizar transacciones usando API directa
  async sincronizarConAPIDirecta(bankConnection) {
    try {
      console.log(`Sincronizando con API directa para conexión: ${bankConnection.nombre}`);
      
      // Aquí iría la lógica real de API directa
      // Por ahora simulamos la sincronización
      const transaccionesSimuladas = await this.simularTransaccionesAPIDirecta(bankConnection);
      
      let transaccionesNuevas = 0;
      let transaccionesActualizadas = 0;

      for (const transaccionBanco of transaccionesSimuladas) {
        const transaccionExistente = await Transacciones.findOne({
          cuenta: bankConnection.cuenta,
          fecha: transaccionBanco.fecha,
          monto: transaccionBanco.monto,
          descripcion: transaccionBanco.descripcion
        });

        if (!transaccionExistente) {
          const nuevaTransaccion = new Transacciones({
            descripcion: transaccionBanco.descripcion,
            monto: transaccionBanco.monto,
            fecha: transaccionBanco.fecha,
            categoria: bankConnection.configuracion.categorizacionAutomatica ? 
              this.categorizarTransaccion(transaccionBanco.descripcion) : 'Otro',
            estado: 'COMPLETADA',
            tipo: transaccionBanco.monto > 0 ? 'INGRESO' : 'EGRESO',
            usuario: bankConnection.usuario,
            cuenta: bankConnection.cuenta,
            origen: {
              tipo: 'BANCARIO',
              conexionId: bankConnection._id,
              transaccionId: transaccionBanco.id
            }
          });

          await nuevaTransaccion.save();
          transaccionesNuevas++;
        }
      }

      await bankConnection.actualizarSincronizacion(
        'EXITOSA',
        transaccionesNuevas,
        transaccionesActualizadas
      );

      return {
        exito: true,
        transaccionesNuevas,
        transaccionesActualizadas
      };

    } catch (error) {
      console.error('Error en sincronización API directa:', error);
      
      await bankConnection.actualizarSincronizacion(
        'ERROR',
        0,
        0,
        error.message
      );

      return {
        exito: false,
        error: error.message
      };
    }
  }

  // Sincronizar transacciones usando MercadoPago
  async sincronizarConMercadoPago(bankConnection) {
    try {
      console.log(`Sincronizando con MercadoPago para conexión: ${bankConnection.nombre}`);
      
      // Desencriptar credenciales de MercadoPago del usuario
      let userAccessToken = this.decrypt(bankConnection.credenciales.accessToken);
      let refreshToken = this.decrypt(bankConnection.credenciales.refreshToken);
      const userId = this.decrypt(bankConnection.credenciales.userId);

      // Obtener información de la cuenta para acceder a la moneda
      const cuenta = await Cuentas.findById(bankConnection.cuenta);
      if (!cuenta) {
        throw new Error('Cuenta no encontrada');
      }
      
      // Obtener información del usuario usando la API REST directamente (como en el controller exitoso)
      const userRes = await fetch('https://api.mercadopago.com/users/me', {
        headers: { 
          'Authorization': `Bearer ${userAccessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!userRes.ok) {
        throw new Error(`Error obteniendo información del usuario: ${userRes.status}`);
      }

      const userInfo = await userRes.json();
      console.log('Usuario MercadoPago verificado:', userInfo.nickname || userInfo.email);

      // Obtener pagos recientes (solo para vendedores - opcional)
      const fechaDesde = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      let pagos = [];
      
      try {
        const paymentsUrl = `https://api.mercadopago.com/v1/payments/search?range=date_created&begin_date=${fechaDesde.toISOString()}&limit=100&sort=date_created.desc`;
        
        const paymentsRes = await fetch(paymentsUrl, {
          headers: { 
            'Authorization': `Bearer ${userAccessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (paymentsRes.ok) {
          const paymentsData = await paymentsRes.json();
          pagos = paymentsData.results || [];
          console.log('✅ Pagos obtenidos de MercadoPago:', {
            total: pagos.length,
            usuario: userInfo.nickname || userInfo.email
          });
        } else {
          console.warn('⚠️ No se pudieron obtener pagos (usuario no es vendedor):', paymentsRes.status);
        }
      } catch (error) {
        console.warn('⚠️ Error obteniendo pagos, continuando con movimientos:', error.message);
      }

      // Obtener movimientos de cuenta
      let movimientos = [];
      try {
        const movimientosUrl = `https://api.mercadopago.com/v1/account/bank_report?begin_date=${fechaDesde.toISOString()}&end_date=${new Date().toISOString()}`;
        const movimientosRes = await fetch(movimientosUrl, {
          headers: { 
            'Authorization': `Bearer ${userAccessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (movimientosRes.ok) {
          const movimientosData = await movimientosRes.json();
          movimientos = movimientosData.results || [];
          console.log('Movimientos de cuenta obtenidos:', movimientos.length);
        }
      } catch (error) {
        console.warn('No se pudieron obtener movimientos de cuenta:', error.message);
      }

      // Obtener balance de la cuenta
      let balance = { available: 0, unavailable: 0 };
      try {
        const balanceUrl = `https://api.mercadopago.com/users/${userId}/mercadopago_account/balance`;
        const balanceRes = await fetch(balanceUrl, {
          headers: { 
            'Authorization': `Bearer ${userAccessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (balanceRes.ok) {
          const balanceData = await balanceRes.json();
          balance.available = balanceData.available_balance || 0;
          balance.unavailable = balanceData.unavailable_balance || 0;
          console.log('Balance obtenido:', balance);
        }
      } catch (error) {
        console.warn('No se pudo obtener balance:', error.message);
      }

      // Procesar pagos como transacciones
      let transaccionesNuevas = 0;
      let transaccionesActualizadas = 0;

      for (const pago of pagos) {
        try {
          // Verificar si la transacción ya existe
          const transaccionExistente = await Transacciones.findOne({
            cuenta: bankConnection.cuenta,
            'origen.transaccionId': pago.id.toString(),
            'origen.tipo': 'MERCADOPAGO_PAGO'
          });

          if (!transaccionExistente) {
            // Calcular comisiones
            const comisiones = this.calcularComisionesMercadoPago(pago);
            const monto = Math.abs(pago.transaction_amount || 0);
            const montoNeto = monto - comisiones.total;

            // Crear nueva transacción con metadata enriquecida
            const nuevaTransaccion = new Transacciones({
              descripcion: this.formatearDescripcionMercadoPago(pago),
              monto: monto,
              montoNeto: montoNeto,
              fecha: new Date(pago.date_created),
              categoria: bankConnection.configuracion.categorizacionAutomatica ? 
                this.categorizarTransaccion(this.formatearDescripcionMercadoPago(pago)) : 'Otro',
              estado: this.mapearEstadoMercadoPago(pago.status),
              tipo: pago.transaction_amount > 0 ? 'INGRESO' : 'EGRESO',
              usuario: bankConnection.usuario,
              cuenta: bankConnection.cuenta,
              moneda: cuenta.moneda, // Usar la moneda de la cuenta
              comisiones: comisiones,
              origen: {
                tipo: 'MERCADOPAGO_PAGO',
                conexionId: bankConnection._id,
                transaccionId: pago.id.toString(),
                metadata: {
                  paymentId: pago.id,
                  status: pago.status,
                  statusDetail: pago.status_detail,
                  paymentMethod: pago.payment_method?.type,
                  paymentMethodId: pago.payment_method_id,
                  issuer: pago.issuer_id,
                  cardInfo: pago.card ? {
                    firstSix: pago.card.first_six_digits,
                    lastFour: pago.card.last_four_digits,
                    cardholderName: pago.card.cardholder?.name
                  } : null,
                  currencyId: pago.currency_id,
                  installments: pago.installments,
                  description: pago.description
                }
              }
            });

            await nuevaTransaccion.save();
            transaccionesNuevas++;
          }
        } catch (error) {
          console.error(`Error procesando pago ${pago.id}:`, error);
        }
      }

      // Procesar movimientos de cuenta como transacciones
      for (const movimiento of movimientos) {
        try {
          const transaccionExistente = await Transacciones.findOne({
            cuenta: bankConnection.cuenta,
            'origen.transaccionId': movimiento.id?.toString(),
            'origen.tipo': 'MERCADOPAGO_MOVIMIENTO'
          });

          if (!transaccionExistente && movimiento.id) {
            const transaccion = new Transacciones({
              descripcion: `MercadoPago - ${movimiento.type || 'Movimiento'}`,
              monto: Math.abs(movimiento.amount || 0),
              montoNeto: Math.abs(movimiento.amount || 0), // Movimientos no tienen comisión adicional
              fecha: new Date(movimiento.date_created),
              categoria: 'Otro',
              estado: 'COMPLETADA',
              tipo: movimiento.amount > 0 ? 'INGRESO' : 'EGRESO',
              usuario: bankConnection.usuario,
              cuenta: bankConnection.cuenta,
              moneda: cuenta.moneda, // Usar la moneda de la cuenta
              comisiones: { // Inicializar comisiones en 0
                mercadopago: 0,
                financieras: 0,
                envio: 0,
                total: 0
              },
              origen: {
                tipo: 'MERCADOPAGO_MOVIMIENTO',
                conexionId: bankConnection._id,
                transaccionId: movimiento.id.toString(),
                metadata: {
                  movementType: movimiento.type,
                  concept: movimiento.concept,
                  reference: movimiento.reference
                }
              }
            });
            await transaccion.save();
            transaccionesNuevas++;
          }
        } catch (error) {
          console.error(`Error procesando movimiento:`, error);
        }
      }

      // Actualizar balances en la cuenta
      try {
        await Cuentas.findByIdAndUpdate(bankConnection.cuenta, {
          saldo: balance.available,
          'mercadopago.disponibleRetiro': balance.available,
          'mercadopago.disponiblePendiente': balance.unavailable
        });
        console.log('Balances actualizados en cuenta');
      } catch (error) {
        console.error('Error actualizando balances:', error);
      }

      // Actualizar estado de la conexión
      await bankConnection.actualizarSincronizacion(
        'EXITOSA',
        transaccionesNuevas,
        transaccionesActualizadas
      );

      return {
        exito: true,
        transaccionesNuevas,
        transaccionesActualizadas,
        detalles: {
          usuario: userInfo.nickname || userInfo.email,
          totalPagos: pagos.length,
          totalMovimientos: movimientos.length,
          balance: balance,
          errores: []
        }
      };

    } catch (error) {
      console.error('Error en sincronización MercadoPago:', error);
      
      await bankConnection.actualizarSincronizacion(
        'ERROR',
        0,
        0,
        error.message
      );

      return {
        exito: false,
        error: error.message
      };
    }
  }

  // Obtener pagos de MercadoPago (método actualizado para usar el adaptador)
  async obtenerPagosMercadoPago(accessToken, fechaDesde) {
    try {
      // Importar el adaptador de MercadoPago
      const { MercadoPagoAdapter } = await import('./adapters/mercadoPagoAdapter.js');
      
      // Crear instancia del adaptador
      const mpAdapter = new MercadoPagoAdapter({
        accessToken,
        refreshToken: null, // No necesario para este método
        userId: null // No necesario para este método
      });

      // Obtener pagos usando el adaptador corregido
      const pagos = await mpAdapter.getMovimientos({
        since: fechaDesde.toISOString(),
        limit: 100
      });
      
      return pagos;
    } catch (error) {
      console.error('Error obteniendo pagos de MercadoPago:', error);
      throw error;
    }
  }

  // Formatear descripción de transacción de MercadoPago
  formatearDescripcionMercadoPago(pago) {
    let descripcion = `MercadoPago - ${pago.payment_method?.type || 'Pago'}`;
    
    if (pago.description) {
      descripcion += ` - ${pago.description}`;
    }
    
    if (pago.external_reference) {
      descripcion += ` (Ref: ${pago.external_reference})`;
    }
    
    return descripcion;
  }

  // Mapear estado de MercadoPago a estado interno
  mapearEstadoMercadoPago(status) {
    const estados = {
      'approved': 'COMPLETADA',
      'pending': 'PENDIENTE',
      'in_process': 'PENDIENTE',
      'rejected': 'CANCELADA',
      'cancelled': 'CANCELADA',
      'refunded': 'CANCELADA'
    };
    
    return estados[status] || 'PENDIENTE';
  }

  // Método principal de sincronización
  async sincronizarConexion(bankConnection) {
    try {
      switch (bankConnection.tipo) {
        case 'PLAID':
          return await this.sincronizarConPlaid(bankConnection);
        case 'OPEN_BANKING':
          return await this.sincronizarConOpenBanking(bankConnection);
        case 'API_DIRECTA':
          return await this.sincronizarConAPIDirecta(bankConnection);
        case 'MERCADOPAGO':
          return await this.sincronizarConMercadoPago(bankConnection);
        default:
          throw new Error(`Tipo de conexión no soportado: ${bankConnection.tipo}`);
      }
    } catch (error) {
      console.error('Error en sincronización:', error);
      throw error;
    }
  }

  // Sincronizar todas las conexiones pendientes
  async sincronizarTodasLasConexiones() {
    try {
      const conexiones = await BankConnection.getConexionesParaSincronizar();
      console.log(`Sincronizando ${conexiones.length} conexiones bancarias`);

      const resultados = [];
      for (const conexion of conexiones) {
        try {
          const resultado = await this.sincronizarConexion(conexion);
          resultados.push({
            conexionId: conexion._id,
            nombre: conexion.nombre,
            ...resultado
          });
        } catch (error) {
          console.error(`Error sincronizando conexión ${conexion.nombre}:`, error);
          resultados.push({
            conexionId: conexion._id,
            nombre: conexion.nombre,
            exito: false,
            error: error.message
          });
        }
      }

      return resultados;
    } catch (error) {
      console.error('Error en sincronización masiva:', error);
      throw error;
    }
  }

  // Métodos de simulación para desarrollo
  async simularTransaccionesPlaid(bankConnection) {
    // Simular transacciones de Plaid
    const transacciones = [];
    const ahora = new Date();
    
    for (let i = 0; i < 5; i++) {
      const fecha = new Date(ahora.getTime() - i * 24 * 60 * 60 * 1000);
      transacciones.push({
        id: `plaid_${Date.now()}_${i}`,
        descripcion: `Transacción Plaid ${i + 1}`,
        monto: Math.random() > 0.5 ? Math.random() * 1000 : -Math.random() * 500,
        fecha: fecha,
        categoria: 'Otro'
      });
    }
    
    return transacciones;
  }

  async simularTransaccionesOpenBanking(bankConnection) {
    // Simular transacciones de Open Banking
    const transacciones = [];
    const ahora = new Date();
    
    for (let i = 0; i < 3; i++) {
      const fecha = new Date(ahora.getTime() - i * 24 * 60 * 60 * 1000);
      transacciones.push({
        id: `openbanking_${Date.now()}_${i}`,
        descripcion: `Transacción Open Banking ${i + 1}`,
        monto: Math.random() > 0.5 ? Math.random() * 800 : -Math.random() * 300,
        fecha: fecha,
        categoria: 'Otro'
      });
    }
    
    return transacciones;
  }

  async simularTransaccionesAPIDirecta(bankConnection) {
    // Simular transacciones de API directa
    const transacciones = [];
    const ahora = new Date();
    
    for (let i = 0; i < 4; i++) {
      const fecha = new Date(ahora.getTime() - i * 24 * 60 * 60 * 1000);
      transacciones.push({
        id: `api_${Date.now()}_${i}`,
        descripcion: `Transacción API Directa ${i + 1}`,
        monto: Math.random() > 0.5 ? Math.random() * 1200 : -Math.random() * 600,
        fecha: fecha,
        categoria: 'Otro'
      });
    }
    
    return transacciones;
  }

  // Calcular comisiones de MercadoPago
  calcularComisionesMercadoPago(pago) {
    const comisiones = {
      mercadopago: 0,
      financieras: 0,
      envio: 0,
      total: 0
    };

    // MercadoPago devuelve las comisiones en fee_details
    if (pago.fee_details && Array.isArray(pago.fee_details)) {
      for (const fee of pago.fee_details) {
        const amount = Math.abs(fee.amount || 0);
        
        switch (fee.type) {
          case 'mercadopago_fee':
            comisiones.mercadopago += amount;
            break;
          case 'financing_fee':
            comisiones.financieras += amount;
            break;
          case 'shipping_fee':
            comisiones.envio += amount;
            break;
          default:
            // Otros tipos de comisiones se suman a MercadoPago
            comisiones.mercadopago += amount;
        }
      }
    }

    // Calcular total
    comisiones.total = comisiones.mercadopago + comisiones.financieras + comisiones.envio;

    return comisiones;
  }
} 