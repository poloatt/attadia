FROM node:18

WORKDIR /app

# Copiar archivos de configuración primero
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm install

# Generar Prisma Client
RUN npx prisma generate

# Copiar el resto del código
COPY . .

EXPOSE 5000

# Esperar a que la base de datos esté lista y ejecutar migraciones antes de iniciar
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && npm run dev"] 