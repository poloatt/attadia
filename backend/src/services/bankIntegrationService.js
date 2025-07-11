import { Cuentas } from '../models/Cuentas.js';
import { BankConnection } from '../models/BankConnection.js';
import { Transacciones } from '../models/Transacciones.js';
import { MercadoPagoAdapter } from './adapters/mercadoPagoAdapter.js';

const adapters = {
  MERCADOPAGO: MercadoPagoAdapter,
  // Aquí puedes agregar más adapters en el futuro
};

export class BankIntegrationService {
  static async connect({ tipo, usuario, credenciales, moneda }) {
    const Adapter = adapters[tipo];
    if (!Adapter) throw new Error('Tipo de integración no soportado');
    const adapter = new Adapter(credenciales);

    // 1. Crear o buscar cuenta local
    let cuenta = await Cuentas.findOne({ usuario, tipo });
    if (!cuenta) {
      cuenta = await Cuentas.create({ usuario, tipo, nombre: tipo, moneda });
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
    for (const mov of movimientos) {
      // Crea transacción si no existe
      await Transacciones.findOneAndUpdate(
        { cuenta: connection.cuenta._id, 'origen.transaccionId': mov.id },
        {
          descripcion: mov.description || 'Movimiento MercadoPago',
          monto: mov.transaction_amount,
          fecha: new Date(mov.date_created),
          categoria: 'Otro',
          estado: mov.status === 'approved' ? 'COMPLETADA' : 'PENDIENTE',
          tipo: mov.collector_id === adapter.userId ? 'INGRESO' : 'EGRESO',
          usuario: connection.usuario,
          moneda: connection.cuenta.moneda,
          cuenta: connection.cuenta._id,
          origen: {
            tipo: 'MERCADOPAGO',
            conexionId: connection._id,
            transaccionId: mov.id,
            metadata: mov
          }
        },
        { upsert: true }
      );
    }
    // Actualiza estado de sincronización
    await connection.actualizarSincronizacion('EXITOSA', movimientos.length, 0, null);
  }
} 