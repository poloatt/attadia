import mongoose from 'mongoose';
import { Users, Roles, SystemHealth } from '../src/models/index.js';

const initializeDatabase = async () => {
  try {
    console.log('🔄 Intentando conectar a MongoDB...');
    
    // Configurar mongoose para más logs
    mongoose.set('debug', true);
    
    // Esperar a que la conexión esté lista
    await mongoose.connection.db.command({ ping: 1 });
    console.log('✅ Ping a MongoDB exitoso');

    console.log('🔄 Creando roles...');
    // Crear rol de administrador si no existe
    const adminRole = await Roles.findOneAndUpdate(
      { nombre: 'ADMIN' },
      { 
        nombre: 'ADMIN',
        descripcion: 'Administrador del sistema'
      },
      { 
        upsert: true, 
        new: true, 
        maxTimeMS: 20000,
        setDefaultsOnInsert: true 
      }
    );
    console.log('✅ Rol admin creado:', adminRole._id);

    // Crear rol de usuario si no existe
    const userRole = await Roles.findOneAndUpdate(
      { nombre: 'USER' },
      { 
        nombre: 'USER',
        descripcion: 'Usuario del sistema'
      },
      { 
        upsert: true, 
        new: true, 
        maxTimeMS: 20000,
        setDefaultsOnInsert: true 
      }
    );
    console.log('✅ Rol usuario creado:', userRole._id);

    console.log('🔄 Creando usuario admin...');
    // Crear usuario administrador por defecto
    const adminUser = await Users.findOneAndUpdate(
      { email: 'admin@example.com' },
      {
        nombre: 'Administrador',
        email: 'admin@example.com',
        password: '$2b$10$XOPbrlUPQdwdJUpSrIF6X.MPaOGRKwxLCHVnSz4CYOv.hZVy8WS6i', // admin123
        role: adminRole._id,
        active: true
      },
      { 
        upsert: true, 
        maxTimeMS: 20000,
        setDefaultsOnInsert: true 
      }
    );
    console.log('✅ Usuario admin creado:', adminUser._id);

    console.log('🔄 Creando registro de salud del sistema...');
    // Crear registro inicial de salud del sistema
    const health = await SystemHealth.create({
      cpuUsage: 0,
      memoryUsage: 0,
      status: 'HEALTHY'
    });
    console.log('✅ Registro de salud creado:', health._id);

    console.log('✅ Base de datos inicializada correctamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error inicializando la base de datos:', error);
    process.exit(1);
  }
};

// Esperar a que MongoDB esté disponible
const waitForMongo = async () => {
  let retries = 30;
  while (retries > 0) {
    try {
      console.log('🔄 Intentando conectar a MongoDB... (intentos restantes:', retries, ')');
      await mongoose.connection.db.command({ ping: 1 });
      console.log('✅ Conexión exitosa a MongoDB');
      return true;
    } catch (error) {
      console.log('⚠️ Error conectando:', error.message);
      await new Promise(resolve => setTimeout(resolve, 1000));
      retries--;
    }
  }
  return false;
};

// Configurar mongoose
mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongodb:27017/present', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Error de MongoDB:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Desconectado de MongoDB');
});

const start = async () => {
  if (await waitForMongo()) {
    await initializeDatabase();
  } else {
    console.error('❌ No se pudo conectar a MongoDB después de varios intentos');
    process.exit(1);
  }
};

start(); 