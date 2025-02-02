import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Aquí puedes agregar datos iniciales si lo deseas
  console.log('Base de datos inicializada correctamente')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 