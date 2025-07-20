import mongoose from 'mongoose';

async function checkFinalizedDetailed() {
  try {
    // Conectar directamente a MongoDB usando la URL del contenedor
    const mongoUrl = 'mongodb://admin:MiContraseñaSegura123@mongodb:27017/present?authSource=admin';
    console.log('Conectando a MongoDB...');
    await mongoose.connect(mongoUrl);
    console.log('Conectado a MongoDB');

    // Definir esquemas básicos para los modelos
    const contratoSchema = new mongoose.Schema({}, { strict: false });
    const inquilinoSchema = new mongoose.Schema({}, { strict: false });
    const propiedadSchema = new mongoose.Schema({}, { strict: false });

    const Contratos = mongoose.model('Contratos', contratoSchema);
    const Inquilinos = mongoose.model('Inquilinos', inquilinoSchema);
    const Propiedades = mongoose.model('Propiedades', propiedadSchema);

    console.log('\n=== ANÁLISIS DETALLADO DE CONTRATOS ===');
    
    // Buscar todos los contratos
    const todosContratos = await Contratos.find({});
    console.log(`Total de contratos en la base de datos: ${todosContratos.length}`);

    // Agrupar por estado
    const contratosPorEstado = {};
    todosContratos.forEach(contrato => {
      const estado = contrato.estado || 'SIN_ESTADO';
      if (!contratosPorEstado[estado]) {
        contratosPorEstado[estado] = [];
      }
      contratosPorEstado[estado].push(contrato);
    });

    console.log('\nDistribución por estado:');
    Object.entries(contratosPorEstado).forEach(([estado, contratos]) => {
      console.log(`  ${estado}: ${contratos.length} contratos`);
    });

    // Mostrar detalles de contratos finalizados
    const contratosFinalizados = contratosPorEstado['FINALIZADO'] || [];
    console.log(`\nContratos FINALIZADOS encontrados: ${contratosFinalizados.length}`);
    
    if (contratosFinalizados.length > 0) {
      contratosFinalizados.forEach((contrato, index) => {
        console.log(`\n--- Contrato Finalizado ${index + 1} ---`);
        console.log(`ID: ${contrato._id}`);
        console.log(`Tipo: ${contrato.tipoContrato || 'No especificado'}`);
        console.log(`Propiedad ID: ${contrato.propiedad || 'No especificada'}`);
        console.log(`Fecha Inicio: ${contrato.fechaInicio || 'No especificada'}`);
        console.log(`Fecha Fin: ${contrato.fechaFin || 'No especificada'}`);
        console.log(`Precio Total: ${contrato.precioTotal || 'No especificado'}`);
        console.log(`Estado: ${contrato.estado}`);
        console.log(`Cuotas Mensuales: ${contrato.cuotasMensuales ? contrato.cuotasMensuales.length : 0}`);
      });
    }

    console.log('\n=== ANÁLISIS DETALLADO DE INQUILINOS ===');
    
    // Buscar todos los inquilinos
    const todosInquilinos = await Inquilinos.find({});
    console.log(`Total de inquilinos en la base de datos: ${todosInquilinos.length}`);

    // Agrupar por estado
    const inquilinosPorEstado = {};
    todosInquilinos.forEach(inquilino => {
      const estado = inquilino.estado || 'SIN_ESTADO';
      if (!inquilinosPorEstado[estado]) {
        inquilinosPorEstado[estado] = [];
      }
      inquilinosPorEstado[estado].push(inquilino);
    });

    console.log('\nDistribución por estado:');
    Object.entries(inquilinosPorEstado).forEach(([estado, inquilinos]) => {
      console.log(`  ${estado}: ${inquilinos.length} inquilinos`);
    });

    // Mostrar detalles de inquilinos no activos
    const inquilinosNoActivos = [];
    Object.entries(inquilinosPorEstado).forEach(([estado, inquilinos]) => {
      if (estado !== 'ACTIVO') {
        inquilinosNoActivos.push(...inquilinos);
      }
    });

    console.log(`\nInquilinos NO ACTIVOS encontrados: ${inquilinosNoActivos.length}`);
    
    if (inquilinosNoActivos.length > 0) {
      inquilinosNoActivos.forEach((inquilino, index) => {
        console.log(`\n--- Inquilino No Activo ${index + 1} ---`);
        console.log(`ID: ${inquilino._id}`);
        console.log(`Nombre: ${inquilino.nombre || 'No especificado'}`);
        console.log(`Apellido: ${inquilino.apellido || 'No especificado'}`);
        console.log(`Email: ${inquilino.email || 'No especificado'}`);
        console.log(`Estado: ${inquilino.estado || 'No especificado'}`);
        console.log(`Propiedad ID: ${inquilino.propiedad || 'No especificada'}`);
        console.log(`Fecha Check-in: ${inquilino.fechaCheckIn || 'No especificada'}`);
      });
    }

    console.log('\n=== ANÁLISIS DE PROPIEDADES ===');
    
    // Buscar todas las propiedades
    const todasPropiedades = await Propiedades.find({});
    console.log(`Total de propiedades en la base de datos: ${todasPropiedades.length}`);

    // Verificar relaciones
    console.log('\n=== VERIFICACIÓN DE RELACIONES ===');
    
    // Verificar si los contratos finalizados están asociados a propiedades
    if (contratosFinalizados.length > 0) {
      console.log('\nVerificando contratos finalizados en propiedades:');
      for (const contrato of contratosFinalizados) {
        if (contrato.propiedad) {
          const propiedad = await Propiedades.findById(contrato.propiedad);
          if (propiedad) {
            console.log(`✅ Contrato ${contrato._id} está asociado a propiedad: ${propiedad.titulo || propiedad.alias || propiedad._id}`);
          } else {
            console.log(`❌ Contrato ${contrato._id} tiene propiedad ID ${contrato.propiedad} pero no se encuentra`);
          }
        } else {
          console.log(`⚠️  Contrato ${contrato._id} no tiene propiedad asociada`);
        }
      }
    }

    // Verificar si los inquilinos no activos están asociados a propiedades
    if (inquilinosNoActivos.length > 0) {
      console.log('\nVerificando inquilinos no activos en propiedades:');
      for (const inquilino of inquilinosNoActivos) {
        if (inquilino.propiedad) {
          const propiedad = await Propiedades.findById(inquilino.propiedad);
          if (propiedad) {
            console.log(`✅ Inquilino ${inquilino._id} está asociado a propiedad: ${propiedad.titulo || propiedad.alias || propiedad._id}`);
          } else {
            console.log(`❌ Inquilino ${inquilino._id} tiene propiedad ID ${inquilino.propiedad} pero no se encuentra`);
          }
        } else {
          console.log(`⚠️  Inquilino ${inquilino._id} no tiene propiedad asociada`);
        }
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\nDesconectado de MongoDB');
  }
}

// Ejecutar el script
checkFinalizedDetailed(); 