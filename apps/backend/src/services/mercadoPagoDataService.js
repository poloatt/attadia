import { MercadoPagoAdapter } from './adapters/mercadoPagoAdapter.js';
import { Monedas } from '../models/Monedas.js';
import { Transacciones } from '../models/Transacciones.js';
import { Cuentas } from '../models/Cuentas.js';

export class MercadoPagoDataService {
  constructor({ accessToken, refreshToken, userId, usuarioId }) {
    this.mpAdapter = new MercadoPagoAdapter({
      accessToken,
      refreshToken,
      userId
    });
    this.usuarioId = usuarioId;
  }

  // Obtener datos completos del usuario de Mercado Pago
  async obtenerDatosCompletos({ fechaDesde = null, limit = 100 }) {
    try {
      console.log('Obteniendo datos completos de Mercado Pago...', {
        fechaDesde,
        limit,
        usuarioId: this.usuarioId
      });

      const fechaDesdeISO = fechaDesde ? new Date(fechaDesde).toISOString() : null;

      // Obtener información del usuario
      const userInfo = await this.mpAdapter.getUserInfo();

      // Obtener datos de múltiples endpoints en paralelo
      const [
        pagos,
        movimientosCuenta,
        ordenesComerciante
      ] = await Promise.allSettled([
        this.mpAdapter.getMovimientos({ since: fechaDesdeISO, limit }),
        this.mpAdapter.getAccountMovements({ since: fechaDesdeISO, limit }),
        this.mpAdapter.getMerchantOrders({ since: fechaDesdeISO, limit })
      ]);

      // Procesar resultados
      const resultados = {
        usuario: userInfo,
        pagos: pagos.status === 'fulfilled' ? pagos.value : [],
        movimientosCuenta: movimientosCuenta.status === 'fulfilled' ? movimientosCuenta.value : [],
        ordenesComerciante: ordenesComerciante.status === 'fulfilled' ? ordenesComerciante.value : [],
        errores: []
      };

      // Registrar errores si los hay
      if (pagos.status === 'rejected') {
        console.error('Error obteniendo pagos:', pagos.reason);
        resultados.errores.push({ tipo: 'pagos', error: pagos.reason.message });
      }

      if (movimientosCuenta.status === 'rejected') {
        console.error('Error obteniendo movimientos de cuenta:', movimientosCuenta.reason);
        resultados.errores.push({ tipo: 'movimientos_cuenta', error: movimientosCuenta.reason.message });
      }

      if (ordenesComerciante.status === 'rejected') {
        console.error('Error obteniendo órdenes de comerciante:', ordenesComerciante.reason);
        resultados.errores.push({ tipo: 'ordenes_comerciante', error: ordenesComerciante.reason.message });
      }

      console.log('Datos completos obtenidos:', {
        usuarioId: this.usuarioId,
        totalPagos: resultados.pagos.length,
        totalMovimientos: resultados.movimientosCuenta.length,
        totalOrdenes: resultados.ordenesComerciante.length,
        errores: resultados.errores.length
      });

      return resultados;
    } catch (error) {
      console.error('Error obteniendo datos completos de Mercado Pago:', error);
      throw error;
    }
  }

  // Procesar y guardar transacciones de pagos
  async procesarPagos(pagos, cuentaId) {
    try {
      console.log(`Procesando ${pagos.length} pagos para cuenta ${cuentaId}`);

      const transaccionesNuevas = [];
      const transaccionesActualizadas = [];

      for (const pago of pagos) {
        try {
          // Verificar si la transacción ya existe
          const transaccionExistente = await Transacciones.findOne({
            cuenta: cuentaId,
            'origen.transaccionId': pago.id.toString(),
            'origen.tipo': 'MERCADOPAGO_PAGO'
          });

          if (transaccionExistente) {
            // Actualizar transacción existente si es necesario
            const actualizada = await this.actualizarTransaccionExistente(transaccionExistente, pago);
            if (actualizada) {
              transaccionesActualizadas.push(actualizada);
            }
            continue;
          }

          // Crear nueva transacción
          const nuevaTransaccion = await this.crearTransaccionDePago(pago, cuentaId);
          if (nuevaTransaccion) {
            transaccionesNuevas.push(nuevaTransaccion);
          }
        } catch (error) {
          console.error(`Error procesando pago ${pago.id}:`, error);
        }
      }

      return {
        nuevas: transaccionesNuevas.length,
        actualizadas: transaccionesActualizadas.length,
        transacciones: [...transaccionesNuevas, ...transaccionesActualizadas]
      };
    } catch (error) {
      console.error('Error procesando pagos:', error);
      throw error;
    }
  }

  // Procesar y guardar transacciones de movimientos de cuenta
  async procesarMovimientosCuenta(movimientos, cuentaId) {
    try {
      console.log(`Procesando ${movimientos.length} movimientos de cuenta para cuenta ${cuentaId}`);

      const transaccionesNuevas = [];
      const transaccionesActualizadas = [];

      for (const movimiento of movimientos) {
        try {
          // Verificar si la transacción ya existe
          const transaccionExistente = await Transacciones.findOne({
            cuenta: cuentaId,
            'origen.transaccionId': movimiento.id.toString(),
            'origen.tipo': 'MERCADOPAGO_MOVIMIENTO'
          });

          if (transaccionExistente) {
            // Actualizar transacción existente si es necesario
            const actualizada = await this.actualizarTransaccionExistente(transaccionExistente, movimiento);
            if (actualizada) {
              transaccionesActualizadas.push(actualizada);
            }
            continue;
          }

          // Crear nueva transacción
          const nuevaTransaccion = await this.crearTransaccionDeMovimiento(movimiento, cuentaId);
          if (nuevaTransaccion) {
            transaccionesNuevas.push(nuevaTransaccion);
          }
        } catch (error) {
          console.error(`Error procesando movimiento ${movimiento.id}:`, error);
        }
      }

      return {
        nuevas: transaccionesNuevas.length,
        actualizadas: transaccionesActualizadas.length,
        transacciones: [...transaccionesNuevas, ...transaccionesActualizadas]
      };
    } catch (error) {
      console.error('Error procesando movimientos de cuenta:', error);
      throw error;
    }
  }

  // Crear transacción a partir de un pago
  async crearTransaccionDePago(pago, cuentaId) {
    try {
      // Determinar tipo de transacción
      let tipo = 'EGRESO';
      let monto = Math.abs(pago.transaction_amount || 0);
      
      // Si es un pago recibido (como vendedor), es un INGRESO
      if (pago.collector_id === this.mpAdapter.userId) {
        tipo = 'INGRESO';
      }
      
      // Si es un pago enviado (como comprador), es un EGRESO
      if (pago.payer?.id === this.mpAdapter.userId) {
        tipo = 'EGRESO';
      }

      // Obtener o crear moneda
      const moneda = await this.obtenerOCrearMoneda(pago.currency_id || 'ARS');

      // Crear nueva transacción
      const nuevaTransaccion = new Transacciones({
        descripcion: this.formatearDescripcionPago(pago),
        monto: monto,
        fecha: new Date(pago.date_created),
        categoria: this.categorizarTransaccion(this.formatearDescripcionPago(pago)),
        estado: this.mapearEstadoPago(pago.status),
        tipo: tipo,
        usuario: this.usuarioId,
        cuenta: cuentaId,
        moneda: moneda._id,
        origen: {
          tipo: 'MERCADOPAGO_PAGO',
          transaccionId: pago.id.toString(),
          metadata: {
            paymentId: pago.id,
            status: pago.status,
            paymentMethod: pago.payment_method?.type,
            installments: pago.installments,
            currencyId: pago.currency_id,
            collectorId: pago.collector_id,
            payerId: pago.payer?.id
          }
        }
      });

      await nuevaTransaccion.save();
      console.log(`Transacción de pago creada: ${nuevaTransaccion._id}`);
      return nuevaTransaccion;
    } catch (error) {
      console.error('Error creando transacción de pago:', error);
      return null;
    }
  }

  // Crear transacción a partir de un movimiento de cuenta
  async crearTransaccionDeMovimiento(movimiento, cuentaId) {
    try {
      // Determinar tipo de transacción
      let tipo = 'EGRESO';
      let monto = Math.abs(movimiento.amount || 0);
      
      // Si es un ingreso, cambiar tipo
      if (movimiento.type === 'credit' || movimiento.amount > 0) {
        tipo = 'INGRESO';
      }

      // Obtener o crear moneda
      const moneda = await this.obtenerOCrearMoneda(movimiento.currency_id || 'ARS');

      // Crear nueva transacción
      const nuevaTransaccion = new Transacciones({
        descripcion: this.formatearDescripcionMovimiento(movimiento),
        monto: monto,
        fecha: new Date(movimiento.date_created),
        categoria: this.categorizarTransaccion(this.formatearDescripcionMovimiento(movimiento)),
        estado: this.mapearEstadoMovimiento(movimiento.status),
        tipo: tipo,
        usuario: this.usuarioId,
        cuenta: cuentaId,
        moneda: moneda._id,
        origen: {
          tipo: 'MERCADOPAGO_MOVIMIENTO',
          transaccionId: movimiento.id.toString(),
          metadata: {
            movementId: movimiento.id,
            status: movimiento.status,
            type: movimiento.type,
            currencyId: movimiento.currency_id,
            reference: movimiento.reference
          }
        }
      });

      await nuevaTransaccion.save();
      console.log(`Transacción de movimiento creada: ${nuevaTransaccion._id}`);
      return nuevaTransaccion;
    } catch (error) {
      console.error('Error creando transacción de movimiento:', error);
      return null;
    }
  }

  // Actualizar transacción existente
  async actualizarTransaccionExistente(transaccion, datos) {
    try {
      let actualizada = false;

      // Actualizar estado si cambió
      const nuevoEstado = this.mapearEstadoPago(datos.status) || this.mapearEstadoMovimiento(datos.status);
      if (nuevoEstado && transaccion.estado !== nuevoEstado) {
        transaccion.estado = nuevoEstado;
        actualizada = true;
      }

      // Actualizar monto si cambió
      const nuevoMonto = Math.abs(datos.transaction_amount || datos.amount || 0);
      if (nuevoMonto && transaccion.monto !== nuevoMonto) {
        transaccion.monto = nuevoMonto;
        actualizada = true;
      }

      // Actualizar metadata si es necesario
      if (datos.status && transaccion.origen.metadata.status !== datos.status) {
        transaccion.origen.metadata.status = datos.status;
        actualizada = true;
      }

      if (actualizada) {
        await transaccion.save();
        console.log(`Transacción actualizada: ${transaccion._id}`);
        return transaccion;
      }

      return null;
    } catch (error) {
      console.error('Error actualizando transacción:', error);
      return null;
    }
  }

  // Obtener o crear moneda
  async obtenerOCrearMoneda(currencyId) {
    try {
      // Buscar moneda existente
      let moneda = await Monedas.findOne({ codigo: currencyId });
      
      if (!moneda) {
        // Crear nueva moneda si no existe
        moneda = new Monedas({
          codigo: currencyId,
          nombre: this.obtenerNombreMoneda(currencyId),
          simbolo: this.obtenerSimboloMoneda(currencyId),
          pais: this.obtenerPaisMoneda(currencyId)
        });
        await moneda.save();
        console.log(`Nueva moneda creada: ${currencyId}`);
      }
      
      return moneda;
    } catch (error) {
      console.error('Error obteniendo/creando moneda:', error);
      // Retornar moneda por defecto (ARS)
      return await Monedas.findOne({ codigo: 'ARS' }) || 
             await Monedas.findOne({ codigo: 'USD' }) || 
             await Monedas.findOne();
    }
  }

  // Formatear descripción de pago
  formatearDescripcionPago(pago) {
    let descripcion = `MercadoPago - ${pago.payment_method?.type || 'Pago'}`;
    
    if (pago.description) {
      descripcion += ` - ${pago.description}`;
    }
    
    if (pago.external_reference) {
      descripcion += ` (Ref: ${pago.external_reference})`;
    }
    
    return descripcion;
  }

  // Formatear descripción de movimiento
  formatearDescripcionMovimiento(movimiento) {
    let descripcion = `MercadoPago - Movimiento`;
    
    if (movimiento.description) {
      descripcion += ` - ${movimiento.description}`;
    }
    
    if (movimiento.reference) {
      descripcion += ` (Ref: ${movimiento.reference})`;
    }
    
    return descripcion;
  }

  // Categorizar transacción automáticamente
  categorizarTransaccion(descripcion) {
    const desc = descripcion.toLowerCase();
    
    if (desc.includes('comida') || desc.includes('restaurante') || desc.includes('supermercado')) {
      return 'Comida y Mercado';
    }
    if (desc.includes('transporte') || desc.includes('uber') || desc.includes('taxi')) {
      return 'Transporte';
    }
    if (desc.includes('ropa') || desc.includes('zapatos') || desc.includes('vestimenta')) {
      return 'Ropa';
    }
    if (desc.includes('tecnología') || desc.includes('computadora') || desc.includes('celular')) {
      return 'Tecnología';
    }
    if (desc.includes('salud') || desc.includes('médico') || desc.includes('farmacia')) {
      return 'Salud y Belleza';
    }
    if (desc.includes('fiesta') || desc.includes('evento') || desc.includes('celebración')) {
      return 'Fiesta';
    }
    
    return 'Otro';
  }

  // Mapear estado de pago
  mapearEstadoPago(status) {
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

  // Mapear estado de movimiento
  mapearEstadoMovimiento(status) {
    const estados = {
      'available': 'COMPLETADA',
      'pending': 'PENDIENTE',
      'cancelled': 'CANCELADA'
    };
    
    return estados[status] || 'PENDIENTE';
  }

  // Obtener nombre de moneda
  obtenerNombreMoneda(currencyId) {
    const monedas = {
      'ARS': 'Peso Argentino',
      'USD': 'Dólar Estadounidense',
      'BRL': 'Real Brasileño',
      'CLP': 'Peso Chileno',
      'COP': 'Peso Colombiano',
      'MXN': 'Peso Mexicano',
      'PEN': 'Sol Peruano',
      'UYU': 'Peso Uruguayo',
      'VES': 'Bolívar Venezolano'
    };
    
    return monedas[currencyId] || currencyId;
  }

  // Obtener símbolo de moneda
  obtenerSimboloMoneda(currencyId) {
    const simbolos = {
      'ARS': '$',
      'USD': 'US$',
      'BRL': 'R$',
      'CLP': '$',
      'COP': '$',
      'MXN': '$',
      'PEN': 'S/',
      'UYU': '$',
      'VES': 'Bs.'
    };
    
    return simbolos[currencyId] || currencyId;
  }

  // Obtener país de moneda
  obtenerPaisMoneda(currencyId) {
    const paises = {
      'ARS': 'Argentina',
      'USD': 'Estados Unidos',
      'BRL': 'Brasil',
      'CLP': 'Chile',
      'COP': 'Colombia',
      'MXN': 'México',
      'PEN': 'Perú',
      'UYU': 'Uruguay',
      'VES': 'Venezuela'
    };
    
    return paises[currencyId] || 'Desconocido';
  }
} 