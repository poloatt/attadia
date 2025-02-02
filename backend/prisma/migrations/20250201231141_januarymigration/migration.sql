/*
  Warnings:

  - Added the required column `usuarioId` to the `inquilinos` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "inquilinos" ADD COLUMN     "estado" TEXT NOT NULL DEFAULT 'ACTIVO',
ADD COLUMN     "usuarioId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "inquilinos" ADD CONSTRAINT "inquilinos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
