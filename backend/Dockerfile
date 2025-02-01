# Etapa de construcción
FROM node:18-alpine AS builder

WORKDIR /app

# Instalar dependencias necesarias para Prisma y OpenSSL
RUN apk add --no-cache openssl libc6-compat python3 make g++

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm install --legacy-peer-deps
RUN npx prisma generate

# Etapa de producción
FROM node:18-alpine

# Instalar dependencias necesarias
RUN apk add --no-cache openssl curl postgresql-client

WORKDIR /app

# Copiar solo los archivos necesarios desde la etapa de construcción
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY . .

# Asegurarse que el archivo .env se copia
COPY .env ./

# Script para esperar a que la base de datos esté lista
COPY scripts/wait-for-db.js ./scripts/

# Exponer puerto
EXPOSE 5000

# Aumentar el tiempo de espera y los reintentos
ENV MAX_RETRIES=10
ENV RETRY_DELAY=5000

# Comando para iniciar la aplicación
CMD ["sh", "-c", "node scripts/wait-for-db.js && npm run dev"]