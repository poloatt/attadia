import mongoose from 'mongoose';
import bankSyncService from '../services/bankSyncService.js';
import { BankConnection } from '../models/BankConnection.js';
import { Cuentas } from '../models/Cuentas.js';
import { Users } from '../models/Users.js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Función para conectar a la base de datos
const connectDB = async () => {
  try {
    const mongoUrl = process.env.MONGO_URL || process.env.MONGO_PUBLIC_URL;
    await mongoose.connect(mongoUrl);
    console.log('MongoDB conectado exitosamente');
  } catch (error) {
    console.error('Error conectando a MongoDB:', error);
    process.exit(1);
  }
};

// Función para crear datos de prueba
const createTestData = async () => {
  try {
    console.log('Creando datos de prueba...');

    // Crear un usuario de prueba
    let user = await Users.findOne({ email: 'test@example.com' });
    if (!user) {
      user = new Users({
        email: 'test@example.com',
        password: 'password123',
        nombre: 'Usuario de Prueba',
        apellido: 'Test'
      });
      await user.save();
      console.log('Usuario de prueba creado');
    }

    // Crear una cuenta de prueba
    let cuenta = await Cuentas.findOne({ nombre: 'Cuenta de Prueba', usuario: user._id });
    if (!cuenta) {
      cuenta = new Cuentas({
        nombre: 'Cuenta de Prueba',
        tipo: 'BANCO',
        moneda: '507f1f77bcf86cd799439011', // ID de moneda USD (ajustar según tu BD)
        usuario: user._id
      });
      await cuenta.save();
      console.log('Cuenta de prueba creada');
    }

    // Crear una conexión bancaria de prueba
    let connection = await BankConnection.findOne({ nombre: 'Conexión de Prueba', usuario: user._id });
    if (!connection) {
      connection = new BankConnection({
        nombre: 'Conexión de Prueba',
        banco: 'Banco Santander',
        tipo: 'PLAID',
        cuenta: cuenta._id,
        usuario: user._id,
        credenciales: {
          accessToken: 'test_access_token',
          institutionId: 'test_institution',
          accountId: 'test_account'
        },
        configuracion: {
          sincronizacionAutomatica: true,
          frecuenciaSincronizacion: 'DIARIA',
          categorizacionAutomatica: true
        },
        estado: 'ACTIVA'
      });
      await connection.save();
      console.log('Conexión bancaria de prueba creada');
    }

    return { user, cuenta, connection };
  } catch (error) {
    console.error('Error creando datos de prueba:', error);
    throw error;
  }
};

// Función para probar sincronización
const testSync = async () => {
  try {
    console.log('=== INICIANDO PRUEBA DE SINCRONIZACIÓN ===');
    
    // Conectar a la base de datos
    await connectDB();
    
    // Crear datos de prueba
    const { user, cuenta, connection } = await createTestData();
    
    console.log('\n--- Probando sincronización individual ---');
    const resultado = await bankSyncService.sincronizarConexion(connection);
    console.log('Resultado de sincronización individual:', resultado);
    
    console.log('\n--- Probando sincronización masiva ---');
    const resultados = await bankSyncService.sincronizarTodasLasConexiones();
    console.log('Resultados de sincronización masiva:', resultados);
    
    console.log('\n--- Verificando transacciones creadas ---');
    const { Transacciones } = await import('../models/Transacciones.js');
    const transacciones = await Transacciones.find({ cuenta: cuenta._id }).populate('moneda');
    console.log(`Transacciones encontradas: ${transacciones.length}`);
    
    transacciones.forEach((trans, index) => {
      console.log(`Transacción ${index + 1}:`, {
        descripcion: trans.descripcion,
        monto: trans.monto,
        tipo: trans.tipo,
        categoria: trans.categoria,
        fecha: trans.fecha,
        origen: trans.origen
      });
    });
    
    console.log('\n=== PRUEBA COMPLETADA ===');
    
  } catch (error) {
    console.error('Error en la prueba:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Conexión a MongoDB cerrada');
  }
};

// Ejecutar la prueba si el script se ejecuta directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testSync();
}

export { testSync }; 