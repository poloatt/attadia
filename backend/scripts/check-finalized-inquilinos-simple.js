import mongoose from 'mongoose';

async function checkFinalizedInquilinos() {
  try {
    // Conectar directamente a MongoDB usando la URL del contenedor
    const mongoUrl = 'mongodb://admin:MiContraseñaSegura123@mongodb:27017/present?authSource=admin';
    console.log('Conectando a MongoDB...');
    await mongoose.connect(mongoUrl);
    console.log('Conectado a MongoDB');

    // Obtener el modelo de Inquilinos
    const Inquilinos = mongoose.model('Inquilinos', new mongoose.Schema({}));
    
    // Buscar todos los inquilinos no activos
    const inquilinosNoActivos = await Inquilinos.find({ 
      estado: { $ne: 'ACTIVO' }
    });
    
    console.log(`\n=== INQUILINOS NO ACTIVOS ENCONTRADOS: ${inquilinosNoActivos.length} ===`);
    
    if (inquilinosNoActivos.length === 0) {
      console.log('No hay inquilinos no activos en la base de datos.');
    } else {
      // Mostrar información básica de cada inquilino
      inquilinosNoActivos.forEach((inquilino, index) => {
        console.log(`\n--- Inquilino ${index + 1} ---`);
        console.log(`ID: ${inquilino._id}`);
        console.log(`Nombre: ${inquilino.nombre} ${inquilino.apellido}`);
        console.log(`Email: ${inquilino.email}`);
        console.log(`Estado: ${inquilino.estado}`);
        console.log(`Propiedad: ${inquilino.propiedad}`);
        console.log(`Fecha Check-in: ${inquilino.fechaCheckIn}`);
      });
    }

    // Verificar inquilinos por estado
    console.log('\n=== ESTADÍSTICAS POR ESTADO ===');
    const estados = await Inquilinos.aggregate([
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
      console.log(`${estado._id || 'SIN_ESTADO'}: ${estado.count} inquilinos`);
    });

    // Verificar inquilinos con propiedad asignada vs sin propiedad
    console.log('\n=== INQUILINOS CON/SIN PROPIEDAD ===');
    const conPropiedad = await Inquilinos.countDocuments({ propiedad: { $exists: true, $ne: null } });
    const sinPropiedad = await Inquilinos.countDocuments({ 
      $or: [
        { propiedad: { $exists: false } },
        { propiedad: null }
      ]
    });
    
    console.log(`Con propiedad asignada: ${conPropiedad}`);
    console.log(`Sin propiedad asignada: ${sinPropiedad}`);

  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\nDesconectado de MongoDB');
  }
}

// Ejecutar el script
checkFinalizedInquilinos(); 