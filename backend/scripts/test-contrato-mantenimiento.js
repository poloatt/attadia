import mongoose from 'mongoose';
import { Contratos } from '../src/models/index.js';

// Conectar a la base de datos usando la URL de Docker
const MONGO_URL = 'mongodb://admin:MiContraseñaSegura123@mongodb:27017/present?authSource=admin';
console.log('Conectando a MongoDB:', MONGO_URL);

try {
  await mongoose.connect(MONGO_URL);
  console.log('✅ Conectado a MongoDB exitosamente');
} catch (error) {
  console.error('❌ Error al conectar a MongoDB:', error);
  process.exit(1);
}

// Primero, verificar qué propiedades existen y a qué usuario pertenecen
console.log('=== VERIFICANDO PROPIEDADES Y USUARIOS ===');
const Propiedades = mongoose.model('Propiedades');
const propiedades = await Propiedades.find({}).select('_id alias usuario').lean();

console.log('Propiedades encontradas:');
propiedades.forEach(prop => {
  console.log(`  - ID: ${prop._id}`);
  console.log(`    Alias: ${prop.alias || 'Sin alias'}`);
  console.log(`    Usuario: ${prop.usuario}`);
  console.log('');
});

if (propiedades.length === 0) {
  console.log('❌ No hay propiedades en la base de datos');
  await mongoose.disconnect();
  process.exit(1);
}

// Buscar una propiedad que pertenezca al usuario que queremos usar
const usuarioId = '6873ef83d830a11c7b0895c5';
const propiedadDelUsuario = propiedades.find(prop => prop.usuario.toString() === usuarioId);

if (!propiedadDelUsuario) {
  console.log(`❌ No hay propiedades que pertenezcan al usuario ${usuarioId}`);
  console.log('Usuarios disponibles:');
  const usuariosUnicos = [...new Set(propiedades.map(prop => prop.usuario.toString()))];
  usuariosUnicos.forEach(userId => {
    const propsDelUsuario = propiedades.filter(prop => prop.usuario.toString() === userId);
    console.log(`  Usuario ${userId}: ${propsDelUsuario.length} propiedades`);
  });
  await mongoose.disconnect();
  process.exit(1);
}

console.log(`✅ Usando propiedad: ${propiedadDelUsuario.alias} (${propiedadDelUsuario._id})`);

// Datos exactos que envía el frontend, pero con la propiedad correcta
const formDataFromFrontend = {
  "inquilino": [],
  "propiedad": propiedadDelUsuario._id.toString(),
  "esPorHabitacion": false,
  "fechaInicio": "2025-07-09T03:00:00.000Z",
  "fechaFin": "2025-08-15T03:00:00.000Z",
  "precioTotal": 0,
  "deposito": 0,
  "observaciones": "",
  "documentoUrl": "",
  "tipoContrato": "MANTENIMIENTO",
  "cuotasMensuales": [],
  "esMantenimiento": true
};

console.log('=== SIMULANDO DATOS DEL FRONTEND ===');
console.log('formData completo:', JSON.stringify(formDataFromFrontend, null, 2));

// Simular el procesamiento del controlador
console.log('\n=== SIMULANDO PROCESAMIENTO DEL CONTROLADOR ===');

// Debug: Verificar valores antes del procesamiento
console.log('=== DEBUG PRECIO TOTAL ===');
console.log('req.body.precioTotal:', formDataFromFrontend.precioTotal, 'tipo:', typeof formDataFromFrontend.precioTotal);
console.log('req.body.montoMensual:', formDataFromFrontend.montoMensual, 'tipo:', typeof formDataFromFrontend.montoMensual);
console.log('req.body.tipoContrato:', formDataFromFrontend.tipoContrato);
console.log('req.body.esMantenimiento:', formDataFromFrontend.esMantenimiento);

// Calcular precioTotal de forma segura
let precioTotalCalculado = 0;
if (formDataFromFrontend.tipoContrato === 'MANTENIMIENTO' || formDataFromFrontend.esMantenimiento === true) {
  precioTotalCalculado = 0;
} else {
  const precioTotalRaw = formDataFromFrontend.precioTotal || formDataFromFrontend.montoMensual || 0;
  console.log('precioTotalRaw:', precioTotalRaw, 'tipo:', typeof precioTotalRaw);
  precioTotalCalculado = parseFloat(precioTotalRaw) || 0;
}
console.log('precioTotalCalculado:', precioTotalCalculado);

// Simular el objeto data que se crea en el controlador
const data = {
  ...formDataFromFrontend,
  fechaInicio: new Date(formDataFromFrontend.fechaInicio),
  fechaFin: formDataFromFrontend.fechaFin ? new Date(formDataFromFrontend.fechaFin) : null,
  precioTotal: precioTotalCalculado,
  deposito: formDataFromFrontend.deposito ? parseFloat(formDataFromFrontend.deposito) : null,
  propiedad: formDataFromFrontend.propiedadId || formDataFromFrontend.propiedad,
  inquilino: formDataFromFrontend.tipoContrato === 'MANTENIMIENTO' ? [] : (formDataFromFrontend.inquilinoId || formDataFromFrontend.inquilino || []),
  habitacion: formDataFromFrontend.habitacionId || formDataFromFrontend.habitacion,
  cuenta: formDataFromFrontend.tipoContrato === 'MANTENIMIENTO' ? null : (formDataFromFrontend.cuentaId || formDataFromFrontend.cuenta),
  moneda: formDataFromFrontend.tipoContrato === 'MANTENIMIENTO' ? null : null,
  esMantenimiento: formDataFromFrontend.tipoContrato === 'MANTENIMIENTO' || formDataFromFrontend.esMantenimiento === true,
  usuario: new mongoose.Types.ObjectId(usuarioId) // Usuario que realmente posee la propiedad
};

console.log('\n=== DATOS PROCESADOS ===');
console.log('Datos procesados:', data);
console.log('Datos procesados JSON:', JSON.stringify(data, null, 2));

// Intentar crear el contrato
console.log('\n=== INTENTANDO CREAR CONTRATO ===');
try {
  const contrato = await Contratos.create(data);
  console.log('✅ Contrato creado exitosamente!');
  console.log('ID del contrato:', contrato._id);
  console.log('Contrato completo:', JSON.stringify(contrato.toObject(), null, 2));
} catch (error) {
  console.error('❌ Error al crear contrato:', error);
  console.error('Error name:', error.name);
  console.error('Error message:', error.message);
  
  if (error.name === 'ValidationError') {
    console.error('Errores de validación:');
    for (const field in error.errors) {
      console.error(`  ${field}:`, error.errors[field].message);
    }
  }
}

await mongoose.disconnect();
console.log('\n✅ Desconectado de MongoDB'); 