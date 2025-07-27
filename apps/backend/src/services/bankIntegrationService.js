import { Cuentas } from '../models/Cuentas.js';
import { BankConnection } from '../models/BankConnection.js';
import { Transacciones } from '../models/Transacciones.js';
import { MercadoPagoAdapter } from './adapters/mercadoPagoAdapter.js';
import { Monedas, ISO_4217, PAISES_MONEDAS } from '../models/Monedas.js';
import { Users } from '../models/Users.js';

const adapters = {
  MERCADOPAGO: MercadoPagoAdapter,
  // Aquí puedes agregar más adapters en el futuro
};

// Mapeo de tipos de integración a tipos de cuenta
const tipoToCuentaTipo = {
  MERCADOPAGO: 'MERCADO_PAGO',
  // Agregar más mapeos según sea necesario
};

export class BankIntegrationService {
  static async connect({ tipo, usuario, credenciales, moneda }) {
    const Adapter = adapters[tipo];
    if (!Adapter) throw new Error('Tipo de integración no soportado');
    const adapter = new Adapter(credenciales);

    // 1. Crear o buscar cuenta local
    const cuentaTipo = tipoToCuentaTipo[tipo] || tipo;
    let cuenta = await Cuentas.findOne({ usuario, tipo: cuentaTipo });
    if (!cuenta) {
      let monedaId = moneda;
      if (!monedaId) {
        // Buscar el país del usuario
        const userDoc = await Users.findById(usuario);
        let pais = userDoc?.pais || 'AR';
        let monedaCodigo = PAISES_MONEDAS[pais]?.moneda || 'ARS';
        let monedaDoc = await Monedas.findOne({ codigo: monedaCodigo });
        if (!monedaDoc) {
          const ref = ISO_4217[monedaCodigo] || { nombre: monedaCodigo, simbolo: monedaCodigo };
          monedaDoc = await Monedas.create({
            codigo: monedaCodigo,
            nombre: ref.nombre,
            simbolo: ref.simbolo,
            esGlobal: true
          });
        }
        monedaId = monedaDoc._id;
      }
      cuenta = await Cuentas.create({ 
        usuario, 
        tipo: cuentaTipo, 
        nombre: tipo === 'MERCADOPAGO' ? 'Mercado Pago' : tipo, 
        moneda: monedaId
      });
    }

    // 2. Crear o actualizar conexión
    let connection = await BankConnection.findOne({ usuario, tipo });
    if (!connection) {
      connection = await BankConnection.create({ usuario, tipo, cuenta: cuenta._id, credenciales });
    } else {
      connection.credenciales = credenciales;
      await connection.save();
    }

    // 3. Sincronizar transacciones
    await BankIntegrationService.syncBankConnection(connection._id);

    return connection;
  }

  static async syncBankConnection(connectionId) {
    const connection = await BankConnection.findById(connectionId).populate('cuenta');
    const Adapter = adapters[connection.tipo];
    if (!Adapter) throw new Error('Tipo de integración no soportado');
    const adapter = new Adapter(connection.credenciales);

    // Obtener fecha de última sincronización
    const since = connection.configuracion?.ultimaSincronizacion?.toISOString();
    const movimientos = await adapter.getMovimientos({ since });
    
    console.log(`Sincronizando ${movimientos.length} movimientos para conexión ${connection.tipo}`);
    
    for (const mov of movimientos) {
      // Determinar tipo de transacción basado en el movimiento
      let tipo = 'EGRESO';
      if (mov.collector_id === adapter.userId) {
        tipo = 'INGRESO'; // Si el usuario es el cobrador, es un ingreso
      }
      // --- NUEVO: Obtener moneda de la transacción o usar fallback ---
      let monedaId = undefined;
      const currencyId = mov.currency_id?.toUpperCase();
      if (currencyId) {
        let moneda = await Monedas.findOne({ codigo: currencyId });
        if (!moneda) {
          const ref = ISO_4217[currencyId] || { nombre: currencyId, simbolo: currencyId };
          moneda = await Monedas.create({
            codigo: currencyId,
            nombre: ref.nombre,
            simbolo: ref.simbolo,
            esGlobal: true
          });
        }
        monedaId = moneda._id;
      } else {
        // Fallback: usar la moneda de la cuenta y loguear warning
        monedaId = connection.cuenta.moneda;
        console.warn('[MercadoPago] Movimiento sin currency_id, usando moneda de la cuenta:', {
          movId: mov.id,
          descripcion: mov.description,
          cuenta: connection.cuenta._id,
          monedaFallback: monedaId
        });
      }
      // Crea transacción si no existe
      await Transacciones.findOneAndUpdate(
        { 
          cuenta: connection.cuenta._id, 
          'origen.transaccionId': mov.id.toString() 
        },
        {
          descripcion: mov.description || mov.external_reference || 'Movimiento MercadoPago',
          monto: mov.transaction_amount,
          fecha: new Date(mov.date_created),
          categoria: 'Otro', // Se puede mejorar con categorización automática
          estado: mov.status === 'approved' ? 'COMPLETADA' : 'PENDIENTE',
          tipo: tipo,
          usuario: connection.usuario,
          moneda: monedaId,
          cuenta: connection.cuenta._id,
          origen: {
            tipo: 'MERCADOPAGO',
            conexionId: connection._id,
            transaccionId: mov.id.toString(),
            metadata: {
              payment_id: mov.id,
              status: mov.status,
              payment_method: mov.payment_method?.type,
              collector_id: mov.collector_id,
              payer_id: mov.payer?.id
            }
          }
        },
        { upsert: true, new: true }
      );
    }
    
    // Actualiza estado de sincronización
    await connection.actualizarSincronizacion('EXITOSA', movimientos.length, 0, null);
    
    console.log(`Sincronización completada: ${movimientos.length} transacciones procesadas`);
  }
} 