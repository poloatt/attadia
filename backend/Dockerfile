FROM node:18

WORKDIR /app

# Instalar dependencias primero
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copiar el resto de archivos
COPY . .

# Generar el cliente de Prisma
RUN npx prisma generate

# Instalar curl para el healthcheck
RUN apt-get update && apt-get install -y curl

# Script de inicio que ejecuta las migraciones y luego inicia la app
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Asegurarse de que el script tenga los permisos correctos y los finales de línea correctos
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh && \
    chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "run", "dev"]