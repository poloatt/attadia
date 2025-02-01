import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Iniciando seed...');
    
    // Crear monedas básicas
    const monedas = [
      { codigo: 'ARS', nombre: 'Peso Argentino', simbolo: '$' },
      { codigo: 'USD', nombre: 'Dólar Estadounidense', simbolo: 'U$D' },
      { codigo: 'EUR', nombre: 'Euro', simbolo: '€' }
    ];

    console.log('Creando monedas...');
    for (const moneda of monedas) {
      await prisma.moneda.upsert({
        where: { codigo: moneda.codigo },
        update: {},
        create: moneda
      });
    }

    console.log('Datos iniciales creados exitosamente');
  } catch (error) {
    console.error('Error durante el seed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  }); 