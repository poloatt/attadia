import mongoose from 'mongoose';

async function checkFinalizedContracts() {
  try {
    // Conectar directamente a MongoDB usando la URL del contenedor
    const mongoUrl = 'mongodb://admin:MiContraseñaSegura123@mongodb:27017/present?authSource=admin';
    console.log('Conectando a MongoDB...');
    await mongoose.connect(mongoUrl);
    console.log('Conectado a MongoDB');

    // Obtener el modelo de Contratos
    const Contratos = mongoose.model('Contratos', new mongoose.Schema({}));
    
    // Buscar todos los contratos finalizados
    const contratosFinalizados = await Contratos.find({ 
      estado: 'FINALIZADO' 
    });
    
    console.log(`\n=== CONTRATOS FINALIZADOS ENCONTRADOS: ${contratosFinalizados.length} ===`);
    
    if (contratosFinalizados.length === 0) {
      console.log('No hay contratos finalizados en la base de datos.');
    } else {
      // Mostrar información básica de cada contrato
      contratosFinalizados.forEach((contrato, index) => {
        console.log(`\n--- Contrato ${index + 1} ---`);
        console.log(`ID: ${contrato._id}`);
        console.log(`Tipo: ${contrato.tipoContrato}`);
        console.log(`Propiedad: ${contrato.propiedad}`);
        console.log(`Fecha Inicio: ${contrato.fechaInicio}`);
        console.log(`Fecha Fin: ${contrato.fechaFin}`);
        console.log(`Precio Total: ${contrato.precioTotal}`);
        console.log(`Estado: ${contrato.estado}`);
        console.log(`Cuotas Mensuales: ${contrato.cuotasMensuales ? contrato.cuotasMensuales.length : 0}`);
      });
    }

    // Verificar contratos por estado
    console.log('\n=== ESTADÍSTICAS POR ESTADO ===');
    const estados = await Contratos.aggregate([
      {
        $group: {
          _id: '$estado',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    estados.forEach(estado => {
      console.log(`${estado._id || 'SIN_ESTADO'}: ${estado.count} contratos`);
    });

  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\nDesconectado de MongoDB');
  }
}

// Ejecutar el script
checkFinalizedContracts(); 