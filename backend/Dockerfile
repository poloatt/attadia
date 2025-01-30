FROM node:18

WORKDIR /app

# Configurar npm para usar el registro de GitHub
RUN npm config set registry https://registry.npmjs.org/

# Copiar archivos de configuración primero
COPY package*.json ./
COPY prisma ./prisma/

# Configurar npm para mayor estabilidad
RUN npm config set fetch-retry-maxtimeout 600000
RUN npm config set fetch-retry-mintimeout 100000

# Instalar todas las dependencias de una sola vez
RUN npm install --no-audit --no-fund \
    && npm install passport passport-google-oauth20 bcrypt cookie-parser \
    && npx prisma generate

# Copiar el resto del código
COPY . .

EXPOSE 5000

# Esperar a que la base de datos esté lista y ejecutar migraciones antes de iniciar
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && npm run dev"] 