import mongoose from 'mongoose';
import { Monedas, COLORES_MONEDA } from './src/models/Monedas.js';
import { config } from './src/config/config.js';

// Conectar a la base de datos
await mongoose.connect(config.mongoUri);
console.log('Conectado a MongoDB');

// Función para limpiar monedas de prueba
async function limpiarMonedasPrueba() {
  try {
    await Monedas.deleteMany({ codigo: { $in: ['TEST', 'TEST2', 'TEST3'] } });
    console.log('Monedas de prueba limpiadas');
  } catch (error) {
    console.error('Error limpiando monedas:', error);
  }
}

// Función para probar crear moneda
async function probarCrear() {
  try {
    console.log('\n=== Probando CREAR moneda ===');
    const nuevaMoneda = new Monedas({
      codigo: 'TEST',
      nombre: 'Moneda de Prueba',
      simbolo: 'T$',
      color: COLORES_MONEDA.CELESTE_ARGENTINA,
      activa: true
    });
    
    const monedaGuardada = await nuevaMoneda.save();
    console.log('✅ Moneda creada exitosamente:', monedaGuardada.codigo);
    return monedaGuardada;
  } catch (error) {
    console.error('❌ Error creando moneda:', error.message);
    throw error;
  }
}

// Función para probar actualizar moneda
async function probarActualizar(moneda) {
  try {
    console.log('\n=== Probando ACTUALIZAR moneda ===');
    const monedaActualizada = await Monedas.findByIdAndUpdate(
      moneda._id,
      { 
        nombre: 'Moneda de Prueba Actualizada',
        color: COLORES_MONEDA.AZUL_NAVY
      },
      { new: true, runValidators: true }
    );
    
    console.log('✅ Moneda actualizada exitosamente:', monedaActualizada.nombre);
    return monedaActualizada;
  } catch (error) {
    console.error('❌ Error actualizando moneda:', error.message);
    throw error;
  }
}

// Función para probar toggle activa
async function probarToggleActiva(moneda) {
  try {
    console.log('\n=== Probando TOGGLE ACTIVA ===');
    const estadoAnterior = moneda.activa;
    moneda.activa = !moneda.activa;
    const monedaActualizada = await moneda.save();
    
    console.log(`✅ Estado cambiado de ${estadoAnterior} a ${monedaActualizada.activa}`);
    return monedaActualizada;
  } catch (error) {
    console.error('❌ Error cambiando estado:', error.message);
    throw error;
  }
}

// Función para probar eliminar moneda
async function probarEliminar(moneda) {
  try {
    console.log('\n=== Probando ELIMINAR moneda ===');
    await Monedas.findByIdAndDelete(moneda._id);
    console.log('✅ Moneda eliminada exitosamente');
  } catch (error) {
    console.error('❌ Error eliminando moneda:', error.message);
    throw error;
  }
}

// Función para probar validaciones
async function probarValidaciones() {
  try {
    console.log('\n=== Probando VALIDACIONES ===');
    
    // Probar código inválido
    try {
      const monedaInvalida = new Monedas({
        codigo: 'INVALID',
        nombre: 'Moneda Inválida',
        simbolo: 'I$',
        color: COLORES_MONEDA.CELESTE_ARGENTINA
      });
      await monedaInvalida.save();
      console.log('❌ No debería haber guardado código inválido');
    } catch (error) {
      console.log('✅ Validación de código funcionando:', error.message);
    }
    
    // Probar color inválido
    try {
      const monedaColorInvalido = new Monedas({
        codigo: 'TEST2',
        nombre: 'Moneda Color Inválido',
        simbolo: 'C$',
        color: '#INVALID'
      });
      await monedaColorInvalido.save();
      console.log('❌ No debería haber guardado color inválido');
    } catch (error) {
      console.log('✅ Validación de color funcionando:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error en validaciones:', error.message);
  }
}

// Función principal de pruebas
async function ejecutarPruebas() {
  try {
    console.log('🚀 Iniciando pruebas CRUD de monedas...');
    
    // Limpiar datos de prueba anteriores
    await limpiarMonedasPrueba();
    
    // Ejecutar pruebas
    await probarValidaciones();
    
    const monedaCreada = await probarCrear();
    const monedaActualizada = await probarActualizar(monedaCreada);
    const monedaToggleada = await probarToggleActiva(monedaActualizada);
    await probarEliminar(monedaToggleada);
    
    console.log('\n🎉 Todas las pruebas CRUD completadas exitosamente!');
    
  } catch (error) {
    console.error('\n💥 Error en las pruebas:', error);
  } finally {
    // Limpiar y cerrar conexión
    await limpiarMonedasPrueba();
    await mongoose.connection.close();
    console.log('Conexión cerrada');
  }
}

// Ejecutar pruebas
ejecutarPruebas(); 