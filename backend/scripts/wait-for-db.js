import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES || '10');
const RETRY_DELAY = parseInt(process.env.RETRY_DELAY || '5000');

async function waitForDatabase() {
  console.log('Esperando a que la base de datos esté lista...');
  let retries = MAX_RETRIES;

  while (retries > 0) {
    try {
      console.log('Intentando conectar a la base de datos...');
      await prisma.$connect();
      console.log('✅ Conexión a la base de datos exitosa');
      
      console.log('Ejecutando migraciones...');
      const { execSync } = await import('child_process');
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
      
      console.log('Iniciando la aplicación...');
      await prisma.$disconnect();
      process.exit(0);
    } catch (error) {
      console.log(`❌ Conexión fallida. ${retries} intentos restantes...`);
      console.error('Error:', error);
      retries--;
      
      if (retries === 0) {
        console.error('No se pudo conectar a la base de datos después de varios intentos');
        process.exit(1);
      }
      
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }
}

waitForDatabase(); 