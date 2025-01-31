import { PrismaClient } from '@prisma/client';
import { setTimeout } from 'timers/promises';

const prisma = new PrismaClient();

const waitForDatabase = async () => {
  let retries = 5;
  while (retries > 0) {
    try {
      console.log('Intentando conectar a la base de datos...');
      await prisma.$connect();
      console.log('✅ Conexión a la base de datos exitosa');
      await prisma.$disconnect();
      process.exit(0);
    } catch (err) {
      console.log(`❌ Conexión fallida. ${retries} intentos restantes...`);
      console.error(err);
      retries -= 1;
      await setTimeout(5000);
    }
  }
  console.error('No se pudo conectar a la base de datos');
  process.exit(1);
};

waitForDatabase(); 