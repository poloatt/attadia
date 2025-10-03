import mongoose from 'mongoose';
import config from '../config.js';

const connectDB = async (retries = 5) => {
  try {
    // Usar MONGO_PUBLIC_URL primero (para Railway), luego MONGO_URL, luego config.mongoUrl
    const mongoUrl = process.env.MONGO_PUBLIC_URL || process.env.MONGO_URL || config.mongoUrl;
    console.log('Intentando conectar a MongoDB...');
    console.log('URL de conexión:', mongoUrl);
    console.log('Ambiente:', config.env);
    
    const conn = await mongoose.connect(mongoUrl, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority',
      // Configuración para MongoDB Atlas con API estable
      serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true,
      }
    });
    
    console.log(`MongoDB conectado exitosamente a ${conn.connection.host}`);
    
    mongoose.connection.on('error', err => {
      console.error('Error de conexión MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB desconectado. Intentando reconectar...');
      setTimeout(() => connectDB(retries - 1), 5000);
    });

    return conn;
  } catch (error) {
    console.error('Error al conectar MongoDB:', error.message);
    console.error('Detalles de la conexión:', {
      url: process.env.MONGO_PUBLIC_URL || process.env.MONGO_URL || config.mongoUrl,
      ambiente: config.env,
      error: error.stack
    });
    
    if (retries > 0) {
      console.log(`Reintentando conexión en 5 segundos... (${retries} intentos restantes)`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return connectDB(retries - 1);
    } else {
      console.error('No se pudo conectar a MongoDB después de múltiples intentos');
      process.exit(1);
    }
  }
};

export default connectDB; 