import mongoose from 'mongoose';
import config from '../config.js';

const connectDB = async (retries = 5) => {
  try {
    const conn = await mongoose.connect(config.mongoUrl, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      retryWrites: true,
      family: 4
    });
    
    console.log(`MongoDB conectado: ${conn.connection.host}`);
    
    // Manejadores de eventos de conexión
    mongoose.connection.on('error', err => {
      console.error('Error de MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB desconectado. Intentando reconectar...');
      setTimeout(() => connectDB(retries - 1), 5000);
    });

    return conn;
  } catch (error) {
    console.error(`Error al conectar MongoDB: ${error.message}`);
    if (retries > 0) {
      console.log(`Reintentando en 5 segundos... (${retries} intentos restantes)`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return connectDB(retries - 1);
    } else {
      console.error('No se pudo conectar a MongoDB después de múltiples intentos');
      process.exit(1);
    }
  }
};

export default connectDB; 