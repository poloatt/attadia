import mongoose from 'mongoose';
import { BankConnection } from '../models/BankConnection.js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const urls = [
  'mongodb://admin:MiContraseñaSegura123@localhost:27017/present?authSource=present',
  'mongodb://admin:MiContraseñaSegura123@localhost:27017/present?authSource=admin'
];

async function testConnections() {
  for (const url of urls) {
    try {
      console.log(`\nIntentando conectar con: ${url}`);
      await mongoose.connect(url);
      console.log('✅ Conexión exitosa');
      await mongoose.disconnect();
      return url; // Usar esta URL para el resto del script
    } catch (error) {
      console.error('❌ Error de conexión:', error.message);
      try { await mongoose.disconnect(); } catch {}
    }
  }
  throw new Error('No se pudo conectar a MongoDB con ninguna de las URLs probadas.');
}

async function eliminarConexionesProblematicas() {
  let workingUrl;
  try {
    workingUrl = await testConnections();
    await mongoose.connect(workingUrl);
    console.log('Conectado a MongoDB');

    // 1. Buscar conexiones sin _id (aunque esto no debería ser posible)
    const conexionesSinId = await BankConnection.find({ _id: { $exists: false } });
    console.log(`\n1. Conexiones sin _id: ${conexionesSinId.length}`);
    conexionesSinId.forEach(c => console.log(`   - ${c.nombre || 'Sin nombre'} (${c.tipo || 'Sin tipo'})`));

    // 2. Buscar conexiones sin nombre o con nombre vacío
    const conexionesSinNombre = await BankConnection.find({
      $or: [
        { nombre: { $exists: false } },
        { nombre: null },
        { nombre: '' },
        { nombre: { $regex: /^\s*$/ } } // Solo espacios en blanco
      ]
    });
    console.log(`\n2. Conexiones sin nombre o con nombre vacío: ${conexionesSinNombre.length}`);
    conexionesSinNombre.forEach(c => console.log(`   - ID: ${c._id} (${c.tipo || 'Sin tipo'})`));

    // 3. Buscar conexiones sin tipo
    const conexionesSinTipo = await BankConnection.find({
      $or: [
        { tipo: { $exists: false } },
        { tipo: null },
        { tipo: '' }
      ]
    });
    console.log(`\n3. Conexiones sin tipo: ${conexionesSinTipo.length}`);
    conexionesSinTipo.forEach(c => console.log(`   - ID: ${c._id} (${c.nombre || 'Sin nombre'})`));

    // 4. Buscar conexiones MercadoPago sin userId
    const mercadopagoSinUserId = await BankConnection.find({
      tipo: 'MERCADOPAGO',
      $or: [
        { 'credenciales.userId': { $exists: false } },
        { 'credenciales.userId': null },
        { 'credenciales.userId': '' }
      ]
    });
    console.log(`\n4. Conexiones MercadoPago sin userId: ${mercadopagoSinUserId.length}`);
    mercadopagoSinUserId.forEach(c => console.log(`   - ID: ${c._id} (${c.nombre || 'Sin nombre'})`));

    // 5. Buscar conexiones con credenciales vacías o nulas
    const conexionesSinCredenciales = await BankConnection.find({
      $or: [
        { credenciales: { $exists: false } },
        { credenciales: null },
        { credenciales: {} }
      ]
    });
    console.log(`\n5. Conexiones sin credenciales: ${conexionesSinCredenciales.length}`);
    conexionesSinCredenciales.forEach(c => console.log(`   - ID: ${c._id} (${c.nombre || 'Sin nombre'}) (${c.tipo || 'Sin tipo'})`));

    // 6. Buscar conexiones que no son MANUAL pero no tienen banco ni cuenta
    const conexionesIncompletas = await BankConnection.find({
      tipo: { $nin: ['MANUAL', 'MERCADOPAGO'] },
      $or: [
        { banco: { $exists: false } },
        { banco: null },
        { banco: '' },
        { cuenta: { $exists: false } },
        { cuenta: null }
      ]
    });
    console.log(`\n6. Conexiones incompletas (sin banco/cuenta): ${conexionesIncompletas.length}`);
    conexionesIncompletas.forEach(c => console.log(`   - ID: ${c._id} (${c.nombre || 'Sin nombre'}) (${c.tipo || 'Sin tipo'})`));

    // Resumen total
    const totalProblematicas = conexionesSinId.length + conexionesSinNombre.length + 
                              conexionesSinTipo.length + mercadopagoSinUserId.length + 
                              conexionesSinCredenciales.length + conexionesIncompletas.length;

    console.log(`\n=== RESUMEN ===`);
    console.log(`Total de conexiones problemáticas encontradas: ${totalProblematicas}`);

    if (totalProblematicas === 0) {
      console.log('¡No se encontraron conexiones problemáticas!');
      return;
    }

    // Preguntar si eliminar (simulado - en producción usaría readline)
    console.log('\n=== OPCIONES ===');
    console.log('1. Solo mostrar (no eliminar)');
    console.log('2. Eliminar todas las conexiones problemáticas');
    console.log('3. Eliminar solo conexiones MercadoPago sin userId');
    console.log('4. Eliminar solo conexiones sin nombre');
    console.log('5. Eliminar solo conexiones incompletas (sin banco/cuenta)');

    // Por ahora, solo mostrar. Para eliminar, descomenta las líneas correspondientes:
    
    /*
    // Ejemplo para eliminar conexiones MercadoPago sin userId:
    if (mercadopagoSinUserId.length > 0) {
      const result = await BankConnection.deleteMany({
        _id: { $in: mercadopagoSinUserId.map(c => c._id) }
      });
      console.log(`\nEliminadas ${result.deletedCount} conexiones MercadoPago sin userId`);
    }
    */

    /*
    // Ejemplo para eliminar conexiones sin nombre:
    if (conexionesSinNombre.length > 0) {
      const result = await BankConnection.deleteMany({
        _id: { $in: conexionesSinNombre.map(c => c._id) }
      });
      console.log(`\nEliminadas ${result.deletedCount} conexiones sin nombre`);
    }
    */

    /*
    // Ejemplo para eliminar todas las problemáticas:
    const todasLasIds = [
      ...conexionesSinId.map(c => c._id),
      ...conexionesSinNombre.map(c => c._id),
      ...conexionesSinTipo.map(c => c._id),
      ...mercadopagoSinUserId.map(c => c._id),
      ...conexionesSinCredenciales.map(c => c._id),
      ...conexionesIncompletas.map(c => c._id)
    ].filter(id => id); // Filtrar IDs válidos

    if (todasLasIds.length > 0) {
      const result = await BankConnection.deleteMany({
        _id: { $in: todasLasIds }
      });
      console.log(`\nEliminadas ${result.deletedCount} conexiones problemáticas en total`);
    }
    */

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDesconectado de MongoDB');
  }
}

// Ejecutar el script
eliminarConexionesProblematicas(); 