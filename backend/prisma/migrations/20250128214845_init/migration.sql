-- CreateEnum
CREATE TYPE "Moneda" AS ENUM ('EUR', 'USD', 'ARS');

-- CreateEnum
CREATE TYPE "Estado" AS ENUM ('PENDIENTE', 'PAGADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "EstadoProyecto" AS ENUM ('PENDIENTE', 'EN_PROGRESO', 'COMPLETADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaccion" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "moneda" "Moneda" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "cuenta" TEXT NOT NULL,
    "estado" "Estado" NOT NULL,
    "recurrencia" BOOLEAN NOT NULL DEFAULT false,
    "tipo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "locacion" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "propiedadId" TEXT,

    CONSTRAINT "Transaccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Propiedad" (
    "id" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "barrio" TEXT NOT NULL,
    "provincia" TEXT NOT NULL,
    "pais" TEXT NOT NULL,
    "cuentas" TEXT[],
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "Propiedad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Habitacion" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "propiedadId" TEXT NOT NULL,

    CONSTRAINT "Habitacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventario" (
    "id" TEXT NOT NULL,
    "locacion" TEXT NOT NULL,
    "sublocacion" TEXT,
    "categoria" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "consumible" BOOLEAN NOT NULL DEFAULT false,
    "propiedadId" TEXT,
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "Inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rutina" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "wakeup" BOOLEAN NOT NULL DEFAULT false,
    "meds" BOOLEAN NOT NULL DEFAULT false,
    "skincareDay" BOOLEAN NOT NULL DEFAULT false,
    "makeBed" BOOLEAN NOT NULL DEFAULT false,
    "clean" BOOLEAN NOT NULL DEFAULT false,
    "meditate" BOOLEAN NOT NULL DEFAULT false,
    "stretch" BOOLEAN NOT NULL DEFAULT false,
    "protein" BOOLEAN NOT NULL DEFAULT false,
    "gym" BOOLEAN NOT NULL DEFAULT false,
    "water" BOOLEAN NOT NULL DEFAULT false,
    "cooking" BOOLEAN NOT NULL DEFAULT false,
    "eating" BOOLEAN NOT NULL DEFAULT false,
    "bath" BOOLEAN NOT NULL DEFAULT false,
    "cream" BOOLEAN NOT NULL DEFAULT false,
    "skincareNight" BOOLEAN NOT NULL DEFAULT false,
    "completitud" DOUBLE PRECISION NOT NULL,
    "muscle" DOUBLE PRECISION,
    "fat" DOUBLE PRECISION,
    "fatPercent" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "stress" INTEGER,
    "sleep" DOUBLE PRECISION,
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "Rutina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabResult" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "tipo" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "unidad" TEXT NOT NULL,
    "notas" TEXT,
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "LabResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proyecto" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3),
    "estado" "EstadoProyecto" NOT NULL DEFAULT 'EN_PROGRESO',
    "tags" TEXT[],
    "usuarioId" TEXT NOT NULL,

    CONSTRAINT "Proyecto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tarea" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "proyectoId" TEXT NOT NULL,

    CONSTRAINT "Tarea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subtarea" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "tareaId" TEXT NOT NULL,

    CONSTRAINT "Subtarea_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- AddForeignKey
ALTER TABLE "Transaccion" ADD CONSTRAINT "Transaccion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaccion" ADD CONSTRAINT "Transaccion_propiedadId_fkey" FOREIGN KEY ("propiedadId") REFERENCES "Propiedad"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Propiedad" ADD CONSTRAINT "Propiedad_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Habitacion" ADD CONSTRAINT "Habitacion_propiedadId_fkey" FOREIGN KEY ("propiedadId") REFERENCES "Propiedad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventario" ADD CONSTRAINT "Inventario_propiedadId_fkey" FOREIGN KEY ("propiedadId") REFERENCES "Propiedad"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventario" ADD CONSTRAINT "Inventario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rutina" ADD CONSTRAINT "Rutina_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabResult" ADD CONSTRAINT "LabResult_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proyecto" ADD CONSTRAINT "Proyecto_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subtarea" ADD CONSTRAINT "Subtarea_tareaId_fkey" FOREIGN KEY ("tareaId") REFERENCES "Tarea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
