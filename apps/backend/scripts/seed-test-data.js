// Script para poblar la base de datos con datos de prueba aleatorios
import mongoose from 'mongoose';
import { 
  Users, Roles, Monedas, Cuentas, Propiedades, Habitaciones, Inquilinos, 
  Contratos, Transacciones, Inventarios, Tareas, Proyectos, Objetivos 
} from '../src/models/index.js';
import { faker } from '@faker-js/faker';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:MiContraseñaSegura123@mongodb:27017/present?authSource=admin';

const N_USERS = 5;
const N_MONEDAS = 3;
const N_CUENTAS = 8;
const N_PROPIEDADES = 5;
const N_HABITACIONES = 15;
const N_INQUILINOS = 8;
const N_CONTRATOS = 6;
const N_INVENTARIOS = 25;
const N_TAREAS = 12;
const N_PROYECTOS = 4;
const N_OBJETIVOS = 6;
const N_TRANSACCIONES = 30;

const ADMIN_EMAIL = 'Odell14@yahoo.com';
const ADMIN_PASSWORD = 'admin123';

const main = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Conectado a MongoDB');

    // Limpiar colecciones
    await Promise.all([
      Users.deleteMany({}),
      Roles.deleteMany({}),
      Monedas.deleteMany({}),
      Cuentas.deleteMany({}),
      Propiedades.deleteMany({}),
      Habitaciones.deleteMany({}),
      Inquilinos.deleteMany({}),
      Contratos.deleteMany({}),
      Inventarios.deleteMany({}),
      Tareas.deleteMany({}),
      Proyectos.deleteMany({}),
      Objetivos.deleteMany({}),
      Transacciones.deleteMany({}),
    ]);
    console.log('🧹 Colecciones limpiadas');

    // Crear roles
    const adminRole = await Roles.create({ nombre: 'ADMIN', descripcion: 'Administrador' });
    const userRole = await Roles.create({ nombre: 'USER', descripcion: 'Usuario' });

    // Crear usuario admin específico
    const adminUser = await Users.create({
      nombre: 'Odell Admin',
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: 'ADMIN',
      activo: true
    });

    // Crear otros usuarios
    const users = [adminUser];
    for (let i = 1; i < N_USERS; i++) {
      users.push(await Users.create({
        nombre: faker.person.fullName(),
        email: faker.internet.email(),
        password: 'admin123',
        role: 'USER',
        activo: true
      }));
    }
    console.log('👤 Usuarios creados:', users.length);

    // Crear monedas
    const monedas = [];
    const monedasPredefinidas = [
      { nombre: 'Peso Argentino', simbolo: '$', codigo: 'ARS', color: '#75AADB' },
      { nombre: 'Euro', simbolo: '€', codigo: 'EUR', color: '#4B0082' },
      { nombre: 'Dólar Estadounidense', simbolo: 'US$', codigo: 'USD', color: '#008080' }
    ];
    for (let i = 0; i < N_MONEDAS; i++) {
      monedas.push(await Monedas.create(monedasPredefinidas[i % monedasPredefinidas.length]));
    }
    console.log('💰 Monedas creadas:', monedas.length);

    // Crear cuentas (al menos 2 del admin)
    const cuentas = [];
    for (let i = 0; i < N_CUENTAS; i++) {
      cuentas.push(await Cuentas.create({
        nombre: faker.company.name(),
        numero: faker.finance.accountNumber(),
        tipo: faker.helpers.arrayElement(['EFECTIVO', 'BANCO', 'MERCADO_PAGO', 'CRIPTO', 'OTRO']),
        usuario: i < 2 ? adminUser._id : faker.helpers.arrayElement(users)._id,
        moneda: faker.helpers.arrayElement(monedas)._id,
        activo: true
      }));
    }
    console.log('🏦 Cuentas creadas:', cuentas.length);

    // Crear propiedades (al menos 2 del admin)
    const propiedades = [];
    for (let i = 0; i < N_PROPIEDADES; i++) {
      propiedades.push(await Propiedades.create({
        alias: faker.location.streetAddress(),
        descripcion: faker.lorem.paragraph(),
        direccion: faker.location.streetAddress(),
        ciudad: faker.location.city(),
        estado: ['DISPONIBLE'],
        tipo: faker.helpers.arrayElement(['CASA', 'DEPARTAMENTO', 'OFICINA', 'LOCAL', 'TERRENO']),
        metrosCuadrados: faker.number.int({ min: 50, max: 500 }),
        moneda: faker.helpers.arrayElement(monedas)._id,
        cuenta: faker.helpers.arrayElement(cuentas.filter(c => c.usuario.toString() === adminUser._id.toString()))._id,
        usuario: i < 2 ? adminUser._id : faker.helpers.arrayElement(users)._id
      }));
    }
    console.log('🏠 Propiedades creadas:', propiedades.length);

    // Si no hay propiedades, abortar la creación de secundarios
    if (!propiedades.length) {
      console.warn('⚠️ No hay propiedades creadas. No se pueden crear secundarios.');
      return;
    }

    // Crear habitaciones (distribuir entre todas las propiedades)
    const habitaciones = [];
    const tiposHabitacion = [
      'BAÑO', 'TOILETTE', 'DORMITORIO_DOBLE', 'DORMITORIO_SIMPLE', 
      'ESTUDIO', 'COCINA', 'DESPENSA', 'SALA_PRINCIPAL', 
      'PATIO', 'JARDIN', 'TERRAZA', 'LAVADERO', 'OTRO'
    ];
    for (let i = 0; i < N_HABITACIONES; i++) {
      // Seleccionar siempre una propiedad real
      const propiedad = propiedades[i % propiedades.length];
      const tipo = faker.helpers.arrayElement(tiposHabitacion);
      habitaciones.push(await Habitaciones.create({
        usuario: propiedad.usuario,
        propiedad: propiedad._id,
        tipo: tipo,
        nombrePersonalizado: tipo === 'OTRO' ? faker.word.noun() : undefined
      }));
    }
    console.log('🚪 Habitaciones creadas:', habitaciones.length);

    // Normalizar habitaciones: asegurar que 'propiedad' sea siempre un ID puro
    habitaciones.forEach(h => {
      if (h.propiedad && typeof h.propiedad === 'object' && h.propiedad._id) {
        h.propiedad = h.propiedad._id;
      }
    });

    // Crear inquilinos (al menos 2 asociados a propiedades del admin)
    const inquilinos = [];
    for (let i = 0; i < N_INQUILINOS; i++) {
      // Seleccionar siempre una propiedad real
      const prop = propiedades[i % propiedades.length];
      inquilinos.push(await Inquilinos.create({
        usuario: faker.helpers.arrayElement(users)._id,
        nombre: faker.person.firstName(),
        apellido: faker.person.lastName(),
        email: faker.internet.email(),
        telefono: faker.phone.number(),
        dni: faker.string.numeric(8),
        nacionalidad: faker.location.country(),
        ocupacion: faker.person.jobTitle(),
        estado: 'ACTIVO',
        propiedad: prop._id,
        fechaCheckIn: faker.date.past()
      }));
    }
    console.log('👥 Inquilinos creados:', inquilinos.length);

    // Crear contratos (al menos 2 del admin como propietario)
    const contratos = [];
    for (let i = 0; i < N_CONTRATOS; i++) {
      // Seleccionar siempre una propiedad real
      const propiedadSeleccionada = propiedades[i % propiedades.length];
      // Filtrar cuentas del usuario de la propiedad y asegurar que haya al menos una
      const cuentasDelUsuario = cuentas.filter(c => c.usuario.toString() === propiedadSeleccionada.usuario.toString());
      if (cuentasDelUsuario.length === 0) {
        console.warn(`⚠️ No hay cuentas para el usuario de la propiedad ${propiedadSeleccionada._id}, usando cuenta por defecto`);
        continue; // Saltar este contrato si no hay cuentas disponibles
      }
      const cuentaSeleccionada = faker.helpers.arrayElement(cuentasDelUsuario);
      const monedaSeleccionada = faker.helpers.arrayElement(monedas);
      const inquilinosSeleccionados = faker.helpers.arrayElements(inquilinos, { min: 1, max: 2 });
      // Calcular precio total y cuotas
      const meses = faker.number.int({ min: 6, max: 36 });
      const precioTotal = faker.finance.amount({ min: 6000, max: 36000, dec: 2 });
      const alquilerMensualPromedio = Math.round((precioTotal / meses) * 100) / 100;
      const fechaInicio = faker.date.past();
      const fechaFin = faker.date.future({ years: Math.ceil(meses / 12) });
      // Generar cuotas mensuales
      const cuotasMensuales = [];
      for (let m = 0; m < meses; m++) {
        const fechaCuota = new Date(fechaInicio);
        fechaCuota.setMonth(fechaInicio.getMonth() + m);
        let montoCuota = alquilerMensualPromedio;
        if (m === meses - 1) {
          const montoAcumulado = alquilerMensualPromedio * (meses - 1);
          montoCuota = precioTotal - montoAcumulado;
        }
        cuotasMensuales.push({
          mes: fechaCuota.getMonth() + 1,
          año: fechaCuota.getFullYear(),
          monto: Math.round(montoCuota * 100) / 100,
          fechaVencimiento: new Date(fechaCuota.getFullYear(), fechaCuota.getMonth(), 1),
          estado: 'PENDIENTE'
        });
      }
      contratos.push(await Contratos.create({
        nombre: `Contrato ${faker.string.alphanumeric(5)}`,
        fechaInicio,
        fechaFin,
        usuario: propiedadSeleccionada.usuario,
        propiedad: propiedadSeleccionada._id,
        inquilino: inquilinosSeleccionados.map(i => i._id),
        cuenta: cuentaSeleccionada._id,
        moneda: monedaSeleccionada._id,
        precioTotal,
        alquilerMensualPromedio,
        cuotasMensuales,
        deposito: faker.finance.amount({ min: 500, max: 5000, dec: 2 }),
        tipoContrato: 'ALQUILER',
        estado: 'ACTIVO',
        observaciones: faker.lorem.sentence()
      }));
    }
    console.log('📄 Contratos creados:', contratos.length);

    // Crear inventarios (al menos 3 en propiedades del admin)
    const inventarios = [];
    const categoriasInventario = ['Muebles', 'Electrodomésticos', 'Herramientas', 'Decoración', 'Limpieza', 'Jardín'];
    const estadosInventario = ['NUEVO', 'BUEN_ESTADO', 'REGULAR', 'MALO', 'REPARACION'];
    for (let i = 0; i < N_INVENTARIOS; i++) {
      // Seleccionar siempre una propiedad real
      const propiedad = propiedades[i % propiedades.length];
      // Filtrar habitaciones que pertenezcan a la propiedad (comparando solo por _id puro)
      const habitacionesDeProp = habitaciones.filter(h => String(h.propiedad) === String(propiedad._id));
      let inventarioData = {
        nombre: faker.commerce.productName(),
        descripcion: faker.lorem.sentence(),
        cantidad: faker.number.int({ min: 1, max: 10 }),
        categoria: faker.helpers.arrayElement(categoriasInventario),
        estado: faker.helpers.arrayElement(estadosInventario),
        usuario: propiedad.usuario,
        propiedad: propiedad._id, // solo el ID
        valorEstimado: faker.finance.amount({ min: 100, max: 5000, dec: 2 }),
        fechaAdquisicion: faker.date.past(),
        notas: faker.lorem.sentence()
      };
      if (habitacionesDeProp.length > 0) {
        const habitacion = faker.helpers.arrayElement(habitacionesDeProp);
        // Asignar solo el _id de la habitación
        if (habitacion && String(habitacion.propiedad) === String(propiedad._id)) {
          inventarioData.habitacion = habitacion._id;
        }
      }
      inventarios.push(await Inventarios.create(inventarioData));
    }
    console.log('📦 Inventarios creados:', inventarios.length);

    // Crear proyectos (al menos 1 del admin)
    const proyectos = [];
    for (let i = 0; i < N_PROYECTOS; i++) {
      const propiedad = i === 0 ? propiedades[0] : faker.helpers.arrayElement(propiedades);
      proyectos.push(await Proyectos.create({
        usuario: propiedad.usuario,
        nombre: faker.company.catchPhrase(),
        descripcion: faker.lorem.paragraph(),
        estado: faker.helpers.arrayElement(['PENDIENTE', 'EN_PROGRESO', 'COMPLETADO']),
        fechaInicio: faker.date.past(),
        fechaFin: faker.date.future(),
        prioridad: faker.helpers.arrayElement(['BAJA', 'MEDIA', 'ALTA']),
        presupuesto: faker.finance.amount({ min: 1000, max: 50000, dec: 2 }),
        moneda: faker.helpers.arrayElement(monedas)._id,
        propiedad: propiedad._id
      }));
    }
    console.log('📋 Proyectos creados:', proyectos.length);

    // Crear tareas (al menos 2 del admin)
    const tareas = [];
    for (let i = 0; i < N_TAREAS; i++) {
      const proyecto = i < 2 ? proyectos[0] : faker.helpers.arrayElement(proyectos);
      tareas.push(await Tareas.create({
        titulo: faker.lorem.sentence(),
        descripcion: faker.lorem.paragraph(),
        estado: faker.helpers.arrayElement(['PENDIENTE', 'EN_PROGRESO', 'COMPLETADA']),
        fechaInicio: faker.date.past(),
        fechaFin: faker.date.future(),
        fechaVencimiento: faker.date.future(),
        proyecto: proyecto._id,
        usuario: proyecto.usuario,
        prioridad: faker.helpers.arrayElement(['BAJA', 'ALTA']),
        completada: false,
        orden: i
      }));
    }
    console.log('✅ Tareas creadas:', tareas.length);

    // Crear objetivos (al menos 2 del admin)
    const objetivos = [];
    for (let i = 0; i < N_OBJETIVOS; i++) {
      const propiedad = i < 2 ? propiedades[0] : faker.helpers.arrayElement(propiedades);
      objetivos.push(await Objetivos.create({
        titulo: faker.lorem.sentence(),
        descripcion: faker.lorem.paragraph(),
        tipo: faker.helpers.arrayElement(['FINANCIERO', 'MANTENIMIENTO', 'OCUPACION', 'MEJORA', 'OTRO']),
        estado: faker.helpers.arrayElement(['PENDIENTE', 'EN_PROGRESO', 'COMPLETADO', 'CANCELADO']),
        fechaInicio: faker.date.past(),
        fechaObjetivo: faker.date.future(),
        metrica: {
          actual: faker.number.int({ min: 0, max: 100 }),
          objetivo: faker.number.int({ min: 100, max: 1000 }),
          unidad: faker.helpers.arrayElement(['%', 'USD', 'días', 'unidades'])
        },
        propiedad: propiedad._id,
        usuario: propiedad.usuario
      }));
    }
    console.log('🎯 Objetivos creados:', objetivos.length);

    // Crear transacciones (al menos 3 en cuentas del admin)
    for (let i = 0; i < N_TRANSACCIONES; i++) {
      const cuentaSeleccionada = i < 3 ? cuentas[0] : faker.helpers.arrayElement(cuentas);
      await Transacciones.create({
        descripcion: faker.lorem.sentence(),
        cuenta: cuentaSeleccionada._id,
        contrato: faker.helpers.arrayElement(contratos)._id,
        usuario: cuentaSeleccionada.usuario,
        moneda: cuentaSeleccionada.moneda,
        tipo: faker.helpers.arrayElement(['INGRESO', 'EGRESO']),
        monto: faker.finance.amount({ min: 100, max: 10000, dec: 2 }),
        fecha: faker.date.recent(),
        estado: 'PAGADO',
        categoria: faker.helpers.arrayElement([
          'Salud y Belleza',
          'Contabilidad y Facturas',
          'Transporte',
          'Comida y Mercado',
          'Fiesta',
          'Ropa',
          'Tecnología',
          'Otro'
        ])
      });
    }
    console.log('💸 Transacciones creadas:', N_TRANSACCIONES);

    // Mostrar credenciales de los usuarios creados
    console.log('\n=== Usuarios de prueba generados ===');
    users.forEach(u => {
      console.log(`Email: ${u.email} | Rol: ${u.role} | Contraseña: admin123`);
    });
    console.log('====================================\n');

    console.log('✅ Datos de prueba generados correctamente.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error generando datos de prueba:', err);
    process.exit(1);
  }
};

main();  