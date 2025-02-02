# Etapa de construcción
FROM node:18-alpine

WORKDIR /app

# Instalar dependencias necesarias para Prisma y OpenSSL
RUN apk add --no-cache openssl libc6-compat python3 make g++ postgresql-client curl

# Copiar archivos de configuración primero
COPY package*.json ./
COPY prisma ./prisma/
COPY .env ./

# Instalar dependencias con retry y timeout más largos
RUN npm config set fetch-retry-maxtimeout 600000 \
    && npm config set fetch-retry-mintimeout 100000 \
    && npm config set fetch-retries 5 \
    && npm install --verbose \
    && npm install -D prisma@latest typescript ts-node @types/node --verbose \
    && npm cache clean --force

# Generar el cliente Prisma (antes de copiar todo el código)
RUN npx prisma generate

# Copiar el resto de los archivos
COPY . .

# Dar permisos a los scripts después de copiarlos
RUN mkdir -p scripts \
    && touch scripts/wait-for-db.js scripts/db-dev.js \
    && chmod +x scripts/wait-for-db.js \
    && chmod +x scripts/db-dev.js

# Exponer puerto
EXPOSE 5000

# Aumentar el tiempo de espera y los reintentos
ENV MAX_RETRIES=10
ENV RETRY_DELAY=5000

# Crear script de entrada
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "run", "dev"]