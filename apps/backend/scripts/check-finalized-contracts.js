import mongoose from 'mongoose';
import { Contratos, Propiedades } from '../src/models/index.js';
import config from '../src/config/config.js';

async function checkFinalizedContracts() {
  try {
    // Conectar a la base de datos
    const mongoUrl = process.env.MONGODB_URI || 'mongodb://admin:MiContraseñaSegura123@localhost:27017/present?authSource=admin';
    await mongoose.connect(mongoUrl);
    console.log('Conectado a MongoDB');

    // Buscar todos los contratos finalizados
    const contratosFinalizados = await Contratos.find({ 
      estado: 'FINALIZADO' 
    }).populate('propiedad');
    
    console.log(`\n=== CONTRATOS FINALIZADOS ENCONTRADOS: ${contratosFinalizados.length} ===`);
    
    if (contratosFinalizados.length === 0) {
      console.log('No hay contratos finalizados en la base de datos.');
      return;
    }

    // Analizar cada contrato finalizado
    for (const contrato of contratosFinalizados) {
      console.log(`\n--- Contrato ID: ${contrato._id} ---`);
      console.log(`Tipo: ${contrato.tipoContrato}`);
      console.log(`Propiedad: ${contrato.propiedad?.titulo || contrato.propiedad?._id || 'Sin propiedad'}`);
      console.log(`Fecha Inicio: ${contrato.fechaInicio}`);
      console.log(`Fecha Fin: ${contrato.fechaFin}`);
      console.log(`Precio Total: ${contrato.precioTotal}`);
      console.log(`Estado: ${contrato.estado}`);
      console.log(`Cuotas Mensuales: ${contrato.cuotasMensuales ? contrato.cuotasMensuales.length : 0}`);
      
      if (contrato.cuotasMensuales && contrato.cuotasMensuales.length > 0) {
        console.log('  Detalle de cuotas:');
        contrato.cuotasMensuales.forEach((cuota, index) => {
          console.log(`    ${index + 1}. Mes: ${cuota.mes}/${cuota.año}, Monto: ${cuota.monto}, Estado: ${cuota.estado}`);
        });
      } else {
        console.log('  ⚠️  NO TIENE CUOTAS GENERADAS');
      }
    }

    // Verificar si los contratos finalizados aparecen en las propiedades
    console.log('\n=== VERIFICANDO RELACIÓN CON PROPIEDADES ===');
    
    for (const contrato of contratosFinalizados) {
      if (contrato.propiedad) {
        const propiedad = await Propiedades.findById(contrato.propiedad._id).populate('contratos');
        console.log(`\nPropiedad: ${propiedad.titulo}`);
        console.log(`Contratos en propiedad: ${propiedad.contratos ? propiedad.contratos.length : 0}`);
        
        if (propiedad.contratos) {
          const contratoEnPropiedad = propiedad.contratos.find(c => c._id.toString() === contrato._id.toString());
          if (contratoEnPropiedad) {
            console.log(`✅ Contrato finalizado SÍ aparece en la propiedad`);
          } else {
            console.log(`❌ Contrato finalizado NO aparece en la propiedad`);
          }
        }
      }
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
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDesconectado de MongoDB');
  }
}

// Ejecutar el script
checkFinalizedContracts(); 