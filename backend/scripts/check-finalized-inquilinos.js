import mongoose from 'mongoose';
import { Inquilinos, Propiedades } from '../src/models/index.js';
import config from '../src/config/config.js';

async function checkFinalizedInquilinos() {
  try {
    // Conectar a la base de datos
    const mongoUrl = process.env.MONGODB_URI || 'mongodb://admin:MiContraseñaSegura123@localhost:27017/present?authSource=admin';
    await mongoose.connect(mongoUrl);
    console.log('Conectado a MongoDB');

    // Buscar todos los inquilinos no activos
    const inquilinosNoActivos = await Inquilinos.find({ 
      estado: { $ne: 'ACTIVO' }
    }).populate('propiedad');
    
    console.log(`\n=== INQUILINOS NO ACTIVOS ENCONTRADOS: ${inquilinosNoActivos.length} ===`);
    
    if (inquilinosNoActivos.length === 0) {
      console.log('No hay inquilinos no activos en la base de datos.');
      return;
    }

    // Analizar cada inquilino no activo
    for (const inquilino of inquilinosNoActivos) {
      console.log(`\n--- Inquilino ID: ${inquilino._id} ---`);
      console.log(`Nombre: ${inquilino.nombre} ${inquilino.apellido}`);
      console.log(`Email: ${inquilino.email}`);
      console.log(`Estado: ${inquilino.estado}`);
      console.log(`Propiedad: ${inquilino.propiedad?.titulo || inquilino.propiedad?._id || 'Sin propiedad'}`);
      console.log(`Fecha Check-in: ${inquilino.fechaCheckIn}`);
    }

    // Verificar si los inquilinos no activos aparecen en las propiedades
    console.log('\n=== VERIFICANDO RELACIÓN CON PROPIEDADES ===');
    
    for (const inquilino of inquilinosNoActivos) {
      if (inquilino.propiedad) {
        const propiedad = await Propiedades.findById(inquilino.propiedad._id).populate('inquilinos');
        console.log(`\nPropiedad: ${propiedad.titulo}`);
        console.log(`Inquilinos en propiedad: ${propiedad.inquilinos ? propiedad.inquilinos.length : 0}`);
        
        if (propiedad.inquilinos) {
          const inquilinoEnPropiedad = propiedad.inquilinos.find(i => i._id.toString() === inquilino._id.toString());
          if (inquilinoEnPropiedad) {
            console.log(`✅ Inquilino ${inquilino.estado} SÍ aparece en la propiedad`);
          } else {
            console.log(`❌ Inquilino ${inquilino.estado} NO aparece en la propiedad`);
          }
        }
      }
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
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDesconectado de MongoDB');
  }
}

// Ejecutar el script
checkFinalizedInquilinos(); 